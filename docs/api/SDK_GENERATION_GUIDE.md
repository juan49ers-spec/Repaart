# SDK Generation Guide

This guide shows how to generate SDKs from the Repaart OpenAPI specification.

---

## 📦 Available SDK Generators

### 1. TypeScript/JavaScript (Recommended)

**Tool:** OpenAPI Generator  
**Target:** Browser, Node.js, React Native

```bash
# Install OpenAPI Generator
npm install -g @openapitools/openapi-generator-cli

# Generate TypeScript SDK
openapi-generator-cli generate \
  -i docs/api/openapi.yaml \
  -g typescript-axios \
  -o src/generated/sdk

# Or use typescript-fetch (lighter)
openapi-generator-cli generate \
  -i docs/api/openapi.yaml \
  -g typescript-fetch \
  -o src/generated/sdk
```

**Features:**
- ✅ Full TypeScript types
- ✅ Axios or Fetch based
- ✅ Authentication handling
- ✅ Automatic retries
- ✅ Request/response interceptors

### 2. Python

**Tool:** OpenAPI Generator  
**Target:** Python 3.7+

```bash
# Generate Python SDK
openapi-generator-cli generate \
  -i docs/api/openapi.yaml \
  -g python \
  -o src/generated/python

# Or use Python FastAPI generator
openapi-generator-cli generate \
  -i docs/api/openapi.yaml \
  -g python-flask \
  -o src/generated/python-flask
```

**Features:**
- ✅ Full type hints
- ✅ Requests library
- ✅ Async/await support
- ✅ Pip-ready

### 3. Go

**Tool:** OpenAPI Generator  
**Target:** Go 1.16+

```bash
# Generate Go SDK
openapi-generator-cli generate \
  -i docs/api/openapi.yaml \
  -g go \
  -o src/generated/go

# Or use Go Gin generator
openapi-generator-cli generate \
  -i docs/api/openapi.yaml \
  -g go-gin-server \
  -o src/generated/go-gin
```

**Features:**
- ✅ Full type safety
- ✅ Native HTTP client
- ✅ Context handling
- ✅ Mod-ready

### 4. Kotlin

**Tool:** OpenAPI Generator  
**Target:** Kotlin 1.5+

```bash
# Generate Kotlin SDK
openapi-generator-cli generate \
  -i docs/api/openapi.yaml \
  -g kotlin \
  -o src/generated/kotlin

# Or use Spring Boot generator
openapi-generator-cli generate \
  -i docs/api/openapi.yaml \
  -g spring \
  -o src/generated/spring
```

**Features:**
- ✅ Null safety
- ✅ Coroutines support
- ✅ OkHttp client
- ✅ Gradle/Maven ready

### 5. Dart (Flutter)

**Tool:** OpenAPI Generator  
**Target:** Dart 2.12+

```bash
# Generate Dart SDK
openapi-generator-cli generate \
  -i docs/api/openapi.yaml \
  -g dart \
  -o src/generated/dart

# Or use Flutter generator
openapi-generator-cli generate \
  -i docs/api/openapi.yaml \
  -g dart-dio \
  -o src/generated/flutter
```

**Features:**
- ✅ Flutter widgets
- ✅ Dio HTTP client
- ✅ Null safety
- ✅ JSON serialization

---

## 🔧 TypeScript SDK Usage Example

After generating the TypeScript SDK, here's how to use it:

### Installation

```bash
cd src/generated/sdk
npm install
npm run build
```

### Basic Usage

```typescript
import { RepaartApi, Configuration } from './generated/sdk';

// Initialize API with auth token
const config = new Configuration({
  accessToken: async () => {
    const token = await getFirebaseAuthToken();
    return token;
  },
  basePath: 'https://repaartfinanzas.web.app'
});

const api = new RepaartApi(config);

// List riders
const riders = await api.fleet.listRiders({
  franchiseId: 'franchise_abc'
});

console.log(riders);
```

### Create Rider

```typescript
import { CreateRiderRequest, Rider } from './generated/sdk';

const riderData: CreateRiderRequest = {
  email: 'rider@example.com',
  password: 'securePass123',
  fullName: 'Juan Pérez',
  franchiseId: 'franchise_abc',
  contractHours: 40,
  licenseType: '125cc'
};

const rider: Rider = await api.fleet.createRider({ riderData });
console.log('Created rider:', rider.id);
```

### Error Handling

```typescript
try {
  const record = await api.finance.createRecord({
    recordInput: {
      franchiseId: 'franchise_abc',
      type: 'income',
      amount: 1000
    }
  });
} catch (error) {
  if (error.response) {
    // API returned error response
    console.error('API Error:', error.response.data);
    console.error('Status:', error.response.status);
  } else {
    // Network error or request setup error
    console.error('Request Error:', error.message);
  }
}
```

### Custom Interceptors

```typescript
import { Configuration } from './generated/sdk';

const config = new Configuration({
  baseOptions: {
    // Request interceptor
    transformRequest: [
      (data, headers) => {
        headers['X-Custom-Header'] = 'value';
        return data;
      }
    ],
    // Response interceptor
    transformResponse: [
      (data, headers) => {
        // Transform response data
        return data;
      }
    ]
  }
});
```

---

## 🐍 Python SDK Usage Example

### Installation

```bash
cd src/generated/python
pip install -r requirements.txt
pip install -e .
```

### Basic Usage

