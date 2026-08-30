import os, glob, re

target_files = [
    r'src\components\CinematicTextureWrapper.tsx',
    r'src\components\Diorama.tsx',
    r'src\components\DynamicLiquidGrid.tsx',
    r'src\components\Layouts.tsx',
    r'src\components\MagnatesStage_TwoPart.tsx',
    r'src\components\MonolithEngine.tsx'
]

for file in target_files:
    if not os.path.exists(file): continue
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Import replacement logic
    # Find import { ... Video ... } from 'remotion'
    # We will just globally replace  Video, or  Video  with  OffthreadVideo 
    # But safer: regex to replace Video with OffthreadVideo inside the import statement
    import_pattern = r"(import\s+\{[^}]*)\bVideo\b([^}]*\}\s+from\s+['\"]remotion['\"];?)"
    content = re.sub(import_pattern, r"\1OffthreadVideo\2", content)
    
    # Also handle if it's imported as import {Video} from 'remotion' without spaces
    import_pattern_2 = r"(import\s+\{)Video(\}\s+from\s+['\"]remotion['\"];?)"
    content = re.sub(import_pattern_2, r"\1OffthreadVideo\2", content)

    # Component replacement
    content = content.replace('<Video ', '<OffthreadVideo ')
    content = content.replace('<Video\n', '<OffthreadVideo\n')
    content = content.replace('<Video\r', '<OffthreadVideo\r')
    content = content.replace('</Video>', '</OffthreadVideo>')

    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'Converted {file}')
