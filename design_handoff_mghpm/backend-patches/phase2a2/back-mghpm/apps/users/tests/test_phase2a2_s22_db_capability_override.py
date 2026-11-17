# STATUS: DRAFT — NOT EXECUTED IN CLAUDE DESIGN
"""
S-22 — P2 — _capabilities_set_for_role() (apps/users/permissions.py):
si Role.capabilities (JSON en BD) no es null, sustituye a ROLE_CAPABILITIES del código.

1) Precedencia: tests unitarios con can().
2) Deriva: compara Role.capabilities de la BD de TEST (creada por las migraciones)
   con ROLE_CAPABILITIES. Para la BD real usar el comando del README (paso 5).
"""

from django.test import TestCase

from apps.users.models import Role
from apps.users.permissions import ROLE_CAPABILITIES, can

from .phase2a2_helpers import ensure_role, make_member, make_org


class DbCapabilityOverrideTests(TestCase):
    def setUp(self):
        self.org = make_org("p2a2-s22")
        self.agent, _ = make_member("s22-agent@example.com", self.org, "agent")
        self.role = ensure_role("agent")

    def test_db_list_takes_precedence_over_code(self):
        self.role.capabilities = ["property.read"]
        self.role.save(update_fields=["capabilities"])
        self.assertIn("reservation.read", ROLE_CAPABILITIES["agent"])
        self.assertFalse(can(self.agent, self.org, "reservation.read"))
        self.assertTrue(can(self.agent, self.org, "property.read"))

    def test_null_falls_back_to_code(self):
        self.role.capabilities = None
        self.role.save(update_fields=["capabilities"])
        self.assertTrue(can(self.agent, self.org, "reservation.read"))

    def test_empty_list_denies_everything(self):
        self.role.capabilities = []
        self.role.save(update_fields=["capabilities"])
        self.assertFalse(can(self.agent, self.org, "property.read"))

    def test_migrated_roles_match_code(self):
        """Falla si las migraciones dejaron capacidades distintas a ROLE_CAPABILITIES (lista la deriva)."""
        drift = {}
        for key, code_caps in ROLE_CAPABILITIES.items():
            role = Role.objects.filter(key=key).first()
            if role is None or role.capabilities is None:
                continue
            db_caps = set(role.capabilities)
            if db_caps != set(code_caps):
                drift[key] = {
                    "solo_en_bd": sorted(db_caps - set(code_caps)),
                    "solo_en_codigo": sorted(set(code_caps) - db_caps),
                }
        self.assertEqual(drift, {}, drift)
