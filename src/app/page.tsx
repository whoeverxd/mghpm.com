import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LandingPage } from "@/components/landing/landing-page";
import { getSessionUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "My Global Hub Property Management | Caribbean Property Experts",
  description:
    "Professional property management in the Dominican Republic and the Caribbean. Leasing, rent collection, maintenance and transparent owner reporting on one platform.",
  openGraph: {
    title: "My Global Hub Property Management",
    description: "Your Property. Our Expertise. Your Peace of Mind.",
    type: "website",
  },
};

export default async function HomePage() {
  const user = await getSessionUser();
  if (!user) return <LandingPage />;

  redirect("/espacios");
}
