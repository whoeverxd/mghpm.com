import "server-only";

import { NextResponse } from "next/server";
import { PropertyRecordNotFoundError } from "@/lib/properties/records";
import { leaseStatusLabels } from "./labels";
import {
  LeaseDateRuleError,
  LeaseLinkInvalidError,
  LeaseOverlapError,
  LeaseRecordNotFoundError,
  LeaseStatusTransitionError,
  LeaseUnitUnavailableError,
} from "./records";

const linkMessages = {
  property: "La propiedad seleccionada no existe o está archivada.",
  unit: "La unidad seleccionada no existe o está archivada.",
  tenant: "El inquilino seleccionado no existe, está archivado o no es un inquilino.",
  renewal: "El contrato a renovar debe estar activo y ser de la misma unidad y el mismo inquilino.",
} as const;

const dateRuleMessages = {
  "termination-future": "La fecha efectiva de terminación no puede ser futura.",
  "not-ended": "El contrato solo puede marcarse como vencido después de su fecha de fin.",
} as const;

export function getLeaseErrorResponse(error: unknown, logMessage: string) {
  if (error instanceof LeaseRecordNotFoundError) {
    return NextResponse.json({ error: "No se encontró el contrato." }, { status: 404 });
  }
  if (error instanceof PropertyRecordNotFoundError) {
    return NextResponse.json({ error: linkMessages.property }, { status: 400 });
  }
  if (error instanceof LeaseLinkInvalidError) {
    return NextResponse.json({ error: linkMessages[error.target] }, { status: 400 });
  }
  if (error instanceof LeaseOverlapError) {
    return NextResponse.json(
      {
        error: `Las fechas se cruzan con el contrato ${error.conflictingCode} de la misma unidad.`,
      },
      { status: 409 },
    );
  }
  if (error instanceof LeaseStatusTransitionError) {
    return NextResponse.json(
      {
        error: `Esta acción no está permitida para un contrato en estado "${
          leaseStatusLabels[error.from]
        }".`,
      },
      { status: 409 },
    );
  }
  if (error instanceof LeaseUnitUnavailableError) {
    return NextResponse.json(
      {
        error:
          error.reason === "other-lease"
            ? "La unidad ya está ocupada por otro contrato activo."
            : "La unidad figura ocupada sin contrato. Márcala como disponible antes de activar.",
      },
      { status: 409 },
    );
  }
  if (error instanceof LeaseDateRuleError) {
    return NextResponse.json({ error: dateRuleMessages[error.rule] }, { status: 409 });
  }

  console.error(logMessage, error);
  return NextResponse.json(
    { error: "No se pudo guardar el contrato. Inténtalo más tarde." },
    { status: 500 },
  );
}
