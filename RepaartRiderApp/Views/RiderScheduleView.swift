import SwiftUI
import FirebaseAuthService

/// Vista principal de agenda para el rider
/// Muestra los turnos de la semana actual con navegación por pestañas
/// Solo lectura de la web API de Repaart
@MainActor
struct RiderScheduleView: View {
    
    // MARK: - Published Properties
    
    /// Estado de carga
    @Published private(setIsLoading) var isLoading: Bool = false
    @Published private(setErrorMessage) var errorMessage: String?
    
    /// Datos de turnos
    @Published private(setShifts) var shifts: [Shift] = []
    
    /// Fecha seleccionada para navegación
    @Published private(setSelectedDate) var selectedDate: Date = Date()
    
    /// Modo de visualización (diario/semana)
    @Published private(setViewMode) var viewMode: ViewMode = .week
    
    // Navegación por pestañas
    enum ViewMode: String, Identifiable {
        case week = "week"
        case day = "day"
    }
    
    // MARK: - Dependencies
    
    @EnvironmentObject private var auth: FirebaseAuthService
    @State private var currentDate = Date()
    
    // MARK: - Computed Properties
    
    private var authService: FirebaseAuthService {
        get { auth }
    }
    
    private var shiftsByDate: [String: [Shift]] {
        didSet {
            updateShiftsByDate()
        }
    }
    
    private var daysInWeek: [Date] {
        didSet {
            updateDaysInWeek()
        }
    }
    
