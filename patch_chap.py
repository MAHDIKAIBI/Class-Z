import os

path = r'src\components\CinematicChapterReveal.tsx'
with open(path, 'r', encoding='utf-8') as f: text = f.read()

# Scale critical translation values that push things off screen
text = text.replace('[-900, -550]', '[-1300, -750]')
text = text.replace('[900, 550]', '[1300, 750]')

# Scale shard widths
text = text.replace('"750px"', '"1000px"')
text = text.replace('"1200px"', '"1600px"')

with open(path, 'w', encoding='utf-8') as f: f.write(text)
print("Updated CinematicChapterReveal")
