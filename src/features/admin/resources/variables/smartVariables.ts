export type VariableType = 'text' | 'date' | 'calculated' | 'required';

export interface SmartVariable {
    key: string;
    label: string;
    type: VariableType;
    description?: string;
    defaultValue?: string;
    validation?: {
        required?: boolean;
        pattern?: RegExp;
        minLength?: number;
        maxLength?: number;
    };
    calculate?: () => string;
}

// Variables calculadas automáticamente
export const CALCULATED_VARIABLES: SmartVariable[] = [
    {
        key: 'FECHA_HOY',
        label: 'Fecha de hoy',
        type: 'calculated',
        description: 'Fecha actual en formato completo',
        calculate: () => {
            const today = new Date();
            return today.toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        }
    },
    {
        key: 'FECHA_CORTA',
        label: 'Fecha corta (DD/MM/AAAA)',
        type: 'calculated',
        description: 'Fecha actual en formato corto',
        calculate: () => {
            const today = new Date();
            return today.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        }
    },
    {
        key: 'FECHA_MAS_7_DIAS',
        label: 'Fecha + 7 días',
        type: 'calculated',
        description: 'Fecha dentro de una semana',
        calculate: () => {
            const date = new Date();
            date.setDate(date.getDate() + 7);
            return date.toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        }
    },
    {
        key: 'FECHA_MAS_15_DIAS',
        label: 'Fecha + 15 días',
        type: 'calculated',
        description: 'Fecha dentro de 15 días',
        calculate: () => {
            const date = new Date();
            date.setDate(date.getDate() + 15);
            return date.toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        }
    },
    {
        key: 'FECHA_MAS_30_DIAS',
        label: 'Fecha + 30 días',
        type: 'calculated',
        description: 'Fecha dentro de 30 días',
        calculate: () => {
            const date = new Date();
            date.setDate(date.getDate() + 30);
            return date.toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        }
    },
    {
        key: 'FECHA_MAS_3_MESES',
        label: 'Fecha + 3 meses',
        type: 'calculated',
        description: 'Fecha dentro de 3 meses',
        calculate: () => {
            const date = new Date();
            date.setMonth(date.getMonth() + 3);
            return date.toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        }
    },
    {
        key: 'FECHA_MAS_6_MESES',
        label: 'Fecha + 6 meses',
        type: 'calculated',
        description: 'Fecha dentro de 6 meses',
        calculate: () => {
            const date = new Date();
            date.setMonth(date.getMonth() + 6);
            return date.toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        }
    },
    {
        key: 'FECHA_MAS_1_AÑO',
        label: 'Fecha + 1 año',
        type: 'calculated',
        description: 'Fecha dentro de 1 año',
        calculate: () => {
            const date = new Date();
            date.setFullYear(date.getFullYear() + 1);
            return date.toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        }
    },
    {
        key: 'DIA_SEMANA',
        label: 'Día de la semana',
        type: 'calculated',
        description: 'Día actual de la semana',
        calculate: () => {
            const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
            return days[new Date().getDay()];
        }
    },
    {
        key: 'MES_ACTUAL',
        label: 'Mes actual',
        type: 'calculated',
        description: 'Nombre del mes actual',
        calculate: () => {
            const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
            return months[new Date().getMonth()];
        }
    },
    {
        key: 'AÑO_ACTUAL',
        label: 'Año actual',
        type: 'calculated',
        description: 'Año en curso',
        calculate: () => new Date().getFullYear().toString()
    }
];

// Variables con validación
export const VALIDATED_VARIABLES: SmartVariable[] = [
    {
        key: 'CIF_FRANQUICIA',
        label: 'CIF/NIF Franquicia',
        type: 'required',
        description: 'Código de Identificación Fiscal',
        validation: {
            required: true,
            pattern: /^[A-Z0-9]{9}$/i,
            minLength: 9,
            maxLength: 9
        }
    },
    {
        key: 'CIF_RESTAURANTE',
        label: 'CIF/NIF Restaurante',
        type: 'required',
        description: 'Código de Identificación Fiscal del restaurante',
        validation: {
            required: true,
            pattern: /^[A-Z0-9]{9}$/i,
            minLength: 9,
            maxLength: 9
        }
    },
    {
        key: 'EMAIL_FRANQUICIA',
        label: 'Email Franquicia',
        type: 'required',
        description: 'Correo electrónico válido',
        validation: {
            required: true,
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        }
    },
    {
        key: 'CP_FRANQUICIA',
        label: 'Código Postal',
        type: 'required',
        description: 'Código postal español (5 dígitos)',
        validation: {
            required: true,
            pattern: /^\d{5}$/,
            minLength: 5,
            maxLength: 5
        }
    },
    {
        key: 'TELÉFONO_FRANQUICIA',
        label: 'Teléfono',
        type: 'required',
        description: 'Número de teléfono',
        validation: {
            required: true,
            pattern: /^[\d\s+\-()]{9,15}$/
        }
    }
];

// Todas las variables inteligentes
export const ALL_SMART_VARIABLES: SmartVariable[] = [
    ...CALCULATED_VARIABLES,
    ...VALIDATED_VARIABLES
];

// Función para calcular todas las variables calculadas
export const calculateSmartVariables = (): Record<string, string> => {
    const result: Record<string, string> = {};

    CALCULATED_VARIABLES.forEach(variable => {
        if (variable.calculate) {
            result[variable.key] = variable.calculate();
        }
    });

    return result;
};

// Función para validar una variable
export const validateVariable = (key: string, value: string): { isValid: boolean; error?: string } => {
    const variable = VALIDATED_VARIABLES.find(v => v.key === key);

    if (!variable || !variable.validation) {
        return { isValid: true };
    }

    const { validation } = variable;

    if (validation.required && (!value || value.trim() === '')) {
        return {
            isValid: false,
            error: `El campo ${variable.label} es obligatorio`
        };
    }

    if (validation.minLength && value.length < validation.minLength) {
        return {
            isValid: false,
            error: `Mínimo ${validation.minLength} caracteres`
        };
    }

    if (validation.maxLength && value.length > validation.maxLength) {
        return {
            isValid: false,
            error: `Máximo ${validation.maxLength} caracteres`
        };
    }

    if (validation.pattern && !validation.pattern.test(value)) {
        return {
            isValid: false,
            error: `Formato inválido para ${variable.label}`
        };
    }

    return { isValid: true };
};

export default ALL_SMART_VARIABLES;
