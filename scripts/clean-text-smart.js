
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Only targeting the seed file since it's the one being used for the database update
const file = 'src/features/academy/encyclopediaData.ts';

try {
    const path = join(process.cwd(), file);
    let content = readFileSync(path, 'utf8');

    // Safe regex to target ONLY values within content: "..."
    // Matches content: "..." and captures the string content in group 1
    content = content.replace(/(content|action|title|example):\s*"((?:[^"\\]|\\.)*)"/g, (match, key, text) => {
        let cleanText = text;

        // Remove **
        cleanText = cleanText.replace(/\*\*/g, '');

        // Remove * bullets if at start of string or preceded by space
        cleanText = cleanText.replace(/(^|\s)\*+(\s|$)/g, '$1$2').trim();

        // Remove parens ( ) but maybe keep content? 
        // User asked to remove "parentesis". 
        // Example: "(0-4 km)" -> "0-4 km"
        cleanText = cleanText.replace(/[()]/g, '');

        // Remove "*-" pattern
        cleanText = cleanText.replace(/\*+-/g, '');

        return `${key}: "${cleanText}"`;
    });

    writeFileSync(path, content, 'utf8');
    console.log(`Safely processed ${file}`);
} catch (e) {
    console.error(`Error processing ${file}:`, e);
}
