import * as functions from 'firebase-functions/v1';
import * as nodemailer from 'nodemailer';

// Config check safe access
const gmailEmail = functions.config().gmail?.email;
const gmailPassword = functions.config().gmail?.password;

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: gmailEmail,
        pass: gmailPassword
    }
});

export const onIncidentCreated = functions.firestore.document('incidents/{incidentId}').onCreate(async (snap, context) => {
    const incidentData = snap.data();
    if (!incidentData) return;

    const mailOptions = {
        from: 'Repaart App <noreply@repaart.com>',
        to: 'admin@repaart.com', // Ideally configurable
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
        } else {
            console.log('⚠️ No hay credenciales de Gmail configuradas (functions.config().gmail). Email no enviado.');
        }
    } catch (error) {
        console.error('❌ Error enviando email de incidencia:', error);
    }
});
