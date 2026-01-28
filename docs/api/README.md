# Repaart API Documentation

> **Version:** 1.0.0  
> **Base URL:** `https://repaartfinanzas.web.app`  
> **Auth:** Firebase Auth (JWT Bearer Token)

---

## 📋 Overview

The Repaart API is a RESTful API for managing logistics, finance, academy, and scheduling operations for franchise and admin users.

### Key Features

- ✅ **RESTful Architecture**: Resource-oriented design with proper HTTP methods
- ✅ **Firebase Auth**: JWT-based authentication and role-based authorization
- ✅ **Schema Validation**: Zod runtime validation for all requests/responses
- ✅ **ISO 8601 Timestamps**: Consistent date formatting across all endpoints
- ✅ **OpenAPI 3.1 Specification**: Machine-readable API contract

### Roles & Permissions

| Role | Scope | Permissions |
|-------|--------|--------------|
| **Admin** | Global | Access all franchises, approve financial records, manage academy content |
| **Franchise** | Local | Manage own franchise riders, vehicles, shifts, and financial records (draft/submitted) |
| **Rider** | Personal | View/confirm own shifts, track academy progress, no financial access |

---

## 🔐 Authentication

All API requests require a valid Firebase Auth JWT token in the Authorization header.

```bash
curl -H "Authorization: Bearer <firebase-jwt-token>" \
     https://repaartfinanzas.web.app/api/finance/records
```

### Obtaining a Token

```javascript
import { getAuth } from 'firebase/auth';

const user = await getAuth().currentUser;
const token = await user.getIdToken();

// Use token in Authorization header
```

---

## 📊 Finance API

### Endpoints

#### List Financial Records

```http
GET /finance/records?franchiseId={franchiseId}&month={month}
```

**Response:**
```json
[
  {
    "id": "rec_123",
    "franchiseId": "franchise_abc",
    "type": "income",
    "amount": 1500.00,
    "category": "delivery_revenue",
    "description": "Weekly delivery revenue",
    "status": "approved",
    "createdAt": "2026-01-15T10:00:00Z",
    "updatedAt": "2026-01-15T10:00:00Z"
  }
]
```

#### Create Financial Record

```http
POST /finance/records
Content-Type: application/json

{
  "franchiseId": "franchise_abc",
  "type": "expense",
  "amount": 500.00,
  "category": "fuel",
  "description": "Weekly fuel costs"
}
```

#### Update Record Status

```http
PATCH /finance/records/{recordId}/status
Content-Type: application/json

{
  "status": "submitted"
}
```

**Status Flow:**
```
draft → submitted → approved/rejected
  ↓          ↓           ↓
[Franchise] [Admin]    [Admin]
```

#### Get Monthly Summary

```http
GET /finance/summary?franchiseId={franchiseId}&month={month}
```

**Response:**
```json
{
  "id": "summary_2026-01",
  "franchiseId": "franchise_abc",
  "month": "2026-01",
  "totalIncome": 5000.00,
  "totalExpense": 2000.00,
  "netProfit": 3000.00,
  "margin": 60.0,
  "status": "locked",
  "lockedAt": "2026-02-01T00:00:00Z"
}
```

#### Lock Financial Month

```http
POST /finance/summary/{summaryId}/lock
```

> **Note:** Only Admin can lock months. Locked months cannot be modified.

---

## 🏍️ Fleet API

### Endpoints

#### List Riders

```http
GET /fleet/riders?franchiseId={franchiseId}
```

#### Create Rider

```http
POST /fleet/riders
Content-Type: application/json

{
  "email": "rider@example.com",
  "password": "securePass123",
  "fullName": "Juan Pérez",
  "franchiseId": "franchise_abc",
  "contractHours": 40,
  "phone": "+34600123456",
  "licenseType": "125cc"
}
```

> **Note:** This creates a Firebase Auth user and Firestore document.

#### List Vehicles

```http
GET /fleet/vehicles?franchiseId={franchiseId}
```

#### Create Vehicle

```http
POST /fleet/vehicles?franchiseId={franchiseId}
Content-Type: application/json

{
  "plate": "1234ABC",
  "brand": "Yamaha",
  "model": "NMAX 155",
  "currentKm": 5000,
  "nextRevisionKm": 10000
}
```

> **Note:** Vehicle automatically switches to `maintenance` status when `currentKm >= nextRevisionKm`.

---

## 🎓 Academy API

### Endpoints

#### List Courses

```http
GET /academy/courses
```

#### Create Course

```http
POST /academy/courses
Content-Type: application/json

{
  "title": "Delivery Best Practices",
  "description": "Learn how to deliver efficiently",
  "category": "Operations",
  "duration": "2 hours",
  "level": "beginner",
  "status": "active"
}
```

#### Create Lesson

```http
POST /academy/lessons
Content-Type: application/json

{
  "moduleId": "course_123",
  "title": "Package Handling",
  "content": "<h1>Package Handling</h1><p>Learn proper techniques...</p>",
  "videoUrl": "https://storage.googleapis.com/videos/package_handling.mp4",
  "duration": 900,
  "order": 1
}
```

#### Get User Progress

```http
GET /academy/progress?userId={userId}
```

**Response:**
```json
{
  "course_123": {
    "id": "progress_456",
    "userId": "user_abc",
    "moduleId": "course_123",
    "completedLessons": ["lesson_1", "lesson_2"],
    "quizScore": 85,
    "status": "in_progress",
    "lastAccessed": "2026-01-20T15:30:00Z"
  }
}
```

