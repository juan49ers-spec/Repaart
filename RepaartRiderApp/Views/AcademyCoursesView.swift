import SwiftUI

/// Vista de lista de cursos de la Academia
/// Permite al rider ver y acceder a los cursos disponibles
@MainActor
struct AcademyCoursesView: View {
    
    // MARK: - Published Properties
    @Published private(setIsLoading) var isLoading: Bool = false
    @Published private(setErrorMessage) var errorMessage: String?
    @Published private(setCourses) var courses: [Course] = []
    
    // MARK: - Dependencies
    @EnvironmentObject private var auth: FirebaseAuthService
    @EnvironmentObject private var apiService: RepaartAPIService
    
    // MARK: - State
    @State private var selectedCategory: String = "Todos"
    @State private var searchQuery: String = ""
    
    // MARK: - Body
    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Header con búsqueda y filtros
                headerSection
                
                if isLoading {
                    loadingView
                } else if let error = errorMessage {
                    errorView(message: error)
                } else if courses.isEmpty {
                    emptyView
                } else {
                    coursesListSection
                }
            }
            .navigationTitle("Academia")
        }
    }
    
    // MARK: - Header Section
    private var headerSection: some View {
        VStack(spacing: 16) {
            // Barra de búsqueda
            HStack {
                Image(systemName: "magnifyingglass")
                    .font(.callout)
                    .foregroundColor(.secondary)
                
                TextField("Buscar cursos...", text: $searchQuery)
                    .textFieldStyle(.rounded)
                
                if !searchQuery.isEmpty {
                    Button(action: {
                        withAnimation {
                            searchQuery = ""
                        }
                    }) {
                        Image(systemName: "xmark.circle.fill")
                            .font(.callout)
                            .foregroundColor(.secondary)
                    }
                }
            }
            .padding(.horizontal, 16)
            
            // Categorías
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(categories, id: \.self) { category in
                        Button(action: {
                            withAnimation {
                                selectedCategory = category
                            }
                        }) {
                            Text(category)
                                .font(.subheadline)
                                .fontWeight(.medium)
                                .padding(.horizontal, 16)
                                .padding(.vertical, 8)
                                .background(selectedCategory == category ? Color.brandPrimary : Color.surface)
                                .foregroundColor(selectedCategory == category ? .white : .primary)
                                .cornerRadius(20)
                        }
                    }
                }
                .padding(.horizontal, 16)
            }
        }
        .padding(.vertical, 16)
    }
    
    // MARK: - Courses List Section
    private var coursesListSection: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                ForEach(filteredCourses, id: \.id) { course in
                    CourseCard(course: course)
                        .onTapGesture {
                            // Navegar a detalle del curso
                            // TODO: Implementar navegación
                        }
                }
            }
            .padding(.horizontal, 16)
        }
    }
    
    // MARK: - Course Card
    private func CourseCard(course: Course) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header: Icono, título, categoría y nivel
            HStack {
                VStack(alignment: .leading, spacing: 8) {
                    Text(course.title)
                        .font(.headline)
                        .foregroundColor(.primary)
                        .lineLimit(2)
                    
                    HStack(spacing: 8) {
                        Image(systemName: "book.fill")
                            .font(.caption1)
                            .foregroundColor(.blue)
                        
                        Text(course.category)
                            .font(.caption2)
                            .foregroundColor(.secondary)
                        
                        Spacer()
                        
                        CourseLevelBadge(level: course.level)
                    }
                }
                
                Spacer()
            }
            .padding(.bottom, 8)
            
            Divider()
            
            // Body: Descripción, duración, lecciones
            VStack(alignment: .leading, spacing: 8) {
                Text(course.description)
                    .font(.body)
                    .foregroundColor(.primary)
                    .lineLimit(3)
                
                HStack(spacing: 12) {
                    HStack(spacing: 4) {
                        Image(systemName: "clock.fill")
                            .font(.caption1)
                            .foregroundColor(.orange)
                        
                        Text(course.duration ?? "Desconocido")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    }
                    
                    if let lessonCount = course.lessonCount {
                        HStack(spacing: 4) {
                            Image(systemName: "list.bullet.rectangle")
                                .font(.caption1)
                                .foregroundColor(.blue)
                            
                            Text("\(lessonCount) lecciones")
                                .font(.caption2)
                                .foregroundColor(.secondary)
                        }
                    }
                }
            }
        }
        .padding(16)
        .background(Color.surface)
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.1), radius: 4, y: 2)
    }
    
    // MARK: - Level Badge
    private func CourseLevelBadge(level: CourseLevel) -> some View {
        Text(level.displayName)
            .font(.caption2)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(backgroundColor(for: level))
            .foregroundColor(foregroundColor(for: level))
            .cornerRadius(8)
    }
    
    // MARK: - Empty View
    private var emptyView: some View {
        VStack(spacing: 24) {
            Image(systemName: "book.closed")
                .font(.system(size: 64))
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
            
            Text("No hay cursos disponibles")
                .font(.headline)
                .multilineTextAlignment(.center)
                .foregroundColor(.primary)
            
            Text("Vuelve más tarde para ver nuevos cursos")
                .font(.body)
                .multilineTextAlignment(.center)
                .foregroundColor(.secondary)
        }
        .padding()
    }
    
    // MARK: - Loading View
    private var loadingView: some View {
        VStack(spacing: 16) {
            ProgressView()
                .progressViewStyle(.circular)
            
            Text("Cargando cursos...")
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
        .padding()
    }
    
    // MARK: - Error View
    private func errorView(message: String) -> some View {
        VStack(spacing: 16) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 64))
                .foregroundColor(.error)
            
            Text(message)
                .font(.body)
                .multilineTextAlignment(.center)
                .foregroundColor(.primary)
            
            Spacer()
            
            Button("Reintentar") {
                Task {
                    await fetchCourses()
                }
            }
            .buttonStyle(.bordered)
        }
        .padding()
    }
    
    // MARK: - Data Fetching
    private func fetchCourses() async {
        isLoading = true
        errorMessage = nil
        
        do {
            // TODO: Implementar llamada a API de Repaart
            // Ejemplo: courses = try await apiService.fetchCourses()
            
            // Simulación de datos por ahora
            try await Task.sleep(nanoseconds: 1_500_000_000) // 1.5s de delay
            
            // Generar cursos de prueba
            courses = generateSampleCourses()
            
            isLoading = false
        } catch {
            errorMessage = "Error al cargar cursos. Por favor intenta de nuevo."
            isLoading = false
        }
    }
    
    // MARK: - Helper Properties
    private var categories: [String] {
        ["Todos", "Operaciones", "Mantenimiento", "Seguridad", "Atención al Cliente"]
    }
    
    private var filteredCourses: [Course] {
        var result = courses
        
        // Filtrar por categoría
        if selectedCategory != "Todos" {
            result = result.filter { $0.category == selectedCategory }
        }
        
        // Filtrar por búsqueda
        if !searchQuery.isEmpty {
            result = result.filter { course in
                course.title.localizedCaseInsensitiveContains(searchQuery) ||
                course.description.localizedCaseInsensitiveContains(searchQuery)
            }
        }
        
        return result
    }
    
    // MARK: - Sample Data Generation
    private func generateSampleCourses() -> [Course] {
        [
            Course(
                id: "course_1",
                title: "Procedimientos de Entrega",
                description: "Aprende las mejores prácticas para realizar entregas de manera profesional y segura. Incluye protocolos de seguridad, manejo de paquetes y atención al cliente.",
                icon: "box.truck",
                category: "Operaciones",
                duration: "2 horas",
                level: .beginner,
                status: .active,
                lessonCount: 5,
                order: 1,
                createdAt: ISO8601DateFormatter.string(from: Date()),
                updatedAt: ISO8601DateFormatter.string(from: Date())
            ),
            Course(
                id: "course_2",
                title: "Mantenimiento de Vehículos",
                description: "Conoce los procedimientos básicos de mantenimiento preventivo para mantener la flota en óptimas condiciones. Incluye revisiones diarias, semanales y mensuales.",
                icon: "wrench",
                category: "Mantenimiento",
                duration: "3 horas",
                level: .intermediate,
                status: .active,
                lessonCount: 8,
                order: 2,
                createdAt: ISO8601DateFormatter.string(from: Date()),
                updatedAt: ISO8601DateFormatter.string(from: Date())
            ),
            Course(
                id: "course_3",
                title: "Seguridad en Ruta",
                description: "Aprende a identificar y prevenir riesgos mientras conduces. Conoce las rutas más seguras y cómo reaccionar ante situaciones de emergencia.",
                icon: "shield",
                category: "Seguridad",
                duration: "1.5 horas",
                level: .beginner,
                status: .active,
                lessonCount: 4,
                order: 3,
                createdAt: ISO8601DateFormatter.string(from: Date()),
                updatedAt: ISO8601DateFormatter.string(from: Date())
            ),
            Course(
                id: "course_4",
                title: "Atención al Cliente Premium",
                description: "Domina las técnicas de comunicación y servicio al cliente para asegurar experiencias memorables. Incluye manejo de quejas y devoluciones.",
                icon: "person.3",
                category: "Atención al Cliente",
                duration: "2.5 horas",
                level: .intermediate,
                status: .active,
                lessonCount: 6,
                order: 4,
                createdAt: ISO8601DateFormatter.string(from: Date()),
                updatedAt: ISO8601DateFormatter.string(from: Date())
            ),
            Course(
                id: "course_5",
                title: "Gestión de Horarios y Turnos",
                description: "Aprende a usar el sistema de gestión de turnos de Repaart. Incluye cómo confirmar turnos, solicitar cambios y ver tu historial.",
                icon: "calendar",
                category: "Operaciones",
                duration: "1 hora",
                level: .beginner,
                status: .active,
                lessonCount: 3,
                order: 5,
                createdAt: ISO8601DateFormatter.string(from: Date()),
                updatedAt: ISO8601DateFormatter.string(from: Date())
            )
        ]
    }
}

// MARK: - Supporting Types

struct Course: Identifiable, Codable {
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
    
    var displayName: String {
        switch self {
        case .beginner:
            return "Principiante"
        case .intermediate:
            return "Intermedio"
        case .advanced:
            return "Avanzado"
        }
    }
}

enum CourseStatus: String, Codable {
    case active
    case draft
    case archived
}
