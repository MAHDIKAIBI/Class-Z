import sys
import re

with open(r'src/index.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

def find_unclosed_braces(code):
    stack = []
    in_string = False
    string_char = ''
    in_comment = False
    in_multiline_comment = False
    
    i = 0
    line = 1
    
    while i < len(code):
        char = code[i]
        
        if char == '\n':
            line += 1
            in_comment = False
            
        if not in_string and not in_comment and not in_multiline_comment:
            if char == '/' and i + 1 < len(code):
                if code[i+1] == '/':
                    in_comment = True
                    i += 1
                elif code[i+1] == '*':
                    in_multiline_comment = True
                    i += 1
            elif char in ('"', "'", '`'):
                in_string = True
                string_char = char
            elif char == '{':
                stack.append(('{', line, i))
            elif char == '}':
                if stack and stack[-1][0] == '{':
                    stack.pop()
                else:
                    print(f"Extra closing brace at line {line}")
        elif in_string:
            if char == string_char and code[i-1] != '\\':
                in_string = False
        elif in_multiline_comment:
            if char == '*' and i + 1 < len(code) and code[i+1] == '/':
                in_multiline_comment = False
                i += 1
                
        i += 1
        
    for item in stack:
        print(f"Unclosed brace opened at line {item[1]}")

find_unclosed_braces(text)
