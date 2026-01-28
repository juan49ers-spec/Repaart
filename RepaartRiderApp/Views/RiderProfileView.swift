import SwiftUI

/// Vista de perfil del rider
/// Muestra información personal, métricas y configuración
@MainActor
struct RiderProfileView: View {
    
    // MARK: - Published Properties
    @Published private(setIsLoading) var isLoading: Bool = false
    @Published private(setErrorMessage) var errorMessage: String?
    @Published private(setUserData) var userData: User?
    @Published private(setStats) var stats: RiderStats?
    
    // MARK: - Dependencies
    @EnvironmentObject private var auth: FirebaseAuthService
    
    // MARK: - Body
    var body: some View {
        NavigationStack {
            if isLoading {
                loadingView
            } else if let error = errorMessage {
                errorView(message: error)
            } else if let user = userData {
                profileContent(user: user)
            } else {
                emptyView
            }
        }
        .navigationTitle("Mi Perfil")
    }
    
    // MARK: - Profile Content
    private func profileContent(user: User) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                // Header con avatar e información básica
                headerSection(user: user)
                
                Divider()
                
                // Métricas del rider
                if let stats = stats {
                    metricsSection(stats: stats)
                }
                
                Divider()
                
                // Información detallada
                detailsSection(user: user)
                
                Divider()
                
