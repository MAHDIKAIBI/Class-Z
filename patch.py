import re  
with open('.github/workflows/render.yml', 'r') as f:  
    text = f.read()  
text = re.sub(r'sudo apt-get update', r'sudo apt-get -o Acquire::ForceIPv4=true -o Acquire::Retries=3 -o Acquire::http::Timeout=\" "15\ update', text)  
text = re.sub(r'sudo apt-get install', r'sudo apt-get -o Acquire::ForceIPv4=true -o Acquire::Retries=3 -o Acquire::http::Timeout=\15\ install', text)  
t_match = r'-o Acquire::ForceIPv4=true -o Acquire::Retries=3 -o Acquire::http::Timeout=\15\'  
text = text.replace(t_match + ' ' + t_match, t_match)  
with open('.github/workflows/render.yml', 'w') as f:  
    f.write(text)  
