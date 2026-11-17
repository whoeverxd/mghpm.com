# STATUS: DRAFT — NOT EXECUTED IN CLAUDE DESIGN
"""
Helpers compartidos por los tests de la Fase 2A.2.

Mismo patrón que apps/users/tests/test_critical_access_gaps.py:
APIClient + JWT real (RefreshToken.for_user) + cabecera X-Organization,
de modo que OrganizationContextMiddleware y HasOrganizationAction se
ejecutan de verdad. Sin mocks de autorización ni de scoping.

Nota: Role.objects.get_or_create devuelve el rol sembrado por las
migraciones si ya existe (incluido su campo capabilities en BD). Eso es
intencional: los tests usan el mismo origen de capacidades que producción.
"""

from __future__ import annotations

from datetime import date
from decimal import Decimal

from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.leases.models import Lease
from apps.properties.models import Property
from apps.users.models import Membership, Organization, Role, User, UserRole


def make_org(slug: str) -> Organization:
    return Organization.objects.create(name=slug, slug=slug)


def ensure_role(key: str) -> Role:
    role, _ = Role.objects.get_or_create(key=key, defaults={"name": key, "is_system": True})
    return role


def make_member(email: str, org: Organization, *role_keys: str, verification: str | None = None, user: User | None = None):
    if user is None:
        user = User.objects.create_user(
            email=email, password="pass", first_name=email.split("@")[0][:30], last_name="Test"
        )
    extra = {"verification_status": verification} if verification else {}
    membership = Membership.objects.create(
        user=user, organization=org, status=Membership.Status.ACTIVE, **extra
    )
    for key in role_keys:
        UserRole.objects.create(membership=membership, role=ensure_role(key))
    return user, membership


def make_property(org: Organization, code: str, **kw) -> Property:
    return Property.objects.create(
        organization=org, title=f"Prop {code}", property_code=code,
        address_line1=f"Calle {code}", city="Santo Domingo", **kw,
    )


def make_lease(org: Organization, prop: Property, *, tenant: User, owner: User | None = None, rent="1000.00") -> Lease:
    return Lease.objects.create(
        organization=org, property=prop, tenant=tenant, owner=owner or prop.owner,
        start_date=date(2026, 1, 1), end_date=date(2026, 12, 31),
        rent_amount=Decimal(rent), status=Lease.Status.ACTIVE,
    )


def auth(user: User, org: Organization) -> dict:
    token = str(RefreshToken.for_user(user).access_token)
    return {"HTTP_AUTHORIZATION": f"Bearer {token}", "HTTP_X_ORGANIZATION": org.slug}


def client() -> APIClient:
    return APIClient()


def results(response):
    data = response.data
    if isinstance(data, dict):
        return data.get("results", [])
    return data or []


def body(response) -> str:
    return response.content.decode("utf-8", errors="ignore")


DENIED = (403, 404)
