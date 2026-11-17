import "server-only";

import { NextResponse } from "next/server";
import { z } from "zod";
import { isValidSessionRequest } from "@/lib/auth/request-security";

/**
 * Validates CSRF/same-origin, content type and parses the JSON body against
 * the schema. Returns either the parsed data or the error response to send.
 */
export async function readJsonRequestBody<Schema extends z.ZodType>(
  request: Request,
  schema: Schema,
): Promise<{ data: z.infer<Schema> } | { response: NextResponse }> {
  if (!isValidSessionRequest(request)) {
    return { response: NextResponse.json({ error: "Solicitud no válida." }, { status: 403 }) };
  }

  if (!request.headers.get("content-type")?.includes("application/json")) {
    return {
      response: NextResponse.json({ error: "Se esperaba contenido JSON." }, { status: 415 }),
    };
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return {
      response: NextResponse.json(
        { error: "El cuerpo de la solicitud no es válido." },
        { status: 400 },
      ),
    };
  }

  const parsedBody = schema.safeParse(body);
  if (!parsedBody.success) {
    return {
      response: NextResponse.json(
        { error: parsedBody.error.issues[0]?.message ?? "Revisa los datos ingresados." },
        { status: 400 },
      ),
    };
  }

  return { data: parsedBody.data };
}
