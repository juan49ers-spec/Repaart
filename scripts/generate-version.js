import fs from 'fs';
import path from 'path';

const version = new Date().getTime().toString();
const versionContent = JSON.stringify({ version, buildTime: Date.now() });

// Assuming this script is run from project root via 'npm run build'
// We want to write to public/version.json
const publicDir = 'public';
const versionFile = path.join(publicDir, 'version.json');

// Ensure public dir exists
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(versionFile, versionContent);
console.log(`Generated version.json with version: ${version}`);
