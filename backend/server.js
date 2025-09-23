const express = require('express');
const path = require('path');
const pg = require('pg');

const app = express();
const port = process.env.PORT || 3000;

// --- DATABASE CONFIGURATION ---
const dbConfig = {
    user: process.env.DB_USER || 'allable_user',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'allable_db',
    password: process.env.DB_PASSWORD || 'Maha_251',
    port: process.env.DB_PORT || 5432,
};

const pool = new pg.Pool(dbConfig);

// --- MIDDLEWARE ---
app.use(express.json()); 
app.use(express.static(path.join(__dirname, 'public')));

// --- API ROUTES ---

// Serve the main application page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// GET user preferences
app.get('/api/user/:userId/preferences', async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await pool.query('SELECT * FROM user_preferences WHERE user_id = $1', [userId]);
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ error: 'Preferences not found for this user.' });
        }
    } catch (err) {
        console.error('Error fetching preferences:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST or UPDATE user preferences
app.post('/api/user/preferences', async (req, res) => {
    // Output preference is removed, only language is needed.
    const { userId, profileType, language } = req.body;

    if (!userId || !profileType || !language) {
        return res.status(400).json({ error: 'Missing required fields: userId, profileType, language.' });
    }

    try {
        // UPSERT logic: Insert or update if conflict on user_id
        const query = `
            INSERT INTO user_preferences (user_id, profile_type, language, last_updated)
            VALUES ($1, $2, $3, NOW())
            ON CONFLICT (user_id)
            DO UPDATE SET
                profile_type = EXCLUDED.profile_type,
                language = EXCLUDED.language,
                last_updated = NOW();
        `;
        await pool.query(query, [userId, profileType, language]);
        res.status(201).json({ message: 'Preferences saved successfully.' });
    } catch (err) {
        console.error('Error saving preferences:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// --- MOCK AI/ML ENDPOINTS ---
// These endpoints simulate the behavior of the AI models.
// In a real application, these would make calls to Python services (Flask/FastAPI).

// Image-to-Speech endpoint
app.post('/api/ml/image-to-speech', (req, res) => {
    console.log('Received image-to-speech request.');
    const MOCK_DESCRIPTIONS = [
        "A person is walking towards a wooden door.",
        "A red apple is on a white table.",
        "Text detected: DANGER, DO NOT ENTER.",
        "A city street with cars and pedestrians."
    ];
    const description = MOCK_DESCRIPTIONS[Math.floor(Math.random() * MOCK_DESCRIPTIONS.length)];
    res.json({ description });
});

// Sign-to-Speech endpoint
app.post('/api/ml/sign-to-speech', (req, res) => {
    console.log('Received sign-to-speech request.');
    const MOCK_PHRASES = ["Hello", "Thank you", "Water, please", "Where is the restroom?"];
    const phrase = MOCK_PHRASES[Math.floor(Math.random() * MOCK_PHRASES.length)];
    res.json({ spokenText: phrase });
});

// Speech-to-Text endpoint
app.post('/api/ml/speech-to-text', (req, res) => {
    const { audioData } = req.body; 
    console.log('Received speech-to-text request.');
    if (!audioData) {
        return res.status(400).json({error: "No audio data received."});
    }
    const MOCK_TRANSCRIPTS = ["The meeting is at 2 PM.", "Let's go to the park.", "What is the weather like today?"];
    const transcript = MOCK_TRANSCRIPTS[Math.floor(Math.random() * MOCK_TRANSCRIPTS.length)];
    res.json({ transcript, icons: ['📅', '⏰'] });
});


// --- SERVER INITIALIZATION ---
app.listen(port, () => {
    console.log(`ALLABLE server running at http://localhost:${port}`);
});

