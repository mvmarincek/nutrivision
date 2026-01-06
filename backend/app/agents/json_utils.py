import json
import re

def parse_json_safe(content: str) -> dict:
    if "```json" in content:
        content = content.split("```json")[1].split("```")[0]
    elif "```" in content:
        content = content.split("```")[1].split("```")[0]
    
    content = content.strip()
    content = re.sub(r',\s*]', ']', content)
    content = re.sub(r',\s*}', '}', content)
    
    return json.loads(content)
