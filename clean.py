import sys

with open(r'src/index.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

start_idx = -1
end_idx = -1

for i in range(len(lines)):
    if 'const SceneContent = ({ scene, index }: any) => {' in lines[i]:
        if start_idx == -1:
            start_idx = i
        else:
            end_idx = i
            break

if start_idx != -1 and end_idx != -1:
    # Delete from start_idx + 2 down to end_idx
    del lines[start_idx+2:end_idx+1]
    
    with open(r'src/index.tsx', 'w', encoding='utf-8') as f:
        f.writelines(lines)
    print(f"Successfully deleted duplicate block between lines {start_idx+3} and {end_idx+1}")
else:
    print(f"Could not find both SceneContent declarations. Found start_idx: {start_idx}")
