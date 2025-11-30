import json
import re

# Read services.ts
with open('src/data/services.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Create a temp js file
js_content = """
const fs = require('fs');
const { services } = require('./src/data/services_temp.cjs');
fs.writeFileSync('data/services.json', JSON.stringify(services, null, 2));
"""

# We need to make services.ts require-able. It has "export interface" which is TS.
# We can strip the interface part.

parts = content.split('export const services: Service[] =')
if len(parts) > 1:
    ts_content = 'module.exports.services =' + parts[1]
else:
    print("Could not find export const services")
    ts_content = ""

with open('src/data/services_temp.cjs', 'w', encoding='utf-8') as f:
    f.write(ts_content)

with open('convert_services.cjs', 'w', encoding='utf-8') as f:
    f.write(js_content)
