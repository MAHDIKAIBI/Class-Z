import os

# --- 1. src/index.tsx ---
idx_path = r'src\index.tsx'
with open(idx_path, 'r', encoding='utf-8') as f: text = f.read()
text = text.replace('[-1920, 0]', '[-2560, 0]')
text = text.replace('[1920, 0]', '[2560, 0]')
text = text.replace('[1080, 0]', '[1333, 0]')
text = text.replace('[-1080, 0]', '[-1333, 0]')
text = text.replace('width={1920} height={1080}', 'width={2560} height={1333}')
with open(idx_path, 'w', encoding='utf-8') as f: f.write(text)

# --- 2. src/components/Effects.tsx ---
eff_path = r'src\components\Effects.tsx'
with open(eff_path, 'r', encoding='utf-8') as f: text = f.read()
text = text.replace('1080 - driftY', '1333 - driftY')
text = text.replace('% 1920', '% 2560')
text = text.replace('[-1920, 1920]', '[-2560, 2560]')
with open(eff_path, 'w', encoding='utf-8') as f: f.write(text)

# --- 3. src/components/Layouts.tsx ---
lay_path = r'src\components\Layouts.tsx'
with open(lay_path, 'r', encoding='utf-8') as f: text = f.read()
text = text.replace('width="1920" height="1080" viewBox="0 0 1920 1080"', 'width="2560" height="1333" viewBox="0 0 2560 1333"')
text = text.replace('[-1920, 1920]', '[-2560, 2560]')
text = text.replace("'1080px' : '900px'", "'1333px' : '1100px'")
with open(lay_path, 'w', encoding='utf-8') as f: f.write(text)

print("Replaced all hardcoded dimensions.")
