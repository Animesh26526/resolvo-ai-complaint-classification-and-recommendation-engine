import sys

file = 'frontend/src/components/complaints/LiveD2DSession.jsx'
with open(file, 'r') as f:
    content = f.read()

content = content.replace(
    "const res = await fetch('http://127.0.0.1:8000/api/transcribe', {",
    "const res = await fetch('http://127.0.0.1:8000/api/audio-complaint', {"
)
content = content.replace(
    "setTranscript(data.transcript);",
    """setTranscript(data.transcript);
          // Play the AI spoken reply
          if (data.analysis && data.analysis.reply) {
            const utterance = new SpeechSynthesisUtterance(data.analysis.reply);
            window.speechSynthesis.speak(utterance);
          }"""
)

with open(file, 'w') as f:
    f.write(content)
print("Updated LiveD2DSession.jsx")
