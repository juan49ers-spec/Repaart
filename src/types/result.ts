/**
 * Result Pattern for Type-Safe Error Handling
 * 
 * Replaces try/catch with explicit success/failure types.
 * Forces consumers to handle errors at compile time.
 */

export type Result<T, E = Error> =
    | { success: true; data: T }
    | { success: false; error: E };

/**
 * Helper constructors
 */
export const ok = <T>(data: T): Result<T, never> =>
    ({ success: true, data });

export const err = <E>(error: E): Result<never, E> =>
    ({ success: false, error });

/**
 * Type guards - CRITICAL for type narrowing
 * Enables exhaustive checking in TypeScript consumers
 */
export const isOk = <T, E>(result: Result<T, E>): result is { success: true; data: T } =>
    result.success;

export const isErr = <T, E>(result: Result<T, E>): result is { success: false; error: E } =>
    !result.success;