#### Complete Lesson

```http
POST /academy/lessons/{lessonId}/complete
Content-Type: application/json

{
  "userId": "user_abc",
  "moduleId": "course_123"
}
```

---

## 📅 Scheduler API

### Endpoints

#### List Shifts

```http
GET /scheduler/shifts?franchiseId={franchiseId}&startDate={startDate}&endDate={endDate}
```

**Query Parameters:**
- `franchiseId` (required): Franchise ID
- `startDate` (required): Start date (YYYY-MM-DD)
- `endDate` (required): End date (YYYY-MM-DD)
- `riderId` (optional): Filter by rider

#### Create Shift

```http
POST /scheduler/shifts
Content-Type: application/json

{
  "franchiseId": "franchise_abc",
  "riderId": "rider_123",
  "riderName": "Juan Pérez",
  "motoId": "vehicle_456",
  "motoPlate": "1234ABC",
  "startAt": "2026-01-25T09:00:00Z",
  "endAt": "2026-01-25T14:00:00Z",
  "status": "scheduled"
}
```

#### Start Shift (Clock In)

```http
POST /scheduler/shifts/{shiftId}/start
```

> **Effect:** Sets `status: 'active'` and `actualStart: serverTimestamp()`

#### End Shift (Clock Out)

```http
POST /scheduler/shifts/{shiftId}/end
```

> **Effect:** Sets `status: 'completed'` and `actualEnd: serverTimestamp()`

#### Confirm Shift

```http
POST /scheduler/shifts/{shiftId}/confirm
```

> **Purpose:** Rider confirms they've seen and accepted the shift assignment.

#### Request Shift Swap

```http
PATCH /scheduler/shifts/{shiftId}/swap
Content-Type: application/json

{
  "requested": true
}
```

#### Request Shift Change

```http
PATCH /scheduler/shifts/{shiftId}/change
Content-Type: application/json

{
  "requested": true,
  "reason": "Personal commitment"
}
```

#### Get Week Data

```http
GET /scheduler/weeks/{franchiseId}/{weekId}
```

**weekId Format:** `YYYY_WW` (e.g., `2026_04`)

**Response:**
```json
{
  "id": "2026_04",
  "startDate": "2026-01-20",
  "status": "published",
  "metrics": {
    "totalHours": 160.5,
    "activeRiders": 8,
    "motosInUse": 7
  },
  "shifts": [...]
}
```

---

## 🎨 Design Principles

### 1. RESTful Conventions

| Method | Action | Example |
|---------|---------|---------|
| GET | Retrieve resource | `GET /fleet/riders` |
| POST | Create resource | `POST /fleet/riders` |
| PUT | Update resource | `PUT /fleet/riders/{id}` |
| DELETE | Delete resource | `DELETE /fleet/riders/{id}` |
| PATCH | Partial update | `PATCH /finance/records/{id}/status` |

### 2. Naming Conventions

- **camelCase**: All field names (e.g., `franchiseId`, `createdAt`)
- **Plural resources**: `/riders`, `/vehicles`, `/shifts`
- **Hierarchical IDs**: `/weeks/{franchiseId}/{weekId}`

### 3. Response Format

#### Success Response
```json
{
  "id": "resource_123",
  "field1": "value1",
  "field2": "value2"
}
```

#### Error Response
```json
{
  "code": "VALIDATION_ERROR",
  "message": "The provided data is invalid",
  "details": {
    "field": "amount",
    "constraint": "must be positive"
  }
}
```

### 4. HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 204 | No Content (success, no body) |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (invalid/missing token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found (resource doesn't exist) |
| 500 | Internal Server Error |

---

## 🔧 SDK Generation

You can generate SDKs from the OpenAPI specification using these tools:

### TypeScript/JavaScript (OpenAPI Generator)

```bash
# Install
npm install -g @openapitools/openapi-generator-cli

# Generate TypeScript SDK
openapi-generator-cli generate \
  -i docs/api/openapi.yaml \
  -g typescript-axios \
  -o src/generated/api
```

### Python (OpenAPI Generator)

```bash
openapi-generator-cli generate \
  -i docs/api/openapi.yaml \
  -g python \
  -o src/generated/python
```

### Go (OpenAPI Generator)

```bash
openapi-generator-cli generate \
  -i docs/api/openapi.yaml \
  -g go \
  -o src/generated/go
```

### Kotlin (OpenAPI Generator)

```bash
openapi-generator-cli generate \
  -i docs/api/openapi.yaml \
  -g kotlin \
  -o src/generated/kotlin
```

---

## 📚 Additional Resources

- **Full OpenAPI Spec**: `docs/api/openapi.yaml`
- **Postman Collection**: [Import from openapi.yaml](#)
- **API Versioning**: Follows semantic versioning (MAJOR.MINOR.PATCH)
- **Changelog**: `CHANGELOG.md`

---

## 🚦 Version History

### v1.0.0 (2026-01-26)
- Initial OpenAPI 3.1 specification
- Finance, Fleet, Academy, and Scheduler endpoints documented
- Authentication and authorization defined
- Error response standardization

---

## 📞 Support

For API support:
- Email: api@repaart.com
- Documentation: https://docs.repaart.com
- GitHub Issues: https://github.com/repaart/api/issues
