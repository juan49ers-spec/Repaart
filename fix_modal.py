import sys

# Read file
with open(r'c:\Users\Usuario\.gemini\antigravity\playground\synthetic-sagan\src\components\FinanceEntryModal.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace
content = content.replace('SmartFinanceInput', 'SmartInput')

# Write back
with open(r'c:\Users\Usuario\.gemini\antigravity\playground\synthetic-sagan\src\components\FinanceEntryModal.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Replaced all occurrences")
