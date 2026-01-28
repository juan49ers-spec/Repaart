# PASO 6: Mobile iOS Design - Iniciado

## 📋 Resumen Ejecutado

Se ha iniciado la planificación y diseño de la aplicación móvil nativa iOS para los riders de Repaart, siguiendo las directrices de Apple Human Interface Guidelines.

---

## 🎯 Objetivos del PASO 6

### 1. Experiencia Nativa iOS Premium
- ✅ SwiftUI moderno y fluido
- ✅ Navegación nativa (TabView, NavigationStack)
- ✅ SF Symbols para iconografía consistente
- ✅ Dynamic Type y Dark Mode
- ✅ Animaciones suaves y transiciones nativas

### 2. Funcionalidades del Rider
- ✅ Ver turnos programados (vista semanal)
- ✅ Clock In/Out (fichar entrada/salida)
- ✅ Confirmar turnos
- ✅ Solicitar intercambios/cambios
- ✅ Ver progreso de la Academia
- ✅ Perfil personal y métricas

### 3. Integración con Repaart API
- ✅ Cliente HTTP nativo (URLSession)
- ✅ Firebase Auth wrapper
- ✅ Manejo de errores con UX nativa
- ✅ Refresh tokens automático
- ✅ Offline support con CoreData

---

## 📁 Arquitectura del Proyecto iOS

```
RepaartRiderApp/
├── RepaartRiderApp/
│   ├── App.swift                    # Entry point
│   ├── RepaartRiderAppApp.swift   # Main app structure
│   ├── Info.plist                   # App configuration
│   └── Assets.xcassets             # Images, colors, fonts
│
├── Models/
│   ├── Rider.swift                  # Rider data model
│   ├── Shift.swift                  # Shift data model
│   ├── Course.swift                 # Course data model
│   ├── Lesson.swift                 # Lesson data model
│   ├── Progress.swift                # User progress model
│   └── APIResponse.swift            # Generic API response
│
├── Views/
│   ├── Auth/
│   │   ├── LoginView.swift           # Login screen
│   │   ├── RegisterView.swift        # Registration screen
│   │   └── ForgotPasswordView.swift # Password recovery
│   │
│   ├── Scheduler/
│   │   ├── ShiftsListView.swift      # Weekly shifts list
│   │   ├── ShiftDetailView.swift      # Shift details
│   │   ├── WeekCalendarView.swift    # Calendar view
│   │   └── ClockInOutView.swift     # Clock in/out UI
│   │
│   ├── Academy/
│   │   ├── CoursesListView.swift     # List of courses
│   │   ├── CourseDetailView.swift    # Course content
│   │   ├── LessonView.swift        # Lesson content
│   │   ├── QuizView.swift          # Quiz interface
│   │   └── ProgressView.swift      # User progress
│   │
│   ├── Profile/
│   │   ├── ProfileView.swift        # Rider profile
│   │   ├── StatsView.swift         # Rider metrics
│   │   └── SettingsView.swift      # App settings
│   │
│   └── Components/
│       ├── ShiftCard.swift          # Reusable shift card
│       ├── CourseCard.swift         # Reusable course card
│       ├── ProgressBar.swift        # Progress indicator
│       ├── StatCard.swift          # Metrics card
│       └── EmptyStateView.swift    # Empty state UI
│
├── ViewModels/
│   ├── AuthViewModel.swift         # Authentication logic
│   ├── SchedulerViewModel.swift      # Shift management logic
│   ├── AcademyViewModel.swift       # Academy logic
│   ├── ProfileViewModel.swift       # Profile logic
│   └── APIService.swift           # API client
│
├── Services/
│   ├── FirebaseAuthService.swift     # Firebase Auth wrapper
│   ├── RepaartAPIService.swift    # Repaart API client
│   ├── CacheService.swift          # Local caching
│   └── NotificationService.swift   # Push notifications
│
├── Utils/
│   ├── DateFormatter.swift         # Date formatting
│   ├── Validators.swift            # Input validation
│   ├── Constants.swift             # App constants
│   └── Extensions/
│       ├── String+Extensions.swift
│       ├── Date+Extensions.swift
│       └── View+Extensions.swift
│
└── Resources/
    ├── Assets.xcassets           # Images, icons, colors
    ├── Localizable.strings        # Localization
    └── Colors.xcassets           # Color system
```

---

## 🎨 Design System iOS Documentado

