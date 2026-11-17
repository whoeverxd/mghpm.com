import type { Metadata } from "next";
import "@fontsource-variable/plus-jakarta-sans";
import "./globals.css";
import { ClientTexts, baseNamespaces } from "@/components/i18n/client-texts";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: {
      default: "MGHPM Property Management",
      template: "%s | MGHPM",
    },
    description: t.meta.appDescription,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { locale } = await getI18n();
  return (
    <html lang={locale}>
      <body>
        <ClientTexts namespaces={baseNamespaces}>{children}</ClientTexts>
      </body>
    </html>
  );
}
