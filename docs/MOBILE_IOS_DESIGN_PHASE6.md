# PASO 6: Mobile iOS Design - App Nativa para Riders

## 📋 Resumen

Se va a crear una aplicación móvil nativa para iOS (SwiftUI) enfocada en los riders de Repaart. Esta app proporcionará una experiencia nativa superior y acceso a las APIs del sistema.

---

## 🎯 Objetivos

### 1. Experiencia Nativa iOS
- ✅ Interfaz SwiftUI moderna y fluida
- ✅ Navegación nativa (TabView, NavigationStack)
- ✅ Animaciones suaves y transiciones nativas
- ✅ Soporte para Dynamic Type y Dark Mode
- ✅ SF Symbols para iconografía consistente

### 2. Funcionalidades del Rider
- ✅ Ver turnos programados (vista semanal)
- ✅ Clock In/Out (fichar entrada/salida)
- ✅ Confirmar turnos
- ✅ Solicitar intercambios/cambios
- ✅ Ver progreso de la Academia
- ✅ Perfil personal y métricas

### 3. Integración con Repaart API
- ✅ Cliente HTTP nativo (URLSession)
- ✅ Autenticación Firebase Auth
- ✅ Manejo de errores con UX nativa
- ✅ Refresh tokens automático
- ✅ Offline support con CoreData

---

## 📱 Arquitectura de la App

### Estructura de Proyecto

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

## 🎨 Design System iOS

### 1. Colores (Semantic)

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

### 3. SF Symbols (Iconografía)

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

## 🔧 Componentes UI

### 1. ShiftCard

```swift
struct ShiftCard: View {
    let shift: Shift
    let onTap: () -> Void
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header: Date and Time
            HStack {
                Text(formatDate(shift.startAt))
                    .font(.headline)
                    .foregroundStyle(.primary)
                
                Spacer()
                
                Text(formatTime(shift.startAt))
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            .padding(.bottom, 8)
            
            Divider()
            
            // Body: Rider and Vehicle info
            HStack(spacing: 12) {
                // Rider info
                HStack(spacing: 8) {
                    SFIcons.person.image
                        .foregroundStyle(.blue)
                    
                    VStack(alignment: .leading, spacing: 4) {
                        Text(shift.riderName)
                            .font(.body)
                            .foregroundStyle(.primary)
                        
                        Text("Rider ID: \(shift.riderId ?? "Unassigned")")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }
                
                Spacer()
                
                // Vehicle info
                HStack(spacing: 8) {
                    SFIcons.calendar.image
                        .foregroundStyle(.orange)
                    
                    Text(shift.motoPlate)
                        .font(.body)
                            .foregroundStyle(.primary)
                }
                
                // Status badge
                ShiftStatusBadge(status: shift.status)
            }
        }
        .padding()
        .background(Color.surface)
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.1), radius: 4, y: 2)
        .onTapGesture {
            onTap()
        }
    }
}
```

### 2. ClockInOutView

```swift
struct ClockInOutView: View {
    @State private var clockedIn: Bool = false
    @State private var clockInTime: Date?
    @State private var clockOutTime: Date?
    let shift: Shift
    
    var body: some View {
        VStack(spacing: 24) {
            // Header
            VStack(spacing: 8) {
                Text("Turno Actual")
                    .font(.title2)
                    .foregroundStyle(.primary)
                
                Text(formatDateRange(shift.startAt, shift.endAt))
                    .font(.headline)
                    .foregroundStyle(.secondary)
            }
            .padding()
            
            // Clock In/Out Button
            if !clockedIn {
                Button(action: {
                    clockIn()
                }) {
                    Label("Fichar Entrada", systemImage: "play.circle.fill")
                        .font(.headline)
                }
                .buttonStyle(.primary)
                .controlSize(.large)
            } else {
                Button(action: {
                    clockOut()
                }) {
                    Label("Fichar Salida", systemImage: "pause.circle.fill")
                        .font(.headline)
                }
                .buttonStyle(.destructive)
                .controlSize(.large)
            }
            .padding(.horizontal)
            
            // Status
            VStack(spacing: 16) {
                if let clockIn = clockInTime {
                    HStack {
                        SFIcons.clock.image
                        Text("Entrada: \(formatTime(clockIn))")
                            .font(.body)
                    }
                    .foregroundStyle(.success)
                }
                
                if let clockOut = clockOutTime {
                    HStack {
                        SFIcons.checkmark.image
                        Text("Salida: \(formatTime(clockOut))")
                            .font(.body)
                    }
                    .foregroundStyle(.success)
                }
            }
            .padding()
            .background(Color.surface)
            .cornerRadius(12)
        }
        .padding()
    }
    
    private func clockIn() {
        // Call API to start shift
        // Update state
        clockedIn = true
        clockInTime = Date()
    }
    
    private func clockOut() {
        // Call API to end shift
        // Update state
        clockedIn = false
        clockOutTime = Date()
    }
}
```

