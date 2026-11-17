import "server-only";

import { NextResponse } from "next/server";
import {
  MemberAlreadyExistsError,
  MemberNotFoundError,
  MemberPermissionError,
  MemberPersonLinkError,
} from "./records";

const personLinkMessages: Record<MemberPersonLinkError["reason"], string> = {
  missing: "La ficha de Personas no existe o está archivada.",
  type: "La ficha de Personas no corresponde al rol seleccionado.",
  relationship: "La persona no tiene una relación activa de ese tipo.",
  email: "El correo de la cuenta debe coincidir con el de la ficha de Personas.",
  linked: "Esa ficha de Personas ya tiene una cuenta de acceso.",
};

export function getMemberErrorResponse(error: unknown, logMessage: string) {
  if (error instanceof MemberNotFoundError) {
    return NextResponse.json({ error: "No se encontró el usuario." }, { status: 404 });
  }
  if (error instanceof MemberAlreadyExistsError) {
    return NextResponse.json(
      { error: "Esa cuenta ya tiene acceso a esta organización." },
      { status: 409 },
    );
  }
  if (error instanceof MemberPermissionError && error.reason === "status") {
    return NextResponse.json(
      { error: "El estado actual de esta cuenta no se puede cambiar desde aquí." },
      { status: 409 },
    );
  }
  if (error instanceof MemberPermissionError) {
    return NextResponse.json(
      {
        error:
          error.reason === "self"
            ? "No puedes cambiar tu propio acceso."
            : "Tu rol no puede asignar o modificar ese rol.",
      },
      { status: 403 },
    );
  }
  if (error instanceof MemberPersonLinkError) {
    return NextResponse.json({ error: personLinkMessages[error.reason] }, { status: 409 });
  }

  console.error(logMessage, error);
  return NextResponse.json(
    { error: "No se pudo guardar el acceso. Inténtalo más tarde." },
    { status: 500 },
  );
}
