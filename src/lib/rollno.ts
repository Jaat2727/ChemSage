import type { Programme } from "@/lib/types";

const ROLL_NO_PATTERN = /^CY(\d{2})([BSD])(\d{3})$/i;
const SMAIL_DOMAIN = "@smail.iitm.ac.in";

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
  return email.trim().toLowerCase().endsWith(SMAIL_DOMAIN);
}

export function rollNoToSmailEmail(rollNo: string) {
  const { roll_no } = parseRollNo(rollNo);
  return `${roll_no.toLowerCase()}${SMAIL_DOMAIN}`;
}

export function normalizeSmailIdentifier(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error("Enter your IITM smail email or roll number.");
  }

  if (trimmed.includes("@")) {
    if (!isSmailEmail(trimmed)) {
      throw new Error("Only @smail.iitm.ac.in email addresses are allowed.");
    }
    return trimmed.toLowerCase();
  }

  return rollNoToSmailEmail(trimmed);
}

export function extractRollNo(emailOrRollNo: string) {
  if (emailOrRollNo.includes("@")) {
    if (!isSmailEmail(emailOrRollNo)) {
      throw new Error("Only @smail.iitm.ac.in email addresses are allowed.");
    }

    return emailOrRollNo.trim().split("@")[0].toUpperCase();
  }

  return parseRollNo(emailOrRollNo).roll_no;
}