### 3. CourseCard

```swift
struct CourseCard: View {
    let course: Course
    let progress: UserProgress?
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header: Title and Category
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(course.title)
                        .font(.headline)
                        .foregroundStyle(.primary)
                        .lineLimit(2)
                    
                    HStack(spacing: 8) {
                        SFIcons.book.image
                            .foregroundStyle(.blue)
                        Text(course.category)
                            .font(.caption1)
                            .foregroundStyle(.secondary)
                    }
                }
                
                Spacer()
                
                // Progress indicator
                if let progress = progress {
                    VStack(spacing: 4) {
                        Text("\(progress.completedLessons?.count ?? 0)/\(course.lessonCount ?? 0)")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                        
                        ProgressBar(
                            current: progress.completedLessons?.count ?? 0,
                            total: course.lessonCount ?? 1
                        )
                    }
                }
            }
            .padding(.bottom, 8)
            
            Divider()
            
            // Body: Description and Duration
            VStack(alignment: .leading, spacing: 8) {
                Text(course.description)
                    .font(.body)
                    .foregroundStyle(.primary)
                    .lineLimit(3)
                
                HStack(spacing: 12) {
                    SFIcons.clock.image
                    Text(course.duration ?? "Unknown")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                
                Spacer()
                
                // Status badge
                CourseStatusBadge(status: progress?.status ?? .notStarted)
            }
        }
        .padding()
        .background(Color.surface)
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.1), radius: 4, y: 2)
    }
}
```

---

## 🧭 Navegación

### Main TabView

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

## 🔌 Integración con Firebase Auth

### FirebaseAuthService

```swift
import FirebaseAuth

class FirebaseAuthService: ObservableObject {
    @Published var currentUser: User?
    @Published var isAuthenticated: Bool = false
    @Published var errorMessage: String?
    
    private let auth = Auth.auth()
    
    init() {
        setupAuthListener()
    }
    
    private func setupAuthListener() {
        auth.addStateDidChangeListener { [weak self] auth, user in
            DispatchQueue.main.async {
                self?.currentUser = user
                self?.isAuthenticated = user != nil
            }
        }
    }
    
    func signIn(email: String, password: String) async throws {
        do {
            let result = try await auth.signIn(withEmail: email, password: password)
            currentUser = result.user
            errorMessage = nil
        } catch {
            errorMessage = error.localizedDescription
            throw error
        }
    }
    
    func signOut() throws {
        try auth.signOut()
        currentUser = nil
        isAuthenticated = false
    }
    
    func getIDToken() async throws -> String {
        guard let user = currentUser else {
            throw AuthError.notAuthenticated
        }
        return try await user.getIDToken()
    }
}

enum AuthError: LocalizedError {
    case notAuthenticated
    case invalidCredentials
}
```

---

## 🌐 Integración con Repaart API

### RepaartAPIService

