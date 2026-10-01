const fs = require('fs');
const file = 'src/pages/shared/SubmitComplaint.jsx';
let content = fs.readFileSync(file, 'utf8');

// Fix API endpoints for CSE
content = content.replace(
  /await api\.post\('\/complaints', \{/g,
  `await api.post(user?.role === 'cse' ? '/complaints/staff' : '/complaints', {`
);

// Fix disabled={isRecording} on buttons
content = content.replace(/disabled=\{isRecording\}/g, '');

fs.writeFileSync(file, content);
console.log("Patched endpoints and disabled buttons");
