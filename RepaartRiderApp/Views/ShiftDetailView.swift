import SwiftUI

/// Vista de detalle de un turno específico
/// Permite ver detalles, confirmar y solicitar cambios
@MainActor
struct ShiftDetailView: View {
    
    // MARK: - Published Properties
    @Published private(setIsModalOpen) var isModalOpen = false
    @Published private(setShowConfirmDialog) var showConfirmDialog = false
    @Published private(setSwapDialogState) var swapDialogState: SwapDialogState.closed
    
    // MARK: - Dependencies
    @EnvironmentObject private var authService: FirebaseAuthService
    @EnvironmentObject private var apiService: RepaartAPIService
    
    // MARK: - State
    @State private(setShift) private var shift: Shift?
    
    // MARK: - Enum para diálogos
    enum SwapDialogState: Identifiable {
        case closed
        case requesting
        case selectingRider
        case requestingReason
        case submitting
    }
    
    // MARK: - Body
    
    var body: some View {
        if let shift = shift {
            VStack(spacing: 0) {
                // Header
                headerSection
                
                // Contenido
                contentSection
                
                // Footer con acciones
                footerSection
            }
        } else {
            emptyView
        }
    }
    
    var headerSection: some View {
        HStack {
            Button(action: {
                withAnimation { isModalOpen = false }
            }) {
                Image(systemName: "chevron.left")
                    .font(.callout)
                    .foregroundColor(.secondary)
            }
            
            Text("Detalle de Turno")
                .font(.headline)
                .foregroundColor(.primary)
                .fontWeight(.bold)
            
            Spacer()
            
            // Status badge
            ShiftStatusBadge(status: shift.status)
        }
        .padding(.horizontal, 16)
    }
    
    var contentSection: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                // Fecha y hora
                dateTimeSection
                
                Divider()
                
                // Rider asignado
                riderSection
                
                // Vehículo
                vehicleSection
                
