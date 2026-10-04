const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/', (req, res) => {
    res.json({ status: 'online', message: 'Nova AI Backend is running' });
});

app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ error: 'Message required' });

        const GEMINI_KEY = process.env.GEMINI_API_KEY;
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
            {
                contents: [{
                    parts: [{
                        text: `You are Nova AI, a helpful coding assistant. Reply in the same language the user writes in.\n\nUser: ${message}`
                    }]
                }]
            },
            { headers: { 'Content-Type': 'application/json' } }
        );

        const aiReply = response.data.candidates[0].content.parts[0].text;
        res.json({ reply: aiReply });
    } catch (error) {
        res.status(500).json({ error: 'AI failed', details: error.message });
    }
});

app.post('/api/review', async (req, res) => {
    try {
        const { code, filename } = req.body;
        const GEMINI_KEY = process.env.GEMINI_API_KEY;
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
            {
                contents: [{
                    parts: [{
                        text: `Review this code (${filename}) and return ONLY JSON with "issues" array. Each: { "severity": "HIGH|MEDIUM|LOW", "title": "...", "description": "..." }. Code: ${code}`
                    }]
                }],
                generationConfig: { responseMimeType: 'application/json' }
            },
            { headers: { 'Content-Type': 'application/json' } }
        );

        let parsed;
        try { parsed = JSON.parse(response.data.candidates[0].content.parts[0].text); } 
        catch { parsed = { issues: [] }; }
        res.json(parsed);
    } catch (error) {
        res.status(500).json({ issues: [{ severity: 'HIGH', title: 'Backend Error', description: error.message }] });
    }
});

app.post('/api/build', (req, res) => {
    res.json({ status: 'queued', buildId: 'BUILD-' + Date.now(), message: 'Build queued' });
});

module.exports = app;
