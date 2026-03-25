/**
 * Customer Wallet Service
 *
 * Gestiona saldos a favor de clientes que surgen cuando:
 * - Se rectifica (abona) una factura ya pagada
 * - Un cliente sobre-paga una factura
 *
 * El wallet refleja crédito positivo, elimina "deudas negativas" del dashboard
 * y permite aplicar el saldo automáticamente a futuras facturas.
 */

import { db } from '../../lib/firebase';
import {
    collection,
    doc,
    getDoc,
    runTransaction,
    serverTimestamp,
    query,
    where,
    getDocs
} from 'firebase/firestore';
import type { Timestamp } from 'firebase/firestore';
import { Result, ok, err } from '../../types/result';

// -- Types --

export interface CustomerWalletEntry {
    id: string;
    franchiseId: string;
    customerId: string;
    customerName: string;

    /** Saldo a favor acumulado (siempre >= 0) */
    creditBalance: number;

    /** Historial de movimientos que modificaron el saldo */
    movements: WalletMovement[];

    createdAt: Date | Timestamp;
    updatedAt: Date | Timestamp;
}

export interface WalletMovement {
    type: 'CREDIT' | 'DEBIT';
    amount: number;
    description: string;
    invoiceId?: string;
    createdAt: Date | Timestamp;
    createdBy: string;
}

type WalletError =
    | { type: 'WALLET_NOT_FOUND'; customerId: string }
    | { type: 'INSUFFICIENT_CREDIT'; available: number; requested: number }
    | { type: 'UNKNOWN_ERROR'; message: string; cause?: unknown };

const WALLETS_COLLECTION = 'customer_wallets';

/**
 * Genera un ID determinista para el wallet de un cliente en una franquicia.
 * Evita duplicados y simplifica queries.
 */
function walletDocId(franchiseId: string, customerId: string): string {
    return `${franchiseId}_${customerId}`;
}

