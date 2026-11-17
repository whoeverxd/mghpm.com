import "server-only";

import { NextResponse } from "next/server";
import { PropertyRecordNotFoundError } from "./records";
import { describeGeneratedLabels } from "./unit-generation";
import {
  OccupiedUnitArchiveError,
  UnitLabelConflictError,
  UnitLeaseLockedError,
  UnitLimitReachedError,
  UnitRecordNotFoundError,
  UnitStayNotConfigurableError,
} from "./units";

export function getUnitErrorResponse(error: unknown, logMessage: string) {
  if (error instanceof PropertyRecordNotFoundError) {
    return NextResponse.json({ error: "No se encontró la propiedad." }, { status: 404 });
  }
  if (error instanceof UnitRecordNotFoundError) {
    return NextResponse.json({ error: "No se encontró la unidad." }, { status: 404 });
  }
  if (error instanceof UnitLabelConflictError) {
    return NextResponse.json(
      {
        error:
          error.labels.length > 0
            ? `Ya existen unidades activas con estas identificaciones: ${describeGeneratedLabels(error.labels)}. Cambia el prefijo o el número inicial.`
            : "Ya existe una unidad activa con esa identificación en esta propiedad.",
      },
      { status: 409 },
    );
  }
  if (error instanceof UnitLimitReachedError) {
    return NextResponse.json(
      { error: "La propiedad alcanzó el máximo de unidades permitido." },
      { status: 409 },
    );
  }
  if (error instanceof OccupiedUnitArchiveError) {
    return NextResponse.json(
      { error: "No se puede archivar una unidad ocupada. Cambia su estado primero." },
      { status: 409 },
    );
  }

  if (error instanceof UnitLeaseLockedError) {
    return NextResponse.json(
      {
        error:
          "La unidad tiene un contrato activo y debe seguir ocupada. Termina o vence el contrato para liberarla.",
      },
      { status: 409 },
    );
  }

  if (error instanceof UnitStayNotConfigurableError) {
    return NextResponse.json(
      {
        error:
          error.reason === "not_short_term"
            ? "Para publicar en el catálogo, la propiedad debe ser de corto plazo o de ambos tipos."
            : "Para publicar en el catálogo, configura la moneda de la propiedad en su ficha.",
      },
      { status: 409 },
    );
  }

  console.error(logMessage, error);
  return NextResponse.json(
    { error: "No se pudo guardar la unidad. Inténtalo más tarde." },
    { status: 500 },
  );
}
