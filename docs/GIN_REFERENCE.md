# Gin - Referencia Rápida

Framework web HTTP de alto rendimiento en Go para construir APIs REST, microservicios y aplicaciones web.

## ¿Cuándo usarlo?

- ✅ APIs REST que necesitan alto throughput y baja latencia
- ✅ Microservicios en Go
- ✅ Aplicaciones web con routing complejo y middleware
- ❌ SaaS típicos con Node/Python (Express, Django)
- ❌ Frontend + BaaS (Firebase, Supabase)

## Características clave

- **Zero allocation router** - Routing sin heap allocations (ultra eficiente)
- **Alto rendimiento** - 40x más rápido que Martini, benchmarks excepcionales
- **Middleware ecosystem** - Auth, CORS, rate limiting, logging, etc.
- **JSON validation** - Binding automático de request/response
- **Route grouping** - Organiza rutas y aplica middleware por grupos
- **Crash-free** - Recovery middleware integrado

## Instalación

```bash
go get -u github.com/gin-gonic/gin
```

## Ejemplo básico

```go
package main

import (
  "net/http"
  "github.com/gin-gonic/gin"
)

func main() {
  r := gin.Default()

  r.GET("/ping", func(c *gin.Context) {
    c.JSON(http.StatusOK, gin.H{
      "message": "pong",
    })
  })

  r.Run(":8080")
}
```

## Comandos esenciales

```bash
# Iniciar proyecto
go mod init mi-app
go get -u github.com/gin-gonic/gin

# Ejecutar
go run main.go

# Build para producción
go build -o app
```

## Routing

```go
// Rutas simples
r.GET("/users", getUsers)
r.POST("/users", createUser)
r.PUT("/users/:id", updateUser)
r.DELETE("/users/:id", deleteUser)

// Parámetros
r.GET("/users/:id", func(c *gin.Context) {
  id := c.Param("id")
})

// Query params
r.GET("/search", func(c *gin.Context) {
  q := c.Query("q")
  page := c.DefaultQuery("page", "1")
})

// Route groups
v1 := r.Group("/api/v1")
{
  v1.GET("/users", getUsers)
  v1.POST("/users", createUser)
}
```

## Middleware

```go
// Middleware personalizado
r.Use(func(c *gin.Context) {
  fmt.Println("Middleware antes")
  c.Next()
  fmt.Println("Middleware después")
})

// Middleware en grupos
authorized := r.Group("/admin")
authorized.Use(AuthMiddleware())
{
  authorized.GET("/dashboard", dashboard)
}

// Middleware común (gin-contrib)
import "github.com/gin-contrib/cors"
r.Use(cors.Default())
```

## Request/Response

```go
// JSON binding
type User struct {
  Name  string `json:"name" binding:"required"`
  Email string `json:"email" binding:"required,email"`
}

r.POST("/users", func(c *gin.Context) {
  var user User
  if err := c.ShouldBindJSON(&user); err != nil {
    c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
    return
  }
  c.JSON(http.StatusCreated, user)
})
```

## Ecosystem

- [gin-contrib](https://github.com/gin-contrib) - Middleware oficial (CORS, JWT, sessions, etc.)
- [gin-gonic/contrib](https://github.com/gin-gonic/contrib) - Middleware adicional comunidad

## Alternativas en Go

- **Echo** - Similar, también alto rendimiento
- **Fiber** - Inspirado en Express.js, muy rápido
- **Chi** - Minimalista, composable
- **net/http** - Standard library (para casos simples)

## Documentación

- [GitHub](https://github.com/gin-gonic/gin)
- [Docs oficiales](https://gin-gonic.com/docs/)
- [Ejemplos](https://github.com/gin-gonic/examples)

## Comparativa con otros frameworks

| Framework | Requests/s | ns/op | B/op | allocs/op |
|-----------|-------------|-------|-------|-----------|
| **Gin** | 43,550 | 27,364 | 0 | 0 |
| HttpRouter | 55,938 | 21,360 | 0 | 0 |
| Echo | 31,251 | 38,479 | 0 | 0 |
| Chi | 7,620 | 238,331 | 87,696 | 609 |

## Cuándo elegir Gin vs otros

**Elige Gin si:**
- Performance crítico y necesitas routing complejo
- Middleware ecosystem importante para tu caso de uso
- API REST robusta con validaciones

**Elige Fiber si:**
- Estás migrando de Express.js y quieres sintaxis similar
- Performance aún más crítica (Fiber usa fasthttp)

**Elige Chi si:**
- Prefieres API minimalista y composable
- Standard library patterns son suficientes

**Elige net/http si:**
- Casos simples donde framework es overhead
- Máximo control y mínimas dependencias
