# STATUS: DRAFT — NOT EXECUTED IN CLAUDE DESIGN
"""
S-10 — P1 — El gate de verificación de identidad (apps/users/services/identity_verification.py:
apply_capability_gate, LIMITED_CAPABILITIES_WHILE_UNVERIFIED = {document.read, document.create})
solo se aplica en effective_capabilities_for_user() (lo que ve el frontend).
can(), usado por HasOrganizationAction, no lo aplica.

Estos tests DOCUMENTAN el comportamiento actual frente a la política que el propio código declara
(solo roles KYC: tenant y agent). No definen la política final.
Los asserts "debería 403" fallan hoy si el hallazgo es real.
"""

from django.test import TestCase

from apps.users.models import Membership
from apps.users.permissions import can, effective_capabilities_for_user

from .phase2a2_helpers import auth, client, make_lease, make_member, make_org, make_property

PENDING = Membership.VerificationStatus.PENDING_DOCUMENTS
VERIFIED = Membership.VerificationStatus.VERIFIED


class IdentityGateApiTests(TestCase):
    def setUp(self):
        self.org = make_org("p2a2-s10")
        self.admin, _ = make_member("s10-admin@example.com", self.org, "admin")
        self.owner, _ = make_member("s10-owner@example.com", self.org, "owner")
        self.tenant_u, self.tenant_u_m = make_member("s10-tenant-u@example.com", self.org, "tenant", verification=PENDING)
        self.tenant_v, _ = make_member("s10-tenant-v@example.com", self.org, "tenant", verification=VERIFIED)
        self.agent_u, self.agent_u_m = make_member("s10-agent-u@example.com", self.org, "agent", verification=PENDING)
        self.prop = make_property(self.org, "S10A", owner=self.owner, listing_agent=self.agent_u)
        make_lease(self.org, self.prop, tenant=self.tenant_u)
        self.c = client()

    # -- Demostración directa del desacople ---------------------------------
    def test_effective_capabilities_are_limited_for_unverified_tenant(self):
        """Debería pasar hoy: el frontend recibe el set recortado."""
        caps = effective_capabilities_for_user(self.tenant_u, self.org)
        self.assertNotIn("payment.read", caps)

    def test_can_matches_effective_capabilities_for_unverified_tenant(self):
        """Falla hoy si S-10 es real: can() concede lo que el gate quita."""
        self.assertFalse(can(self.tenant_u, self.org, "payment.read"))

    # -- API directa ---------------------------------------------------------
    def test_unverified_tenant_payments_api(self):
        resp = self.c.get("/api/v1/billing/payments/", **auth(self.tenant_u, self.org))
        self.assertEqual(resp.status_code, 403, f"actual={resp.status_code}")

    def test_unverified_tenant_leases_api(self):
        resp = self.c.get("/api/v1/leases/", **auth(self.tenant_u, self.org))
        self.assertEqual(resp.status_code, 403, f"actual={resp.status_code}")

    def test_unverified_tenant_work_orders_api(self):
        resp = self.c.get("/api/v1/work-orders/", **auth(self.tenant_u, self.org))
        self.assertEqual(resp.status_code, 403, f"actual={resp.status_code}")

    def test_unverified_agent_property_update_api(self):
        resp = self.c.patch(f"/api/v1/properties/{self.prop.id}/", {"title": "Sin verificar"},
                            format="json", **auth(self.agent_u, self.org))
        self.assertEqual(resp.status_code, 403, f"actual={resp.status_code}")
        self.prop.refresh_from_db()
        self.assertNotEqual(self.prop.title, "Sin verificar")

    def test_unverified_agent_reservations_api(self):
        resp = self.c.get("/api/v1/reservations/", **auth(self.agent_u, self.org))
        self.assertEqual(resp.status_code, 403, f"actual={resp.status_code}")

    # -- Controles --------------------------------------------------------------
    def test_unverified_tenant_can_still_read_documents(self):
        """document.read está en LIMITED_CAPABILITIES (debería pasar hoy)."""
        resp = self.c.get("/api/v1/documents/", **auth(self.tenant_u, self.org))
        self.assertEqual(resp.status_code, 200, resp.content)

    def test_verified_tenant_payments_api(self):
        resp = self.c.get("/api/v1/billing/payments/", **auth(self.tenant_v, self.org))
        self.assertEqual(resp.status_code, 200, resp.content)

    def test_non_kyc_roles_are_not_gated(self):
        """owner/admin no son roles KYC: el gate no les aplica por diseño (documentación)."""
        self.assertEqual(self.c.get("/api/v1/reports/summary/financial/", **auth(self.owner, self.org)).status_code, 200)
        self.assertEqual(self.c.get("/api/v1/memberships/", **auth(self.admin, self.org)).status_code, 200)
