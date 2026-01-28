# API Design Best Practices for Repaart

## 📋 Table of Contents

1. [REST Principles](#rest-principles)
2. [Naming Conventions](#naming-conventions)
3. [Error Handling](#error-handling)
4. [Versioning Strategy](#versioning-strategy)
5. [Authentication & Authorization](#authentication--authorization)
6. [Pagination](#pagination)
7. [Testing](#testing)
8. [Documentation](#documentation)

---

## REST Principles

### Resource-Oriented Design

**✅ DO:**
```http
GET    /fleet/riders          # List riders
POST   /fleet/riders          # Create rider
GET    /fleet/riders/{id}     # Get rider
PUT    /fleet/riders/{id}     # Update rider
DELETE  /fleet/riders/{id}     # Delete rider
```

**❌ DON'T:**
```http
GET    /getRiders              # Verbs in URL
POST   /createRider            # Verbs in URL
GET    /api/v1/getAllRiders   # Verbs and redundant path
```

### HTTP Methods Semantics

| Method | Safe | Idempotent | Purpose |
|--------|-------|------------|---------|
| GET | ✅ | ✅ | Retrieve resource |
| POST | ❌ | ❌ | Create resource |
| PUT | ❌ | ✅ | Replace resource |
| PATCH | ❌ | ❌ | Partial update |
| DELETE | ❌ | ✅ | Delete resource |

### Proper Status Codes

**Success (2xx)**
- `200 OK`: Successful GET, PUT, PATCH, DELETE
- `201 Created`: Successful POST with new resource
- `204 No Content`: Successful DELETE (no body)

**Client Error (4xx)**
- `400 Bad Request`: Validation error, malformed request
- `401 Unauthorized`: Missing/invalid token
- `403 Forbidden`: Valid token, insufficient permissions
- `404 Not Found`: Resource doesn't exist
- `422 Unprocessable Entity`: Semantic validation error

**Server Error (5xx)**
- `500 Internal Server Error`: Unexpected server error
- `503 Service Unavailable`: Temporary service outage

---

## Naming Conventions

### Field Names: camelCase

**✅ DO:**
```json
{
  "franchiseId": "franchise_123",
  "createdAt": "2026-01-15T10:00:00Z",
  "contractHours": 40
}
```

**❌ DON'T:**
```json
{
  "franchise_id": "franchise_123",
  "created_at": "2026-01-15T10:00:00Z",
  "contract_hours": 40
}
```

### Resource Names: Plural

**✅ DO:**
```http
GET /fleet/riders
GET /fleet/vehicles
GET /academy/courses
```

**❌ DON'T:**
```http
GET /fleet/rider
GET /fleet/vehicle
GET /academy/course
```

### Path Parameters: lowercase

**✅ DO:**
```http
GET /fleet/riders/{riderId}
PUT /finance/records/{recordId}/status
```

**❌ DON'T:**
```http
GET /fleet/riders/{RiderId}
PUT /finance/records/{RecordId}/status
```

### Query Parameters: lowercase

**✅ DO:**
```http
GET /finance/records?franchiseId=abc&month=2026-01
```

**❌ DON'T:**
```http
GET /finance/records?FranchiseId=abc&Month=2026-01
```

---

## Error Handling

### Standard Error Format

```typescript
interface Error {
  code: string;           // Machine-readable error code
  message: string;        // Human-readable error message
  details?: {             // Optional validation details
    field?: string;
    constraint?: string;
    value?: any;
  };
}
```

### Example: Validation Error

**Request:**
```json
{
  "amount": -100,
  "type": "income"
}
```

**Response (400):**
```json
{
  "code": "VALIDATION_ERROR",
  "message": "Amount must be positive",
  "details": {
    "field": "amount",
    "constraint": "must be positive",
    "value": -100
  }
}
```

### Example: Authorization Error

**Response (403):**
```json
{
  "code": "FORBIDDEN",
  "message": "You don't have permission to approve financial records"
}
```

### Example: Not Found Error

**Response (404):**
```json
{
  "code": "NOT_FOUND",
  "message": "Rider with ID 'rider_123' not found"
}
```

### Error Code Standards

| Prefix | Domain | Examples |
|--------|---------|----------|
| `VALIDATION_` | Input validation | `VALIDATION_ERROR`, `VALIDATION_REQUIRED` |
| `AUTH_` | Authentication | `AUTH_INVALID_TOKEN`, `AUTH_EXPIRED` |
| `PERMISSION_` | Authorization | `PERMISSION_DENIED`, `PERMISSION_INSUFFICIENT` |
| `NOT_FOUND_` | Missing resources | `NOT_FOUND_RIDER`, `NOT_FOUND_VEHICLE` |
| `CONFLICT_` | Resource conflicts | `CONFLICT_EMAIL_EXISTS`, `CONFLICT_DUPLICATE` |
| `BUSINESS_` | Business logic | `BUSINESS_MONTH_LOCKED`, `BUSINESS_VEHICLE_MAINTENANCE` |

---

## Versioning Strategy

### URL Versioning (Preferred)

**Version 1:**
```http
GET /api/v1/fleet/riders
```

**Version 2:**
```http
GET /api/v2/fleet/riders
```

### Backward Compatibility

**✅ DO:**
```json
{
  "franchiseId": "abc123",
  "franchise_id": "abc123"  // Legacy field
}
```

**Reasoning:** Supports old clients while migrating to new schema.

### Deprecation Policy

1. **New versions** introduce new endpoints with new path
2. **Old versions** remain supported for at least 6 months
3. **Deprecation header** added to deprecated endpoints:
```http
Warning: 299 - "Deprecated API. Use /api/v2/... instead. Support ends 2026-07-01"
```

4. **Sunset** of old versions announced in changelog

---

## Authentication & Authorization

### Bearer Token Authentication

**Request Header:**
```http
Authorization: Bearer <firebase-jwt-token>
```

### Role-Based Access Control (RBAC)

**Admin Role:**
```typescript
// Can access all franchises
if (user.role !== 'admin' && requestedFranchiseId !== user.franchiseId) {
  throw new Error('PERMISSION_DENIED');
}
```

**Franchise Role:**
```typescript
// Can only access own franchise
if (user.role === 'franchise' && requestedFranchiseId !== user.franchiseId) {
  throw new Error('PERMISSION_DENIED');
}
```

**Rider Role:**
```typescript
// Can only access own data
if (user.role === 'rider' && requestedRiderId !== user.uid) {
  throw new Error('PERMISSION_DENIED');
}
```

### Resource Ownership Check Pattern

```typescript
async function checkPermission(resourceId: string, userId: string) {
  const resource = await getResource(resourceId);
  
  if (resource.franchiseId !== getFranchiseId(userId)) {
    throw new ForbiddenError('You do not have permission to access this resource');
  }
  
  return resource;
}
```

---

## Pagination

### Offset-based Pagination (Simple)

**Request:**
```http
GET /fleet/riders?franchiseId=abc&offset=0&limit=20
```

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "offset": 0,
    "limit": 20,
    "total": 150,
    "hasMore": true
  }
}
```

### Cursor-based Pagination (Advanced)

**Request:**
```http
GET /finance/records?franchiseId=abc&cursor=abc123&limit=20
```

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "nextCursor": "def456",
    "hasMore": true
  }
}
```

### Pagination Guidelines

1. **Default limit**: 20 items per page
2. **Maximum limit**: 100 items per page
3. **Include pagination metadata** in response
4. **Use consistent limit** across all endpoints

---

## Testing

### Unit Tests

```typescript
describe('Finance API', () => {
  it('should create a financial record', async () => {
    const response = await request(app)
      .post('/finance/records')
      .set('Authorization', `Bearer ${token}`)
      .send({
        franchiseId: 'abc',
        type: 'income',
        amount: 1000
      });

    expect(response.status).toBe(201);
    expect(response.body.type).toBe('income');
  });

  it('should return 400 for negative amount', async () => {
    const response = await request(app)
      .post('/finance/records')
      .set('Authorization', `Bearer ${token}`)
      .send({
        franchiseId: 'abc',
        type: 'income',
        amount: -100
      });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });
});
```

### Integration Tests

```typescript
describe('Finance API Integration', () => {
  it('should approve financial record', async () => {
    const record = await createRecord({...});
    const response = await request(app)
      .patch(`/finance/records/${record.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'approved' });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('approved');
  });
});
```

### Load Testing

```bash
# Using Apache Bench
ab -n 1000 -c 10 \
   -H "Authorization: Bearer <token>" \
   https://repaartfinanzas.web.app/api/fleet/riders

# Using k6
k6 run --vus 10 --duration 30s load-test.js
```

---

## Documentation

### Inline Code Documentation

```typescript
/**
 * Creates a new rider with Firebase Auth and Firestore
 * 
 * @param riderData - Rider information
 * @param riderData.email - Email address (must be unique)
 * @param riderData.password - Password (min 6 chars)
 * @param riderData.fullName - Full name
 * @param riderData.franchiseId - Franchise ID
 * @returns Created rider object
 * @throws {Error} If email already exists
 * @throws {Error} If validation fails
 * 
 * @example
 * const rider = await fleetService.createRider({
 *   email: 'rider@example.com',
 *   password: 'secure123',
 *   fullName: 'Juan Pérez',
 *   franchiseId: 'franchise_abc'
 * });
 */
async createRider(riderData: RiderInput): Promise<Rider> {
  // Implementation
}
```

### OpenAPI Specification Updates

When adding new endpoints:

1. **Update `docs/api/openapi.yaml`**
2. **Add endpoint path and method**
3. **Define request/response schemas**
4. **Add tags for organization**
5. **Document error responses**

### Changelog Maintenance

```markdown
## [1.1.0] - 2026-02-01

### Added
- `PATCH /fleet/riders/{id}/status` - Update rider status
- `GET /scheduler/shifts/stats` - Get shift statistics

### Changed
- `POST /fleet/riders` - Added `onboardingDate` field
- `GET /finance/summary` - Added `yearToDate` field

### Fixed
- Fixed pagination cursor encoding
- Fixed `403` error on rider self-update

### Deprecated
- `GET /fleet/riders/search` - Use `GET /fleet/riders` with filters instead
```

---

## 🚦 Quick Reference

### HTTP Method Decision Tree

```
Need to...          | Method
--------------------|--------
Retrieve data       | GET
Create new resource | POST
Replace resource   | PUT
Update partially   | PATCH
Delete resource   | DELETE
```

### Status Code Decision Tree

```
Success?             | Status
---------------------|-------
Yes, created         | 201
Yes, no body        | 204
Yes, with body      | 200
Client error         | 400
Unauthorized        | 401
Forbidden           | 403
Not found           | 404
Server error        | 500
```

### URL Structure Template

```
/api/v{version}/{domain}/{resource}/{id}/{action}

Examples:
/api/v1/fleet/riders
/api/v1/fleet/vehicles/{id}
/api/v1/finance/records/{id}/status
/api/v1/academy/courses/{id}/lessons
```

---

## 📚 Additional Resources

- [OpenAPI 3.1 Specification](https://swagger.io/specification/)
- [REST API Design Best Practices](https://restfulapi.net/)
- [HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Zod Validation](https://zod.dev/)

---

## 🔗 Related Documents

- [OpenAPI Specification](./openapi.yaml)
- [API README](./README.md)
- [Project README](../../README.md)
