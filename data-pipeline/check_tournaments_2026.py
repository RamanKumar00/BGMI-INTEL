import re

tourneys_js_path = r'C:\Users\raman\.gemini\antigravity-ide\brain\cba7a232-ccd2-4d8e-8642-241e8ff196ab\.system_generated\steps\522\content.md'

with open(tourneys_js_path, encoding='utf-8') as f:
    content = f.read()

# 1. Search for .from('...')
tables = set(re.findall(r"\.from\(['\"]([^'\"]+)['\"]\)", content))
print("Supabase Tables in tournaments_2026.js:", tables)

# 2. Search for any fetch('...') or json files or GitHub CDN links
urls = set(re.findall(r"fetch\(['\"]([^'\"]+)['\"]\)", content))
print("fetch URLs in tournaments_2026.js:", urls)

# 3. Search for CDN or github links
cdns = set(re.findall(r"https://[^\s'\"]+", content))
for c in list(cdns)[:15]:
    print("  CDN link:", c)