```python
from repaart_sdk import RepaartApi
from repaart_sdk.rest import ApiException

# Initialize API
api_instance = RepaartApi(
    api_key='your-firebase-jwt-token',
    host='https://repaartfinanzas.web.app'
)

# List riders
try:
    riders = api_instance.fleet.list_riders(franchise_id='franchise_abc')
    print(riders)
except ApiException as e:
    print(f"Exception when calling FleetApi->list_riders: {e}")
```

### Create Rider

```python
from repaart_sdk.models import CreateRiderRequest

rider_data = CreateRiderRequest(
    email='rider@example.com',
    password='securePass123',
    full_name='Juan Pérez',
    franchise_id='franchise_abc',
    contract_hours=40,
    license_type='125cc'
)

try:
    rider = api_instance.fleet.create_rider(rider_data=rider_data)
    print(f"Created rider: {rider.id}")
except ApiException as e:
    print(f"Error creating rider: {e}")
```

---

## 🔧 Go SDK Usage Example

### Installation

```bash
cd src/generated/go
go mod tidy
go build ./...
```

### Basic Usage

```go
package main

import (
    "context"
    "fmt"
    "log"
    "repaart-sdk"
)

func main() {
    // Initialize API
    cfg := repaart.NewConfiguration()
    cfg.BasePath = "https://repaartfinanzas.web.app"
    cfg.AddDefaultHeader("Authorization", "Bearer your-token")

    client := repaart.NewAPIClient(cfg)

    // List riders
    riders, resp, err := client.FleetApi.ListRiders(context.Background()).
        FranchiseId("franchise_abc").
        Execute()
    
    if err != nil {
        log.Fatalf("Error calling ListRiders: %v", err)
    }
    
    fmt.Printf("Found %d riders\n", len(riders))
}
```

### Create Rider

```go
riderData := *repaart.NewCreateRiderRequest(
    "rider@example.com",
    "securePass123",
    "Juan Pérez",
    "franchise_abc",
)
riderData.ContractHours = int32(40)
riderData.LicenseType = "125cc"

rider, resp, err := client.FleetApi.CreateRider(context.Background()).
    RiderData(riderData).
    Execute()

if err != nil {
    log.Fatalf("Error creating rider: %v", err)
}

fmt.Printf("Created rider: %s\n", rider.Id)
```

---

## 🔧 Custom SDK Generation

### Custom TypeScript Generator

Create a custom template in `templates/typescript/`:

```handlebars
{{#apiInfo}}
/**
 * {{appName}} SDK
 * Version: {{version}}
 */
{{/apiInfo}}

export class {{classname}} {
  {{#operations}}
  {{#operation}}
  /**
   * {{summary}}
   * {{#notes}}
   * {{notes}}
   * {{/notes}}
   */
  async {{nickname}}({{#allParams}}{{paramName}}: {{dataType}}{{#hasMore}}, {{/hasMore}}{{/allParams}}): Promise<{{returnType}}> {
    // Custom implementation
  }
  {{/operation}}
  {{/operations}}
}
```

Generate with custom template:

```bash
openapi-generator-cli generate \
  -i docs/api/openapi.yaml \
  -g typescript-axios \
  -t templates/typescript \
  -o src/generated/sdk
```

---

## 📦 SDK Distribution

### NPM Package (TypeScript)

**Package: `@repaart/sdk`**

1. **Build SDK**
```bash
cd src/generated/sdk
npm run build
```

2. **Publish to NPM**
```bash
npm publish --access public
```

3. **Usage in projects**
```bash
npm install @repaart/sdk
```

```typescript
import { RepaartApi } from '@repaart/sdk';

const api = new RepaartApi({ accessToken: '...' });
```

### PyPI Package (Python)

**Package: `repaart-sdk`**

1. **Build SDK**
```bash
cd src/generated/python
python setup.py sdist bdist_wheel
```

2. **Publish to PyPI**
```bash
twine upload dist/*
```

3. **Usage in projects**
```bash
pip install repaart-sdk
```

```python
from repaart_sdk import RepaartApi
```

### Go Module (Go)

**Module: `github.com/repaart/sdk-go`**

1. **Initialize Git repo**
```bash
cd src/generated/go
git init
git remote add origin https://github.com/repaart/sdk-go.git
```

2. **Push to GitHub**
```bash
git add .
git commit -m "Initial SDK release"
git push origin main
```

3. **Usage in projects**
```bash
go get github.com/repaart/sdk-go
```

```go
import "github.com/repaart/sdk-go"
```

---

## 🔄 SDK Versioning

Follow Semantic Versioning (SemVer):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

**Example:**
```
1.0.0 → 1.0.1 (patch)
1.0.1 → 1.1.0 (minor)
1.1.0 → 2.0.0 (major)
```

---

## 📚 Additional Resources

- [OpenAPI Generator Documentation](https://openapi-generator.tech/docs/generators)
- [TypeScript Axios Generator](https://github.com/OpenAPITools/openapi-generator/blob/master/docs/generators/typescript-axios.md)
- [Python Generator](https://github.com/OpenAPITools/openapi-generator/blob/master/docs/generators/python.md)
- [Go Generator](https://github.com/OpenAPITools/openapi-generator/blob/master/docs/generators/go.md)

---

## 🆘 Support

For SDK generation issues:
- GitHub: https://github.com/repaart/sdk-generator/issues
- Email: sdk@repaart.com
