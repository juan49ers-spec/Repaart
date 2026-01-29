# API Documentation - Repaart Platform

Complete API reference for the Repaart SaaS Platform.

## Table of Contents

- [Authentication](#authentication)
- [Cloud Functions](#cloud-functions)
- [Firestore Collections](#firestore-collections)
- [Academy API](#academy-api)
- [Admin API](#admin-api)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

---

## Authentication

### Auth Methods

The platform uses Firebase Authentication with custom claims for role-based access control.

#### Get Current User
```typescript
import { getAuth } from 'firebase/auth';

const auth = getAuth();
const user = auth.currentUser;
```

#### Custom Claims
```typescript
interface CustomClaims {
  role: 'admin' | 'franchise' | 'rider' | 'user';
  admin?: boolean;
  franchise?: boolean;
  franchiseId?: string;
}
```

#### Get Token
```typescript
const token = await user.getIdToken();
const claims = await user.getIdTokenResult();
const role = claims.claims.role;
```

---

## Cloud Functions

### Callable Functions

#### createUserManaged
Creates a new user with role and franchise assignment.

**Endpoint:** `createUserManaged`

**Authentication:** Required

**Permissions:** Admin or Franchise

**Request:**
```typescript
{
  email: string;
  password: string;
  role: 'admin' | 'franchise' | 'rider' | 'user';
  franchiseId?: string;
  displayName?: string;
  phoneNumber?: string;
  status?: string;
}
```

**Response:**
```typescript
{
  uid: string;
  message: string;
}
```

**Errors:**
- `unauthenticated` - User not authenticated
- `permission-denied` - Insufficient permissions
- `invalid-argument` - Missing required fields
- `already-exists` - Email already in use

---

#### createFranchise
Creates a new franchise (Admin only).

**Endpoint:** `createFranchise`

**Authentication:** Required

**Permissions:** Admin only

**Request:**
```typescript
{
  name: string;
  slug: string;
  settings: {
    minOrderAmount: number;
    shippingCost: number;
    isActive: boolean;
  };
  location: {
    address: string;
    city: string;
    zipCodes: string[];
  };
  contactEmail?: string;
  contactPhone?: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  data: {
    id: string;
  };
}
```

**Errors:**
- `unauthenticated` - User not authenticated
- `permission-denied` - Not an admin
- `invalid-argument` - Missing or invalid fields

---

#### adminDeleteUser
Deletes a user completely from Auth and Firestore.

**Endpoint:** `adminDeleteUser`

**Authentication:** Required

**Permissions:** Admin only

**Request:**
```typescript
{
  uid: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  message: string;
}
```

**Errors:**
- `unauthenticated` - User not authenticated
- `permission-denied` - Not an admin
- `not-found` - User not found
- `invalid-argument` - Invalid UID

---

## Firestore Collections

### users

User profiles and role assignments.

**Document Structure:**
```typescript
{
  uid: string;
  email: string;
  role: 'admin' | 'franchise' | 'rider' | 'user';
  franchiseId?: string;
  status: 'active' | 'inactive' | 'suspended';
  displayName?: string;
  phoneNumber?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Permissions:**
- Read: Own profile, Admin, Franchise
- Create: Admin SDK only
- Update: Own profile, Admin, Franchise (own users)

---

### academy_modules

Academy learning modules.

**Document Structure:**
```typescript
{
  title: string;
  description: string;
  thumbnail_url?: string;
  order: number;
  status: 'draft' | 'active';
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

**Permissions:**
- Read: All authenticated users
- Create/Update/Delete: Admin, Franchise

---

### academy_lessons

Individual lessons within modules.

**Document Structure:**
```typescript
{
  module_id: string;
  title: string;
  content: string;
  content_type: 'text' | 'video';
  video_url?: string;
  duration: number;
  order: number;
  status: 'draft' | 'published';
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

**Permissions:**
- Read: All authenticated users
- Create/Update/Delete: Admin, Franchise

---

### academy_progress

User progress tracking.

**Document Structure:**
```typescript
{
  user_id: string;
  module_id: string;
  completed_lessons: string[];
  status: 'not_started' | 'in_progress' | 'completed';
  completed_at?: Timestamp;
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

**Permissions:**
- Read: Own progress, Admin
- Create/Update: Own progress, Admin

---

## Academy API

### Get All Modules
```typescript
import { academyService } from '../services/academyService';

const modules = await academyService.getAllModules('active');
```

### Get Module by ID
```typescript
const module = await academyService.getModuleById('module-id');
```

### Get Lessons for Module
```typescript
const lessons = await academyService.getLessonsByModule('module-id', 'published');
```

### Mark Lesson Complete
```typescript
await academyService.markLessonComplete(
  'user-id',
  'module-id',
  'lesson-id'
);
```

---

## Admin API

### Create Module
```typescript
const moduleId = await academyService.createModule({
  title: 'Introduction to Operations',
  description: 'Learn the basics',
  order: 1,
  status: 'draft',
});
```

### Update Module
```typescript
await academyService.updateModule('module-id', {
  title: 'Updated Title',
  status: 'active',
});
```

### Create Lesson
```typescript
const lessonId = await academyService.createLesson({
  module_id: 'module-id',
  title: 'Lesson 1',
  content: 'Lesson content...',
  content_type: 'video',
  video_url: 'https://youtube.com/watch?v=xxx',
  duration: 15,
  order: 1,
  status: 'draft',
});
```

---

## Error Handling

### HttpsError Codes

All Cloud Functions return standardized errors:

| Code | Description |
|------|-------------|
| `unauthenticated` | User not authenticated |
| `permission-denied` | Insufficient permissions |
| `invalid-argument` | Invalid or missing parameters |
| `not-found` | Resource not found |
| `already-exists` | Resource already exists |
| `internal` | Internal server error |

### Error Handling Pattern

```typescript
try {
  const result = await callableFunction(data);
} catch (error) {
  if (error instanceof functions.https.HttpsError) {
    switch (error.code) {
      case 'permission-denied':
        // Handle permission error
        break;
      case 'invalid-argument':
        // Handle invalid input
        break;
      default:
        // Handle other errors
    }
  }
}
```

---

## Rate Limiting

### Default Limits

- Callable Functions: 100 requests per minute per user
- Firestore reads: 50,000 reads per day
- Firestore writes: 20,000 writes per day

### Rate Limit Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

---

## Best Practices

### 1. Use Custom Claims for Authorization

```typescript
const claims = await user.getIdTokenResult();
if (claims.claims.admin) {
  // Admin logic
}
```

### 2. Handle Loading States

```typescript
const [loading, setLoading] = useState(false);

const handleSubmit = async () => {
  setLoading(true);
  try {
    await createModule(data);
  } finally {
    setLoading(false);
  }
};
```

### 3. Cache Results

```typescript
import { useQuery } from '@tanstack/react-query';

const { data } = useQuery({
  queryKey: ['modules', 'active'],
  queryFn: () => academyService.getAllModules('active'),
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

### 4. Use Transactions for Atomic Operations

```typescript
await admin.firestore().runTransaction(async (transaction) => {
  const userRef = admin.firestore().collection('users').doc(userId);
  const userDoc = await transaction.get(userRef);
  
  if (!userDoc.exists) {
    throw new Error('User not found');
  }
  
  transaction.update(userRef, { updatedAt: serverTimestamp() });
});
```

---

## SDK

### React Hooks

```typescript
import {
  useAcademyModules,
  useAcademyLessons,
  useAcademyProgress,
} from '../hooks/academy';

const { modules, loading, error } = useAcademyModules('active');
```

### Services

```typescript
import { academyService } from '../services/academyService';

const modules = await academyService.getAllModules();
```

---

## Testing

### Unit Tests

```typescript
import { renderHook } from '@testing-library/react';
import { useAcademyModules } from '../hooks/academy';

const { result } = renderHook(() => useAcademyModules());
```

### E2E Tests

```typescript
test('should display modules', async ({ page }) => {
  await page.goto('/academy');
  const modules = await page.locator('.grid').count();
  expect(modules).toBeGreaterThan(0);
});
```

---

## Changelog

### v4.1.0 (2026-01-29)
- Added Academy API
- Added Admin API
- Improved error handling
- Added logging infrastructure

---

## Support

For API issues or questions:
- Email: support@repaart.com
- Documentation: /docs
- Status: /status
