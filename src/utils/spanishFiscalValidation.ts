/**
 * Spanish Fiscal Identification Validation
 * Validates CIF, NIF, NIE formats according to Spanish regulations
 */

const CIF_LETTERS = 'JABCDEFGHIJ';
const DNI_LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKEO';

export type FiscalIdType = 'NIF' | 'NIE' | 'CIF' | 'INVALID';

export interface ValidationResult {
    isValid: boolean;
    type: FiscalIdType;
    normalizedValue: string;
    error?: string;
}

function cleanFiscalId(value: string): string {
    return value.replace(/[\s\-_.]/g, '').toUpperCase();
}

export function validateNIF(value: string): ValidationResult {
    const clean = cleanFiscalId(value);
    
    if (!/^\d{8}[A-Z]$/.test(clean)) {
        return { isValid: false, type: 'NIF', normalizedValue: clean, error: 'Formato de NIF inválido (8 números + letra)' };
    }
    
    const number = parseInt(clean.substring(0, 8), 10);
    const letter = clean.charAt(8);
    const expectedLetter = DNI_LETTERS[number % 23];
    
    if (letter !== expectedLetter) {
        return { isValid: false, type: 'NIF', normalizedValue: clean, error: `Letra incorrecta. Debería ser ${expectedLetter}` };
    }
    
    return { isValid: true, type: 'NIF', normalizedValue: clean };
}

export function validateNIE(value: string): ValidationResult {
    const clean = cleanFiscalId(value);
    
    if (!/^[XYZ]\d{7}[A-Z]$/.test(clean)) {
        return { isValid: false, type: 'NIE', normalizedValue: clean, error: 'Formato de NIE inválido (X/Y/Z + 7 números + letra)' };
    }
    
    const prefix = clean.charAt(0);
    const prefixMap: Record<string, string> = { X: '0', Y: '1', Z: '2' };
    const number = parseInt(prefixMap[prefix] + clean.substring(1, 8), 10);
    const letter = clean.charAt(8);
    const expectedLetter = DNI_LETTERS[number % 23];
    
    if (letter !== expectedLetter) {
        return { isValid: false, type: 'NIE', normalizedValue: clean, error: `Letra incorrecta. Debería ser ${expectedLetter}` };
    }
    
    return { isValid: true, type: 'NIE', normalizedValue: clean };
}

export function validateCIF(value: string): ValidationResult {
    const clean = cleanFiscalId(value);
    
    if (!/^[ABCDEFGHJKLMNPQRSUVW]\d{7}[0-9A-J]$/.test(clean)) {
        return { isValid: false, type: 'CIF', normalizedValue: clean, error: 'Formato de CIF inválido (letra + 7 números + dígito/letra)' };
    }
    
    const numbers = clean.substring(1, 8);
    const control = clean.charAt(8);
    
    let sum = 0;
    for (let i = 0; i < 7; i++) {
        const digit = parseInt(numbers.charAt(i), 10);
        if (i % 2 === 0) {
            const doubled = digit * 2;
            sum += Math.floor(doubled / 10) + (doubled % 10);
        } else {
            sum += digit;
        }
    }
    
    const checkDigit = (10 - (sum % 10)) % 10;
    const expectedControl = CIF_LETTERS[checkDigit];
    
    const isValidNumeric = control === checkDigit.toString();
    const isValidLetter = control === expectedControl;
    
    if (!isValidNumeric && !isValidLetter) {
        return { isValid: false, type: 'CIF', normalizedValue: clean, error: `Dígito de control incorrecto` };
    }
    
    return { isValid: true, type: 'CIF', normalizedValue: clean };
}

export function validateSpanishFiscalId(value: string): ValidationResult {
    const clean = cleanFiscalId(value);
    
    if (clean.length === 0) {
        return { isValid: false, type: 'INVALID', normalizedValue: clean, error: 'CIF/NIF requerido' };
    }
    
    const firstChar = clean.charAt(0);
    
    if (/^\d/.test(firstChar)) {
        return validateNIF(clean);
    }
    
    if (/^[XYZ]/.test(firstChar)) {
        return validateNIE(clean);
    }
    
    if (/^[ABCDEFGHJKLMNPQRSUVW]/.test(firstChar)) {
        return validateCIF(clean);
    }
    
    return { isValid: false, type: 'INVALID', normalizedValue: clean, error: 'Formato de identificación fiscal no reconocido' };
}

export function formatFiscalId(value: string): string {
    const clean = cleanFiscalId(value);
    
    if (clean.length === 9 && /^\d/.test(clean)) {
        return `${clean.substring(0, 8)}-${clean.charAt(8)}`;
    }
    
    if (clean.length === 9 && /^[A-Z]/.test(clean)) {
        return `${clean.charAt(0)}-${clean.substring(1, 8)}-${clean.charAt(8)}`;
    }
    
    return value;
}
