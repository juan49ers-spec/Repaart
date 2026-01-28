# Repaart API Test Suite

Test suite for Postman Collection validation.

## 📋 Test Scenarios

### 1. Authentication Tests

#### Test 1.1: Valid Token Request
- **Endpoint:** `GET /finance/records`
- **Headers:** `Authorization: Bearer <valid-token>`
- **Expected:** `200 OK`
- **Description:** Verify that valid token grants access

#### Test 1.2: Invalid Token Request
- **Endpoint:** `GET /finance/records`
- **Headers:** `Authorization: Bearer invalid-token`
- **Expected:** `401 Unauthorized`
- **Description:** Verify invalid token is rejected

#### Test 1.3: Missing Token Request
- **Endpoint:** `GET /finance/records`
- **Headers:** No Authorization header
- **Expected:** `401 Unauthorized`
- **Description:** Verify missing token is required

### 2. Finance API Tests

#### Test 2.1: List Financial Records
- **Endpoint:** `GET /finance/records?franchiseId=franchise_abc&month=2026-01`
- **Expected:** `200 OK` with array of records
- **Description:** Retrieve all financial records for a month

#### Test 2.2: Create Income Record
- **Endpoint:** `POST /finance/records`
- **Body:** 
  ```json
  {
    "franchiseId": "franchise_abc",
    "type": "income",
    "amount": 1500.00,
    "category": "delivery_revenue",
    "description": "Weekly delivery revenue"
  }
  ```
- **Expected:** `201 Created` with record object
- **Description:** Create a new income record

#### Test 2.3: Create Expense Record
- **Endpoint:** `POST /finance/records`
- **Body:**
  ```json
  {
    "franchiseId": "franchise_abc",
    "type": "expense",
    "amount": 500.00,
    "category": "fuel",
    "description": "Weekly fuel costs"
  }
  ```
- **Expected:** `201 Created` with record object
- **Description:** Create a new expense record

#### Test 2.4: Invalid Amount (Negative)
- **Endpoint:** `POST /finance/records`
- **Body:**
  ```json
  {
    "franchiseId": "franchise_abc",
    "type": "income",
    "amount": -100
  }
  ```
- **Expected:** `400 Bad Request` with validation error
- **Description:** Verify negative amount validation

#### Test 2.5: Update Record Status
- **Endpoint:** `PATCH /finance/records/{recordId}/status`
- **Body:**
  ```json
  {
    "status": "submitted"
  }
  ```
- **Expected:** `200 OK` with updated status
- **Description:** Update record from draft to submitted

#### Test 2.6: Invalid Status Transition
- **Endpoint:** `PATCH /finance/records/{recordId}/status`
- **Body:**
  ```json
  {
    "status": "approved"
  }
  ```
- **Expected:** `403 Forbidden` (Franchise cannot approve)
- **Description:** Verify role-based access control

#### Test 2.7: Get Monthly Summary
- **Endpoint:** `GET /finance/summary?franchiseId=franchise_abc&month=2026-01`
- **Expected:** `200 OK` with summary data
- **Description:** Retrieve monthly financial summary

#### Test 2.8: Get Financial Trends
- **Endpoint:** `GET /finance/trends?franchiseId=franchise_abc`
- **Expected:** `200 OK` with array of trend items
- **Description:** Retrieve 12-month financial trends

### 3. Fleet API Tests

#### Test 3.1: List Riders
- **Endpoint:** `GET /fleet/riders?franchiseId=franchise_abc`
- **Expected:** `200 OK` with array of riders
- **Description:** Retrieve all riders for a franchise

