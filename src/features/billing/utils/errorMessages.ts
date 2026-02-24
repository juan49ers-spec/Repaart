/**
 * Billing Error Messages
 * 
 * Mapea errores técnicos a mensajes amigables en español para el usuario
 */

import { BillingError } from '../../../types/invoicing';

interface ErrorMessage {
    title: string;
    message: string;
    suggestion?: string;
}

/**
 * Convierte un error de facturación en un mensaje amigable para el usuario
 */
export const getBillingErrorMessage = (error: BillingError): ErrorMessage => {
    const errorMessages: Record<string, ErrorMessage> = {
        // Errores de validación
        'VALIDATION_ERROR': {
            title: 'Datos incorrectos',
            message: 'Algunos campos obligatorios están incompletos o tienen formato incorrecto.',
            suggestion: 'Revisa que todos los campos marcados con * estén completados'
        },

        // Errores de factura no encontrada
        'INVOICE_NOT_FOUND': {
            title: 'Factura no encontrada',
            message: 'La factura que buscas no existe o ha sido eliminada.',
            suggestion: 'Actualiza la lista de facturas'
        },

        // Error de factura no es borrador
        'INVOICE_NOT_DRAFT': {
            title: 'Factura no editable',
            message: 'Solo se pueden editar facturas en estado BORRADOR.',
            suggestion: 'Esta factura ya fue emitida y no se puede modificar'
        },

        // Errores de cliente
        'CUSTOMER_NOT_FOUND': {
            title: 'Cliente no encontrado',
            message: 'El cliente seleccionado no existe en el sistema.',
            suggestion: 'Selecciona un cliente existente o crea uno nuevo'
        },

        // Errores de pago
        'PAYMENT_EXCEEDS_TOTAL': {
            title: 'El pago excede el total',
            message: 'El importe del pago es mayor que el total de la factura.',
            suggestion: 'Verifica el importe pendiente de la factura'
        },

        'INVALID_PAYMENT': {
            title: 'Pago no válido',
            message: 'La factura no admite pagos en su estado actual.',
            suggestion: 'Las facturas en borrador no pueden recibir pagos'
        },

        // Error de rectificación
        'INVOICE_ALREADY_RECTIFIED': {
            title: 'Factura ya rectificada',
            message: 'Esta factura ya ha sido rectificada previamente.',
            suggestion: 'Crea una nueva rectificación si es necesario'
        },

        'INVALID_RECTIFICATION': {
            title: 'Rectificación no válida',
            message: 'Los datos de la rectificación no son válidos.',
            suggestion: 'Verifica que el importe sea positivo y menor que la factura original'
        },

        // Errores de empresa
        'COMPANY_DATA_MISSING': {
            title: 'Datos de empresa incompletos',
            message: 'Antes de crear facturas, debes configurar los datos de tu empresa.',
            suggestion: 'Ve a "Datos Franquicia" y completa: Razón Social, CIF, Teléfono y Dirección'
        },

        // Errores generales
        'UNKNOWN_ERROR': {
            title: 'Error inesperado',
            message: 'Ha ocurrido un error al procesar la solicitud.',
            suggestion: 'Inténtalo de nuevo. Si el problema persiste, contacta con soporte'
        },

        'PERMISSION_DENIED': {
            title: 'Sin permisos',
            message: 'No tienes permisos suficientes para realizar esta acción.',
            suggestion: 'Contacta al administrador del sistema'
        }
    };

    // Buscar mensaje específico o usar genérico
    const errorInfo = errorMessages[error.type] || errorMessages['UNKNOWN_ERROR'];

    // Si hay información adicional en el error, agregarla
    let finalMessage = errorInfo.message;
    
    if ('field' in error && error.field && error.field !== 'unknown') {
        finalMessage += ` (campo: ${error.field})`;
    }

    return {
        title: errorInfo.title,
        message: finalMessage,
        suggestion: errorInfo.suggestion
    };
};
