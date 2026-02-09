/**
 * Script para probar diferentes puertos y configuraciones
 */

const portsToTest = [
  5432, // PostgreSQL por defecto
  3306, // MySQL por defecto
  5433, // PostgreSQL alternativo
  3307, // MySQL alternativo
  1433, // SQL Server
];

async function testConnection(host, port) {
  const net = await import('net');
  
  return new Promise((resolve) => {
    const socket = new net.Socket();
    
    const timeout = setTimeout(() => {
      socket.destroy();
      resolve({ port, status: 'timeout' });
    }, 5000);
    
    socket.connect(port, host, () => {
      clearTimeout(timeout);
      socket.destroy();
      resolve({ port, status: 'open' });
    });
    
    socket.on('error', () => {
      clearTimeout(timeout);
      resolve({ port, status: 'closed' });
    });
  });
}

async function main() {
  const host = 'api.flyder.app';
  
  console.log(`🔍 Probando puertos en ${host}...`);
  
  for (const port of portsToTest) {
    const result = await testConnection(host, port);
    
    if (result.status === 'open') {
      console.log(`✅ Puerto ${port}: ABIERTO`);
    } else if (result.status === 'timeout') {
      console.log(`⏱️  Puerto ${port}: TIMEOUT (bloqueado o sin respuesta)`);
    } else {
      console.log(`❌ Puerto ${port}: CERRADO`);
    }
  }
  
  console.log('\n💡 Si todos los puertos están cerrados:');
  console.log('   1. Contacta a Flyder para habilitar acceso remoto');
  console.log('   2. Pregunta si hay un host diferente para la BD');
  console.log('   3. Pregunta si necesitan tu IP en whitelist');
  console.log('   4. Considera usar la API REST en su lugar');
}

main();
