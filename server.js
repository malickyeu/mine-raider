const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from project root
app.use(express.static(path.join(__dirname), {
    // Correct MIME types for ES modules
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
    }
}));

app.listen(PORT, () => {
    console.log(`\n  ⛏️  Mine Raider server běží!\n`);
    console.log(`  → Otevři v prohlížeči: http://localhost:${PORT}\n`);
});
