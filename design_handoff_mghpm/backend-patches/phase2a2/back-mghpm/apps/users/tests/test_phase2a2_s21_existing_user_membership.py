# STATUS: DRAFT — NOT EXECUTED IN CLAUDE DESIGN
"""
S-21 — P2 — MembershipViewSet.perform_create (api/v1/organizations/views.py):
si el email ya existe en la plataforma, reutiliza el usuario.

Revisión estática posterior: la membresía se crea con status=INVITED (no ACTIVE).
Estos tests documentan el comportamiento actual; se espera que PASEN, lo que
haría el hallazgo NO reproducible en su forma original (auto-ACTIVE).
"""

from django.test import TestCase

from apps.users.models import Membership, User

from .phase2a2_helpers import auth, client, make_member, make_org

URL = "/api/v1/memberships/"


class ExistingUserMembershipTests(TestCase):
    def setUp(self):
        self.org_a = make_org("p2a2-s21-a")
        self.org_b = make_org("p2a2-s21-b")
        self.admin_a, _ = make_member("s21-admin-a@example.com", self.org_a, "admin")
        self.existing, _ = make_member("s21-existing@example.com", self.org_b, "tenant")
        self.c = client()

    def test_existing_user_added_by_other_org_is_not_auto_active(self):
        resp = self.c.post(URL, {"email": self.existing.email, "role": "tenant"}, format="json", **auth(self.admin_a, self.org_a))
        self.assertIn(resp.status_code, (200, 201), resp.content)
        m = Membership.objects.get(user=self.existing, organization=self.org_a)
        self.assertEqual(m.status, Membership.Status.INVITED)

    def test_existing_user_is_reused_not_duplicated(self):
        self.c.post(URL, {"email": self.existing.email, "role": "tenant"}, format="json", **auth(self.admin_a, self.org_a))
        self.assertEqual(User.objects.filter(email=self.existing.email).count(), 1)

    def test_invited_member_cannot_act_in_org_a(self):
        """Middleware exige membresía ACTIVE: el invitado no opera en org A hasta aceptar."""
        self.c.post(URL, {"email": self.existing.email, "role": "tenant"}, format="json", **auth(self.admin_a, self.org_a))
        resp = self.c.get("/api/v1/leases/", **auth(self.existing, self.org_a))
        self.assertEqual(resp.status_code, 403, resp.content)

    def test_admin_cannot_grant_org_owner(self):
        resp = self.c.post(URL, {"email": "s21-new@example.com", "role": "org_owner"}, format="json", **auth(self.admin_a, self.org_a))
        self.assertEqual(resp.status_code, 403, resp.content)
