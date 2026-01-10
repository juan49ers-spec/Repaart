import emailjs from '@emailjs/browser';

// CONFIGURATION
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_NEW_TICKET = import.meta.env.VITE_EMAILJS_TEMPLATE_NEW_TICKET;
const EMAILJS_TEMPLATE_REPLY = import.meta.env.VITE_EMAILJS_TEMPLATE_REPLY;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

export const initEmailSystem = (): void => {
    try {
        if (EMAILJS_PUBLIC_KEY) {
            emailjs.init(EMAILJS_PUBLIC_KEY);
        } else {
            console.warn("EmailJS Public Key not found in env vars");
        }
    } catch (error) {
        console.warn("Simluated email error (ignored):", error);
    }
};

/**
 * Sends an email to Admin (hola@repaart.es) when a new ticket is created.
 */
export const sendTicketCreatedEmail = async (ticket: any): Promise<boolean> => {
    // In a real scenario, you map these params to your EmailJS Template variables
    const templateParams = {
        to_email: 'hola@repaart.es',
        from_name: ticket.email, // Franchisee Name/Email
        subject: ticket.subject,
        message: ticket.message,
        urgency: ticket.urgency,
        ticket_id: ticket.id || 'N/A',
        ticket_link: `${window.location.origin}/admin?ticketId=${ticket.id}` // Link to admin panel
    };

    try {
        // NOTE: We only attempt to send if key is not the placeholder to avoid errors in dev
        if (EMAILJS_PUBLIC_KEY === 'YOUR_PUBLIC_KEY') {
            if (import.meta.env.DEV) {
                console.log("Mocking Email Send (Keys not set):", templateParams);
            }
            return true;
        }
        const response = await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_NEW_TICKET, templateParams);
        if (import.meta.env.DEV) {
            console.log("Email enviado con éxito!", response.status, response.text);
        }
        return true;
    } catch (error) {
        console.error("Failed to send email:", error);
        return false;
    }
};

/**
 * Sends an email to the Franchisee when Admin replies.
 */
export const sendTicketReplyEmail = async (toEmail: string, _subject: string, replyMessage: string, originalMessage: string, ticketId: string): Promise<boolean> => {
    const templateParams = {
        to_email: toEmail,
        reply_message: replyMessage,
        original_message: originalMessage,
        ticket_id: ticketId,
        ticket_link: `${window.location.origin}/support?ticketId=${ticketId}` // Link to user portal
    };

    try {
        if (EMAILJS_PUBLIC_KEY === 'YOUR_PUBLIC_KEY') {
            if (import.meta.env.DEV) {
                console.log("Mocking Reply Send (Keys not set):", templateParams);
            }
            return true;
        }
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_REPLY, templateParams);
        return true;
    } catch (error) {
        console.error("Failed to send reply:", error);
        return false;
    }
};
