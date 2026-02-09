"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.onIncidentCreated = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const nodemailer = __importStar(require("nodemailer"));
const gmailEmail = process.env.GMAIL_EMAIL;
const gmailPassword = process.env.GMAIL_PASSWORD;
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: gmailEmail,
        pass: gmailPassword
    }
});
exports.onIncidentCreated = functions.firestore.document('incidents/{incidentId}').onCreate(async (snap, context) => {
    const incidentData = snap.data();
    if (!incidentData)
        return;
    const mailOptions = {
        from: 'Repaart App <noreply@repaart.com>',
        to: 'admin@repaart.com',
        subject: `🚨 Nueva Incidencia: ${incidentData.type || 'General'}`,
        html: `
            <h1>Nueva Incidencia Registrada</h1>
            <p><strong>Rider:</strong> ${incidentData.riderName || incidentData.riderId || 'Desconocido'}</p>
            <p><strong>Tipo:</strong> ${incidentData.type}</p>
            <p><strong>Descripción:</strong> ${incidentData.description || 'Sin descripción'}</p>
            <p><strong>Gravedad:</strong> ${incidentData.severity || 'Normal'}</p>
            <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
        `
    };
    try {
        if (gmailEmail && gmailPassword) {
            await transporter.sendMail(mailOptions);
            console.log('📧 Email de incidencia enviado.');
        }
        else {
            console.log('⚠️ No hay credenciales de Gmail configuradas. Email no enviado.');
        }
    }
    catch (error) {
        console.error('❌ Error enviando email de incidencia:', error);
    }
});
//# sourceMappingURL=onIncident.js.map