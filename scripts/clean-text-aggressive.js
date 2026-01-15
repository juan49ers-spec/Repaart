
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const files = [
    'scripts/seed-encyclopedia.js',
    'src/features/academy/encyclopediaData.ts'
];

files.forEach(file => {
    try {
        const path = join(process.cwd(), file);
        let content = readFileSync(path, 'utf8');

        // Regex replacements
        // 1. Remove double asterisks (bold)
        content = content.replace(/\*\*/g, '');

        // 2. Remove single asterisks (bullets or italics) - be careful not to break code comments
        // We only want to target string content. This is a naive approach but should work for the data structure.
        // To be safe, let's target specific patterns we see in the text, or just replace all * inside the content strings?
        // Simpler: Replace * only if it's not part of a comment block (/* */). 
        // Given the file structure, most * are in the data strings or comments. 
        // The user specifically complained about TTS, so the data strings are the priority.

        // Let's iterate over the encylopediaData array if possible? 
        // No, treating it as text is safer for preserving file structure if we are careful.
        // But the user said "parentesis, asteriscos, (*-".

        // Let's target the string literals specifically in the known fields?
        // That's hard with regex on the whole file. 
        // Let's just do global replacement of `**` which is the main culprit.
        // For `(`, `)`, we replace with ` ` (space) or `, `? 
        // "Zona A (0-4 km)" -> "Zona A 0-4 km" is better for TTS.

        content = content.replace(/\*\*/g, ''); // Bold
        // content = content.replace(/\s*\(/g, ', '); // Open paren to comma? "Zona A, 0-4 km)"
        // content = content.replace(/\)/g, ''); // Close paren to empty?

        // Let's be more specific based on the user request "parentesis, astericos, (*-"
        // Remove `(` and `)`
        content = content.replace(/[()]/g, '');

        // Remove `*-` ?
        content = content.replace(/\*-\s*/g, '');

        // Remove single `*` if they are bullets found at start of lines or words
        content = content.replace(/(?<=["'])\s*\*\s*/g, ''); // Content starting with *
        content = content.replace(/\s+\*\s+/g, ' '); // * in middle of text

        // Fix any double spaces created
        content = content.replace(/  +/g, ' ');

        writeFileSync(path, content, 'utf8');
        console.log(`Processed ${file}`);
    } catch (e) {
        console.error(`Error processing ${file}:`, e);
    }
});
