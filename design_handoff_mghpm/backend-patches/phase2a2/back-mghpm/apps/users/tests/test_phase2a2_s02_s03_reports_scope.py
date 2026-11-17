# STATUS: DRAFT — NOT EXECUTED IN CLAUDE DESIGN
"""
S-02 — P0 — Summary reports (api/v1/reports/views.py: Financial, Catalog, Occupancy,
Maintenance, Reservations, Tenants) reciben solo organization.
S-03 — P0 — ReportListCreateView y ReportDownloadView filtran solo por organización.

Owner A nunca debe ver datos financieros de Owner B, listar sus informes ni
descargarlos cambiando el ID.
"""

import shutil
import tempfile
from datetime import date
from decimal import Decimal

from django.core.files.base import ContentFile
from django.test import TestCase, override_settings

from apps.billing.models import Payment
from apps.reports.models import GeneratedReport

from .phase2a2_helpers import auth, client, make_lease, make_member, make_org, make_property, results

MEDIA = tempfile.mkdtemp(prefix="p2a2-media-")


@override_settings(MEDIA_ROOT=MEDIA)
class ReportsOwnerScopeTests(TestCase):
    SUMMARY = [
        "/api/v1/reports/summary/financial/",
        "/api/v1/reports/summary/catalog/",
        "/api/v1/reports/summary/occupancy/",
        "/api/v1/reports/summary/maintenance/",
        "/api/v1/reports/summary/reservations/",
        "/api/v1/reports/summary/tenants/",
    ]

    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(MEDIA, ignore_errors=True)

    def setUp(self):
        self.org = make_org("p2a2-s02")
        self.admin, _ = make_member("s02-admin@example.com", self.org, "admin")
        self.owner_a, _ = make_member("s02-owner-a@example.com", self.org, "owner")
        self.owner_b, _ = make_member("s02-owner-b@example.com", self.org, "owner")
        self.tenant_a, _ = make_member("s02-tenant-a@example.com", self.org, "tenant")
        self.tenant_b, _ = make_member("s02-tenant-b@example.com", self.org, "tenant")
        prop_a = make_property(self.org, "S02A", owner=self.owner_a)
        prop_b = make_property(self.org, "S02B", owner=self.owner_b)
        lease_a = make_lease(self.org, prop_a, tenant=self.tenant_a, rent="1000.00")
        lease_b = make_lease(self.org, prop_b, tenant=self.tenant_b, rent="9000.00")
        Payment.objects.create(organization=self.org, lease=lease_a, amount=Decimal("1000.00"), paid_at=date.today(), method="Bank transfer")
        Payment.objects.create(organization=self.org, lease=lease_b, amount=Decimal("9000.00"), paid_at=date.today(), method="Bank transfer")

        self.report_b = GeneratedReport.objects.create(
            organization=self.org, report_type="owners", report_format="pdf", status="generated",
            title="Owner B statement", params_json={"owner_user_id": self.owner_b.id},
            created_by=self.admin, file_name="owner_b.pdf", content_type="application/pdf",
        )
        self.report_b.file.save("owner_b.pdf", ContentFile(b"%PDF-1.4 owner-b"), save=True)
        self.c = client()

    # -- S-02 ----------------------------------------------------------------
    def test_owner_summary_reports_are_scoped(self):
        for url in self.SUMMARY:
            with self.subTest(url=url):
                admin = self.c.get(url, **auth(self.admin, self.org))
                self.assertEqual(admin.status_code, 200, admin.content)
                owner = self.c.get(url, **auth(self.owner_a, self.org))
                if owner.status_code in (403, 404):
                    continue
                self.assertEqual(owner.status_code, 200, owner.content)
                self.assertNotEqual(owner.data, admin.data, f"{url}: owner A recibe el mismo payload que admin")

    def test_owner_financial_summary_excludes_owner_b_amount(self):
        resp = self.c.get("/api/v1/reports/summary/financial/", **auth(self.owner_a, self.org))
        if resp.status_code in (403, 404):
            return
        self.assertNotIn("9000", resp.content.decode("utf-8", errors="ignore"))

    # -- S-03 ----------------------------------------------------------------
    def test_owner_a_list_excludes_owner_b_report(self):
        resp = self.c.get("/api/v1/reports/", **auth(self.owner_a, self.org))
        self.assertEqual(resp.status_code, 200, resp.content)
        ids = {row["id"] for row in results(resp)}
        self.assertNotIn(self.report_b.id, ids)

    def test_owner_a_cannot_download_owner_b_report_by_id(self):
        resp = self.c.get(f"/api/v1/reports/{self.report_b.id}/download/", **auth(self.owner_a, self.org))
        self.assertIn(resp.status_code, (403, 404))

    def test_admin_can_download_report(self):
        """Control (debería pasar hoy)."""
        resp = self.c.get(f"/api/v1/reports/{self.report_b.id}/download/", **auth(self.admin, self.org))
        self.assertEqual(resp.status_code, 200)

    def test_tenant_has_no_report_access(self):
        """Control: tenant sin report.read → 403."""
        resp = self.c.get("/api/v1/reports/summary/financial/", **auth(self.tenant_a, self.org))
        self.assertEqual(resp.status_code, 403, resp.content)