```swift
import Foundation

class RepaartAPIService: ObservableObject {
    private let baseURL = "https://repaartfinanzas.web.app"
    private let authService = FirebaseAuthService()
    
    @Published var isLoading: Bool = false
    @Published var errorMessage: String?
    
    // MARK: - Shifts
    
    func fetchShifts(
        franchiseId: String,
        startDate: Date,
        endDate: Date
    ) async throws -> [Shift] {
        isLoading = true
        defer { isLoading = false }
        
        guard let token = try? await authService.getIDToken() else {
            throw AuthError.notAuthenticated
        }
        
        var components = URLComponents(string: "\(baseURL)/scheduler/shifts")
        components?.queryItems = [
            URLQueryItem(name: "franchiseId", value: franchiseId),
            URLQueryItem(name: "startDate", value: formatDate(startDate)),
            URLQueryItem(name: "endDate", value: formatDate(endDate))
        ]
        
        guard let url = components?.url else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        
        switch httpResponse.statusCode {
        case 200:
            let decoder = JSONDecoder()
            let shifts = try decoder.decode([Shift].self, from: data)
            return shifts
        case 401:
            throw AuthError.invalidCredentials
        default:
            let apiError = try decoder.decode(APIErrorResponse.self, from: data)
            throw APIError.serverError(apiError.message)
        }
    }
    
    // MARK: - Clock In/Out
    
    func startShift(shiftId: String) async throws {
        isLoading = true
        defer { isLoading = false }
        
        guard let token = try? await authService.getIDToken() else {
            throw AuthError.notAuthenticated
        }
        
        let url = URL(string: "\(baseURL)/scheduler/shifts/\(shiftId)/start")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let (_, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        
        guard httpResponse.statusCode == 200 else {
            throw APIError.serverError("Failed to start shift")
        }
    }
    
    func endShift(shiftId: String) async throws {
        isLoading = true
        defer { isLoading = false }
        
        guard let token = try? await authService.getIDToken() else {
            throw AuthError.notAuthenticated
        }
        
        let url = URL(string: "\(baseURL)/scheduler/shifts/\(shiftId)/end")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let (_, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        
        guard httpResponse.statusCode == 200 else {
            throw APIError.serverError("Failed to end shift")
        }
    }
    
    // MARK: - Academy
    
    func fetchCourses() async throws -> [Course] {
        isLoading = true
        defer { isLoading = false }
        
        guard let token = try? await authService.getIDToken() else {
            throw AuthError.notAuthenticated
        }
        
        let url = URL(string: "\(baseURL)/academy/courses")!
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        
        switch httpResponse.statusCode {
        case 200:
            let decoder = JSONDecoder()
            let courses = try decoder.decode([Course].self, from: data)
            return courses
        default:
            let apiError = try decoder.decode(APIErrorResponse.self, from: data)
            throw APIError.serverError(apiError.message)
        }
    }
    
    func fetchProgress(userId: String) async throws -> [String: UserProgress] {
        isLoading = true
        defer { isLoading = false }
        
        guard let token = try? await authService.getIDToken() else {
            throw AuthError.notAuthenticated
        }
        
        var components = URLComponents(string: "\(baseURL)/academy/progress")
        components?.queryItems = [
            URLQueryItem(name: "userId", value: userId)
        ]
        
        guard let url = components?.url else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        
        switch httpResponse.statusCode {
        case 200:
            let decoder = JSONDecoder()
            let progress = try decoder.decode([String: UserProgress].self, from: data)
            return progress
        default:
            let apiError = try decoder.decode(APIErrorResponse.self, from: data)
            throw APIError.serverError(apiError.message)
        }
    }
}

enum APIError: LocalizedError {
    case invalidURL
    case invalidResponse
    case serverError(String)
}
```

---

## 📊 Data Models

### Shift Model

```swift
import Foundation

struct Shift: Codable, Identifiable {
    let id: String
    let shiftId: String
    let franchiseId: String
    let riderId: String?
    let riderName: String
    let motoId: String?
    let motoPlate: String
    let startAt: String // ISO 8601
    let endAt: String // ISO 8601
    let date: String // YYYY-MM-DD
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

### Course Model

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

### UserProgress Model

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

## 🧪 Testing Strategy

### Unit Tests

```swift
import XCTest
@testable import RepaartRiderApp

final class SchedulerViewModelTests: XCTestCase {
    var viewModel: SchedulerViewModel!
    var mockAPIService: MockRepaartAPIService!
    
    override func setUp() {
        super.setUp()
        mockAPIService = MockRepaartAPIService()
        viewModel = SchedulerViewModel(apiService: mockAPIService)
    }
    