#### Test 3.2: Create Rider
- **Endpoint:** `POST /fleet/riders`
- **Body:**
  ```json
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
- **Expected:** `201 Created` with rider object
- **Description:** Create a new rider with Firebase Auth

#### Test 3.3: Create Rider (Duplicate Email)
- **Endpoint:** `POST /fleet/riders`
- **Body:** Same as Test 3.2
- **Expected:** `400 Bad Request` with duplicate email error
- **Description:** Verify unique email validation

#### Test 3.4: Update Rider
- **Endpoint:** `PUT /fleet/riders/{riderId}`
- **Body:**
  ```json
  {
    "fullName": "Juan Pérez García",
    "contractHours": 45
  }
  ```
- **Expected:** `200 OK`
- **Description:** Update rider information

#### Test 3.5: List Vehicles
- **Endpoint:** `GET /fleet/vehicles?franchiseId=franchise_abc`
- **Expected:** `200 OK` with array of vehicles
- **Description:** Retrieve all vehicles for a franchise

#### Test 3.6: Create Vehicle
- **Endpoint:** `POST /fleet/vehicles?franchiseId=franchise_abc`
- **Body:**
  ```json
  {
    "plate": "1234ABC",
    "brand": "Yamaha",
    "model": "NMAX 155",
    "currentKm": 5000,
    "nextRevisionKm": 10000
  }
  ```
- **Expected:** `201 Created` with vehicle object
- **Description:** Create a new vehicle

#### Test 3.7: Create Vehicle (Invalid Plate)
- **Endpoint:** `POST /fleet/vehicles?franchiseId=franchise_abc`
- **Body:**
  ```json
  {
    "plate": "",
    "brand": "Yamaha",
    "model": "NMAX 155"
  }
  ```
- **Expected:** `400 Bad Request` with validation error
- **Description:** Validate required plate field

#### Test 3.8: Update Vehicle (Maintenance Trigger)
- **Endpoint:** `PUT /fleet/vehicles/{vehicleId}`
- **Body:**
  ```json
  {
    "currentKm": 10000,
    "nextRevisionKm": 10000
  }
  ```
- **Expected:** `200 OK` with status changed to 'maintenance'
- **Description:** Verify predictive maintenance logic

### 4. Academy API Tests

#### Test 4.1: List Courses
- **Endpoint:** `GET /academy/courses`
- **Expected:** `200 OK` with array of courses
- **Description:** Retrieve all active courses

#### Test 4.2: Create Course
- **Endpoint:** `POST /academy/courses`
- **Body:**
  ```json
  {
    "title": "Delivery Best Practices",
    "description": "Learn how to deliver efficiently",
    "category": "Operations",
    "duration": "2 hours",
    "level": "beginner",
    "status": "active"
  }
  ```
- **Expected:** `201 Created` with course object
- **Description:** Create a new course (Admin only)

#### Test 4.3: Create Lesson
- **Endpoint:** `POST /academy/lessons`
- **Body:**
  ```json
  {
    "moduleId": "course_123",
    "title": "Package Handling",
    "content": "<h1>Package Handling</h1><p>Learn proper techniques...</p>",
    "videoUrl": "https://storage.googleapis.com/videos/package_handling.mp4",
    "duration": 900,
    "order": 1
  }
  ```
- **Expected:** `201 Created` with lesson object
- **Description:** Create a new lesson

#### Test 4.4: Get User Progress
- **Endpoint:** `GET /academy/progress?userId=user_abc`
- **Expected:** `200 OK` with progress object
- **Description:** Retrieve user progress across courses

#### Test 4.5: Complete Lesson
- **Endpoint:** `POST /academy/lessons/{lessonId}/complete`
- **Body:**
  ```json
  {
    "userId": "user_abc",
    "moduleId": "course_123"
  }
  ```
- **Expected:** `200 OK`
- **Description:** Mark lesson as completed for user

#### Test 4.6: Complete Lesson (Already Completed)
- **Endpoint:** `POST /academy/lessons/{lessonId}/complete`
- **Body:** Same as Test 4.5
- **Expected:** `200 OK` (idempotent)
- **Description:** Verify idempotency of complete operation

### 5. Scheduler API Tests

#### Test 5.1: List Shifts
- **Endpoint:** `GET /scheduler/shifts?franchiseId=franchise_abc&startDate=2026-01-20&endDate=2026-01-26`
- **Expected:** `200 OK` with array of shifts
- **Description:** Retrieve shifts for date range

#### Test 5.2: Create Shift
- **Endpoint:** `POST /scheduler/shifts`
- **Body:**
  ```json
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
- **Expected:** `201 Created` with shift object
- **Description:** Create a new shift

#### Test 5.3: Create Shift (Invalid Date Range)
- **Endpoint:** `POST /scheduler/shifts`
- **Body:**
  ```json
  {
    "franchiseId": "franchise_abc",
    "startAt": "2026-01-25T14:00:00Z",
    "endAt": "2026-01-25T09:00:00Z"
  }
  ```