### 1. Sistema de Colores (Semantic)

**Archivo:** `Resources/Colors.xcassets`

```swift
extension Color {
    static let brandPrimary = Color("BrandPrimary")
    static let brandSecondary = Color("BrandSecondary")
    static let success = Color("Success")
    static let warning = Color("Warning")
    static let error = Color("Error")
    static let background = Color(.systemBackground)
    static let surface = Color(.secondarySystemBackground)
    static let textPrimary = Color(.label)
    static let textSecondary = Color(.secondaryLabel)
}
```

**Colores Definidos:**
- BrandPrimary: `#6366f1` (Indigo)
- BrandSecondary: `#a855f7` (Amatista)
- Success: `#10b981` (Esmeralda)
- Warning: `#f59e0b` (Ambar)
- Error: `#ef4444` (Rojo)

### 2. Tipografía (Dynamic Type)

```swift
extension Font {
    static let largeTitle = Font.system(size: 34, weight: .bold)
    static let title1 = Font.system(size: 28, weight: .bold)
    static let title2 = Font.system(size: 22, weight: .bold)
    static let title3 = Font.system(size: 20, weight: .semibold)
    static let headline = Font.system(size: 17, weight: .semibold)
    static let body = Font.system(size: 17, weight: .regular)
    static let callout = Font.system(size: 16, weight: .regular)
    static let subheadline = Font.system(size: 15, weight: .regular)
    static let footnote = Font.system(size: 13, weight: .regular)
    static let caption1 = Font.system(size: 12, weight: .regular)
    static let caption2 = Font.system(size: 11, weight: .regular)
}
```

### 3. Iconografía (SF Symbols)

**Enumeración de Iconos:**
```swift
enum SFIcons {
    case house
    case calendar
    case clock
    case checkmark
    case person
    case book
    case play
    case pause
    case chevronRight
    case chevronLeft
    case info
    case settings
    case bell
    case starFill
    case star
    
    var image: Image {
        switch self {
        case .house: return Image(systemName: "house.fill")
        case .calendar: return Image(systemName: "calendar")
        case .clock: return Image(systemName: "clock.fill")
        case .checkmark: return Image(systemName: "checkmark.circle.fill")
        case .person: return Image(systemName: "person.fill")
        case .book: return Image(systemName: "book.fill")
        case .play: return Image(systemName: "play.circle.fill")
        case .pause: return Image(systemName: "pause.circle.fill")
        case .chevronRight: return Image(systemName: "chevron.right")
        case .chevronLeft: return Image(systemName: "chevron.left")
        case .info: return Image(systemName: "info.circle.fill")
        case .settings: return Image(systemName: "gearshape.fill")
        case .bell: return Image(systemName: "bell.fill")
        case .starFill: return Image(systemName: "star.fill")
        case .star: return Image(systemName: "star")
        }
    }
}
```

---

## 🧩 Componentes UI Diseñados

### 1. ShiftCard (Tarjeta de Turno)

**Características:**
- Header con fecha y hora
- Información del rider (nombre, ID)
- Información del vehículo (matrícula, tipo)
- Badge de estado (scheduled, active, completed)
- Accesible con VoiceOver
- Animación de tap con escala sutil

### 2. ClockInOutView (Fichar Entrada/Salida)

**Características:**
- Botón grande para Clock In (Play)
- Botón grande para Clock Out (Pause)
- Indicadores de estado con iconos
- Timestamps de entrada/salida
- Animación de estado con fade
- Manejo de errores con alertas nativas

### 3. CourseCard (Tarjeta de Curso)

**Características:**
- Título y categoría
- Descripción con line limit
- Icono de SF Symbol
- Indicador de progreso (X/Y lecciones)
- Barra de progreso visual
- Badge de estado del curso

---

## 🔌 Navegación Documentada

### Main TabView (Pestañas Principales)

```swift
struct MainTabView: View {
    @State private var selectedTab: Tab = .scheduler
    
    var body: some View {
        TabView(selection: $selectedTab) {
            SchedulerView()
                .tabItem {
                    Label("Agenda", systemImage: "calendar")
                }
                .tag(Tab.scheduler)
            
            AcademyView()
                .tabItem {
                    Label("Academia", systemImage: "book.fill")
                }
                .tag(Tab.academy)
            
            ProfileView()
                .tabItem {
                    Label("Perfil", systemImage: "person.fill")
                }
                .tag(Tab.profile)
        }
        .tint(.brandPrimary)
    }
}

enum Tab: String {
    case scheduler
    case academy
    case profile
}
```

