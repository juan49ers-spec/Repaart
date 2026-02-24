# Billing & Treasury Module - Tests

## Overview

This directory contains unit tests for the Billing & Treasury module of Repaart v3.0. The tests ensure the correctness of the core services and their compliance with business rules and regulatory requirements.

## Test Files

### invoiceEngine.test.ts
Tests for the immutable invoice engine:
- Draft invoice creation
- Invoice issuance (transition to ISSUED status)
- Invoice rectification
- Draft updates and deletions
- Error handling for invalid operations

### logisticsBillingEngine.test.ts
Tests for the logistics billing calculation:
- Range-based billing calculation
- Multiple tax rate support
- Mixed billing (logistics + additional services)
- Error handling for insufficient data

### accountsReceivable.test.ts
Tests for payment and debt management:
- Payment registration
- Invoice payment status updates
- Debt dashboard generation
- Customer debt calculation
- Debt classification (current vs overdue)

### taxVault.test.ts
Tests for the fiscal bridge and monthly closing:
- Tax vault observer (on invoice issuance)
- Tax vault observer (on expense creation)
- Monthly close execution
- Tax vault entry retrieval
- Month unlock requests

## Running the Tests

### Run all tests
```bash
npm run test:unit
```

### Run specific test file
```bash
npm run test:unit -- billing/invoiceEngine.test.ts
```

### Run tests in watch mode
```bash
npm run test:unit:watch
```

### Run tests with coverage
```bash
npm run test:unit:coverage
```

## Test Structure

The tests follow the Arrange-Act-Assert pattern and use Vitest as the testing framework. Firebase is mocked to avoid hitting the actual database during tests.

### Example Test Structure
```typescript
describe('ServiceName', () => {
    beforeEach(() => {
        // Setup mocks
    });
    
    afterEach(() => {
        // Cleanup mocks
    });
    
    describe('methodName', () => {
        it('should do something successfully', async () => {
            // Arrange
            const mockData = { ... };
            
            // Act
            const result = await service.methodName(mockData);
            
            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(expectedData);
            }
        });
    });
});
```

## Key Test Scenarios

### Invoice Immutability
- Verify that ISSUED invoices cannot be modified
- Ensure that DRAFT invoices can be edited/deleted
- Validate that rectification creates new invoices

### Transaction Safety
- Test that concurrent operations are handled correctly
- Verify that partial updates don't corrupt data
- Ensure that tax vault is updated atomically

### Business Logic
- Validate tax calculations (IVA 21%, 10%, 4%)
- Test debt classification (>30 days = overdue)
- Verify payment status updates (PENDING → PARTIAL → PAID)

### Error Handling
- Test error responses for invalid operations
- Verify proper error types and messages
- Ensure graceful degradation

## Coverage Goals

- **Lines**: >80%
- **Functions**: >85%
- **Branches**: >75%
- **Statements**: >80%

## Mock Strategy

Firebase Firestore is mocked to provide:
- `collection`: Mock collection references
- `doc`: Mock document references
- `getDoc`: Mock document retrieval
- `addDoc`: Mock document creation
- `updateDoc`: Mock document updates
- `runTransaction`: Mock transaction execution
- `serverTimestamp`: Mock timestamp generation

## Future Improvements

1. Add integration tests with Firebase emulators
2. Add E2E tests for complete workflows
3. Add performance tests for high-volume scenarios
4. Add contract tests for API endpoints
5. Add visual regression tests for PDF generation
