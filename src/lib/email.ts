import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Sends an email to Admin (hola@repaart.es) when a new ticket is created.
 * Uses Firebase Extension: Trigger Email from Firestore
 */
export const sendTicketCreatedEmail = async (ticket: any): Promise<boolean> => {
    try {
        await addDoc(collection(db, 'mail'), {
            to: ['hola@repaart.es'],
            message: {
                subject: ticket.subject,
                html: `
                    <h2>Nuevo Ticket de Soporte</h2>
                    <p><strong>De:</strong> ${ticket.email}</p>
                    <p><strong>Asunto:</strong> ${ticket.subject}</p>
                    <p><strong>Urgencia:</strong> ${ticket.urgency}</p>
                    <p><strong>Mensaje:</strong></p>
                    <p>${ticket.message}</p>
                    <br/>
                    <p><a href="${window.location.origin}/admin?ticketId=${ticket.id || ''}">Gestionar Ticket en Panel Admin</a></p>
                `
            }
        });
        return true;
    } catch (error) {
        console.error("Failed to queue email in 'mail' collection:", error);
        return false;
    }
};

/**
 * Sends an email to the Franchisee when Admin replies.
 * Uses Firebase Extension: Trigger Email from Firestore
 */
export const sendTicketReplyEmail = async (toEmail: string, subject: string, replyMessage: string, originalMessage: string, ticketId: string): Promise<boolean> => {
    try {
        await addDoc(collection(db, 'mail'), {
            to: [toEmail],
            message: {
                subject: `Respuesta a Ticket: ${subject}`,
                html: `
                    <h2>Respuesta de Soporte Repaart</h2>
                    <p>${replyMessage}</p>
                    <hr/>
                    <p><strong>Tu mensaje original:</strong></p>
                    <blockquote style="background: #f9f9f9; padding: 10px; border-left: 4px solid #ccc;">
                        ${originalMessage}
                    </blockquote>
                    <br/>
                    <p><a href="${window.location.origin}/support?ticketId=${ticketId}">Ver conversación completa</a></p>
                `
            }
        });
        return true;
    } catch (error) {
        console.error("Failed to queue reply in 'mail' collection:", error);
        return false;
    }
};

export const initEmailSystem = (): void => {
    // No initialization needed for Firestore Trigger
    console.log("Email System initialized (Firestore Trigger mode)");
};
