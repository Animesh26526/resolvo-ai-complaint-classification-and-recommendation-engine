import sys

file = 'ai-service/app/schemas/analysis_schema.py'
with open(file, 'r') as f:
    content = f.read()

if 'html_guide: Optional[str]' not in content:
    content = content.replace(
        'is_resolvable_by_ai: bool',
        'is_resolvable_by_ai: bool\n    reply: Optional[str] = None\n    html_guide: Optional[str] = None'
    )
    with open(file, 'w') as f:
        f.write(content)
    print("Updated analysis_schema.py")
