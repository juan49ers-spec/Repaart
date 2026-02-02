import { describe, it, expect } from 'vitest';
import { 
  Result, 
  success, 
  failure, 
  isSuccess, 
  isFailure,
  mapResult,
  flatMapResult,
  unwrapOr,
  unwrapOrElse
} from '../result';

describe('Result Type', () => {
  describe('success', () => {
    it('should create a success result', () => {
      const result = success(42);
      expect(result.success).toBe(true);
      expect(result.data).toBe(42);
    });

    it('should be identified as success', () => {
      const result = success('test');
      expect(isSuccess(result)).toBe(true);
      expect(isFailure(result)).toBe(false);
    });
  });

  describe('failure', () => {
    it('should create a failure result', () => {
      const error = new Error('Test error');
      const result = failure(error);
      expect(result.success).toBe(false);
      expect(result.error).toBe(error);
    });

    it('should be identified as failure', () => {
      const result = failure(new Error('Test'));
      expect(isSuccess(result)).toBe(false);
      expect(isFailure(result)).toBe(true);
    });
  });

  describe('mapResult', () => {
    it('should transform success value', () => {
      const result = success(5);
      const mapped = mapResult(result, x => x * 2);
      expect(isSuccess(mapped)).toBe(true);
      if (isSuccess(mapped)) {
        expect(mapped.data).toBe(10);
      }
    });

    it('should pass through failure', () => {
      const error = 404;
      const result: Result<number, number> = failure(error);
      const mapped = mapResult<number, number, number>(result, x => x * 2);
      expect(isFailure(mapped)).toBe(true);
      if (isFailure(mapped)) {
        expect(mapped.error).toBe(error);
      }
    });
  });

  describe('flatMapResult', () => {
    it('should chain success results', () => {
      const result = success(5);
      const chained = flatMapResult(result, x => success(x * 2));
      expect(isSuccess(chained)).toBe(true);
      if (isSuccess(chained)) {
        expect(chained.data).toBe(10);
      }
    });

    it('should stop on first failure', () => {
      const result = success(5);
      const error = new Error('Second error');
      const chained = flatMapResult(result, () => failure(error));
      expect(isFailure(chained)).toBe(true);
    });
  });

  describe('unwrapOr', () => {
    it('should return data on success', () => {
      const result = success(42);
      expect(unwrapOr(result, 0)).toBe(42);
    });

    it('should return default on failure', () => {
      const result = failure(new Error('Test'));
      expect(unwrapOr(result, 0)).toBe(0);
    });
  });

  describe('unwrapOrElse', () => {
    it('should return data on success', () => {
      const result = success(42);
      expect(unwrapOrElse(result, () => 0)).toBe(42);
    });

    it('should call handler on failure', () => {
      const result = failure(new Error('Test'));
      const handler = () => 999;
      expect(unwrapOrElse(result, handler)).toBe(999);
    });
  });
});