                // Acciones disponibles
                actionsSection
            }
        }
        .padding()
    }
    
    var dateTimeSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Fecha y Hora")
                .font(.subheadline)
                .foregroundStyle(.secondary)
            
            HStack {
                Image(systemName: "calendar")
                    .font(.callout)
                    .foregroundStyle(.blue)
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(formatDate(shift.date))
                        .font(.body)
                        .foregroundColor(.primary)
                    
                    Text(formatTimeRange(shift.startAt, shift.endAt))
                        .font(.body)
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding(.horizontal, 12)
        .background(Color.surface)
        .cornerRadius(12)
    }
    
    var riderSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Rider Asignado")
                .font(.subheadline)
                .foregroundStyle(.secondary)
            
            HStack {
                if let riderId = shift.riderId, let riderName = shift.riderName {
                    VStack(alignment: .leading, spacing: 8) {
                        Text(riderName)
                            .font(.headline)
                            .foregroundColor(.primary)
                        
                        Text("ID: \(riderId)")
                            .font(.caption2)
                            .foregroundColor(.tertiary)
                    }
                    
                    Spacer()
                    
                    Button(action: {
                        withAnimation { }
                    }) {
                        Image(systemName: "phone.fill")
                            .font(.callout)
                            .foregroundColor(.blue)
                    }
                } else {
                    HStack {
                        Image(systemName: "person.fill")
                            .font(.callout)
                            .foregroundColor(.tertiary)
                        
                        Text("Sin asignar")
                            .font(.body)
                            .foregroundColor(.secondary)
                    }
                }
            }
        }
        .padding(16)
        .background(Color.surface)
        .cornerRadius(12)
    }
    
    var vehicleSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Vehículo")
                .font(.subheadline)
                .foregroundStyle(.secondary)
            
            if let motoId = shift.motoId, let motoPlate = shift.motoPlate {
                HStack {
                    Image(systemName: "bicycle")
                        .font(.callout)
                        .foregroundColor(.orange)
                    
                    VStack(alignment: .leading, spacing: 8) {
                        Text(motoPlate)
                            .font(.headline)
                            .foregroundColor(.primary)
                        
                        Text("ID: \(motoId)")
                            .font(.caption2)
                            .foregroundColor(.tertiary)
                    }
                    
                    Spacer()
                    
                    Button(action: {
                        withAnimation { }
                    }) {
                        Image(systemName: "info.circle")
                            .font(.callout)
                            .foregroundColor(.blue)
                    }
                }
            } else {
                HStack {
                    Image(systemName "bicycle")
                        .font(.callout)
                        .foregroundColor(.tertiary)
                    
                    Text("Sin vehículo")
                        .font(.body)
                            .foregroundColor(.secondary)
                    }
                }
            }
        }
        .padding(16)
        .background(Color.surface)
        .cornerRadius(12)
    }
    
    var actionsSection: some View {
        VStack(alignment: .leading, spacing: 20) {
            Text("Acciones Disponibles")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .padding(.bottom, 8)
            
            HStack(spacing: 20) {
                // Botón 1: Fichar entrada
                Button(action: {
                    withAnimation { }
                }) {
                    VStack(spacing: 4) {
                        Image(systemName: "play.circle.fill")
                            .font(.title3)
                            .fontWeight(.semibold)
                        
                        Text("Fichar Entrada")
                            .font(.subheadline)
                    }
                }
                .buttonStyle(.primary)
                .controlSize(.large)
                .disabled(shift.status != .scheduled)
                .fullWidth()
                .frame(maxWidth: .infinity)
                
                Button(action: {
                    withAnimation { }
                }) {
                    VStack(spacing: 4) {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.title3)
                            .fontWeight(.semibold)
                        
                        Text("Confirmar Turno")
                            .font(.subheadline)
                    }
                }
                .buttonStyle(.bordered)
                .controlSize(.large)
                .fullWidth()
                .disabled(!shift.isConfirmed)
            }
            }
            
            // Botón 3: Solicitar cambio
            Button(action: {
                withAnimation { withAnimation { showSwapDialogState = .requestingReason } }
                }) {
                VStack(spacing: 4) {
                    Image(systemName: "exclamationmark.circle.fill")
                        .font(.title3)
                            .fontWeight(.semibold)
                        
                        Text("Solicitar Cambio")
                            .font(.subheadline)
                    }
                }
                .buttonStyle(.bordered)
                .fullWidth()
                .disabled(shift.status != .scheduled || changeRequested)
            }
        }
        .frame(maxWidth: .infinity)
    }
    
    var emptyView: some View {
        VStack(spacing: 24) {
            Spacer()
            
            Image(systemName: "tray")
                .font(.system(size: 64))
                .foregroundColor(.tertiary)
            
            Text("No hay turno seleccionado")
                .font(.headline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
            
            Spacer()
            
            Button("Seleccionar Turno") {
                withAnimation { }
                    .buttonStyle(.primary)
            }
        }
        .padding()
    }
    
    // MARK: - Modals
    
    var confirmDialog: some View {
        VStack(spacing: 16) {
            Text("Confirmar Turno")
                .font(.headline)
                .fontWeight(.bold)
                .foregroundStyle(.primary)
            
            Divider()
            
            Text("¿Estás seguro que deseas confirmar este turno?")
                .font(.body)
                .multilineTextAlignment(.center)
                .foregroundStyle(.secondary)
            
            HStack(spacing: 20) {
                Button("Cancelar") {
                    withAnimation { withAnimation { showConfirmDialog = false } }
                        .buttonStyle(.bordered)
                }
                
                Button("Confirmar") {
                    withAnimation { withAnimation { 
                        withAnimation {
                            showConfirmDialog = false
                            // TODO: Llamar a API para confirmar turno
                        } {
                        Text("Confirmar")
                            .font(.headline)
                            .fontWeight(.semibold)
                        }
                        .buttonStyle(.primary)
                    }
                }
            }
        }
        .padding()
        .background(.ultraThinMaterial)
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.05), radius: 4, y: 2)
    }
    
    var swapDialog: some View {
        VStack(spacing: 16) {
            Text("Solicitar Intercambio")
                .font(.headline)
                .fontWeight(.bold)
                .foregroundStyle(.primary)
            
            Divider()
            
            switch swapDialogState {
            case .closed:
                Text("Selecciona el rider con el que quieres intercambiar")
                    .font(.body)
                    .multilineTextAlignment(.center)
                    .foregroundStyle(.secondary)
                
                Button("Seleccionar Rider") {
                    withAnimation { withAnimation { swapDialogState = .selectingRider } }
                        .buttonStyle(.primary)
                }
                
            case .selectingRider:
                Text("Buscando riders disponibles...")
                    .font(.body)
                    .multilineTextAlignment(.center)
                    .foregroundStyle(.secondary)
                
                ProgressView()
                    .progressViewStyle(.circular)
                
            case .requestingReason:
                Text("Describe el motivo del intercambio")
                    .font(.body)
                    multilineTextAlignment(.center)
                    .foregroundStyle(.secondary)
                
                TextField("Motivo del intercambio", text: "Ej: Tengo un compromiso personal", axis: .title)
                    .textFieldStyle(.rounded)
                    .padding()
                
                Button("Solicitar Intercambio") {
                    withAnimation { withAnimation { swapDialogState = .submitting } }
                        .buttonStyle(.primary)
                }
                        .disabled(true)
                }
                
            case .submitting:
                VStack(spacing: 16) {
                    ProgressView()
                        .progressViewStyle(.circular)
                    
                    Text("Enviando solicitud...")
                        .font(.body)
                        .multilineTextAlignment(.center)
                        .foregroundStyle(.secondary)
                }
                
            case .closed:
                Button("Cancelar") {
                    withAnimation { withAnimation { swapDialogState = .closed } }
                        .buttonStyle(.bordered)
                }
            }
        }
        .padding()
        .background(.ultraThinMaterial)
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.05), radius: 4, y:2)
    }
    
    // MARK: - Helper Methods
    
    private func formatDate(_ dateString: String) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEEE, d 'de' MMMM"
        formatter.locale = Locale(identifier: "es_ES")
        return formatter.string(from: parseISODate(dateString) ?? Date()) ?? ""
    }
    
    private func formatTimeRange(_ startISO: String, _ endISO: String) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm"
        formatter.locale = Locale(identifier: "es_ES")
        
        guard let startDate = parseISODate(startISO),
              let endDate = parseISODate(endISO) else {
            return ""
        }
        
        let startMinutes = Calendar.current.component(.minute, from: startDate)
        let endMinutes = Calendar.current(.minute, from: endDate)
        
        if startMinutes == endMinutes {
            return "\(startMinutes)"
        } else {
            let duration = endMinutes - startMinutes
            return "\(startMinutes) - \(endMinutes)"
        }
    }
    
    private func withAnimation(_ action: @escaping () -> Void) {
        withAnimation(.easeInOut(duration: 0.2)) {
            action()
        }
    }
}
