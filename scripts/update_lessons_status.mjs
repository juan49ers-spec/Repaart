// Script para actualizar el status de todas las lecciones a 'published'
// Ejecutar: node scripts/update_lessons_status.mjs

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Cargar variables de entorno desde .env
try {
  const envPath = join(__dirname, '..', '.env');
  const envContent = readFileSync(envPath, 'utf8');
  const envVars = envContent.split('\n').reduce((acc, line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      acc[match[1]] = match[2].replace(/^["']|["']$/g, '');
    }
    return acc;
  }, {});
  
  Object.assign(process.env, envVars);
  console.log('✅ Variables de entorno cargadas desde .env');
} catch (e) {
  console.log('⚠️  No se pudo cargar .env, usando variables de entorno del sistema');
}

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

console.log('🔧 Configuración Firebase:');
console.log(`   - Project ID: ${firebaseConfig.projectId}`);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function updateLessonsStatus() {
  try {
    console.log('🔍 Buscando lecciones en academy_lessons...');
    
    const lessonsRef = collection(db, 'academy_lessons');
    const snapshot = await getDocs(lessonsRef);
    
    console.log(`📚 Total de lecciones encontradas: ${snapshot.docs.length}`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const lessonDoc of snapshot.docs) {
      const lessonData = lessonDoc.data();
      const lessonId = lessonDoc.id;
      
      // Si no tiene campo status o está vacío, actualizar a 'published'
      if (!lessonData.status || lessonData.status === '') {
        console.log(`📝 Actualizando lección: ${lessonId} - ${lessonData.title || 'Sin título'}`);
        
        await updateDoc(doc(db, 'academy_lessons', lessonId), {
          status: 'published',
          updated_at: new Date()
        });
        
        updatedCount++;
      } else {
        console.log(`⏭️  Saltando lección: ${lessonId} - Status ya definido: ${lessonData.status}`);
        skippedCount++;
      }
    }
    
    console.log('\n✅ Resumen:');
    console.log(`   - Lecciones actualizadas: ${updatedCount}`);
    console.log(`   - Lecciones omitidas (ya tenían status): ${skippedCount}`);
    console.log(`   - Total procesadas: ${snapshot.docs.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

updateLessonsStatus();
