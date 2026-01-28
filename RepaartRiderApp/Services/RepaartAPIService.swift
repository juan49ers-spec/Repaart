import Foundation
import FirebaseCore

/// RepaartAPIService: Cliente HTTP para la API de Repaart
/// Permite fetch de datos de turnos, académica y perfil desde la web API
@MainActor
class RepaartAPIService: ObservableObject {
    
    // MARK: - Published Properties
    @Published private(setIsLoading) var isLoading: Bool = false
    @Published private(setErrorMessage) var errorMessage: String?
    
    // MARK: - Private Properties
    private let baseURL: String = "https://repaartfinanzas.web.app"
    private let authService: FirebaseAuthService
    
    // MARK: - Constants
    private enum Endpoint {
        static let shifts = "/scheduler/shifts"
        static let courses = "/academy/courses"
        static let progress = "/academy/progress"
    }
    
    // MARK: - Errors
    enum APIError: LocalizedError {
        case invalidURL
        case invalidResponse
        case serverError(String)
        case unauthorized
        case notFound
        case networkError
        
        var localizedDescription: String {
            switch self {
            case .invalidURL:
                return "URL de API inválida"
            case .invalidResponse:
                return "Respuesta inválida del servidor"
            case .serverError(let message):
                return message
            case .unauthorized:
                return "No estás autorizado"
            case .notFound:
                return "Recurso no encontrado"
            case .networkError:
                return "Error de conexión. Verifica tu internet"
            }
        }
    }
    
    // MARK: - Initialization
    init(authService: FirebaseAuthService) {
        self.authService = authService
    }
    
    // MARK: - Scheduler API
    
