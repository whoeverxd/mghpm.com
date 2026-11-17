import type { Metadata } from "next";
import { PortalProfile } from "@/components/access/portal-pages";
import { requireLane } from "@/lib/access/authorize";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.portal.metaTitles.profile };
}

export default async function ApplicantProfilePage() {
  const access = await requireLane("applicant");
  if (access.kind !== "allowed") return null;
  return (
    <PortalProfile
      organizationId={access.organizationId}
      personId={access.personId}
      userEmail={access.user.email}
    />
  );
}
