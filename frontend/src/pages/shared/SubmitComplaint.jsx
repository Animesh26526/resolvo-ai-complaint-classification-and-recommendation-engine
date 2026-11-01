import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Mail, Users, Send, AlertTriangle, Bot, CheckCircle, Activity, Save, Mic, MicOff, Sparkles, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LiveD2DSession from '../../components/complaints/LiveD2DSession';

export default function SubmitComplaint() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState('selection'); // selection, text_init, text_chat, email, live, agentic
  const [sessionComplaint, setSessionComplaint] = useState(null);

  // Text Flow State
  const [directDesc, setDirectDesc] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const endOfChatRef = useRef(null);

  useEffect(() => {
    endOfChatRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleStartTextChat = async (e) => {
    e.preventDefault();
    if (!directDesc.trim()) return;
    setIsTyping(true);
    
    try {
      const response = await api.post(user?.role === 'cse' ? '/complaints/staff' : '/complaints', {
        description: directDesc,
        channel: 'text'
      });
      const c = response.data.complaint;
      setSessionComplaint(c);

      setChatMessages([
        { role: 'user', content: directDesc },
        { 
          role: 'assistant', 
          content: 'I have logged your complaint (ID: ' + c._id + '). How else can I help you?',
          isEscalated: false,
          isResolved: false
        }
      ]);
      setView('text_chat');
    } catch (err) {
      alert('Failed to log complaint');
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = { role: 'user', content: chatInput.trim() };
    const history = [...chatMessages, userMsg];
    setChatMessages(history);
    setChatInput('');
    setIsTyping(true);

    try {
      // Simulate follow up chat since current backend only analyzes the main complaint
      // Call ai-service chat
      const res = await fetch('http://127.0.0.1:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: chatInput.trim(), session_id: sessionComplaint._id })
      });
      const chatRes = await res.json();
      setChatMessages(prev => [...prev, { 
        role: 'assistant', content: chatRes.reply || 'Noted.', isEscalated: false, isResolved: false
      }]);
    } catch(e) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'System error' }]);
    }
    setIsTyping(false);
  };

  // Email State
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailDraft, setEmailDraft] = useState('');
  const [isDrafting, setIsDrafting] = useState(false);

  const handleEmailDraft = async () => {
    if (!emailBody.trim()) return;
    setIsDrafting(true);
    try {
      // Create a mock draft since backend doesn't have draft email endpoint
      
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
  
    } catch (e) {
      setEmailDraft('Failed to connect to AI server.');
      setIsDrafting(false);
    }
  };

  const handleEmailSubmit = async () => {
    if (!emailBody.trim()) return;
    try {
      const endpoint = user?.role === 'cse' ? '/complaints/staff' : '/complaints';
      const response = await api.post(endpoint, {
        description: `Subject: ${emailSubject}\nBody: ${emailBody}\nDraft: ${emailDraft}`,
        channel: 'email'
      });
      
      const compId = response.data.complaint.complaintId || response.data.complaint._id;
      const mailto = `mailto:cse@resolvo.com?subject=Complaint [${compId}]: ${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailDraft || emailBody)}`;
      window.location.href = mailto;

      alert(`Complaint logged successfully. Opening your email client to send to CSE.`);
      navigate(user?.role === 'cse' ? '/cse/dashboard' : '/customer/complaints');
    } catch (e) {
      alert('Failed to log email complaint.');
    }
  };

  // Audio / Live State mock
  const [isRecording, setIsRecording] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');

  const mediaRecorderRef = useRef(null);
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
  };

  const handleLiveRegister = async () => {
    try {
      const response = await api.post(user?.role === 'cse' ? '/complaints/staff' : '/complaints', {
        description: `TRANSCRIPT: ${liveTranscript}`,
        channel: 'text'
      });
      alert(`Complaint Registered! ID: ${response.data.complaint._id}`);
      navigate(user?.role === 'cse' ? '/cse/dashboard' : '/customer/complaints');
    } catch (e) {
      alert('Registration failed.');
    }
  };



  // Call Log Processing Mode
  const [callLogText, setCallLogText] = useState('');
  const [isProcessingCallLog, setIsProcessingCallLog] = useState(false);

  const handleCallLogSubmit = async () => {
    if (!callLogText.trim()) return;
    setIsProcessingCallLog(true);
    try {
      const resChat = await fetch('http://127.0.0.1:8000/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: "IGNORE ALL PREVIOUS INSTRUCTIONS. You are an internal backend processor, NOT a customer service assistant. DO NOT address the customer. Provide a strict, 3rd-person, 1-2 sentence factual summary of the core complaint from the following call transcript for an internal support ticket:\n\n" + callLogText })
      });
      const chatData = await resChat.json();
      const summary = chatData.reply || "Call Log Complaint";
      
      const endpoint = user?.role === 'cse' ? '/complaints/staff' : '/complaints';
      const res = await api.post(endpoint, {
        description: `SUMMARY: ${summary}\n\nRAW LOG:\n${callLogText}`,
        channel: 'call_log'
      });
      alert(`Complaint logged! ID: ${res.data.complaint._id || res.data.complaint.complaintId}`);
      navigate(user?.role === 'cse' ? '/cse/dashboard' : '/customer/complaints');
    } catch(e) {
      alert("Failed to process call log: " + (e.response?.data?.message || e.message));
    } finally {
      setIsProcessingCallLog(false);
    }
  };
  


  return (
    <div className="flex flex-col w-full p-6 lg:p-8 gap-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Receive Complaint</h1>
          <p className="text-sm text-slate-500">Select the channel to interact and document the customer issue.</p>
        </div>
        {(view !== 'selection') && (
          <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50" onClick={() => { setView('selection'); setSessionComplaint(null); }}>
            &larr; Back to Channels
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {view === 'selection' && (
          <motion.div key="selection" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:-translate-y-1 hover:shadow-md transition-all text-center" onClick={() => setView('text_init')}>
              <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-blue-50 text-blue-600"><MessageSquare size={32} /></div>
              <h3 className="font-bold text-lg mb-2">Text / Direct</h3>
              <p className="text-sm text-slate-500">Standard text-based entry system and interactive chatbot.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:-translate-y-1 hover:shadow-md transition-all text-center" onClick={() => setView('email')}>
              <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-purple-50 text-purple-600"><Mail size={32} /></div>
              <h3 className="font-bold text-lg mb-2">Email Interaction</h3>
              <p className="text-sm text-slate-500">Simulate tracking rules and AI drafting for email channels.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:-translate-y-1 hover:shadow-md transition-all text-center" onClick={() => setView('live')}>
              <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-green-50 text-green-600"><Users size={32} /></div>
              <h3 className="font-bold text-lg mb-2">Live Audio (D2D)</h3>
              <p className="text-sm text-slate-500">Record audio to transcribe and submit live issues.</p>
            </div>
            {user?.role === 'cse' && (
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:-translate-y-1 hover:shadow-md transition-all text-center" onClick={() => setView('call_log')}>
                <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-orange-50 text-orange-600"><FileText size={32} /></div>
                <h3 className="font-bold text-lg mb-2">Upload Call Log</h3>
                <p className="text-sm text-slate-500">Upload audio or paste raw transcript to extract issue and register.</p>
              </div>
            )}

          </motion.div>
        )}

        {view === 'text_init' && (
          <motion.div key="text_init" initial={{y:20, opacity:0}} animate={{y:0, opacity:1}} exit={{opacity:0}}>
            <div className="bg-white p-6 rounded-xl border border-slate-200 max-w-2xl mx-auto shadow-sm">
              <h2 className="text-xl font-bold mb-2">Direct Complaint Entry</h2>
              <p className="text-slate-500 mb-6">Provide the preliminary situation summary.</p>
              <form onSubmit={handleStartTextChat}>
                <textarea 
                  value={directDesc} onChange={(e) => setDirectDesc(e.target.value)}
                  placeholder="Describe the issue... (e.g. Broken packaging on batch #4)"
                  rows={4} required
                  className="w-full p-3 border border-slate-200 rounded-lg mb-4 focus:outline-none focus:border-blue-500"
                />
                <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50" disabled={isTyping}>
                  {isTyping ? 'Generating ID...' : 'Submit & Initialize Agent'}
                </button>
              </form>
            </div>
          </motion.div>
        )}

        {view === 'text_chat' && (
          <motion.div key="text_chat" initial={{y:20, opacity:0}} animate={{y:0, opacity:1}} className="bg-white border border-slate-200 rounded-xl flex flex-col h-[600px] shadow-sm">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <div className="flex gap-4 items-center">
                <span className="px-3 py-1 bg-blue-600 text-white text-xs rounded-full">Tracking: {sessionComplaint?._id}</span>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-slate-50">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex gap-4 max-w-[80%] ${msg.role === 'user' ? 'self-end' : 'self-start'}`}>
                  {msg.role === 'assistant' && <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0"><Bot size={16}/></div>}
                  <div className={`p-4 rounded-xl ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-800'}`}>
                    <p className="m-0">{msg.content}</p>
                    {msg.isEscalated && <div className="mt-2 text-xs text-red-500 flex items-center gap-1"><AlertTriangle size={12}/> AI recommends manual escalation</div>}
                  </div>
                </div>
              ))}
              {isTyping && <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center"><Bot size={16}/></div>
                <div className="p-4 rounded-xl bg-white border border-slate-200">...</div>
              </div>}
              <div ref={endOfChatRef} />
            </div>

            <div className="p-4 bg-white border-t border-slate-200 flex gap-2">
              <input type="text" value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendChat()} className="flex-1 p-3 rounded-full border border-slate-200 focus:outline-none focus:border-blue-500" placeholder="Type follow-up to customer..." />
              <button className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 shrink-0" onClick={handleSendChat}><Send size={18}/></button>
            </div>
          </motion.div>
        )}

        {view === 'email' && (
          <motion.div key="email" initial={{y:20, opacity:0}} animate={{y:0, opacity:1}} className="flex gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex-1">
              <h3 className="font-bold border-b border-slate-200 pb-2 mb-4">Compose Email</h3>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Subject</label>
                  <input type="text" value={emailSubject} onChange={e=>setEmailSubject(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg" placeholder="Email Subject" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Body</label>
                  <textarea value={emailBody} onChange={e=>setEmailBody(e.target.value)} placeholder="Describe the customer issue..." rows={8} className="w-full p-2 border border-slate-200 rounded-lg"></textarea>
                </div>
                <div className="flex gap-4">
                  <button className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-sm font-medium" onClick={handleEmailDraft} disabled={isDrafting}>
                    {isDrafting ? 'Drafting...' : 'Draft with AI'}
                  </button>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2" onClick={handleEmailSubmit}>
                    <Save size={16}/> Log Complaint
                  </button>
                </div>
              </div>
            </div>
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-sm flex-1">
              <h3 className="font-bold border-b border-slate-200 pb-2 mb-4">AI-Generated Draft</h3>
              <div className="text-sm text-slate-700 whitespace-pre-wrap">
                {emailDraft ? emailDraft : (
                  <div className="text-center mt-12 text-slate-400">
                    <Bot size={48} className="mx-auto mb-4 opacity-50"/>
                    <p>Draft response will appear here.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {view === 'call_log' && (
          <motion.div key="call_log" initial={{y:20, opacity:0}} animate={{y:0, opacity:1}} className="bg-white p-6 rounded-xl border border-slate-200 max-w-2xl mx-auto shadow-sm">
            <h2 className="text-2xl font-bold mb-2 text-slate-800">Process Call Audio & Transcript</h2>
            <p className="text-slate-500 text-sm mb-6">Upload an audio recording of the call to automatically transcribe it, or manually paste the transcript below.</p>
            
            <div className="mb-4">
              <label className="block w-full border-2 border-dashed border-slate-300 rounded-xl p-6 text-center cursor-pointer hover:bg-slate-50 hover:border-indigo-400 transition-colors">
                <input 
                  type="file" 
                  accept="audio/*" 
                  className="hidden" 
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    setIsProcessingCallLog(true);
                    try {
                      const formData = new FormData();
                      formData.append('file', file);
                      const res = await fetch('http://127.0.0.1:8000/api/transcribe', {
                        method: 'POST',
                        body: formData
                      });
                      const data = await res.json();
                      if (data.transcript) {
                        setCallLogText(prev => prev + (prev ? '\n\n' : '') + data.transcript);
                      } else {
                        alert("Transcription failed or returned empty.");
                      }
                    } catch(err) {
                      alert("Error uploading audio: " + err.message);
                    } finally {
                      setIsProcessingCallLog(false);
                      e.target.value = null;
                    }
                  }}
                />
                <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                  <Mic size={24} />
                </div>
                <span className="font-medium text-slate-700">Click to upload call audio</span>
                <span className="block text-xs text-slate-500 mt-1">Supports MP3, WAV, WEBM, M4A</span>
              </label>
            </div>

            <textarea
              className="w-full h-64 p-4 border border-slate-200 rounded-xl mb-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none text-sm text-slate-700"
              placeholder="The transcript will appear here. You can also paste manually..."
              value={callLogText}
              onChange={(e) => setCallLogText(e.target.value)}
            ></textarea>
            
            <div className="flex justify-end gap-3">
              <button className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-50 rounded-xl" onClick={() => setView('selection')}>Back</button>
              <button 
                disabled={isProcessingCallLog || !callLogText.trim()}
                className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                onClick={handleCallLogSubmit}
              >
                {isProcessingCallLog ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : <Sparkles size={18} />}
                Process & Register
              </button>
            </div>
          </motion.div>
        )}

        {view === 'live' && (
          <motion.div key="live" initial={{y:20, opacity:0}} animate={{y:0, opacity:1}}>
            <LiveD2DSession onFinish={async (transcript) => {
              if (transcript) {
                 try {
                     // Summarize to get main issue
                     const resChat = await fetch('http://127.0.0.1:8000/api/chat', {
                         method: 'POST',
                         headers: { 'Content-Type': 'application/json' },
                         body: JSON.stringify({ message: "Extract a concise 1-sentence main issue (max 10 words) from this transcript: " + transcript, session_id: "summary" })
                     });
                     const chatRes = await resChat.json();
                     const summary = chatRes.reply || "Live Audio Complaint";

                     const endpoint = user?.role === 'cse' ? '/complaints/staff' : '/complaints';
                     const res = await api.post(endpoint, { description: summary + "\n\n[Transcript available in AI analysis]", channel: 'live_convo' });
                     alert("Complaint logged! ID: " + res.data.complaint._id);
                     navigate(user?.role === 'cse' ? '/cse/dashboard' : '/customer/complaints');
                 } catch (e) {
                     alert("Failed to register complaint: " + (e.response?.data?.message || e.message));
                 }
              }
            }} />
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
