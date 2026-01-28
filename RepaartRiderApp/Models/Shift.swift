import Foundation

/// Shift data model para la app Repaart Rider
/// Contiene información sobre turnos de trabajo programados
struct Shift: Identifiable, Codable {
    let id: String
    let shiftId: String
    let franchiseId: String
    let riderId: String?
    let riderName: String
    let motoId: String?
    let motoPlate: String
    let startAt: String // ISO 8601
    let endAt: String   // ISO 8601
    let date: String    // YYYY-MM-DD
    let status: ShiftStatus
    let isConfirmed: Bool
    let swapRequested: Bool
    let let changeRequested: Bool
    let changeReason: String?
    let isDraft: Bool
}

/// Estado del turno según el ciclo de trabajo
enum ShiftStatus: String, Codable {
    case scheduled     // Programado
    case active        // En curso (clocked in)
    case completed     // Completado
}

/// Extensiones para formateo de fechas
extension Shift {
    /// Obtiene la hora de inicio en formato HH:mm
    var startTimeFormatted: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm"
        formatter.locale = Locale(identifier: "es_ES")
        return formatter.string(from: ISO8601Formatter.date(from: startAt) ?? Date())
    }
    
    /// Obtiene la hora de fin en formato HH:mm
    var endTimeFormatted: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm"
        formatter.locale = Locale(identifier: "es_ES")
        return formatter.string(from: ISO8601Formatter.date(from: endAt) ?? Date())
    }
    
    /// Obtiene la fecha en formato dd/MM/yyyy
    var dateFormatted: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "dd/MM/yyyy"
        formatter.locale = Locale(identifier: "es_ES")
        return formatter.string(from: ISO8601Formatter.date(from: date) ?? Date())
    }
}
