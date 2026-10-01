const fs = require('fs');

let file = 'src/components/complaints/AgenticMode.jsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('import api from')) {
    content = content.replace(
        /import \{ motion \} from 'framer-motion';/,
        `import { motion } from 'framer-motion';\nimport api from '../../services/api';`
    );
}

// Add complaint saving to the processAudio function
content = content.replace(
    /const data = await response\.json\(\);\n\s*setCurrentStep\(PIPELINE_STEPS\.length - 1\);/,
    `const data = await response.json();
      
      // Save to backend
      let savedComplaint = null;
      try {
          // Attempt to register it as a formal complaint
          const dbRes = await api.post('/complaints', { description: data.transcript, channel: 'direct', category: data.analysis?.category, priority: data.analysis?.priority });
          savedComplaint = dbRes.data.complaint;
      } catch(e) {
          console.error("DB Save failed", e);
      }
      
      // Merge saved complaint data so UI displays ID correctly
      if (savedComplaint) {
          data.complaint = { id: savedComplaint._id };
      }
      
      setCurrentStep(PIPELINE_STEPS.length - 1);`
);

fs.writeFileSync(file, content);
console.log("Updated AgenticMode to save to DB");
