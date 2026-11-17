# STATUS: DRAFT — NOT EXECUTED IN CLAUDE DESIGN
"""
S-19 — P2 — OwnerBankAccountListCreateView (api/v1/billing/bank_account_views.py)
exige banking_details.read_self para GET. admin/manager tienen banking_details.review
pero no read_self, aunque el queryset prevé que staff vea todas las solicitudes.

Matriz verificada: crear solicitud, ver la propia, listar pendientes, aprobar, rechazar.
Los tests de listado por admin/manager fallan hoy si el hallazgo es real.
"""

from django.test import TestCase

from apps.billing.models import OwnerBankAccount
from apps.users.models import Membership

from .phase2a2_helpers import auth, body, client, make_member, make_org, results

VERIFIED = Membership.VerificationStatus.VERIFIED
URL = "/api/v1/owner/bank-accounts/"


class BankReviewPermissionTests(TestCase):
    def setUp(self):
        self.org = make_org("p2a2-s19")
        self.admin, _ = make_member("s19-admin@example.com", self.org, "admin")
        self.manager, _ = make_member("s19-manager@example.com", self.org, "manager")
        self.owner_a, _ = make_member("s19-owner-a@example.com", self.org, "owner", verification=VERIFIED)
        self.owner_b, _ = make_member("s19-owner-b@example.com", self.org, "owner", verification=VERIFIED)
        self.owner_u, _ = make_member("s19-owner-u@example.com", self.org, "owner")
        self.tenant, _ = make_member("s19-tenant@example.com", self.org, "tenant")
        self.acc_a = OwnerBankAccount.objects.create(
            organization=self.org, owner=self.owner_a, submitted_by=self.owner_a,
            bank_name="Banreservas", account_number_full="123456789012",
        )
        self.acc_b = OwnerBankAccount.objects.create(
            organization=self.org, owner=self.owner_b, submitted_by=self.owner_b,
            bank_name="Popular", account_number_full="998877665544",
        )
        self.c = client()

    # -- crear -----------------------------------------------------------------
    def test_verified_owner_can_submit_request(self):
        resp = self.c.post(URL, {"bank_name": "BHD", "account_type": "checking", "account_number": "111122223333"},
                           format="json", **auth(self.owner_a, self.org))
        self.assertIn(resp.status_code, (200, 201), resp.content)
        self.assertTrue(OwnerBankAccount.objects.filter(owner=self.owner_a, bank_name="BHD").exists())

    def test_unverified_owner_cannot_submit_request(self):
        resp = self.c.post(URL, {"bank_name": "BHD", "account_type": "checking", "account_number": "111122223333"},
                           format="json", **auth(self.owner_u, self.org))
        self.assertEqual(resp.status_code, 400, resp.content)

    def test_tenant_cannot_submit_request(self):
        resp = self.c.post(URL, {"bank_name": "BHD", "account_type": "checking", "account_number": "111122223333"},
                           format="json", **auth(self.tenant, self.org))
        self.assertEqual(resp.status_code, 403, resp.content)

    # -- ver la propia ------------------------------------------------------------
    def test_owner_sees_only_own_masked_requests(self):
        resp = self.c.get(URL, **auth(self.owner_a, self.org))
        self.assertEqual(resp.status_code, 200, resp.content)
        ids = {row["id"] for row in results(resp)}
        self.assertIn(self.acc_a.id, ids)
        self.assertNotIn(self.acc_b.id, ids)
        self.assertNotIn("123456789012", body(resp))

    # -- listar pendientes (S-19) --------------------------------------------------
    def test_admin_can_list_pending_requests(self):
        resp = self.c.get(URL, **auth(self.admin, self.org))
        self.assertEqual(resp.status_code, 200, f"actual={resp.status_code}")
        ids = {row["id"] for row in results(resp)}
        self.assertTrue({self.acc_a.id, self.acc_b.id} <= ids)
        self.assertNotIn("123456789012", body(resp))

    def test_manager_can_list_pending_requests(self):
        resp = self.c.get(URL, **auth(self.manager, self.org))
        self.assertEqual(resp.status_code, 200, f"actual={resp.status_code}")

    def test_tenant_cannot_list(self):
        self.assertEqual(self.c.get(URL, **auth(self.tenant, self.org)).status_code, 403)

    # -- aprobar / rechazar ---------------------------------------------------------
    def test_admin_can_approve(self):
        resp = self.c.patch(f"{URL}{self.acc_a.id}/review/", {"decision": "approve"}, format="json", **auth(self.admin, self.org))
        self.assertEqual(resp.status_code, 200, resp.content)
        self.acc_a.refresh_from_db()
        self.assertNotEqual(self.acc_a.status, OwnerBankAccount.Status.PENDING_REVIEW)

    def test_manager_can_reject(self):
        resp = self.c.patch(f"{URL}{self.acc_b.id}/review/", {"decision": "reject"}, format="json", **auth(self.manager, self.org))
        self.assertEqual(resp.status_code, 200, resp.content)

    def test_owner_cannot_review_own_request(self):
        resp = self.c.patch(f"{URL}{self.acc_a.id}/review/", {"decision": "approve"}, format="json", **auth(self.owner_a, self.org))
        self.assertEqual(resp.status_code, 403, resp.content)
