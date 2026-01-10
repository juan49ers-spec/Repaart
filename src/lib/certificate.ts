// import { jsPDF } from "jspdf";
// Dynamic imports assumed managed or installed.
// Assuming jspdf is installed.

interface UserData {
    name?: string;
    email: string;
    uid: string;
}

/**
 * Generates a STRICTLY FORMAL technical certificate/report.
 * Focuses on date, time, and central validation text.
 * 
 * @param {object} user - User object { name, email, uid }
 * @param {string} courseName - Name of the course
 * @param {number} averageScore - Optional score
 */
export const generateCertificate = async (user: UserData, courseName: string = "Gestión Operativa Integral", averageScore: number | null = null): Promise<void> => {
    // Dynamic import for client-side performance if needed, or static if preferred.
    // Given previous pattern, let's use dynamic import to be safe with large libs
    const { jsPDF } = await import("jspdf");

    // Portrait A4 for a "Document/Report" feel, not a "Diploma"
    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
    });

    const completionDate = new Date();
    // Verification ID
    const verificationId = `REP-OPS-${completionDate.getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}-${user.uid.slice(0, 4).toUpperCase()}`;

    // --- HEADER ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("REPAART SOLUTIONS & LOGISTICS S.L.", 20, 20);
    doc.text("DEPARTAMENTO DE FORMACIÓN Y CALIDAD", 20, 25);

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(20, 30, 190, 30);

    // --- TITLE ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text("CERTIFICADO TÉCNICO DE CONFORMIDAD", 105, 50, { align: "center" });
    doc.setFontSize(11);
    doc.text("REFERENCIA: FORMACIÓN OBLIGATORIA DE FRANQUICIA", 105, 57, { align: "center" });

    // --- BODY ---
    const startY = 80;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    // 1. IDENTIFICATION
    doc.setFont("helvetica", "bold");
    doc.text("1. IDENTIFICACIÓN DEL TITULAR", 20, startY);
    doc.setFont("helvetica", "normal");
    doc.text(`Nombre / Razón Social: ${user.name || user.email}`, 25, startY + 8);
    doc.text(`Identificador de Sistema (UID): ${user.uid}`, 25, startY + 14);
    doc.text(`Email Vinculado: ${user.email}`, 25, startY + 20);

    // 2. CERTIFICATION STATEMENT
    doc.setFont("helvetica", "bold");
    doc.text("2. DECLARACIÓN DE LA CENTRAL FRANQUICIADORA", 20, startY + 35);
    doc.setFont("helvetica", "normal");

    const textLines = doc.splitTextToSize(
        "Por medio del presente documento, la Dirección de Operaciones de REPAART certifica que el titular arriba indicado ha completado CORRECTAMENTE y ha superado satisfactoriamente todos los módulos teóricos y prácticos correspondientes al programa de capacitación interna.",
        170
    );
    doc.text(textLines, 25, startY + 43);

    const textLines2 = doc.splitTextToSize(
        "Este certificado acredita que el franquiciado dispone de los conocimientos necesarios para operar bajo los estándares de calidad exigidos por la marca.",
        170
    );
    doc.text(textLines2, 25, startY + 60);

    // 3. COURSE DETAILS
    doc.setFont("helvetica", "bold");
    doc.text("3. DETALLES DE LA ACCIÓN FORMATIVA", 20, startY + 80);
    doc.setFont("helvetica", "normal");
    doc.text(`Programa: ${courseName}`, 25, startY + 88);
    doc.text(`Estado: FINALIZADO CORRECTAMENTE`, 25, startY + 94);
    if (averageScore) {
        doc.text(`Evaluación Promedio: ${averageScore}% (APTO)`, 25, startY + 100);
    }
    doc.text(`Progreso Registrado: 100%`, 25, startY + 106);

    // 4. TIMESTAMP & VALIDATION
    doc.setFont("helvetica", "bold");
    doc.text("4. SELLO DE TIEMPO Y VALIDEZ", 20, startY + 120);
    doc.setFont("helvetica", "normal");

    // Precise Date and Time
    const dateStr = completionDate.toLocaleDateString("es-ES", { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = completionDate.toLocaleTimeString("es-ES", { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

    doc.text(`Fecha de Emisión: ${dateStr}`, 25, startY + 128);
    doc.text(`Hora de Emisión: ${timeStr}`, 25, startY + 134);
    doc.text(`Código Único de Verificación (CSV): ${verificationId}`, 25, startY + 140);

    // --- SIGNATURE BLOCK ---
    doc.setFontSize(10);
    doc.text("Conforme,", 20, 230);

    doc.line(20, 250, 80, 250); // Line
    doc.setFont("helvetica", "bold");
    doc.text("DIRECCIÓN DE OPERACIONES", 20, 255);
    doc.setFont("helvetica", "normal");
    doc.text("REPAART Central", 20, 260);

    // Stamp circle simulation
    doc.setDrawColor(30, 58, 138); // Blue
    doc.setLineWidth(0.7);
    doc.circle(50, 245, 15);
    doc.setFontSize(8);
    doc.setTextColor(30, 58, 138);
    doc.text("VALIDADO", 50, 245, { align: "center", angle: 25 });

    // --- FOOTER ---
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("Este documento electrónico tiene validez oficial interna para la red de franquicias Repaart.", 105, 285, { align: "center" });

    // --- SAVE ---
    doc.save(`Certificado_Oficial_${user.uid}_${dateStr.replace(/\//g, '-')}.pdf`);
};
