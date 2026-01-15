import zipfile
import re
import os
import glob
import sys

# Correct path based on user info
SOURCE_DIR = r"c:\Users\Usuario\.gemini\antigravity\playground\synthetic-sagan\academy_sources"

print(f"Scanning directory: {SOURCE_DIR}")
files = glob.glob(os.path.join(SOURCE_DIR, "*.docx"))
print(f"Found {len(files)} DOCX files.")

for file_path in files:
    try:
        print(f"Processing: {os.path.basename(file_path)}")
        with zipfile.ZipFile(file_path, 'r') as z:
            if 'word/document.xml' not in z.namelist():
                print(f"  Skipping (no word/document.xml): {file_path}")
                continue
                
            xml_content = z.read('word/document.xml').decode('utf-8')
            
            # Extract text roughly but effective for analysis
            # Remove XML tags
            text = re.sub(r'<[^>]+>', ' ', xml_content)
            # Normalize whitespace
            text = ' '.join(text.split())
            
            out_name = os.path.basename(file_path) + ".txt"
            out_path = os.path.join(SOURCE_DIR, out_name)
            
            with open(out_path, 'w', encoding='utf-8') as f:
                f.write(text)
            print(f"  Saved to: {out_name}")
            
    except Exception as e:
        print(f"  Error extracting {file_path}: {e}")
