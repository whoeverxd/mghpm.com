import { NextResponse } from "next/server";
import { requireStaffPermission } from "@/lib/access/authorize";
import { searchEverything } from "@/lib/search/global";
import { SEARCH_PREVIEW_LIMIT } from "@/lib/search/modules";

export const dynamic = "force-dynamic";

/** Top-bar search: up to 5 results per module the caller can view. */
export async function GET(request: Request) {
  const access = await requireStaffPermission("dashboard", "view", "Tu rol no tiene permiso para buscar.");
  if (access.kind !== "allowed") {
    return NextResponse.json({ error: access.message }, { status: access.status });
  }

  try {
    const query = new URL(request.url).searchParams.get("q");
    const groups = await searchEverything(access.organizationId, access.role, query, SEARCH_PREVIEW_LIMIT);
    return NextResponse.json({ groups });
  } catch (error) {
    console.error("Unable to run the global search.", error);
    return NextResponse.json({ error: "No se pudo completar la búsqueda." }, { status: 500 });
  }
}
