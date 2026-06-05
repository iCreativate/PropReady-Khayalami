export interface PasswordValidationResult {
    valid: boolean;
    errors: string[];
}

/** Strong password: 8+ chars, upper, lower, number, special character */
export function validatePassword(password: string): PasswordValidationResult {
    const errors: string[] = [];

    if (!password || password.length < 8) {
        errors.push('At least 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
        errors.push('One uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
        errors.push('One lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
        errors.push('One number');
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
        errors.push('One special character (!@#$%^&* etc.)');
    }

    return { valid: errors.length === 0, errors };
}

export function getPasswordRequirementsText(): string {
    return 'At least 8 characters with uppercase, lowercase, a number, and a special character.';
}

export function formatPasswordErrors(result: PasswordValidationResult): string {
    if (result.valid) return '';
    return `Password must include: ${result.errors.join(', ')}.`;
}
