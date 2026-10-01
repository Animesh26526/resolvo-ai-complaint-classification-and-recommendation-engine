const fs = require('fs');

let file = 'src/components/complaints/AgenticMode.jsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('import { useAuth }')) {
    content = content.replace(
        /import React, \{ useState, useRef, useEffect \} from 'react';/,
        `import React, { useState, useRef, useEffect } from 'react';\nimport { useAuth } from '../../context/AuthContext';`
    );
}

content = content.replace(
    /const AgenticMode = \(\{ onContinueAsText \}\) => \{/,
    `const AgenticMode = ({ onContinueAsText }) => {\n  const { user } = useAuth();`
);

content = content.replace(
    /const dbRes = await api\.post\('\/complaints', \{/,
    `const dbRes = await api.post(user?.role === 'cse' ? '/complaints/staff' : '/complaints', {`
);

fs.writeFileSync(file, content);
console.log("Fixed AgenticMode DB Save endpoint");
