import os

mag_path = r'src\components\MagnatesStage.tsx'
with open(mag_path, 'r', encoding='utf-8') as f: text = f.read()
text = text.replace("'1100px'", "'1350px'")
text = text.replace("'550px'", "'680px'")
text = text.replace("'800px'", "'1000px'")
text = text.replace("'350px'", "'430px'")
with open(mag_path, 'w', encoding='utf-8') as f: f.write(text)

print("Scaled MagnatesStage assets.")
