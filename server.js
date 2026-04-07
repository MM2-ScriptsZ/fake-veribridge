const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// ==================== CONFIGURATION ====================
const VERIFICATION_CONFIG = {
    baseDomain: process.env.BASE_URL || 'https://fake-veribridge.vercel.app',
    // No redirect after verification – just a clean fake link
};

// ==================== EXPRESS SETUP ====================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Generate fake verification link with random 12 numbers
app.post('/api/generate', (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'No URL provided', success: false });
    }

    // Validate that it's a Roblox URL (basic check)
    if (!url.includes('roblox.com')) {
        return res.status(400).json({ error: 'Please enter a valid Roblox URL', success: false });
    }

    // Generate 12 random digits
    const randomNumbers = Math.floor(100000000000 + Math.random() * 900000000000).toString();
    
    // Build the fake link: https://fake-veribridge.vercel.app/verify=123456789012
    const generatedLink = `${VERIFICATION_CONFIG.baseDomain}/verify=${randomNumbers}`;

    res.json({
        success: true,
        originalUrl: url,
        generatedUrl: generatedLink,
    });
});

// Optional: return config (not strictly needed for this simple version)
app.get('/api/config', (req, res) => {
    res.json({
        baseDomain: VERIFICATION_CONFIG.baseDomain,
        message: 'Fake VeriBridge – generates random 12‑digit verify links'
    });
});

// Start server
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Fake VeriBridge Gen running on http://localhost:${PORT}`);
        console.log(`Generated links will look like: ${VERIFICATION_CONFIG.baseDomain}/verify=XXXXXXXXXXXX`);
    });
}

module.exports = app;