const fs = require('fs');

const file = 'src/pages/shared/SubmitComplaint.jsx';
let content = fs.readFileSync(file, 'utf8');

// Fix text_chat
content = content.replace(
  /const res = await api\.post\(`\/complaints\/\$\{sessionComplaint\._id\}\/analyze`\);[\s\S]*?\}\]\);/,
  `// Call ai-service chat
      const res = await fetch('http://127.0.0.1:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: chatInput.trim(), session_id: sessionComplaint._id })
      });
      const chatRes = await res.json();
      setChatMessages(prev => [...prev, { 
        role: 'assistant', content: chatRes.response || 'Noted.', isEscalated: false, isResolved: false
      }]);`
);

// Fix email
content = content.replace(
  /setTimeout\(\(\) => \{[\s\S]*?\}, 1500\);/m,
  `
  (async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: "Draft a professional customer support email response regarding this issue: " + emailBody, session_id: "email_draft" })
        });
        const chatRes = await res.json();
        setEmailDraft(chatRes.response);
        setIsDrafting(false);
    } catch(err) {
      setEmailDraft('Failed to draft email.');
      setIsDrafting(false);
    }
  })();
  `
);

// Fix Live Record
content = content.replace(
  /const handleLiveRecord = \(\) => \{[\s\S]*?\}\, 2000\);\n  \};\n/,
  `const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const handleLiveRecord = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('file', blob, 'recording.webm');
        
        try {
          const res = await fetch('http://127.0.0.1:8000/api/transcribe', {
            method: 'POST',
            body: formData
          });
          const data = await res.json();
          setLiveTranscript(data.transcript);
        } catch(err) {
          alert("Transcription failed");
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch(err) {
      alert("Microphone access denied");
    }
  };\n`
);

// Fix Agentic Process
content = content.replace(
  /const handleAgenticProcess = async \(\) => \{[\s\S]*?\}\, 2000\);\n  \};/,
  `const handleAgenticProcess = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('file', blob, 'recording.webm');
        formData.append('channel', 'direct');
        
        try {
          const res = await fetch('http://127.0.0.1:8000/api/audio-complaint', {
            method: 'POST',
            body: formData
          });
          const data = await res.json();
          // Now save this to Node backend
          const response = await api.post('/complaints', {
            description: data.transcript,
            sourceChannel: 'direct'
          });
          const c = response.data.complaint;
          // Trigger analysis on Node backend to sync
          const analysisRes = await api.post(\`/complaints/\${c._id}/analyze\`);

          setAgenticResult({
            complaint: c,
            analysis: analysisRes.data.analysis,
            transcript: data.transcript
          });
        } catch(err) {
          console.error(err);
          alert("Agentic processing failed");
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch(err) {
      alert("Microphone access denied");
    }
  };`
);

fs.writeFileSync(file, content);
console.log("Patched SubmitComplaint.jsx");
