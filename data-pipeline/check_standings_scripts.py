import re

standings_html_path = r'C:\Users\raman\.gemini\antigravity-ide\brain\cba7a232-ccd2-4d8e-8642-241e8ff196ab\.system_generated\steps\457\content.md'

with open(standings_html_path, encoding='utf-8') as f:
    content = f.read()

# Find all script src tags
scripts = re.findall(r'<script[^>]+src=["\']([^"\']+)["\']', content)
print("Scripts in Standings HTML page:", scripts)

# Find any inline script contents containing supabase or fetch
inline = re.findall(r'<script>(.*?)</script>', content, re.DOTALL)
print(f"Found {len(inline)} inline script blocks.")
for idx, s in enumerate(inline):
    if "supabase" in s.lower() or "from(" in s.lower() or "fetch" in s.lower() or "tourn" in s.lower():
        print(f"--- Script #{idx+1} snippet ---")
        print(s[:500])
