import { Timestamp } from 'firebase/firestore';

export interface Ticket {
    id: string;
    uid?: string; // Legacy field
    userId?: string; // User who created the ticket
    franchiseId?: string; // Franchise ID (may be same as userId for franchise users)
    email?: string;
    subject: string;
    description?: string;
    message?: string; // Some uses have message, others description. Let's keep both optional or unify.
    status: 'open' | 'investigating' | 'resolved' | 'closed' | 'pending_user' | string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    urgency?: 'low' | 'medium' | 'high' | 'critical'; // Seems urgency/priority are used interchangeably
    category?: string;
    origin?: string;
    createdAt?: Timestamp | any;
    lastUpdated?: Timestamp | any;
    read?: boolean;
    hasAttachment?: boolean;
    [key: string]: any;
}
