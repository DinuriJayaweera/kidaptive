const fs = require('fs');
let code = fs.readFileSync('d:/kidaptive/frontend/src/features/public/pages/LandingPage.tsx', 'utf8');

code = code.replace(/#c8e6f7/g, 'var(--landing-hero-bg, #c8e6f7)');
code = code.replace(/#ffffff/gi, 'var(--landing-bg, #ffffff)');
code = code.replace(/#fff([^a-zA-Z0-9])/gi, 'var(--landing-bg, #ffffff)$1'); // match #fff exactly, avoiding #ffffff
code = code.replace(/#E0F2FE/gi, 'var(--landing-feature-bg, #E0F2FE)');
code = code.replace(/#deeefe/gi, 'var(--landing-testim-bg, #deeefe)');

code = code.replace(/color: "#1a1a2e"/g, 'color: "var(--landing-text-main, #1a1a2e)"');
code = code.replace(/color: "#444"/g, 'color: "var(--landing-text-muted, #444)"');
code = code.replace(/color: "#777"/g, 'color: "var(--landing-text-muted, #777)"');

fs.writeFileSync('d:/kidaptive/frontend/src/features/public/pages/LandingPage.tsx', code);
console.log('Fixed LandingPage colors');