    /// Obtiene los turnos en un rango de fechas
    func fetchShifts(
        franchiseId: String,
        startDate: Date,
        endDate: Date
    ) async throws -> [Shift] {
        isLoading = true
        defer { isLoading = false }
        
        guard let token = try? await authService.getIDToken() else {
            throw APIError.unauthorized
        }
        
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        
        let urlComponents = URLComponents(
            string: baseURL + Endpoint.shifts,
            queryItems: [
                URLQueryItem(name: "franchiseId", value: franchiseId),
                URLQueryItem(name: "startDate", value: dateFormatter.string(from: startDate)),
                URLQueryItem(name: "endDate", value: dateFormatter.string(from: endDate))
            ]
        )
        
        guard let url = urlComponents.url else {
            throw APIError.invalidURL
        }
        
        let request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            
            guard let httpResponse = response as? HTTPURLResponse else {
                throw APIError.invalidResponse
            }
            
            switch httpResponse.statusCode {
            case 200:
                let decoder = JSONDecoder()
                return try decoder.decode([Shift].self, from: data)
            case 401:
                throw APIError.unauthorized
            case 404:
                throw APIError.notFound
            default:
                let apiError = try decoder.decode([String: String].self, from: data)
                if let message = apiError["message"] {
                    throw APIError.serverError(message)
                }
                throw APIError.serverError("Error desconocido")
            }
        } catch let error as APIError {
            throw error
        } catch {
            throw APIError.networkError
        }
    }
    
    /// Inicia un turno (clock in)
    func startShift(shiftId: String) async throws {
        isLoading = true
        defer { isLoading = false }
        
        guard let token = try? await authService.getIDToken() else {
            throw APIError.unauthorized
        }
        
        guard let url = URL(string: baseURL + Endpoint.shifts + "/\(shiftId)/start") else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = nil
        
        do {
            let (_, response) = try await URLSession.shared.data(for: request)
            
            guard let httpResponse = response as? HTTPURLResponse else {
                throw APIError.invalidResponse
            }
            
            switch httpResponse.statusCode {
            case 200:
                return // Success
            case 401:
                throw APIError.unauthorized
            default:
                throw APIError.serverError("Error al iniciar turno")
            }
        } catch let error as APIError {
            throw error
        } catch {
            throw APIError.networkError
        }
    }
    
    /// Finaliza un turno (clock out)
    func endShift(shiftId: String) async throws {
        isLoading = true
        defer { isLoading = false }
        
        guard let token = try? await authService.getIDToken() else {
            throw APIError.unauthorized
        }
        
        guard let url = URL(string: baseURL + Endpoint.shifts + "/\(shiftId)/end") else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = nil
        
        do {
            let (_, response) = try await URLSession.shared.data(for: request)
            
            guard let httpResponse = response as? HTTPURLResponse else {
                throw APIError.invalidResponse
            }
            
            switch httpResponse.statusCode {
            case 200:
                return // Success
            case 401:
                throw APIError.unauthorized
            default:
                throw APIError.serverError("Error al finalizar turno")
            }
        } catch let error as APIError {
            throw error
        } catch {
            throw APIError.networkError
        }
    }
    
    /// Confirma un turno
    func confirmShift(shiftId: String) async throws {
        isLoading = true
        defer { isLoading = false }
        
        guard let token = try? await authService.getIDToken() else {
            throw APIError.unauthorized
        }
        
        guard let url = URL(string: baseURL + Endpoint.shifts + "/\(shiftId)/confirm") else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = nil
        
        do {
            let (_, response) = try await URLSession.shared.data(for: request)
            
            guard let httpResponse = response as? HTTPURLResponse else {
                throw APIError.invalidResponse
            }
            
            switch httpResponse.statusCode {
            case 200:
                return // Success
            case 401:
                throw APIError.unauthorized
            default:
                throw APIError.serverError("Error al confirmar turno")
            }
        } catch let error as APIError {
            throw error
        } catch {
            throw APIError.networkError
        }
    }
    
    // MARK: - Academy API
    
    /// Obtiene todos los cursos disponibles
    func fetchCourses() async throws -> [Course] {
        isLoading = true
        defer { isLoading = false }
        
        guard let token = try? await authService.getIDToken() else {
            throw APIError.unauthorized
        }
        
        guard let url = URL(string: baseURL + Endpoint.courses) else {
            throw APIError.invalidURL
        }
        
        let request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            
            guard let httpResponse = response as? HTTPURLResponse else {
                throw APIError.invalidResponse
            }
            
            switch httpResponse.statusCode {
            case 200:
                let decoder = JSONDecoder()
                return try decoder.decode([Course].self, from: data)
            case 401:
                throw APIError.unauthorized
            default:
                let apiError = try decoder.decode([String: String].self, from: data)
                if let message = apiError["message"] {
                    throw APIError.serverError(message)
                }
                throw APIError.serverError("Error al cargar cursos")
            }
        } catch let error as APIError {
            throw error
        } catch {
            throw APIError.networkError
        }
    }
    
    /// Obtiene el progreso del usuario en la academia
    func fetchProgress(userId: String) async throws -> [String: UserProgress] {
        isLoading = true
        defer { isLoading = false }
        
        guard let token = try? await authService.getIDToken() else {
            throw APIError.unauthorized
        }
        
        let urlComponents = URLComponents(
            string: baseURL + Endpoint.progress,
            queryItems: [
                URLQueryItem(name: "userId", value: userId)
            ]
        )
        
        guard let url = urlComponents.url else {
            throw APIError.invalidURL
        }
        
        let request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            
            guard let httpResponse = response as? HTTPURLResponse else {
                throw APIError.invalidResponse
            }
            
            switch httpResponse.statusCode {
            case 200:
                let decoder = JSONDecoder()
                return try decoder.decode([String: UserProgress].self, from: data)
            case 401:
                throw APIError.unauthorized
            default:
                let apiError = try decoder.decode([String: String].self, from: data)
                if let message = apiError["message"] {
                    throw APIError.serverError(message)
                }
                throw APIError.serverError("Error al cargar progreso")
            }
        } catch let error as APIError {
            throw error
        } catch {
            throw APIError.networkError
        }
    }
}

// MARK: - Supporting Types

struct Shift: Identifiable, Codable {
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
}

enum CourseStatus: String, Codable {
    case active
    case draft
    case archived
}

struct UserProgress: Codable {
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
