import { formatMinorUnitsAsDecimal, type UnitCurrency } from "@/lib/properties/unit-schema";
import type { LeaseDocument, LeaseFormValues } from "./schema";

function toDecimal(minor: number) {
  return minor > 0 ? formatMinorUnitsAsDecimal(minor) : "";
}

export function getNewLeaseFormValues(
  currency: UnitCurrency,
  prefill: { propertyId?: string; unitId?: string; tenantId?: string },
): LeaseFormValues {
  return {
    source: "admin",
    renewOfLeaseId: "",
    propertyId: prefill.propertyId ?? "",
    unitId: prefill.unitId ?? "",
    tenantId: prefill.tenantId ?? "",
    parties: [],
    startDate: "",
    endDate: "",
    possessionDate: "",
    moveInDate: "",
    renewalType: "manual",
    noticeDays: 60,
    currency,
    rent: "",
    dueDay: 1,
    graceDays: 5,
    lateFeeRule: "percent_5",
    lateFeeFlat: "",
    firstRentDueDate: "",
    prorateFirstPeriod: false,
    securityDeposit: "",
    additionalDeposit: "",
    petDeposit: "",
    advanceRent: "",
    otherChargeLabel: "",
    otherCharge: "",
    collectFirstMonthRent: true,
    utilities: {
      electricity: { party: "tenant", notes: "" },
      water: { party: "tenant", notes: "" },
      internet: { party: "tenant", notes: "" },
      gas: { party: "tenant", notes: "" },
      hoa: { party: "owner", notes: "" },
    },
  };
}

export function getLeaseFormValues(lease: LeaseDocument): LeaseFormValues {
  const defaults = getNewLeaseFormValues(lease.currency, {});
  return {
    source: lease.source,
    renewOfLeaseId: lease.renewOfLeaseId ?? "",
    propertyId: lease.propertyId,
    unitId: lease.unitId,
    tenantId: lease.tenantId,
    parties: lease.parties,
    startDate: lease.startDate ?? "",
    endDate: lease.endDate ?? "",
    possessionDate: lease.possessionDate ?? "",
    moveInDate: lease.moveInDate ?? "",
    renewalType: lease.renewalType,
    noticeDays: lease.noticeDays as LeaseFormValues["noticeDays"],
    currency: lease.currency,
    rent: toDecimal(lease.rentMinor),
    dueDay: lease.dueDay,
    graceDays: lease.graceDays as LeaseFormValues["graceDays"],
    lateFeeRule: lease.lateFeeRule,
    lateFeeFlat: toDecimal(lease.lateFeeFlatMinor),
    firstRentDueDate: lease.firstRentDueDate ?? "",
    prorateFirstPeriod: lease.prorateFirstPeriod,
    securityDeposit: toDecimal(lease.securityDepositMinor),
    additionalDeposit: toDecimal(lease.additionalDepositMinor),
    petDeposit: toDecimal(lease.petDepositMinor),
    advanceRent: toDecimal(lease.advanceRentMinor),
    otherChargeLabel: lease.otherChargeLabel,
    otherCharge: toDecimal(lease.otherChargeMinor),
    collectFirstMonthRent: lease.collectFirstMonthRent,
    utilities: { ...defaults.utilities, ...lease.utilities },
  };
}
