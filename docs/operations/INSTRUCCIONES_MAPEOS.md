# CÓDIGO PARA OBTENER FRANQUICIAS REPAART

Copia y pega este código en la consola del navegador (F12) cuando estés en http://localhost:5173/admin/flyder:

## OPCIÓN 1: Obtener todas las franquicias de Repaart

```javascript
async function getRepaartFranchises() {
  const { collection, query, where, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
  const db = window.firebaseFirestore;
  
  const snapshot = await getDocs(query(
    collection(db, 'users'),
    where('role', '==', 'franchise'),
    where('status', '==', 'active')
  ));
  
  const franchises = snapshot.docs.map(doc => ({
    uid: doc.id,
    franchiseId: doc.data().franchiseId || doc.id,
    name: doc.data().name || doc.data().displayName || 'Sin nombre',
    location: doc.data().location || doc.data().address || '',
    email: doc.data().email || ''
  }));
  
  console.log('\n📊 FRANQUICIAS REPAART (' + franchises.length + ')\n');
  
  franchises.forEach(f => {
    console.log(`[${f.franchiseId}] ${f.name}`);
    console.log(`   UID: ${f.uid}`);
    console.log(`   Ubicación: ${f.location || 'N/A'}`);
    console.log(`   Email: ${f.email || 'N/A'}\n`);
  });
  
  return franchises;
}

getRepaartFranchises();
```

## OPCIÓN 2: Crear mapeos automáticamente (para franquicias con nombres similares)

```javascript
async function createAutoMappings() {
  const { collection, query, where, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
  const { httpsCallable } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js');
  
  const db = window.firebaseFirestore;
  const functions = window.firebaseFunctions;
  
  // Obtener franquicias Repaart
  const snapshot = await getDocs(query(
    collection(db, 'users'),
    where('role', '==', 'franchise'),
    where('status', '==', 'active')
  ));
  
  const repaartFranchises = snapshot.docs.map(doc => ({
    franchiseId: doc.data().franchiseId || doc.id,
    name: (doc.data().name || doc.data().displayName || '').toLowerCase()
  }));
  
  // Mapeos manuales Flyder → Repaart (basados en los IDs de Flyder que obtuvimos)
  const flyderToRepaartMappings = [
    { flyderBusinessId: 6, flyderBusinessName: 'Repaart Cáceres', keyword: 'caceres' },
    { flyderBusinessId: 9, flyderBusinessName: 'Repaart Plasencia', keyword: 'plasencia' },
    { flyderBusinessId: 13, flyderBusinessName: 'Repaart Jaén', keyword: 'jaen' },
    { flyderBusinessId: 14, flyderBusinessName: 'Repaart Sevilla', keyword: 'sevilla' },
    { flyderBusinessId: 15, flyderBusinessName: 'Repaart Torremolinos', keyword: 'torremolinos' },
    { flyderBusinessId: 19, flyderBusinessName: 'Repaart Martos', keyword: 'martos' },
    { flyderBusinessId: 21, flyderBusinessName: 'Repaart Huelin', keyword: 'huelin' },
    { flyderBusinessId: 22, flyderBusinessName: 'Repaart Toledo', keyword: 'toledo' },
  ];
  
  const createMappingFn = httpsCallable(functions, 'createFranchiseMapping');
  
  console.log('\n🔗 Creando mapeos automáticos...\n');
  
  for (const mapping of flyderToRepaartMappings) {
    // Buscar franquicia correspondiente en Repaart
    const matchingFranchise = repaartFranchises.find(f => 
      f.name.includes(mapping.keyword)
    );
    
    if (matchingFranchise) {
      try {
        await createMappingFn({
          flyderBusinessId: mapping.flyderBusinessId,
          flyderBusinessName: mapping.flyderBusinessName,
          repaartFranchiseId: matchingFranchise.franchiseId
        });
        
        console.log('✅ Creado:', mapping.flyderBusinessName, '→', matchingFranchise.franchiseId);
      } catch (error) {
        console.error('❌ Error creando', mapping.flyderBusinessName, ':', error.message);
      }
    } else {
      console.log('⚠️ No encontré:', mapping.flyderBusinessName, '(keyword:', mapping.keyword + ')');
    }
  }
  
  console.log('\n✨ Proceso completado!');
}

createAutoMappings();
```

## INSTRUCCIONES

1. Abre http://localhost:5173/admin/flyder
2. Abre la consola del navegador (F12)
3. Pega el código de la OPCIÓN 1 para ver todas tus franquicias de Repaart
4. Pega el código de la OPCIÓN 2 para crear mapeos automáticos para las franquicias con nombres similares
5. Para las franquicias que no se mapearon automáticamente, crea los mapeos manualmente usando el formulario en la pestaña "Sincronización"
