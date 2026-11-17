# STATUS: DRAFT — NOT EXECUTED IN CLAUDE DESIGN
"""
S-04 — P0 — PaymentReceiptView (api/v1/billing/views.py) busca
Payment.objects.filter(organization, pk) sin scope_payments.
tenant y owner tienen payment.export.

Resultado seguro esperado: 404 (o 403) al pedir el comprobante de un pago ajeno.
"""

from datetime import date
from decimal import Decimal

from django.test import TestCase

from apps.billing.models import Payment

from .phase2a2_helpers import DENIED, auth, client, make_lease, make_member, make_org, make_property


class PaymentReceiptIdorTests(TestCase):
    def setUp(self):
        self.org = make_org("p2a2-s04")
        self.owner_a, _ = make_member("s04-owner-a@example.com", self.org, "owner")
        self.owner_b, _ = make_member("s04-owner-b@example.com", self.org, "owner")
        self.tenant_a, _ = make_member("s04-tenant-a@example.com", self.org, "tenant")
        self.tenant_b, _ = make_member("s04-tenant-b@example.com", self.org, "tenant")
        prop_a = make_property(self.org, "S04A", owner=self.owner_a)
        prop_b = make_property(self.org, "S04B", owner=self.owner_b)
        lease_a = make_lease(self.org, prop_a, tenant=self.tenant_a)
        lease_b = make_lease(self.org, prop_b, tenant=self.tenant_b)
        self.pay_a = Payment.objects.create(organization=self.org, lease=lease_a, amount=Decimal("1000.00"), paid_at=date.today(), method="Bank transfer")
        self.pay_b = Payment.objects.create(organization=self.org, lease=lease_b, amount=Decimal("2000.00"), paid_at=date.today(), method="Bank transfer")
        self.c = client()

    def _get(self, user, payment):
        return self.c.get(f"/api/v1/billing/payments/{payment.id}/receipt/", HTTP_ACCEPT="application/pdf", **auth(user, self.org))

    def test_tenant_a_cannot_download_receipt_of_payment_b(self):
        self.assertIn(self._get(self.tenant_a, self.pay_b).status_code, DENIED)

    def test_owner_a_cannot_download_receipt_of_payment_b(self):
        self.assertIn(self._get(self.owner_a, self.pay_b).status_code, DENIED)

    def test_tenant_a_can_download_own_receipt(self):
        """Control (debería pasar hoy)."""
        self.assertEqual(self._get(self.tenant_a, self.pay_a).status_code, 200)

    def test_owner_a_can_download_receipt_of_own_property(self):
        """Control (debería pasar hoy)."""
        self.assertEqual(self._get(self.owner_a, self.pay_a).status_code, 200)

    def test_payment_list_is_already_scoped(self):
        """Control: el listado usa scope_payments (debería pasar hoy)."""
        resp = self.c.get("/api/v1/billing/payments/", **auth(self.tenant_a, self.org))
        self.assertEqual(resp.status_code, 200, resp.content)
        ids = {row["id"] for row in (resp.data.get("results", []) if isinstance(resp.data, dict) else resp.data)}
        self.assertNotIn(self.pay_b.id, ids)