    private var isToday: Bool {
        Calendar.current.isDateInWeek(today, weekOfYear: currentWeekOfYear, year: currentDate.year))
    }
    
    // MARK: - Body
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Header con selector de modo y navegación de semana
                headerSection
                
                if isLoading {
                    loadingView
                } else if let error = errorMessage {
                    errorView(message: error)
                } else {
                    contentSection
                }
            }
            .navigationTitle("Mi Agenda")
        }
    }
    
    // MARK: - Header Section
    
    private var headerSection: some View {
        HStack {
            Spacer()
            
            // Selector de modo (diario/semana)
            Picker("", selection: $viewMode) {
                ForEach([ViewMode.week, ViewMode.day], id: \.self) { mode in
                    Text(mode == .week ? "Semana" : "Día")
                        .tag(mode)
                        .font(.callout)
                }
            }
            .tint(.brandPrimary)
            
            Spacer()
            
            // Navegación de semana
            HStack(spacing: 12) {
                Button(action: { navigateWeek(-1) }) {
                    Image(systemName: "chevron.left")
                }
                .disabled(!canNavigateWeek(-1))
                
                Text(getWeekRangeString())
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                
                Button(action: { navigateWeek(1) }) {
                    Text("Hoy")
                }
                .disabled(viewMode == .day || isToday)
                
                Button(action: { navigateWeek(7) }) {
                    Image(systemName: "chevron.right")
                }
                .disabled(!canNavigateWeek(7))
                
                Text(getWeekRangeString())
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            .padding(.horizontal, 8)
            .tint(.brandPrimary)
        }
        .font(.headline)
        .fontWeight(.bold)
        .foregroundColor(.primary)
        .padding()
    }
    
    // MARK: - Content Section
    
    private var contentSection: some View {
        switch viewMode {
        case .week:
            weekView
        case .day:
            dayView
        }
    }
    
    // MARK: - Week View
    
    private var weekView: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                ForEach(shiftsByDate.keys.sorted(), id: \.self) { dateKey in
                    DayView(dateString: dateKey, shifts: shiftsByDate[dateKey] ?? [])
                }
            }
        }
        .padding()
    }
    
    // MARK: - Day View
    
    private var dayView: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                if shifts.isEmpty {
                    emptyView
                } else {
                    ForEach(shifts, id: \.shift.id) { shift in
                        ShiftCard(shift: shift)
                    }
                }
            }
        }
        .padding()
    }
    
    // MARK: - Sub-Components
    
    private func DayView(dateString: String, shifts: [Shift]) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            // Fecha
            HStack {
                Text(formatDateString(dateString))
                    .font(.headline)
                    .foregroundColor(.primary)
                Spacer()
                
                Text("•")
                    .foregroundColor(.secondary)
            }
            .padding(.bottom, 8)
            
            // Turnos del día
            VStack(alignment: .leading, spacing: 8) {
                ForEach(shifts, id: \.shift.id) { shift in
                    ShiftCard(shift: shift)
                }
            }
        }
        }
    
    // MARK: - Shift Card
    
    private func ShiftCard(shift: Shift) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            // Header
            HStack {
                Text(formatTime(shift.startAt))
                    .font(.subheadline)
                    .foregroundColor(.primary)
                Spacer()
                
                Text("•")
                    .foregroundColor(.secondary)
                
                // Status badge
                ShiftStatusBadge(status: shift.status)
            }
            
            // Rider info
            HStack(spacing: 8) {
                Image(systemName: "person.fill")
                    .font(.callout)
                    .foregroundColor(.blue)
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(shift.riderName)
                        .font(.body)
                        .foregroundColor(.primary)
                    
                    Text("ID: \(shift.riderId ?? "Sin asignar")")
                        .font(.caption1)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                // Vehicle info
                HStack(spacing: 8) {
                    Image(systemName: "bicycle")
                        .font(.callout)
                        .foregroundColor(.orange)
                    
                    VStack(alignment: .leading, spacing: 4) {
                        Text(shift.motoPlate)
                            .font(.body)
                            .foregroundColor(.primary)
                        
                        if shift.motoPlate != "" {
                            Text("ID: \(shift.motoPlate)")
                                .font(.caption1)
                                .foregroundColor(.secondary)
                        }
                    }
                }
            }
            .padding(12)
            .background(Color.surface)
            .cornerRadius(12)
            .shadow(color: .black.opacity(0.05), radius: 4, y: 2)
        }
    }
    
    // MARK: - Status Badge
    
    private func ShiftStatusBadge(status: ShiftStatus) -> some View {
        Text(status.displayName)
            .font(.caption2)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(backgroundColor(for: status))
            .foregroundColor(foregroundColor(for: status))
            .cornerRadius(12)
    }
    
    // MARK: - Empty View
    
    private var emptyView: some View {
        VStack(spacing: 24) {
            Image(systemName: "calendar.badge.clock")
                .font(.system(size: 64))
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
            
            Text("No tienes turnos programados para esta fecha")
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
            Text("Cargando turnos...")
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
                    // Re-cargar turnos
                    await fetchShifts()
                }
            }
            .buttonStyle(.bordered)
        }
        .padding()
    }
    
    // MARK: - Helper Methods
    
    private func formatDateString(_ dateString: String) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEEE, d 'de' MMMM"
        formatter.locale = Locale(identifier: "es_ES")
        return formatter.string(from: parseISODate(dateString) ?? Date())
    }
    
    private func formatTime(_ isoString: String) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm"
        formatter.locale = Locale(identifier: "es_ES")
        return formatter.string(from: parseISODate(isoString) ?? Date())
    }
    
    private func formatTimeRange() -> String {
        switch viewMode {
        case .week:
            return "Esta semana"
        case .day:
            return formatDateString(ISO8601Formatter.string(from: selectedDate))
        }
    }
    
    private func canNavigateWeek(_ offset: Int) -> Bool {
        guard let firstDate = daysInWeek.first,
              let lastDate = daysInWeek.last else {
            return false
        }
        
        let targetDate = Calendar.current.date(byAdding: .day, value: offset, to: currentDate)
        return targetDate >= firstDate && targetDate <= lastDate
    }
    
    private func navigateWeek(_ offset: Int) {
        guard let targetDate = Calendar.current.date(byAdding: .day, value: offset, to: currentDate) else {
            return
        }
        
        withAnimation {
            selectedDate = targetDate
        }
    }
    
    // MARK: - Shift Status Badge Helpers
    
    private func backgroundColor(for status: ShiftStatus) -> Color {
        switch status {
        case .scheduled:
            return Color.blue.opacity(0.1)
        case .active:
            return Color.green.opacity(0.1)
        case .completed:
            return Color.gray.opacity(0.1)
        }
    }
    
    private func foregroundColor(for status: ShiftStatus) -> Color {
        switch status {
        case .scheduled:
            return .brandPrimary
        case .active:
            return .success
        case .completed:
            return .textPrimary
        }
    }
    
    // MARK: - Data Fetching
    
    private func fetchShifts() async {
        isLoading = true
        errorMessage = nil
        
        do {
            // TODO: Implementar llamada a API de Repaart
            // Ejemplo: await apiService.fetchShifts(startDate, endDate)
            
            // Simulación de datos por ahora
            try await Task.sleep(nanoseconds: 1_500_000_000)) // 1.5s de delay
            
            // Datos simulados de la web
            // En implementación real, llamarías a la API:
            // let apiService = RepaartAPIService()
            // shifts = try await apiService.fetchShifts(startDate: endDate)
            
            // Generar turnos de prueba
            let dateFormatter = DateFormatter()
            dateFormatter.dateFormat = "yyyy-MM-dd"
            let today = Date()
            
            for i in 0..<7 {
                let date = Calendar.current.date(byAdding: .day, value: i, to: today)
                let dateString = dateFormatter.string(from: date)
                
                let sampleShifts = [
                    Shift(
                        id: "shift_\(i)_1",
                        shiftId: "shift_\(i)_1",
                        franchiseId: "demo_franchise",
                        riderId: "rider_\(i)",
                        riderName: i == 0 ? "Juan Pérez" : "María García",
                        motoId: i == 0 ? "moto_\(i)" : "moto_\(i)",
                        motoPlate: "ABC\(i)23",
                        startAt: ISO8601Formatter.string(from: date) + "T09:00:00"),
                        endAt: ISO8601Formatter.string(from: date) + "T17:00:00"),
                        date: dateString,
                        status: i == 0 ? "scheduled" : (i == 1 ? "completed" : "completed"),
                        isConfirmed: true,
                        swapRequested: false,
                        changeRequested: false,
                        isDraft: false
                    ),
                    Shift(
                        id: "shift_\(i)_2",
                        shiftId: "shift_\(i)_2",
                        franchiseId: "demo_franchise",
                        riderId: "rider_\(i)",
                        riderName: i == 0 ? "Carlos López" : "Ana Martínez",
                        motoId: i == 0 ? "moto_\(i)" : "moto_\(i)",
                        motoPlate: "DEF\(i)23",
                        startAt: ISO8601Formatter.string(from: date) + "T10:00:00"),
                        endAt: ISO8601Formatter.string(from: date) + "T18:00:00"),
                        date: dateString,
                        status: "scheduled",
                        isConfirmed: true,
                        swapRequested: false,
                        changeRequested: false,
                        isDraft: false
                    )
                ]
                
                shifts.append(contentsOf: sampleShifts)
            }
            
            isLoading = false
        } catch {
            errorMessage = "Error al cargar turnos. Por favor intenta de nuevo."
            isLoading = false
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
    
    var displayName: String {
        switch self {
        case .scheduled:
            return "Programado"
        case .active:
            return "En curso"
        case .completed:
            return "Completado"
        }
    }
}
