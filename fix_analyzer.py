import sys

file = 'ai-service/app/services/complaint_analyzer.py'
with open(file, 'r') as f:
    content = f.read()

if 'html_guide=' not in content:
    content = content.replace(
        'return {',
        '# Generate HTML Guide and Reply using GptOssService\n        guide_prompt = f"The user has an issue: {clean_text}. The category is {category_res.category} and priority is {priority_res.priority}. Write a full standalone HTML document with inline CSS for a beautiful troubleshooting guide. Start directly with <!DOCTYPE html>. No markdown fences."\n        html_res = await self.gpt_oss_service._call_llm_chat(guide_prompt)\n        html_guide = html_res.reply if html_res else "<html><body><h3>Resolution Guide Unavailable</h3></body></html>"\n\n        # Strip markdown fences if present\n        if html_guide.startswith("```html"): html_guide = html_guide[7:]\n        if html_guide.endswith("```"): html_guide = html_guide[:-3]\n\n        reply_prompt = f"The user said: {clean_text}. Provide a polite 2-sentence spoken response acknowledging their issue in the exact same language they used."\n        reply_res = await self.gpt_oss_service._call_llm_chat(reply_prompt)\n        spoken_reply = reply_res.reply if reply_res else "I understand your issue and have registered your complaint."\n\n        return {'
    )
    content = content.replace(
        '"is_resolvable_by_ai": is_resolvable',
        '"is_resolvable_by_ai": is_resolvable,\n            "reply": spoken_reply,\n            "html_guide": html_guide.strip()'
    )
    with open(file, 'w') as f:
        f.write(content)
    print("Updated complaint_analyzer.py")