---

## 🔧 Servicios Diseñados

### 1. FirebaseAuthService

**Funcionalidades:**
- ✅ signIn(email, password)
- ✅ signOut()
- ✅ getIDToken()
- ✅ setupAuthListener()
- ✅ @Published currentUser
- ✅ @Published isAuthenticated
- ✅ Manejo de errores con LocalizedError

### 2. RepaartAPIService

**Endpoints Implementados:**
```swift
// Shifts
func fetchShifts(franchiseId, startDate, endDate) -> [Shift]
func startShift(shiftId) -> Void
func endShift(shiftId) -> Void

// Academy
func fetchCourses() -> [Course]
func fetchProgress(userId) -> [String: UserProgress]
```

**Características:**
- ✅ URLSession nativo
- ✅ Bearer token authentication
- ✅ Manejo de errores (401, 400, 500)
- ✅ @Published isLoading
- ✅ @Published errorMessage
- ✅ Decoding automático con JSONDecoder

---

## 📊 Modelos de Datos

### 1. Shift Model

```swift
struct Shift: Codable, Identifiable {
    let id: String
    let shiftId: String
    let franchiseId: String
    let riderId: String?
    let riderName: String
    let motoId: String?
    let motoPlate: String
    let startAt: String
    let endAt: String
    let date: String
    let status: ShiftStatus
    let isConfirmed: Bool
    let swapRequested: Bool
    let changeRequested: Bool
    let changeReason: String?
    let isDraft: Bool
}

enum ShiftStatus: String, Codable {
    case scheduled
    case active
    case completed
}
```

### 2. Course Model

```swift
struct Course: Codable, Identifiable {
    let id: String
    let title: String
    let description: String
    let icon: String
    let category: String
    let duration: String
    let level: CourseLevel
    let status: CourseStatus
    let lessonCount: Int?
    let order: Int?
    let createdAt: String
    let updatedAt: String
}

enum CourseLevel: String, Codable {
    case beginner
    case intermediate
    case advanced
}

enum CourseStatus: String, Codable {
    case active
    case draft
    case archived
}
```

### 3. UserProgress Model

```swift
struct UserProgress: Codable, Identifiable {
    let id: String
    let userId: String
    let moduleId: String
    let completedLessons: [String]
    let quizScore: Int
    let status: ProgressStatus
    let lastAccessed: String?
    let createdAt: String
    let updatedAt: String
}

enum ProgressStatus: String, Codable {
    case notStarted
    case inProgress
    case completed
}
```

---

## 🧪 Estrategia de Testing

### Unit Tests

**Archivos:** `RepaartRiderAppTests/`

**Tests Planificados:**
- ✅ AuthViewModel tests (login, logout, token refresh)
- ✅ SchedulerViewModel tests (fetch shifts, clock in/out)
- ✅ AcademyViewModel tests (fetch courses, fetch progress)
- ✅ APIService tests (mock URLSession, error handling)

**Ejemplo:**
```swift
func testFetchShifts_Success() async throws {
    // Given
    let expectedShifts = [Shift(...)]
    mockAPIService.shiftsToReturn = expectedShifts
    
    // When
    let shifts = try await viewModel.fetchShifts()
    
    // Then
    XCTAssertEqual(shifts, expectedShifts)
}
```

### UI Tests

**Archivos:** `RepaartRiderAppUITests/`

**Tests Planificados:**
- ✅ Login success
- ✅ Login failure
- ✅ Navigate to Scheduler
- ✅ Clock in
- ✅ Clock out
- ✅ Complete lesson

**Ejemplo:**
```swift
func testClockIn() {
    // Given
    let shiftCard = app.otherElements["shiftCard_1"]
    let clockInButton = app.buttons["clockInButton"]
    
    // When
    shiftCard.tap()
    clockInButton.tap()
    
    // Then
    XCTAssertTrue(app.staticTexts["Fichar Salida"].waitForExistence(timeout: 5))
}
```

---

## ✅ Checklist de Validación

### Design System
- [x] Sistema de colores semantic definido
- [x] Tipografía Dynamic Type definida
- [x] SF Symbols enumerados
- [x] Dark mode support planeado
- [x] Accesibilidad considerada

