import json
import re

# Read the file content
with open('src/data/services.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract the JSON-like array part
match = re.search(r'export const services: Service\[\] = (\[[\s\S]*\]);', content)
if match:
    json_str = match.group(1)
    # Convert JS object literal to valid JSON for parsing (if needed) or just use regex to remove promotion blocks
    
    # Regex to remove promotion blocks
    # Pattern: "promotion": { ... }, (handling nested braces is hard with regex, but let's try a simpler approach since we know the structure)
    
    # Actually, let's just use Python to parse it if we can make it valid JSON
    # The file is TS, so it might have unquoted keys.
    # Let's try a regex substitution to remove the promotion field entirely.
    
    # This regex looks for "promotion": { ... } and removes it.
    # We assume the structure is relatively standard indentation.
    
    # Matches "promotion": { ... } including nested content until the closing brace at the same indentation level
    # This is risky.
    
    # Alternative: Read line by line.
    lines = content.split('\n')
    new_lines = []
    skip = False
    brace_count = 0
    
    for line in lines:
        if '"promotion": {' in line or 'promotion: {' in line:
            skip = True
            brace_count = 1
            # Check if it closes on the same line
            if line.count('}') == line.count('{'):
                skip = False
                continue
            continue
            
        if skip:
            brace_count += line.count('{')
            brace_count -= line.count('}')
            if brace_count == 0:
                skip = False
            continue
            
        new_lines.append(line)
        
    new_content = '\n'.join(new_lines)
    
    with open('src/data/services.ts', 'w', encoding='utf-8') as f:
        f.write(new_content)
        
    print("Successfully removed promotions from services.ts")
else:
    print("Could not find services array")
