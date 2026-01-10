const fs = require('fs');
const path = require('path');

// 🛡️ CONFIGURACIÓN: Qué ignorar y qué buscar
const ignoreDirs = ['node_modules', '.git', 'dist', 'build', '.firebase', 'coverage'];
const includeExts = ['.js', '.jsx', '.css', '.json', '.html', 'rules']; // Agregamos .rules para Firestore
const ignoreFiles = ['package-lock.json', 'yarn.lock', 'ver_todo.js', 'stats.json'];

// Archivo de salida
const outputFile = '_PROYECTO_COMPLETO.txt';

function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);

    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function (file) {
        const fullPath = path.join(dirPath, file);

        if (fs.statSync(fullPath).isDirectory()) {
            if (!ignoreDirs.includes(file)) {
                arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
            }
        } else {
            const ext = path.extname(file);
            if (includeExts.includes(ext) && !ignoreFiles.includes(file)) {
                arrayOfFiles.push(fullPath);
            }
        }
    });

    return arrayOfFiles;
}

const allFiles = getAllFiles(__dirname);
let content = `Generado el: ${new Date().toISOString()}\n\n`;

console.log(`🔍 Escaneando proyecto... Encontrados ${allFiles.length} archivos.`);

allFiles.forEach(file => {
    // Leemos el contenido
    const fileContent = fs.readFileSync(file, 'utf8');
    // Hacemos la ruta relativa para que sea legible
    const relativePath = path.relative(__dirname, file);

    // Añadimos cabeceras claras para que yo sepa dónde empieza cada archivo
    content += `\n\n` +
        `================================================================================\n` +
        `FILE: ${relativePath}\n` +
        `================================================================================\n` +
        `${fileContent}\n`;
});

fs.writeFileSync(outputFile, content);
console.log(`✅ ¡HECHO! Todo tu código está en: ${outputFile}`);
console.log(`👉 Ahora sube ese archivo al chat.`);
