import SwiftUI
import FirebaseAuth

/// FirebaseAuthService: Manejo de autenticación Firebase para la app Repaart Rider
/// Soporta login, registro, cierre de sesión y obtención de tokens
@MainActor
class FirebaseAuthService: ObservableObject {
    
    // MARK: - Published Properties
    
    /// Usuario autenticado actualmente
    @Published var currentUser: User? = nil
    
    /// Indica si hay un usuario autenticado
    @Published var isAuthenticated: Bool = false
    
    /// Mensaje de error para mostrar al usuario
    @Published var errorMessage: String? = nil
    
    /// Indica si una operación está en progreso
    @Published var isLoading: Bool = false
    
    // MARK: - Private Properties
    
    private let auth = Auth.auth()
    private var authStateHandler: AuthStateDidChangeListenerHandle?
    
    // MARK: - Errors
    
    enum AuthError: LocalizedError {
        case notAuthenticated
        case invalidCredentials
        case userNotFound
        case emailAlreadyInUse
        case weakPassword
        case tooManyAttempts
        case networkError
        case unknownError
        
        var localizedDescription: String {
            switch self {
            case .notAuthenticated:
                "Debes iniciar sesión para continuar"
            case .invalidCredentials:
                "Email o contraseña incorrectos"
            case .userNotFound:
                "Usuario no encontrado"
            case .emailAlreadyInUse:
                "Este email ya está en uso"
            case .weakPassword:
                "La contraseña debe tener al menos 6 caracteres"
            case .tooManyAttempts:
                "Demasiados intentos. Intenta más tarde"
            case .networkError:
                "Error de conexión. Verifica tu internet"
            case .unknownError:
                "Error desconocido. Inténtalo de nuevo"
            }
        }
    }
    
    // MARK: - Initialization
    
    init() {
        setupAuthListener()
        checkAuthState()
    }
    
    // MARK: - Public Methods
    
    /// Inicia sesión con email y contraseña
    /// - Parameters:
    ///   - email: Dirección de correo electrónico del usuario
    ///   - password: Contraseña del usuario
    /// - Returns: Void (el resultado se notifica vía @Published properties)
    func signIn(email: String, password: String) async {
        isLoading = true
        errorMessage = nil
        
        do {
            try await auth.signIn(withEmail: email, password: password)
            errorMessage = nil
        } catch let error as AuthError.Code {
            errorMessage = mapAuthError(error)
        }
        
        isLoading = false
    }
    
    /// Cierra la sesión del usuario actual
    func signOut() async {
        isLoading = true
        errorMessage = nil
        
        do {
            try await auth.signOut()
            currentUser = nil
            isAuthenticated = false
            errorMessage = nil
        } catch {
            errorMessage = "Error al cerrar sesión"
        }
        
        isLoading = false
    }
    
    /// Obtiene el token JWT de Firebase para autenticar con la API de Repaart
    /// - Returns: Token JWT o lanza error
    func getIDToken() async throws -> String {
        guard let user = currentUser else {
            throw AuthError.notAuthenticated
        }
        
        do {
            return try await user.getIDToken()
        } catch {
            throw AuthError.networkError
        }
    }
    
    /// Registra un nuevo usuario con email y contraseña
    /// - Parameters:
    ///   - email: Dirección de correo electrónico del usuario
    ///   - password: Contraseña nueva del usuario
    /// - Returns: Void (el resultado se notifica vía @Published properties)
    func register(email: String, password: String) async {
        isLoading = true
        errorMessage = nil
        
        do {
            try await auth.createUser(withEmail: email, password: password)
            errorMessage = nil
        } catch let error as NSError {
            if let errorCode = AuthErrorCode.Code(rawValue: error.code) {
                switch errorCode {
                case .emailAlreadyInUse:
                    errorMessage = AuthError.emailAlreadyInUse.localizedDescription
                case .invalidEmail:
                    errorMessage = "Email inválido"
                case .weakPassword:
                    errorMessage = AuthError.weakPassword.localizedDescription
                default:
                    errorMessage = error.localizedDescription ?? AuthError.unknownError.localizedDescription
                }
            } else {
                errorMessage = AuthError.unknownError.localizedDescription
            }
        }
        
        isLoading = false
    }
    
    /// Restablece la contraseña del usuario
    /// - Parameters:
    ///   - email: Dirección de correo electrónico del usuario
    /// - Returns: Void (el resultado se notifica vía @Published properties)
    func resetPassword(email: String) async {
        isLoading = true
        errorMessage = nil
        
        do {
            try await auth.sendPasswordReset(withEmail: email)
            errorMessage = "Se ha enviado un correo para restablecer tu contraseña"
        } catch {
            errorMessage = "Error al enviar correo de recuperación"
        }
        
        isLoading = false
    }
    
    /// Verifica si el usuario actual tiene un rol específico
    /// - Parameters:
    ///   - role: Rol a verificar (ej: "admin", "franchise", "rider")
    /// - Returns: Bool indicando si el usuario tiene ese rol
    func hasRole(_ role: String) -> Bool {
        guard let user = currentUser else {
            return false
        }
        
        // Verificar si el usuario tiene el rol específico
        // Nota: En una implementación real, esto vendría de las claims del token
        // Por ahora, retornamos false
        return false
    }
    
    // MARK: - Private Methods
    
    private func setupAuthListener() {
        authStateHandler = auth.addStateDidChangeListener { [weak self] auth, user in
            DispatchQueue.main.async {
                self?.currentUser = user
                self?.isAuthenticated = user != nil
            }
        }
    }
    
    private func checkAuthState() {
        currentUser = auth.currentUser
        isAuthenticated = currentUser != nil
    }
    
    private func mapAuthError(_ error: AuthError.Code) -> String {
        switch error {
        case .invalidEmail:
            return "Email o contraseña incorrectos"
        case .wrongPassword:
            return "Email o contraseña incorrectos"
        case .userNotFound:
            return "Usuario no encontrado"
        case .userDisabled:
            return "Usuario deshabilitado"
        case .tooManyRequests:
            return "Demasiados intentos. Intenta más tarde"
        default:
            return "Error al iniciar sesión"
        }
    }
}
