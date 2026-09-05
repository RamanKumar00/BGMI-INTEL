import re

app_js_path = r'C:\Users\raman\.gemini\antigravity-ide\brain\cba7a232-ccd2-4d8e-8642-241e8ff196ab\.system_generated\steps\425\content.md'

with open(app_js_path, encoding='utf-8') as f:
    content = f.read()

# 1. Search for .from('...')
tables = set(re.findall(r"\.from\(['\"]([^'\"]+)['\"]\)", content))
print("Supabase Tables referenced in app.js:", tables)

# 2. Search for any URL endpoints or RPC calls
rpcs = set(re.findall(r"\.rpc\(['\"]([^'\"]+)['\"]\)", content))
print("Supabase RPCs referenced in app.js:", rpcs)

# 3. Search for JS scripts imported or fetched
scripts = set(re.findall(r"['\"]([^'\"]+\.js)['\"]", content))
print("JS scripts referenced in app.js:", scripts)
