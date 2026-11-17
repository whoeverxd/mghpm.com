import type { Metadata } from "next";
import { PortalHome } from "@/components/access/portal-pages";
import { requireLane } from "@/lib/access/authorize";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.portal.metaTitles.applicant };
}

export default async function ApplicantPortalPage() {
  const access = await requireLane("applicant");
  if (access.kind !== "allowed") return null; // the layout already handled the denial
  return <PortalHome lane="applicant" userName={access.user.name} />;
}
