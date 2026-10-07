import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SahayakAI() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', content: "Namaste! I am Sahayak AI. How can I assist you with your queries or complaints today?" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    
    // Build history for context BEFORE adding the new user message
    const history = messages.map(m => ({
      role: m.role === 'ai' ? 'assistant' : 'user',
      content: m.content
    }));

    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setIsTyping(true);
    
    try {
      const res = await fetch('http://127.0.0.1:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, history })
      });
      const data = await res.json();
      
      let reply = data.reply || "I am processing your request.";
      
      // Auto register complaint if AI flagged it
      if (data.requires_complaint) {
        try {
           const token = localStorage.getItem('resolvo_token');
           const user = JSON.parse(localStorage.getItem('user') || '{}');
           if (token) {
               const historyText = history.map(m => m.role + ": " + m.content).join("\n") + "\nuser: " + userMsg;
               const endpoint = user.role === 'customer' ? '/api/complaints' : '/api/complaints/staff';
               const nodeRes = await fetch(`http://localhost:5000${endpoint}`, {
                   method: 'POST',
                   headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                   body: JSON.stringify({ description: historyText, channel: 'text' })
               });
               if (nodeRes.ok) {
                   const nodeData = await nodeRes.json();
                   reply += ` (Complaint ID: ${nodeData.complaint.complaintId || nodeData.complaint._id} has been registered)`;
               }
           }
        } catch(err) {
           console.error("Failed to auto register complaint:", err);
        }
      }

      setMessages(prev => [...prev, { role: 'ai', content: reply }]);
    } catch(e) {
      setMessages(prev => [...prev, { role: 'ai', content: "Sorry, I am facing network issues at the moment." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-indigo-700 hover:scale-105 transition-all z-50"
      >
        <Bot size={28} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-24 right-6 w-80 md:w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden z-50"
          >
            <div className="bg-indigo-600 p-4 flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <Bot size={20} />
                <span className="font-bold">Sahayak AI</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:bg-indigo-700 p-1 rounded">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-slate-50 flex flex-col gap-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'self-end' : 'self-start'}`}>
                  {msg.role === 'ai' && <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0"><Bot size={16}/></div>}
                  <div className={`p-3 rounded-xl text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm'}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-2 max-w-[85%] self-start">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0"><Bot size={16}/></div>
                  <div className="p-3 rounded-xl text-sm bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm">
                    ...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-3 bg-white border-t border-slate-200 flex gap-2">
              <input 
                type="text" 
                value={input} 
                onChange={e=>setInput(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                className="flex-1 px-3 py-2 border border-slate-200 rounded-full text-sm focus:outline-none focus:border-indigo-500"
                placeholder="Ask Sahayak..."
              />
              <button 
                onClick={handleSend}
                className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center shrink-0 hover:bg-indigo-700"
              >
                <Send size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
