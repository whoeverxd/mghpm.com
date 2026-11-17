# STATUS: DRAFT — NOT EXECUTED IN CLAUDE DESIGN
"""
S-01 — P0 — DashboardSummaryView (api/v1/core/views.py) exige property.read y llama
get_dashboard_summary(organization=...) sin recortar por usuario.

Criterio: un rol no-staff debe recibir 403, o un payload distinto del de admin
(admin ve toda la organización; el rol solo una parte). Si owner/tenant/agent/
comercial reciben exactamente el payload de admin, el hallazgo se confirma (FALLA).
"""

from datetime import date
from decimal import Decimal

from django.test import TestCase

from apps.billing.models import Payment
from apps.properties.models import Property

from .phase2a2_helpers import auth, client, make_lease, make_member, make_org, make_property


class DashboardRoleScopeTests(TestCase):
    URL = "/api/v1/dashboard/summary/"

    def setUp(self):
        self.org = make_org("p2a2-s01")
        self.admin, _ = make_member("s01-admin@example.com", self.org, "admin")
        self.owner_a, _ = make_member("s01-owner-a@example.com", self.org, "owner")
        self.owner_b, _ = make_member("s01-owner-b@example.com", self.org, "owner")
        self.tenant_a, _ = make_member("s01-tenant-a@example.com", self.org, "tenant")
        self.tenant_b, _ = make_member("s01-tenant-b@example.com", self.org, "tenant")
        self.agent_a, _ = make_member("s01-agent-a@example.com", self.org, "agent")
        self.comercial, _ = make_member("s01-comercial@example.com", self.org, "comercial")

        self.prop_a = make_property(self.org, "S01A", owner=self.owner_a, listing_agent=self.agent_a,
                                    acquisition_agent=self.comercial, tenant_active=self.tenant_a,
                                    status=Property.Status.OCCUPIED)
        self.prop_b = make_property(self.org, "S01B", owner=self.owner_b, tenant_active=self.tenant_b,
                                    status=Property.Status.OCCUPIED, estimated_value=Decimal("900000"))
        self.prop_c = make_property(self.org, "S01C", owner=self.owner_b, status=Property.Status.OCCUPIED)
        lease_a = make_lease(self.org, self.prop_a, tenant=self.tenant_a, rent="1000.00")
        lease_b = make_lease(self.org, self.prop_b, tenant=self.tenant_b, rent="7000.00")
        Payment.objects.create(organization=self.org, lease=lease_a, amount=Decimal("1000.00"), paid_at=date.today(), method="Bank transfer")
        Payment.objects.create(organization=self.org, lease=lease_b, amount=Decimal("7000.00"), paid_at=date.today(), method="Bank transfer")
        self.c = client()
        admin_resp = self.c.get(self.URL, **auth(self.admin, self.org))
        self.assertEqual(admin_resp.status_code, 200, admin_resp.content)
        self.admin_payload = admin_resp.data

    def _assert_scoped(self, user):
        resp = self.c.get(self.URL, **auth(user, self.org))
        if resp.status_code in (403, 404):
            return
        self.assertEqual(resp.status_code, 200, resp.content)
        self.assertNotEqual(
            resp.data.get("kpis"), self.admin_payload.get("kpis"),
            "El rol recibe los mismos KPIs que admin (datos de toda la organización).",
        )

    def test_owner_receives_only_own_scope(self):
        self._assert_scoped(self.owner_a)

    def test_tenant_receives_only_own_scope(self):
        self._assert_scoped(self.tenant_a)

    def test_agent_receives_only_assigned_scope(self):
        self._assert_scoped(self.agent_a)

    def test_comercial_receives_only_allowed_scope(self):
        self._assert_scoped(self.comercial)
