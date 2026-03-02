import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';

const serviceAccount = JSON.parse(fs.readFileSync('./serviceAccountKey.json', 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function run() {
    const snapshot = await db.collection('academy_lessons').get();
    let found = false;
    for (const doc of snapshot.docs) {
        const data = doc.data();
        if (data.title && data.title.toLowerCase().includes('panel de restaurante')) {
            console.log('Found:', doc.id, data.title);
            await doc.ref.update({
                content: '<p>Bienvenido a la guía del Panel de Restaurantes. En esta lección aprenderás todo lo necesario para gestionar de forma eficiente la operativa diaria de tu local.</p><ul><li><strong>Gestión de pedidos:</strong> Cómo recibir, aceptar y marcar los pedidos como listos para el rider.</li><li><strong>Control del Menú:</strong> Activar y desactivar productos en tiempo real si te quedas sin stock.</li><li><strong>Horarios:</strong> Configuración de horas de apertura y cierre por día de la semana.</li><li><strong>Soporte:</strong> Cómo contactar con el equipo a través de un ticket en caso de incidencias.</li></ul><p>Recuerda que mantener el panel actualizado garantizará una mejor experiencia tanto para los riders como para los clientes finales.</p>'
            });
            console.log('Updated successfully!');
            found = true;
        }
    }
    if (!found) { console.log('Lesson not found.'); }
    process.exit(0);
}
run();
