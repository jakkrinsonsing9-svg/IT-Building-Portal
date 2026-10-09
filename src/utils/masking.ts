/**
 * Personal Identifiable Information (PII) Data Masking Utilities
 * Follows PDPA (Personal Data Protection Act) and OWASP A02 recommendations.
 */

export function maskCitizenId(id: string | undefined | null): string {
  if (!id) return '-';
  const clean = id.replace(/[^0-9]/g, '');
  if (clean.length !== 13) {
    // If not standard 13 digits, mask middle characters
    if (clean.length < 5) return '***';
    return clean.slice(0, 2) + '*******' + clean.slice(-2);
  }
  // Standard Thai Citizen ID: X-XXXX-XXXXX-XX-X
  // Mask middle 7 digits: 1-1002-XXXXX-XX-7
  return `${clean[0]}-${clean.slice(1, 5)}-XXXXX-XX-${clean[12]}`;
}

export function maskPhone(phone: string | undefined | null): string {
  if (!phone) return '-';
  const clean = phone.replace(/[^0-9]/g, '');
  if (clean.length === 10) {
    // 0812345678 -> 081-XXX-5678
    return `${clean.slice(0, 3)}-XXX-${clean.slice(6)}`;
  }
  if (clean.length === 9) {
    return `${clean.slice(0, 2)}-XXX-${clean.slice(5)}`;
  }
  return phone.length > 4 ? `${phone.slice(0, 3)}****${phone.slice(-2)}` : '****';
}

export function maskEmail(email: string | undefined | null): string {
  if (!email) return '-';
  const parts = email.split('@');
  if (parts.length !== 2) return '***@***';
  const name = parts[0];
  const domain = parts[1];
  if (name.length <= 2) {
    return `${name[0]}*@${domain}`;
  }
  return `${name.slice(0, 2)}***${name.slice(-1)}@${domain}`;
}

export function maskStudentOrStaffId(id: string | undefined | null): string {
  if (!id) return '-';
  const clean = id.trim();
  if (clean.length <= 4) return '****';
  // e.g. 65070042 -> 6507****
  return `${clean.slice(0, 4)}${'*'.repeat(Math.max(2, clean.length - 4))}`;
}