                // Configuración
                settingsSection
            }
            .padding()
        }
    }
    
    // MARK: - Header Section
    private func headerSection(user: User) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            // Avatar y nombre
            HStack(spacing: 16) {
                // Avatar
                ZStack {
                    Circle()
                        .fill(Color.brandPrimary.opacity(0.1))
                        .frame(width: 80, height: 80)
                    
                    Text(user.displayName?.prefix(1).uppercased() ?? "U")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                        .foregroundStyle(.brandPrimary)
                }
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(user.displayName ?? "Rider")
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundStyle(.primary)
                    
                    Text(user.email)
                        .font(.body)
                        .foregroundStyle(.secondary)
                    
                    if let role = user.role {
                        Text(UserRole(rawValue: role)?.displayName ?? "")
                            .font(.caption1)
                            .foregroundStyle(.tertiary)
                    }
                }
                
                Spacer()
                
                // Edit button
                Button(action: {
                    // TODO: Implementar edición de perfil
                }) {
                    Image(systemName: "pencil")
                        .font(.callout)
                        .foregroundStyle(.brandPrimary)
                }
                .buttonStyle(.plain)
            }
        }
        .padding()
        .background(Color.surface)
        .cornerRadius(12)
    }
    
    // MARK: - Metrics Section
    private func metricsSection(stats: RiderStats) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Mis Estadísticas")
                .font(.headline)
                .fontWeight(.semibold)
                .foregroundStyle(.primary)
            
            HStack(spacing: 16) {
                StatCard(
                    title: "Entregas Totales",
                    value: "\(stats.totalDeliveries)",
                    icon: "checkmark.circle.fill",
                    color: .success
                )
                
                StatCard(
                    title: "Calificación",
                    value: String(format: "%.1f", stats.rating),
                    icon: "star.fill",
                    color: .warning
                )
                
                StatCard(
                    title: "Eiciencia",
                    value: "\(stats.eiciency)%",
                    icon: "bolt.fill",
                    color: .brandPrimary
                )
            }
        }
    }
    
    // MARK: - Details Section
    private func detailsSection(user: User) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Información Personal")
                .font(.headline)
                .fontWeight(.semibold)
                .foregroundStyle(.primary)
            
            // Email
            DetailRow(
                icon: "envelope.fill",
                label: "Email",
                value: user.email
            )
            
            // Phone
            if let phone = user.phoneNumber {
                DetailRow(
                    icon: "phone.fill",
                    label: "Teléfono",
                    value: phone
                )
            }
            
            // Franchise ID
            if let franchiseId = user.franchiseId {
                DetailRow(
                    icon: "building.2.fill",
                    label: "Franquicia",
                    value: franchiseId
                )
            }
            
            // Created At
            DetailRow(
                icon: "calendar.badge.clock",
                label: "Miembro desde",
                value: formatDate(user.createdAt)
            )
        }
    }
    
    // MARK: - Settings Section
    private var settingsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Configuración")
                .font(.headline)
                .fontWeight(.semibold)
                .foregroundStyle(.primary)
            
            // Notificaciones
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Notificaciones")
                        .font(.body)
                        .foregroundStyle(.primary)
                    
                    Text("Recibe notificaciones sobre tus turnos y la academia")
                        .font(.caption1)
                        .foregroundStyle(.secondary)
                }
                
                Spacer()
                
                Toggle("", isOn: .constant(true))
                    .tint(.brandPrimary)
            }
            .padding()
            .background(Color.surface)
            .cornerRadius(12)
            
            // Modo oscuro
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Modo Oscuro")
                        .font(.body)
                        .foregroundStyle(.primary)
                    
                    Text("Usa tema oscuro para la interfaz")
                        .font(.caption1)
                        .foregroundStyle(.secondary)
                }
                
                Spacer()
                
                Toggle("", isOn: .constant(false))
                    .tint(.brandPrimary)
            }
            .padding()
            .background(Color.surface)
            .cornerRadius(12)
            
            // Logout button
            Button(action: {
                Task {
                    await auth.signOut()
                }
            }) {
                HStack {
                    Image(systemName: "arrow.right.square")
                        .font(.callout)
                        .foregroundStyle(.error)
                    
                    Text("Cerrar Sesión")
                        .font(.body)
                        .fontWeight(.medium)
                        .foregroundStyle(.error)
                }
            }
            .buttonStyle(.bordered)
            .fullWidth()
            .controlSize(.large)
        }
    }
    
    // MARK: - Sub-Components
    
    private func DetailRow(icon: String, label: String, value: String) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.callout)
                .foregroundStyle(.secondary)
                .frame(width: 24)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(label)
                    .font(.caption1)
                    .foregroundStyle(.tertiary)
                
                Text(value)
                    .font(.body)
                    .foregroundStyle(.primary)
            }
            
            Spacer()
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 8)
    }
    
    // MARK: - Empty View
    private var emptyView: some View {
        VStack(spacing: 24) {
            Image(systemName: "person.slash")
                .font(.system(size: 64))
                .foregroundStyle(.tertiary)
            
            Text("No se pudo cargar tu perfil")
                .font(.headline)
                .multilineTextAlignment(.center)
                .foregroundStyle(.primary)
            
            Text("Por favor intenta más tarde")
                .font(.body)
                .multilineTextAlignment(.center)
                .foregroundStyle(.secondary)
            
            Spacer()
            
            Button("Reintentar") {
                Task {
                    await fetchUserData()
                }
            }
            .buttonStyle(.primary)
        }
        .padding()
    }
    
    // MARK: - Loading View
    private var loadingView: some View {
        VStack(spacing: 16) {
            ProgressView()
                .progressViewStyle(.circular)
            
            Text("Cargando perfil...")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .padding()
    }
    
    // MARK: - Error View
    private func errorView(message: String) -> some View {
        VStack(spacing: 16) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 64))
                .foregroundStyle(.error)
            
            Text(message)
                .font(.body)
                .multilineTextAlignment(.center)
                .foregroundStyle(.primary)
            
            Spacer()
            
            Button("Reintentar") {
                Task {
                    await fetchUserData()
                }
            }
            .buttonStyle(.primary)
        }
        .padding()
    }
    
    // MARK: - Data Fetching
    private func fetchUserData() async {
        isLoading = true
        errorMessage = nil
        
        do {
            // TODO: Implementar llamada a API de Repaart
            // Ejemplo: userData = try await apiService.fetchUserProfile()
            
            // Simulación de datos por ahora
            try await Task.sleep(nanoseconds: 1_000_000_000) // 1 segundo de delay
            
            // Datos simulados de la web
            userData = generateSampleUser()
            stats = generateSampleStats()
            
            isLoading = false
        } catch {
            errorMessage = "Error al cargar tu perfil. Por favor intenta de nuevo."
            isLoading = false
        }
    }
    
    // MARK: - Helper Methods
    
    private func formatDate(_ dateString: String) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "dd/MM/yyyy"
        formatter.locale = Locale(identifier: "es_ES")
        return formatter.string(from: parseISODate(dateString) ?? Date()) ?? ""
    }
    
    // MARK: - Sample Data Generation
    private func generateSampleUser() -> User {
        User(
            id: "user_demo_123",
            email: "rider@repaart.com",
            displayName: "Juan Pérez",
            phoneNumber: "+34 600 123 456",
            role: "rider",
            franchiseId: "franchise_demo_456",
            createdAt: ISO8601DateFormatter.string(from: Date()),
            lastLoginAt: ISO8601DateFormatter.string(from: Date()),
            isActive: true
        )
    }
    
    private func generateSampleStats() -> RiderStats {
        RiderStats(
            totalDeliveries: 342,
            rating: 4.8,
            efficiency: 92
        )
    }
}

// MARK: - Supporting Types

struct User: Identifiable, Codable {
    let id: String
    let email: String
    let displayName: String?
    let phoneNumber: String?
    let role: String?
    let franchiseId: String?
    let createdAt: String
    let lastLoginAt: String?
    let isActive: Bool
}

struct RiderStats {
    let totalDeliveries: Int
    let rating: Double
    let efficiency: Int
}

struct StatCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundStyle(color)
            
            Text(value)
                .font(.title2)
                .fontWeight(.bold)
                .foregroundStyle(.primary)
            
            Text(title)
                .font(.caption1)
                .foregroundStyle(.tertiary)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(color.opacity(0.1))
        .cornerRadius(12)
    }
}
