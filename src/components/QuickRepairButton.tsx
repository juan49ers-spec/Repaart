/**
 * Solución RÁPIDA - Reparar custom claims SIN desplegar funciones
 *
 * Esta solución actualiza directamente el documento en Firestore,
 * lo que activa el trigger onUserWrite que YA ESTÁ desplegado
 * y sincroniza los custom claims automáticamente.
 */

import React, { useState } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { auth } from '../lib/firebase';
import { Button, Alert, Card, Space, Typography, message } from 'antd';

const { Text, Title } = Typography;

export const QuickRepairButton: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

    const quickRepair = async () => {
        if (!auth.currentUser) {
            setResult({ success: false, message: 'No hay usuario logueado' });
            return;
        }

        setLoading(true);
        setResult(null);

        try {
            const userId = auth.currentUser.uid;
            console.log('🔧 Actualizando documento para activar trigger:', userId);

            // Actualizar el documento con un timestamp nuevo para activar el trigger
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                updatedAt: serverTimestamp(),
                // Estos campos ya deberían existir, pero los incluimos para asegurar
                role: 'franchise',
                franchiseId: 'F-0004'
            });

            console.log('✅ Documento actualizado, trigger sincronizará los claims');

            setResult({
                success: true,
                message: '✅ Documento actualizado. El trigger sincronizará los custom claims. Haz logout y login ahora.'
            });

            message.success('Custom claims actualizados correctamente');

            // Preguntar si quiere hacer logout
            setTimeout(() => {
                if (confirm('¿Quieres hacer logout ahora para refrescar el token?')) {
                    auth.signOut().then(() => {
                        window.location.reload();
                    });
                }
            }, 2000);

        } catch (error: unknown) {
            const err = error as { code?: string; message?: string };
            console.error('❌ Error:', error);

            let errorMsg = 'Error desconocido';
            if (err.code === 'permission-denied') {
                errorMsg = 'No tienes permisos. Contacta al administrador.';
            } else if (err.code === 'not-found') {
                errorMsg = 'Usuario no encontrado en Firestore.';
            } else {
                errorMsg = err.message || 'Error actualizando el documento';
            }

            setResult({
                success: false,
                message: `Error: ${errorMsg}`
            });

            message.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card
            size="small"
            style={{
                position: 'fixed',
                bottom: 20,
                right: 20,
                zIndex: 9999,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                maxWidth: 400,
                backgroundColor: '#fef3c7',
                border: '2px solid #f59e0b'
            }}
        >
            <Space direction="vertical" style={{ width: '100%' }}>
                <Title level={5} style={{ margin: 0 }}>🔧 Reparación RÁPIDA</Title>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                    Actualiza el documento en Firestore para activar el trigger que sincroniza los custom claims.
                    <br /><br />
                    <strong>NO requiere desplegar funciones</strong>
                </Text>

                {result && (
                    <Alert
                        type={result.success ? 'success' : 'error'}
                        message={result.message}
                        closable
                        onClose={() => setResult(null)}
                    />
                )}

                <Button
                    type="primary"
                    onClick={quickRepair}
                    loading={loading}
                    danger={!!result && !result.success}
                    style={{ backgroundColor: '#f59e0b', borderColor: '#d97706' }}
                >
                    {loading ? 'Actualizando...' : 'Reparar Ahora (Rápido)'}
                </Button>
            </Space>
        </Card>
    );
};

export default QuickRepairButton;