- **Expected:** `400 Bad Request` with validation error
- **Description:** Validate endAt > startAt

#### Test 5.4: Start Shift (Clock In)
- **Endpoint:** `POST /scheduler/shifts/{shiftId}/start`
- **Expected:** `200 OK` with actualStart timestamp
- **Description:** Clock in to a shift

#### Test 5.5: End Shift (Clock Out)
- **Endpoint:** `POST /scheduler/shifts/{shiftId}/end`
- **Expected:** `200 OK` with actualEnd timestamp
- **Description:** Clock out from a shift

#### Test 5.6: Confirm Shift
- **Endpoint:** `POST /scheduler/shifts/{shiftId}/confirm`
- **Expected:** `200 OK` with isConfirmed: true
- **Description:** Rider confirms shift assignment

#### Test 5.7: Request Shift Swap
- **Endpoint:** `PATCH /scheduler/shifts/{shiftId}/swap`
- **Body:**
  ```json
  {
    "requested": true
  }
  ```
- **Expected:** `200 OK` with swapRequested: true
- **Description:** Request shift swap

#### Test 5.8: Request Shift Change
- **Endpoint:** `PATCH /scheduler/shifts/{shiftId}/change`
- **Body:**
  ```json
  {
    "requested": true,
    "reason": "Personal commitment"
  }
  ```
- **Expected:** `200 OK` with changeRequested: true
- **Description:** Request shift change with reason

#### Test 5.9: Get Week Data
- **Endpoint:** `GET /scheduler/weeks/franchise_abc/2026_04`
- **Expected:** `200 OK` with week data
- **Description:** Retrieve specific week data

#### Test 5.10: Get Week Data (Invalid Week Format)
- **Endpoint:** `GET /scheduler/weeks/franchise_abc/invalid-week`
- **Expected:** `400 Bad Request` with validation error
- **Description:** Validate weekId format (YYYY_WW)

## 📊 Test Execution

### Manual Testing with Postman

1. **Import Collection**
   - Open Postman
   - File → Import
   - Select `docs/api/postman_collection.json`

2. **Configure Environment**
   - Set `baseUrl` to `https://repaartfinanzas.web.app`
   - Set `token` to valid Firebase Auth JWT
   - Set `franchiseId` to test franchise ID
   - Set `month` to `2026-01`

3. **Run Tests**
   - Select Collection
   - Click "Run" button
   - Run entire collection or specific folder
   - Review test results

### Automated Testing with Newman

```bash
# Install Newman
npm install -g newman

# Run tests
newman run docs/api/postman_collection.json \
  -e postman_environment.json \
  --reporters cli,json \
  --reporter-json-export test-results.json

# Run with HTML reporter
newman run docs/api/postman_collection.json \
  -e postman_environment.json \
  --reporters htmlextra \
  --reporter-htmlextra-export test-results.html
```

## ✅ Test Coverage

| Domain | Endpoints | Tests | Coverage |
|--------|-----------|--------|-----------|
| **Authentication** | - | 3 | 100% |
| **Finance** | 8 | 8 | 100% |
| **Fleet** | 8 | 8 | 100% |
| **Academy** | 6 | 6 | 100% |
| **Scheduler** | 10 | 10 | 100% |
| **Total** | 32 | 35 | 100% |

## 🎯 Success Criteria

All tests pass if:
- ✅ Valid requests return `2xx` status codes
- ✅ Invalid requests return `4xx` status codes with error details
- ✅ Server errors return `5xx` status codes
- ✅ Response bodies match expected schemas
- ✅ Authentication and authorization work correctly
- ✅ Business logic validations are enforced

## 🚀 CI/CD Integration

### GitHub Actions Example

```yaml
name: API Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install Newman
        run: npm install -g newman
      
      - name: Run API Tests
        run: |
          newman run docs/api/postman_collection.json \
            -e postman_environment.json \
            --reporters cli,junit \
            --reporter-junit-export test-results.xml
      
      - name: Upload Test Results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-results
          path: test-results.xml
```

## 📞 Support

For test issues:
- Email: testing@repaart.com
- GitHub: https://github.com/repaart/api/issues

---

**Last Updated:** 2026-01-26  
**Version:** 1.0.0
