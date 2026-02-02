/**
 * Result Type - Pattern for error handling without exceptions
 * 
 * Inspired by Rust's Result type and functional programming
 * Use this instead of throwing exceptions for better type safety
 * 
 * Example:
 * ```typescript
 * async function fetchUser(id: string): Promise<Result<User, Error>> {
 *   try {
 *     const user = await api.getUser(id);
 *     return success(user);
 *   } catch (error) {
 *     return failure(new Error('Failed to fetch user'));
 *   }
 * }
 * 
 * // Usage
 * const result = await fetchUser('123');
 * if (isSuccess(result)) {
 *   console.log(result.data);
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */

// Success variant
export interface Success<T> {
  readonly success: true;
  readonly data: T;
}

// Failure variant
export interface Failure<E> {
  readonly success: false;
  readonly error: E;
}

// Result type - discriminated union
export type Result<T, E = Error> = Success<T> | Failure<E>;

/**
 * Create a success result
 */
export function success<T>(data: T): Success<T> {
  return { success: true, data };
}

/**
 * Create a failure result
 */
export function failure<E>(error: E): Failure<E> {
  return { success: false, error };
}

/**
 * Type guard for success
 */
export function isSuccess<T, E>(result: Result<T, E>): result is Success<T> {
  return result.success === true;
}

/**
 * Type guard for failure
 */
export function isFailure<T, E>(result: Result<T, E>): result is Failure<E> {
  return result.success === false;
}

/**
 * Transform the success value
 * If failure, passes through unchanged
 */
export function mapResult<T, U, E>(
  result: Result<T, E>,
  fn: (data: T) => U
): Result<U, E> {
  if (isSuccess(result)) {
    return success(fn(result.data));
  }
  return result;
}

/**
 * Chain operations that return Results
 * If failure, stops and returns the error
 */
export function flatMapResult<T, U, E>(
  result: Result<T, E>,
  fn: (data: T) => Result<U, E>
): Result<U, E> {
  if (isSuccess(result)) {
    return fn(result.data);
  }
  return result;
}

/**
 * Unwrap with default value
 * Returns data if success, defaultValue if failure
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  if (isSuccess(result)) {
    return result.data;
  }
  return defaultValue;
}

/**
 * Unwrap with lazy default
 * Returns data if success, calls handler if failure
 */
export function unwrapOrElse<T, E>(
  result: Result<T, E>,
  handler: () => T
): T {
  if (isSuccess(result)) {
    return result.data;
  }
  return handler();
}

/**
 * Try-catch wrapper that returns Result
 * Makes any throwing function return Result instead
 */
export function tryCatch<T>(
  fn: () => T,
  onError?: (error: unknown) => Error
): Result<T, Error> {
  try {
    return success(fn());
  } catch (error) {
    const mappedError = onError ? onError(error) : 
      error instanceof Error ? error : new Error(String(error));
    return failure(mappedError);
  }
}

/**
 * Async version of tryCatch
 */
export async function tryCatchAsync<T>(
  fn: () => Promise<T>,
  onError?: (error: unknown) => Error
): Promise<Result<T, Error>> {
  try {
    const data = await fn();
    return success(data);
  } catch (error) {
    const mappedError = onError ? onError(error) : 
      error instanceof Error ? error : new Error(String(error));
    return failure(mappedError);
  }
}

/**
 * Combine multiple Results
 * Returns success with array if all succeed
 * Returns first failure if any fail
 */
export function combineResults<T, E>(
  results: Result<T, E>[]
): Result<T[], E> {
  const data: T[] = [];
  
  for (const result of results) {
    if (isFailure(result)) {
      return result;
    }
    data.push(result.data);
  }
  
  return success(data);
}