### Componentes
- [x] ShiftCard diseñado
- [x] ClockInOutView diseñado
- [x] CourseCard diseñado
- [x] ProgressBar diseñado
- [x] StatCard diseñado

### Navegación
- [x] TabView definido
- [x] NavigationStack definido
- [x] Pestañas organizadas (Agenda, Academia, Perfil)

### Servicios
- [x] FirebaseAuthService diseñado
- [x] RepaartAPIService diseñado
- [x] URL session nativo
- [x] Bearer authentication
- [x] Manejo de errores

### Modelos de Datos
- [x] Shift model definido
- [x] Course model definido
- [x] UserProgress model definido
- [x] Enums definidos (Status, Level)

### Testing
- [x] Estrategia de unit tests definida
- [x] Estrategia de UI tests definida
- [x] Ejemplos de tests creados

---

## 🚀 Siguientes Pasos (Por Implementar)

### Fase 1: Setup del Proyecto (Semana 1)
- [ ] Crear proyecto Xcode
- [ ] Configurar Firebase Auth (pod install)
- [ ] Configurar Info.plist (URL schemes, permissions)
- [ ] Definir Assets.xcassets (colores, fuentes, imágenes)
- [ ] Crear estructura de carpetas

### Fase 2: Auth Flow (Semana 1-2)
- [ ] Implementar LoginView con Firebase Auth
- [ ] Implementar RegisterView con creación de usuario
- [ ] Implementar ForgotPasswordView con recuperación
- [ ] Test con Firebase Emulator
- [ ] Test con Firebase Auth real

### Fase 3: Scheduler Views (Semana 2-3)
- [ ] Implementar ShiftsListView con LazyVStack
- [ ] Implementar ShiftDetailView con detalles completos
- [ ] Implementar WeekCalendarView con calendario semanal
- [ ] Implementar ClockInOutView con animaciones
- [ ] Integrar con RepaartAPIService

### Fase 4: Academy Views (Semana 3-4)
- [ ] Implementar CoursesListView con búsqueda y filtros
- [ ] Implementar CourseDetailView con tabs (Lecciones, Quiz)
- [ ] Implementar LessonView con reproductor de video
- [ ] Implementar QuizView con selección de respuestas
- [ ] Implementar ProgressView con gráficos

### Fase 5: Profile Views (Semana 4-5)
- [ ] Implementar ProfileView con edición de datos
- [ ] Implementar StatsView con métricas visuales
- [ ] Implementar SettingsView con toggle de modo oscuro
- [ ] Implementar logout
- [ ] Integrar con RepaartAPIService

### Fase 6: Testing & Polish (Semana 5-6)
- [ ] Unit tests para todos los ViewModels
- [ ] UI tests para todas las vistas principales
- [ ] Performance profiling con Instruments
- [ ] Dark mode testing completo
- [ ] Accessibility audit con VoiceOver
- [ ] Optimizaciones de build size
- [ ] Beta testing con TestFlight

---

## 📞 Recursos y Referencias

### Documentación Apple
- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [SwiftUI Documentation](https://developer.apple.com/documentation/swiftui/)
- [SF Symbols](https://developer.apple.com/sf-symbols/)
- [Firebase iOS SDK](https://firebase.google.com/docs/ios/setup)
- [TestFlight](https://developer.apple.com/testflight/)
- [App Store](https://developer.apple.com/app-store/)

### Documentación del Proyecto
- [PASO 6: Mobile iOS Design](./MOBILE_IOS_DESIGN_PHASE6.md)
- [OpenAPI Spec](../api/openapi.yaml)
- [API Documentation](../api/README.md)

---

## 💰 Beneficios Esperados

### Para los Riders
- ✅ Experiencia nativa superior
- ✅ Performance optimizada
- ✅ Integración perfecta con iOS
- ✅ Push notifications nativas
- ✅ Offline mode con CoreData

### Para el Negocio
- ✅ Mayor retención de riders
- ✅ Mayor productividad (app más rápida)
- ✅ Mejor percepción de marca
- ✅ Feedback en tiempo real

### Para el Equipo de Desarrollo
- ✅ Código nativo Swift puro
- ✅ Mantenibilidad con SwiftUI
- ✅ Testing nativo completo
- ✅ Documentación HIG

---

**Fecha de Inicio:** 26 Enero 2026  
**Autor:** AI Code Refactoring Agent  
**Versión:** v5.0 - Mobile iOS Design Phase 6 (Iniciado)
