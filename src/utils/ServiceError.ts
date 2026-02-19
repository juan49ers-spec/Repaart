/**
 * ServiceError — Clase base para errores tipados de la capa de servicios.
 *
 * Patrón: error-handling-patterns skill.
 * Uso: throw new ServiceError('fetchUser', { cause: e, code: 'NETWORK' })
 *
 * Categorías:
 *   NETWORK    — Conectividad / timeout
 *   PERMISSION — Firebase permission-denied
 *   NOT_FOUND  — Recurso inexistente
 *   VALIDATION — Datos inválidos
 *   UNKNOWN    — Catch-all
 */

export type ErrorCode = 'NETWORK' | 'PERMISSION' | 'NOT_FOUND' | 'VALIDATION' | 'UNKNOWN';

export class ServiceError extends Error {
    readonly code: ErrorCode;
    readonly context: string;
    readonly recoverable: boolean;
    readonly timestamp: number;

    constructor(
        context: string,
        options: {
            cause?: unknown;
            code?: ErrorCode;
            recoverable?: boolean;
            message?: string;
        } = {}
    ) {
        const originalMessage = options.cause instanceof Error
            ? options.cause.message
            : String(options.cause ?? 'Error desconocido');

        super(options.message || `[${context}] ${originalMessage}`);
        this.name = 'ServiceError';
        this.context = context;
        this.code = options.code ?? ServiceError.inferCode(options.cause);
        this.recoverable = options.recoverable ?? ServiceError.isRecoverable(this.code);
        this.timestamp = Date.now();

        // Preservar stack del error original si existe
        if (options.cause instanceof Error && options.cause.stack) {
            this.stack = `${this.stack}\n--- Caused by ---\n${options.cause.stack}`;
        }
    }

    /** Inferir código de error a partir del error original */
    private static inferCode(cause: unknown): ErrorCode {
        if (!(cause instanceof Error)) return 'UNKNOWN';
        const msg = cause.message.toLowerCase();

        if (msg.includes('permission-denied') || msg.includes('unauthorized') || msg.includes('forbidden')) {
            return 'PERMISSION';
        }
        if (msg.includes('not-found') || msg.includes('no document')) {
            return 'NOT_FOUND';
        }
        if (msg.includes('network') || msg.includes('timeout') || msg.includes('unavailable') || msg.includes('failed to fetch')) {
            return 'NETWORK';
        }
        if (msg.includes('invalid') || msg.includes('validation') || msg.includes('required')) {
            return 'VALIDATION';
        }
        return 'UNKNOWN';
    }

    /** Los errores de red son recuperables (reintentar); permisos y validación no */
    private static isRecoverable(code: ErrorCode): boolean {
        return code === 'NETWORK' || code === 'UNKNOWN';
    }

    /** Mensaje amigable para el usuario (no técnico) */
    get userMessage(): string {
        switch (this.code) {
            case 'NETWORK':
                return 'Error de conexión. Comprueba tu internet e intenta de nuevo.';
            case 'PERMISSION':
                return 'No tienes permisos para realizar esta acción.';
            case 'NOT_FOUND':
                return 'El recurso solicitado no existe.';
            case 'VALIDATION':
                return 'Los datos proporcionados no son válidos.';
            default:
                return 'Ha ocurrido un error inesperado. Intenta de nuevo.';
        }
    }
}

/** Helpers rápidos para crear ServiceErrors tipados */
export const networkError = (ctx: string, cause?: unknown) =>
    new ServiceError(ctx, { cause, code: 'NETWORK' });

export const permissionError = (ctx: string, cause?: unknown) =>
    new ServiceError(ctx, { cause, code: 'PERMISSION' });

export const validationError = (ctx: string, message: string) =>
    new ServiceError(ctx, { code: 'VALIDATION', message: `[${ctx}] ${message}` });

export const notFoundError = (ctx: string, cause?: unknown) =>
    new ServiceError(ctx, { cause, code: 'NOT_FOUND' });
