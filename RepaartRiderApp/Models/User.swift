import Foundation

/// User data model para la app Repaart Rider
/// Contiene información básica del usuario autenticado
struct User: Identifiable, Codable {
    let id: String
    let email: String
    let displayName: String?
    let phoneNumber: String?
    let role: String?
    let franchiseId: String?
    let createdAt: Date
    let lastLoginAt: Date?
    let isActive: Bool
}

/// User roles según el sistema de permisos de Repaart
enum UserRole: String, Codable {
    case admin
    case franchise
    case rider
    
    /// Descripción legible del rol
    var displayName: String {
        switch self {
        case .admin:
            return "Administrador"
        case .franchise:
            return "Franquicia"
        case .rider:
            return "Rider"
        }
    }
    
    /// Permisos asociados a cada rol
    var permissions: [String] {
        switch self {
        case .admin:
            return [
                "manage_all_franchises",
                "approve_finances",
                "manage_courses",
                "view_analytics",
                "manage_users",
                "view_reports"
            ]
        case .franchise:
            return [
                "view_own_finances",
                "manage_own_riders",
                "manage_own_vehicles",
                "view_own_analytics",
                "schedule_shifts",
                "view_academy"
            ]
        case .rider:
            return [
                "view_own_shifts",
                "clock_in_out",
                "view_own_schedule",
                "take_academy",
                "view_profile"
            ]
        }
    }
}