export const customerWallet = {
    /**
     * Añade crédito al wallet de un cliente (ej: abono de factura rectificativa pagada).
     */
    addCredit: async (
        franchiseId: string,
        customerId: string,
        customerName: string,
        amount: number,
        description: string,
        invoiceId: string | undefined,
        createdBy: string
    ): Promise<Result<CustomerWalletEntry, WalletError>> => {
        try {
            if (amount <= 0) {
                return err({ type: 'UNKNOWN_ERROR', message: 'Credit amount must be positive' });
            }

            const docId = walletDocId(franchiseId, customerId);
            const walletRef = doc(db, WALLETS_COLLECTION, docId);

            const movement: WalletMovement = {
                type: 'CREDIT',
                amount,
                description,
                invoiceId,
                createdAt: new Date(),
                createdBy
            };

            const result = await runTransaction(db, async (transaction) => {
                const walletSnap = await transaction.get(walletRef);

                if (walletSnap.exists()) {
                    const existing = walletSnap.data() as CustomerWalletEntry;
                    const newBalance = existing.creditBalance + amount;
                    const updatedMovements = [...(existing.movements || []), movement];

                    transaction.update(walletRef, {
                        creditBalance: newBalance,
                        movements: updatedMovements,
                        updatedAt: serverTimestamp()
                    });

                    return {
                        ...existing,
                        creditBalance: newBalance,
                        movements: updatedMovements
                    } as CustomerWalletEntry;
                } else {
                    const newWallet: Omit<CustomerWalletEntry, 'id'> & { id: string } = {
                        id: docId,
                        franchiseId,
                        customerId,
                        customerName,
                        creditBalance: amount,
                        movements: [movement],
                        createdAt: serverTimestamp() as unknown as Date,
                        updatedAt: serverTimestamp() as unknown as Date
                    };

                    transaction.set(walletRef, newWallet);
                    return newWallet as CustomerWalletEntry;
                }
            });

            return ok(result);
        } catch (error: unknown) {
            console.error('[customerWallet.addCredit] Error:', error);
            return err({
                type: 'UNKNOWN_ERROR',
                message: error instanceof Error ? error.message : 'Failed to add credit',
                cause: error
            });
        }
    },

    /**
     * Consume crédito del wallet (ej: al emitir una factura nueva, descontar saldo a favor).
     */
    useCredit: async (
        franchiseId: string,
        customerId: string,
        amount: number,
        description: string,
        invoiceId: string | undefined,
        createdBy: string
    ): Promise<Result<{ applied: number; remainingCredit: number }, WalletError>> => {
        try {
            if (amount <= 0) {
                return err({ type: 'UNKNOWN_ERROR', message: 'Debit amount must be positive' });
            }

            const docId = walletDocId(franchiseId, customerId);
            const walletRef = doc(db, WALLETS_COLLECTION, docId);

            const result = await runTransaction(db, async (transaction) => {
                const walletSnap = await transaction.get(walletRef);

                if (!walletSnap.exists()) {
                    return { applied: 0, remainingCredit: 0 };
                }

                const wallet = walletSnap.data() as CustomerWalletEntry;

                if (wallet.creditBalance <= 0) {
                    return { applied: 0, remainingCredit: 0 };
                }

                const applied = Math.min(amount, wallet.creditBalance);
                const newBalance = wallet.creditBalance - applied;

                const movement: WalletMovement = {
                    type: 'DEBIT',
                    amount: applied,
                    description,
                    invoiceId,
                    createdAt: new Date(),
                    createdBy
                };

                transaction.update(walletRef, {
                    creditBalance: newBalance,
                    movements: [...(wallet.movements || []), movement],
                    updatedAt: serverTimestamp()
                });

                return { applied, remainingCredit: newBalance };
            });

            return ok(result);
        } catch (error: unknown) {
            console.error('[customerWallet.useCredit] Error:', error);
            return err({
                type: 'UNKNOWN_ERROR',
                message: error instanceof Error ? error.message : 'Failed to use credit',
                cause: error
            });
        }
    },

    /**
     * Obtiene el saldo actual del wallet de un cliente.
     */
    getBalance: async (
        franchiseId: string,
        customerId: string
    ): Promise<Result<{ creditBalance: number; movements: WalletMovement[] }, WalletError>> => {
        try {
            const docId = walletDocId(franchiseId, customerId);
            const walletRef = doc(db, WALLETS_COLLECTION, docId);
            const walletSnap = await getDoc(walletRef);

            if (!walletSnap.exists()) {
                return ok({ creditBalance: 0, movements: [] });
            }

            const wallet = walletSnap.data() as CustomerWalletEntry;
            return ok({
                creditBalance: wallet.creditBalance,
                movements: wallet.movements || []
            });
        } catch (error: unknown) {
            console.error('[customerWallet.getBalance] Error:', error);
            return err({
                type: 'UNKNOWN_ERROR',
                message: error instanceof Error ? error.message : 'Failed to get balance',
                cause: error
            });
        }
    },

    /**
     * Lista todos los wallets con saldo positivo de una franquicia.
     */
    getActiveWallets: async (
        franchiseId: string
    ): Promise<Result<CustomerWalletEntry[], WalletError>> => {
        try {
            const q = query(
                collection(db, WALLETS_COLLECTION),
                where('franchiseId', '==', franchiseId),
                where('creditBalance', '>', 0)
            );

            const snap = await getDocs(q);
            const wallets = snap.docs.map(d => ({
                id: d.id,
                ...d.data()
            } as CustomerWalletEntry));

            return ok(wallets);
        } catch (error: unknown) {
            console.error('[customerWallet.getActiveWallets] Error:', error);
            return err({
                type: 'UNKNOWN_ERROR',
                message: error instanceof Error ? error.message : 'Failed to get wallets',
                cause: error
            });
        }
    },

    /**
     * Helper para el DebtDashboard: obtiene créditos por cliente como Map.
     */
    getCreditMap: async (
        franchiseId: string
    ): Promise<Map<string, number>> => {
        const creditMap = new Map<string, number>();

        try {
            const result = await customerWallet.getActiveWallets(franchiseId);
            if (result.success) {
                result.data.forEach(w => {
                    creditMap.set(w.customerId, w.creditBalance);
                });
            }
        } catch {
            console.warn('[customerWallet.getCreditMap] Error loading credits, returning empty map');
        }

        return creditMap;
    }
};
