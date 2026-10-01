const fs = require('fs');

let file = 'src/pages/shared/SubmitComplaint.jsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('import AgenticMode')) {
  content = content.replace(
    /import \{ useAuth \} from '\.\.\/\.\.\/context\/AuthContext';/,
    `import { useAuth } from '../../context/AuthContext';\nimport AgenticMode from '../../components/complaints/AgenticMode';\nimport LiveD2DSession from '../../components/complaints/LiveD2DSession';`
  );
}

// Replace view === 'agentic' entirely
content = content.replace(
  /\{view === 'agentic' && \([\s\S]*?\)\}\n\s*\}\n\s*<\/AnimatePresence>/,
  `{view === 'agentic' && (
          <motion.div key="agentic" initial={{y:20, opacity:0}} animate={{y:0, opacity:1}}>
             <AgenticMode onContinueAsText={() => navigate('/customer/complaints')} />
          </motion.div>
        )}
      </AnimatePresence>`
);

// We should also replace 'live' to use LiveD2DSession
content = content.replace(
  /\{view === 'live' && \([\s\S]*?\}\n\s*\{view === 'agentic'/,
  `{view === 'live' && (
          <motion.div key="live" initial={{y:20, opacity:0}} animate={{y:0, opacity:1}}>
            <LiveD2DSession onFinish={async (transcript) => {
              if (transcript) {
                 try {
                     const endpoint = user?.role === 'cse' ? '/complaints/staff' : '/complaints';
                     const res = await api.post(endpoint, { description: "TRANSCRIPT: " + transcript, channel: 'Direct' });
                     alert("Complaint logged! ID: " + res.data.complaint._id);
                     navigate('/customer/complaints');
                 } catch (e) {
                     alert("Failed to register complaint.");
                 }
              }
            }} />
          </motion.div>
        )}
        {view === 'agentic'`
);

fs.writeFileSync(file, content);
console.log("Updated SubmitComplaint to use AgenticMode and LiveD2DSession");
