import SwiftUI

/// App entry point para la app Repaart Rider
/// Configura el entorno de navegación y provee el punto de entrada principal
@main
struct RepaartRiderApp: App {
    
    @State private var isAuthenticated = false
    @State private var isLoading = true
    
    var body: some Scene {
        AuthView()
    }
    
    var body: some Scene {
        if !isAuthenticated {
            AuthView()
        } else {
            RiderScheduleView()
        }
    }
}

// MARK: - App Lifecycle

extension RepaartRiderApp {
    func scene(_ scene: Scene, willConnectToSession session: UIScene.ConnectionOptions) {
        isLoading = false
    }
}
