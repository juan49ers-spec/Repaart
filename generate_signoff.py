import os
import subprocess

files_to_dump = [
    "firestore.rules",
    "src/services/userService.ts",
    "src/hooks/useUserManager.ts",
    "functions/src/callables/createUser.ts",
    "functions/src/callables/repairCustomClaims.ts",
    "functions/src/callables/adminDeleteUser.ts",
    "functions/src/callables/setRole.ts",
    "functions/src/callables/setUserStatus.ts",
    "functions/src/utils/claims.ts",
    "functions/src/utils/admin.ts"
]

output_path = r"C:\Users\Usuario\.gemini\antigravity\brain\7286db68-bfcc-42b8-840f-71697907b3e7\FINAL_SIGNOFF.md"

with open(output_path, "w", encoding="utf-8") as out:
    out.write("# FINAL SIGNOFF DELIVERABLES\n\n")
    
    for fpath in files_to_dump:
        out.write(f"## {fpath}\n```typescript\n")
        full_path = os.path.join(r"c:\Users\Usuario\.gemini\antigravity\playground\repaart", fpath)
        try:
            with open(full_path, "r", encoding="utf-8") as f:
                out.write(f.read())
        except Exception as e:
            out.write(f"// Error reading file: {e}\n")
        out.write("\n```\n\n")
        
    out.write("## git diff --cached --stat\n```bash\n")
    stat = subprocess.run(["git", "diff", "--cached", "--stat"], cwd=r"c:\Users\Usuario\.gemini\antigravity\playground\repaart", capture_output=True, encoding="utf-8")
    if stat.stdout:
        out.write(stat.stdout)
    out.write("\n```\n\n")

    out.write("## git diff --cached -- firestore.rules src/services/userService.ts src/hooks/useUserManager.ts functions/src/callables/createUser.ts functions/src/callables/repairCustomClaims.ts functions/src/callables/adminDeleteUser.ts functions/src/callables/setRole.ts functions/src/callables/setUserStatus.ts functions/src/utils/claims.ts functions/src/utils/admin.ts\n```diff\n")
    diff = subprocess.run(["git", "diff", "--cached", "--", "firestore.rules", "src/services/userService.ts", "src/hooks/useUserManager.ts", "functions/src/callables/createUser.ts", "functions/src/callables/repairCustomClaims.ts", "functions/src/callables/adminDeleteUser.ts", "functions/src/callables/setRole.ts", "functions/src/callables/setUserStatus.ts", "functions/src/utils/claims.ts", "functions/src/utils/admin.ts"], cwd=r"c:\Users\Usuario\.gemini\antigravity\playground\repaart", capture_output=True, encoding="utf-8")
    if diff.stdout:
        out.write(diff.stdout)
    out.write("\n```\n")

print("Generated FINAL_SIGNOFF.md successfully.")
