import fs from 'fs';
const file = 'src/features/parent/pages/ChildProgressPage.tsx';
let data = fs.readFileSync(file, 'utf8');

data = data.replace(/color: "#111827"/g, 'color: "var(--text-primary)"');
data = data.replace(/color: "#1e293b"/g, 'color: "var(--text-primary)"');
data = data.replace(/color: "#6b7280"/g, 'color: "var(--text-secondary)"');
data = data.replace(/color: "#475569"/g, 'color: "var(--text-secondary)"');
data = data.replace(/color: "#334155"/g, 'color: "var(--text-secondary)"');
data = data.replace(/color: "#94a3b8"/g, 'color: "var(--text-tertiary)"');
data = data.replace(/color: "#64748b"/g, 'color: "var(--text-tertiary)"');

data = data.replace(/background: "#fff"/g, 'background: "var(--card-bg)"');
data = data.replace(/background: "#f8fafc"/g, 'background: "var(--bg-subtle)"');
data = data.replace(/background: "#f1f5f9"/g, 'background: "var(--bg-hover)"');

data = data.replace(/backgroundColor: "#e0f2fe"/g, 'backgroundColor: "var(--bg-subtle)"');

data = data.replace(/border: "1px solid #e8ecf1"/g, 'border: "1px solid var(--border-color)"');
data = data.replace(/border: "1px solid #e2e8f0"/g, 'border: "1px solid var(--border-color)"');
data = data.replace(/border: "1px dashed #cbd5e1"/g, 'border: "1px dashed var(--border-color)"');
data = data.replace(/borderBottom: "2px solid #e2e8f0"/g, 'borderBottom: "2px solid var(--border-color)"');

fs.writeFileSync(file, data);
console.log('Done');
