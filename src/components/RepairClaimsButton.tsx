/**
 * Componente temporal para reparar custom claims
 * Importar en App.tsx o en cualquier página para usarlo
 */

import React, { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';
import { auth } from '../lib/firebase';
import { Button, Alert, Card, Space, Typography } from 'antd';

const { Text, Title } = Typography;

export const RepairClaimsButton: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

    const repairClaims = async () => {
        if (!auth.currentUser) {
            setResult({ success: false, message: 'No hay usuario logueado' });
            return;
        }

        setLoading(true);
        setResult(null);

        try {
            console.log('🔧 Reparando custom claims para:', auth.currentUser.email);

            const repairFn = httpsCallable(functions, 'repairCustomClaims');
            const response = await repairFn({});

            console.log('✅ Respuesta:', response.data);

            setResult({
                success: true,
                message: 'Custom claims reparados exitosamente. Por favor haz logout y login nuevamente.'
            });

            // Preguntar si quiere hacer logout
            setTimeout(() => {
                if (confirm('¿Quieres hacer logout ahora para refrescar el token?')) {
                    auth.signOut().then(() => {
                        window.location.reload();
                    });
                }
            }, 1000);

        } catch (error: any) {
            console.error('❌ Error:', error);

            if (error.code === 'functions/not-found') {
                setResult({
                    success: false,
                    message: 'La función no está desplegada. Ejecuta: cd functions && firebase deploy --only functions'
                });
            } else {
                setResult({
                    success: false,
                    message: `Error: ${error.message || 'Error desconocido'}`
                });
            }
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
                maxWidth: 400
            }}
        >
            <Space direction="vertical" style={{ width: '100%' }}>
                <Title level={5}>🔧 Reparar Custom Claims</Title>
                <Text type="secondary">
                    Si tienes errores 403 en facturación, repara tus custom claims.
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
                    onClick={repairClaims}
                    loading={loading}
                    danger={!result?.success}
                >
                    {loading ? 'Reparando...' : 'Reparar Claims'}
                </Button>
            </Space>
        </Card>
    );
};

export default RepairClaimsButton;
