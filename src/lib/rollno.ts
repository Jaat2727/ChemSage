import type { Programme } from "@/lib/types";

const ROLL_NO_PATTERN = /^CY(\d{2})([BSD])(\d{3})$/i;

const programmeMap: Record<string, Programme> = {
  B: "BS",
  S: "MSc",
  D: "PhD",
};

export function parseRollNo(rollNo: string) {
  const normalized = rollNo.trim().toUpperCase();
  const match = normalized.match(ROLL_NO_PATTERN);

  if (!match) {
    throw new Error("Roll number must match CY + 2-digit year + programme letter + 3 digits.");
  }

  const [, year, programmeCode] = match;
  const batch_year = 2000 + Number(year);
  const programme = programmeMap[programmeCode];

  return {
    roll_no: normalized,
    programme,
    batch_year,
  };
}

export function isSmailEmail(email: string) {
  return email.trim().toLowerCase().endsWith("@smail.iitm.ac.in");
}

export function extractRollNo(email: string) {
  if (!isSmailEmail(email)) {
    throw new Error("Only @smail.iitm.ac.in email addresses are allowed.");
  }

  return email.trim().split("@")[0].toUpperCase();
}
