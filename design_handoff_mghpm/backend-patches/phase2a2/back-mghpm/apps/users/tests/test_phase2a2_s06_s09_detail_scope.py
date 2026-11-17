# STATUS: DRAFT — NOT EXECUTED IN CLAUDE DESIGN
"""
S-06 a S-09 — P1 — El listado aplica scope_properties, pero detalle, edición, archivo,
bulk, unidades, estadísticas y directorio/detalle de personas filtran solo por organización.

Escenario: prop_a asignada a agent_a / owner_a / tenant_a / comercial; prop_b ocupada,
de owner_b, fuera del alcance de todos ellos (no vacante → no entra en el catálogo de tenant/comercial).

Los tests de directorio/detalle de personas para agent dependen de la política final
(qué personas debe ver un agent); aquí se asume "solo personas ligadas a sus propiedades".
"""

from decimal import Decimal

from django.test import TestCase

from apps.properties.models import Property, Unit

from .phase2a2_helpers import DENIED, auth, body, client, make_member, make_org, make_property, results


class PropertyDetailAndActionScopeTests(TestCase):
    def setUp(self):
        self.org = make_org("p2a2-s06")
        self.admin, _ = make_member("s06-admin@example.com", self.org, "admin")
        self.agent_a, _ = make_member("s06-agent-a@example.com", self.org, "agent")
        self.agent_b, _ = make_member("s06-agent-b@example.com", self.org, "agent")
        self.owner_a, _ = make_member("s06-owner-a@example.com", self.org, "owner")
        self.owner_b, _ = make_member("s06-owner-b@example.com", self.org, "owner")
        self.tenant_a, _ = make_member("s06-tenant-a@example.com", self.org, "tenant")
        self.tenant_b, _ = make_member("s06-tenant-b@example.com", self.org, "tenant")
        self.comercial, _ = make_member("s06-comercial@example.com", self.org, "comercial")

        self.prop_a = make_property(self.org, "S06A", owner=self.owner_a, listing_agent=self.agent_a,
                                    acquisition_agent=self.comercial, tenant_active=self.tenant_a,
                                    status=Property.Status.OCCUPIED)
        self.prop_b = make_property(self.org, "S06B", owner=self.owner_b, listing_agent=self.agent_b,
                                    tenant_active=self.tenant_b, status=Property.Status.OCCUPIED,
                                    estimated_value=Decimal("850000"))
        self.unit_a = Unit.objects.create(organization=self.org, property=self.prop_a, unit_number="A-1")
        self.unit_b = Unit.objects.create(organization=self.org, property=self.prop_b, unit_number="B-1")
        self.c = client()

    # -- S-06 detail -----------------------------------------------------------
    def test_tenant_cannot_open_property_outside_scope(self):
        resp = self.c.get(f"/api/v1/properties/{self.prop_b.id}/", **auth(self.tenant_a, self.org))
        self.assertIn(resp.status_code, DENIED, resp.content)

    def test_owner_cannot_open_property_of_other_owner(self):
        resp = self.c.get(f"/api/v1/properties/{self.prop_b.id}/", **auth(self.owner_a, self.org))
        self.assertIn(resp.status_code, DENIED, resp.content)

    def test_comercial_cannot_open_property_outside_scope(self):
        resp = self.c.get(f"/api/v1/properties/{self.prop_b.id}/", **auth(self.comercial, self.org))
        self.assertIn(resp.status_code, DENIED, resp.content)

    def test_agent_cannot_open_unassigned_property(self):
        resp = self.c.get(f"/api/v1/properties/{self.prop_b.id}/", **auth(self.agent_a, self.org))
        self.assertIn(resp.status_code, DENIED, resp.content)

    # -- S-06 edit / archive -----------------------------------------------------
    def test_agent_cannot_edit_unassigned_property(self):
        resp = self.c.patch(f"/api/v1/properties/{self.prop_b.id}/", {"title": "Editado por agent A"},
                            format="json", **auth(self.agent_a, self.org))
        self.assertIn(resp.status_code, DENIED, resp.content)
        self.prop_b.refresh_from_db()
        self.assertNotEqual(self.prop_b.title, "Editado por agent A")

    def test_agent_cannot_archive_unassigned_property(self):
        resp = self.c.delete(f"/api/v1/properties/{self.prop_b.id}/", **auth(self.agent_a, self.org))
        self.assertIn(resp.status_code, DENIED, resp.content)
        self.prop_b.refresh_from_db()
        self.assertIsNone(self.prop_b.deleted_at)

    def test_agent_can_edit_assigned_property(self):
        """Control (debería pasar hoy)."""
        resp = self.c.patch(f"/api/v1/properties/{self.prop_a.id}/", {"title": "Editado OK"},
                            format="json", **auth(self.agent_a, self.org))
        self.assertEqual(resp.status_code, 200, resp.content)

    # -- S-07 bulk / units / duplicate ------------------------------------------
    def test_agent_cannot_bulk_deactivate_unassigned_property(self):
        resp = self.c.post("/api/v1/properties/bulk/", {"action": "deactivate", "ids": [self.prop_b.id]},
                           format="json", **auth(self.agent_a, self.org))
        self.assertIn(resp.status_code, DENIED, resp.content)
        self.prop_b.refresh_from_db()
        self.assertEqual(self.prop_b.record_status, Property.RecordStatus.ACTIVE)

    def test_agent_cannot_bulk_archive_unassigned_property(self):
        resp = self.c.post("/api/v1/properties/bulk/", {"action": "archive", "ids": [self.prop_b.id]},
                           format="json", **auth(self.agent_a, self.org))
        self.assertIn(resp.status_code, DENIED, resp.content)
        self.prop_b.refresh_from_db()
        self.assertIsNone(self.prop_b.deleted_at)

    def test_agent_cannot_bulk_purge(self):
        """Control: purge exige property.delete (agent no la tiene) → 403 (debería pasar hoy)."""
        resp = self.c.post("/api/v1/properties/bulk/", {"action": "purge", "ids": [self.prop_a.id]},
                           format="json", **auth(self.agent_a, self.org))
        self.assertEqual(resp.status_code, 403, resp.content)

    def test_agent_cannot_duplicate_unassigned_property(self):
        before = Property.objects.filter(organization=self.org).count()
        resp = self.c.post(f"/api/v1/properties/{self.prop_b.id}/duplicate/", {}, format="json", **auth(self.agent_a, self.org))
        self.assertIn(resp.status_code, DENIED, resp.content)
        self.assertEqual(Property.objects.filter(organization=self.org).count(), before)

    def test_agent_cannot_edit_unit_of_unassigned_property(self):
        resp = self.c.patch(f"/api/v1/units/{self.unit_b.id}/", {"unit_number": "HACK"},
                            format="json", **auth(self.agent_a, self.org))
        self.assertIn(resp.status_code, DENIED, resp.content)
        self.unit_b.refresh_from_db()
        self.assertEqual(self.unit_b.unit_number, "B-1")

    def test_tenant_cannot_list_units_of_other_property(self):
        resp = self.c.get(f"/api/v1/properties/{self.prop_b.id}/units/", **auth(self.tenant_a, self.org))
        if resp.status_code in DENIED:
            return
        self.assertNotIn(self.unit_b.id, {row["id"] for row in results(resp)})

    # -- S-08 org-wide units / stats ---------------------------------------------
    def test_tenant_org_units_excludes_other_property(self):
        resp = self.c.get("/api/v1/properties/units/", **auth(self.tenant_a, self.org))
        if resp.status_code in DENIED:
            return
        self.assertNotIn(self.unit_b.id, {row["id"] for row in results(resp)})

    def test_owner_portfolio_stats_not_org_wide(self):
        admin = self.c.get("/api/v1/properties/stats/", **auth(self.admin, self.org))
        self.assertEqual(admin.status_code, 200, admin.content)
        owner = self.c.get("/api/v1/properties/stats/", **auth(self.owner_a, self.org))
        if owner.status_code in DENIED:
            return
        self.assertNotEqual(owner.data, admin.data, "owner A recibe estadísticas de toda la organización")

    # -- control: list already scoped --------------------------------------------
    def test_property_list_is_already_scoped_for_agent(self):
        """Control (debería pasar hoy)."""
        resp = self.c.get("/api/v1/properties/", **auth(self.agent_a, self.org))
        self.assertEqual(resp.status_code, 200, resp.content)
        ids = {row["id"] for row in results(resp)}
        self.assertIn(self.prop_a.id, ids)
        self.assertNotIn(self.prop_b.id, ids)


class PeopleDirectoryScopeTests(TestCase):
    """S-09 — PeopleDirectoryView / PeopleSummaryView / PeopleDetailView para agent (people.read)."""

    def setUp(self):
        self.org = make_org("p2a2-s09")
        self.agent_a, _ = make_member("s09-agent-a@example.com", self.org, "agent")
        self.owner_a, _ = make_member("s09-owner-a@example.com", self.org, "owner")
        self.owner_b, _ = make_member("s09-owner-b@example.com", self.org, "owner")
        make_property(self.org, "S09A", owner=self.owner_a, listing_agent=self.agent_a)
        make_property(self.org, "S09B", owner=self.owner_b)
        self.c = client()

    def test_agent_directory_excludes_unrelated_owner(self):
        resp = self.c.get("/api/v1/people/directory/", **auth(self.agent_a, self.org))
        if resp.status_code in DENIED:
            return
        self.assertNotIn(self.owner_b.email, body(resp))

    def test_agent_cannot_open_unrelated_person_detail(self):
        resp = self.c.get(f"/api/v1/people/{self.owner_b.id}/", **auth(self.agent_a, self.org))
        self.assertIn(resp.status_code, DENIED, resp.content)