    func testFetchShifts_Success() async throws {
        // Given
        let expectedShifts = [
            Shift(id: "1", shiftId: "1", franchiseId: "test", riderName: "Test", motoPlate: "ABC123", startAt: "2026-01-25T09:00:00Z", endAt: "2026-01-25T14:00:00Z", date: "2026-01-25", status: .scheduled, isConfirmed: false, swapRequested: false, changeRequested: false, isDraft: false)
        ]
        mockAPIService.shiftsToReturn = expectedShifts
        
        // When
        let shifts = try await viewModel.fetchShifts()
        
        // Then
        XCTAssertEqual(shifts, expectedShifts)
    }
    
    func testFetchShifts_AuthError() async throws {
        // Given
        mockAPIService.shouldThrowAuthError = true
        
        // When/Then
        do {
            _ = try await viewModel.fetchShifts()
            XCTFail("Should have thrown error")
        } catch {
            XCTAssertTrue(error is AuthError)
        }
    }
}
```

### UI Tests

```swift
import XCTest
@testable import RepaartRiderApp

final class SchedulerViewUITests: XCTestCase {
    var app: XCUIApplication!
    
    override func setUp() {
        super.setUp()
        app = XCUIApplication()
        continueAfterFailure = false
        app.launchArguments = ["UI_TESTING"] = true
        app.launch()
    }
    
    func testLogin_Success() {
        // Given
        let emailTextField = app.textFields["emailTextField"]
        let passwordTextField = app.secureTextFields["passwordTextField"]
        let loginButton = app.buttons["loginButton"]
        
        // When
        emailTextField.tap()
        emailTextField.typeText("test@repaart.com")
        
        passwordTextField.tap()
        passwordTextField.typeText("password123")
        
        loginButton.tap()
        
        // Then
        XCTAssertTrue(app.staticTexts["Agenda"].waitForExistence(timeout: 5))
    }
    
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
}
```

---

## 🚀 Siguientes Pasos

### Fase 1: Setup (Semana 1)
- [ ] Crear proyecto Xcode
- [ ] Configurar Firebase Auth
- [ ] Configurar Info.plist
- [ ] Definir Assets.xcassets
- [ ] Crear estructura de carpetas

### Fase 2: Auth Flow (Semana 1)
- [ ] Implementar LoginView
- [ ] Implementar RegisterView
- [ ] Implementar ForgotPasswordView
- [ ] Test con Firebase Emulator
- [ ] Test con Firebase Auth real

### Fase 3: Scheduler (Semana 2)
- [ ] Implementar ShiftsListView
- [ ] Implementar ShiftDetailView
- [ ] Implementar ClockInOutView
- [ ] Implementar WeekCalendarView
- [ ] Integrar con Repaart API

### Fase 4: Academy (Semana 3)
- [ ] Implementar CoursesListView
- [ ] Implementar CourseDetailView
- [ ] Implementar LessonView
- [ ] Implementar QuizView
- [ ] Implementar ProgressView
- [ ] Integrar con Repaart API

### Fase 5: Profile (Semana 4)
- [ ] Implementar ProfileView
- [ ] Implementar StatsView
- [ ] Implementar SettingsView
- [ ] Implementar logout
- [ ] Integrar con Repaart API

### Fase 6: Testing & Polish (Semana 5-6)
- [ ] Unit tests para ViewModels
- [ ] UI tests para Views
- [ ] Performance profiling
- [ ] Dark mode testing
- [ ] Accessibility audit con VoiceOver
- [ ] Optimizaciones de build
- [ ] Beta testing con TestFlight

---

## 📞 Soporte

- **Documentación iOS**: https://developer.apple.com/documentation/
- **SwiftUI**: https://developer.apple.com/documentation/swiftui/
- **Firebase iOS SDK**: https://firebase.google.com/docs/ios/setup
- **TestFlight**: https://developer.apple.com/testflight/
- **App Store**: https://developer.apple.com/app-store/

---

**Fecha de Planificación:** 26 Enero 2026  
**Autor:** AI Code Refactoring Agent  
**Versión:** v5.0 - Mobile iOS Design Phase 6
