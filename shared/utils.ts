// ============================================================================
// Email Validation
// ============================================================================

/** RFC 5322 compliant email validation regex */
export const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/** Validates if a string is a valid email address */
export function isValidEmail(email: string): boolean {
    if (!email || typeof email !== 'string') {
        return false;
    }

    email = email.trim();

    if (email.length === 0 || email.length > 254) {
        return false;
    }

    return EMAIL_REGEX.test(email);
}

/** Normalizes an email address (trim + lowercase) */
export function normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
}

// ============================================================================
// Phone Number Validation
// ============================================================================

/** US phone number regex with optional +1 */
export const PHONE_REGEX = /^(\+1[-.]?)?(\(?\d{3}\)?[-.]?)?\d{3}[-.]?\d{4}$/;

/** Validates if a string is a valid phone number */
export function isValidPhone(phone: string): boolean {
    if (!phone || typeof phone !== 'string') {
        return false;
    }

    return PHONE_REGEX.test(phone.trim());
}

// ============================================================================
// Student ID Validation
// ============================================================================

/** Alfred State student ID format: STU followed by 8 digits */
export const STUDENT_ID_REGEX = /^STU\d{8}$/;

/** Validates if a string is a valid student ID */
export function isValidStudentId(studentId: string): boolean {
    if (!studentId || typeof studentId !== 'string') {
        return false;
    }

    return STUDENT_ID_REGEX.test(studentId.trim());
}