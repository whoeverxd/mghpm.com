# STATUS: DRAFT — NOT EXECUTED IN CLAUDE DESIGN
"""
S-05 — P0 — PeopleDetailView (api/v1/people/views.py) busca User.objects.filter(id=user_id)
sin filtrar por membresía de la organización activa.

Resultado seguro esperado: 404 y ningún dato personal del usuario de otra organización.
Si el hallazgo es real, test_admin_a_cannot_read_user_of_org_b FALLA hoy.
"""

from django.test import TestCase

from .phase2a2_helpers import auth, body, client, make_member, make_org


class PeopleDetailCrossOrgTests(TestCase):
    def setUp(self):
        self.org_a = make_org("p2a2-s05-a")
        self.org_b = make_org("p2a2-s05-b")
        self.admin_a, _ = make_member("s05-admin-a@example.com", self.org_a, "admin")
        self.agent_a, _ = make_member("s05-agent-a@example.com", self.org_a, "agent")
        self.tenant_a, _ = make_member("s05-tenant-a@example.com", self.org_a, "tenant")
        self.user_b, _ = make_member("s05-user-b@example.com", self.org_b, "tenant")
        self.user_b.phone = "8095550199"
        self.user_b.save(update_fields=["phone"])
        self.c = client()

    def _assert_no_leak(self, resp):
        self.assertIn(resp.status_code, (404,), resp.content)
        text = body(resp)
        self.assertNotIn(self.user_b.email, text)
        self.assertNotIn("8095550199", text)

    def test_admin_a_cannot_read_user_of_org_b(self):
        resp = self.c.get(f"/api/v1/people/{self.user_b.id}/", **auth(self.admin_a, self.org_a))
        self._assert_no_leak(resp)

    def test_agent_a_cannot_read_user_of_org_b(self):
        resp = self.c.get(f"/api/v1/people/{self.user_b.id}/", **auth(self.agent_a, self.org_a))
        self._assert_no_leak(resp)

    def test_tenant_a_has_no_people_read(self):
        """Control: tenant no tiene people.read → 403 (debería pasar hoy)."""
        resp = self.c.get(f"/api/v1/people/{self.user_b.id}/", **auth(self.tenant_a, self.org_a))
        self.assertEqual(resp.status_code, 403, resp.content)

    def test_admin_a_can_read_user_of_own_org(self):
        """Control: same-org allowed (debería pasar hoy)."""
        resp = self.c.get(f"/api/v1/people/{self.tenant_a.id}/", **auth(self.admin_a, self.org_a))
        self.assertEqual(resp.status_code, 200, resp.content)

    def test_x_organization_of_b_without_membership_is_rejected(self):
        """Control: middleware → 403 si el usuario no es miembro de la org de la cabecera."""
        resp = self.c.get(f"/api/v1/people/{self.user_b.id}/", **auth(self.admin_a, self.org_b))
        self.assertEqual(resp.status_code, 403, resp.content)
