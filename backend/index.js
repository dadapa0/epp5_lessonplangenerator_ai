import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';

// --- CONFIGURATION ---

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// 1. Check for the API key (Fails hard if missing)
if (!GEMINI_API_KEY) {
    console.error("FATAL ERROR: GEMINI_API_KEY is not set in environment variables.");
    process.exit(1); 
}

// 2. Initialize the Gemini AI client (Explicitly passing the key)
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY }); 

// 3. Server Setup
const app = express();
const PORT = process.env.PORT || 3000;
const SERVER_TIMEOUT_MS = 60000; // 60 seconds

// --- MIDDLEWARE ---

// Configure CORS for global access
app.use(cors({
    origin: '*', 
    methods: ['POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
}));

// Enable JSON body parsing
app.use(express.json());

// --- ROUTES ---

// Health Check Route
app.get('/', (req, res) => {
    res.status(200).send('Lesson Plan Generator Backend is running and healthy.');
});


// Main API Route for Generation
app.post('/api/generate-lesson-plan', async (req, res) => {
    const { prompt } = req.body;

    // Set a response timeout for this specific route (60s)
    const RESPONSE_TIMEOUT_MS = 60000;
    res.setTimeout(RESPONSE_TIMEOUT_MS, () => {
        console.warn('Request timed out after 60 seconds.');
        if (!res.headersSent) {
            res.status(503).json({ error: 'Nalampasan ang timeout (60s). Subukan ulit. (AI Service Unavailable)' });
        }
        res.end();
    });
    
    // Input validation
    if (!prompt) {
        return res.status(400).json({ error: 'Missing "prompt" in request body.' });
    }

    try {
        console.log(`Received prompt. Length: ${prompt.length}.`);

        // Perform the Gemini API call
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash', 
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                temperature: 0.8,
                maxOutputTokens: 1500,
            }
        });

        // Safely extract the generated text
        const generatedText = response.candidates?.[0]?.content?.parts[0]?.text || 
                             "Hindi makabuo ng sagot. Subukan ulit. (AI generation failed)";

        // Success response
        return res.status(200).json({ generatedText });

    } catch (error) {
        console.error('Error during Gemini API call:', error.message);
        
        // Handle failure if the response hasn't been sent yet (i.e., not a timeout 503 error)
        if (!res.headersSent) {
            return res.status(500).json({ 
                error: `Naganap ang internal server error sa pag-access sa AI service. (${error.message.substring(0, 50)}...)`
            });
        }
    }
}); // <--- FINAL CLOSURE FOR app.post (This is the critical line that should not fail)


// --- SERVER STARTUP ---

const server = app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

server.setTimeout(SERVER_TIMEOUT_MS); 
console.log(`Server socket timeout set to ${SERVER_TIMEOUT_MS / 1000} seconds.`);
