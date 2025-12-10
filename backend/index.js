import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';

// --- CONFIGURATION ---

// 1. Securely check for the API key
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
    console.error("FATAL ERROR: GEMINI_API_KEY is not set in environment variables. Check Render settings.");
    process.exit(1); 
}

// 2. Initialize the Gemini AI client
// Note: We use the default client initialization. Explicit timeout for the client is 
// handled via Node's HTTP agent or a wrapper, but we rely on the Express timeout below.
const ai = new GoogleGenAI({});

// 3. Server Setup
const app = express();
const PORT = process.env.PORT || 3000;

// Set a global timeout for the server to close idle sockets
const SERVER_TIMEOUT_MS = 60000; // 60 seconds

// --- MIDDLEWARE ---

// CORS Configuration: Allows your frontend (docs) to talk to this backend (Render)
// IMPORTANT: In production, change '*' to your specific frontend URL (e.g., 'https://your-app.netlify.app')
app.use(cors({
    origin: '*', 
    methods: ['POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
}));

// Enable body parsing for JSON data
app.use(express.json());

// --- ROUTES ---

// Health Check Route (Good for Render monitoring)
app.get('/', (req, res) => {
    res.status(200).send('Lesson Plan Generator Backend is running and healthy.');
});


// Main API Route for Generation
app.post('/api/generate-lesson-plan', async (req, res) => {
    const { prompt } = req.body;

    // Set a response timeout for this specific route.
    // If the request takes longer than 60 seconds, it will send a 503 error.
    const RESPONSE_TIMEOUT_MS = 60000; // 60 seconds
    res.setTimeout(RESPONSE_TIMEOUT_MS, () => {
        console.warn('Request timed out after 60 seconds (response.setTimeout).');
        // Check if headers have already been sent before sending the timeout response
        if (!res.headersSent) {
            res.status(503).json({ error: 'Nalampasan ang timeout (60s). Subukan ulit. (AI Service Unavailable)' });
        }
        res.end();
    });
    
    // Basic input validation
    if (!prompt) {
        return res.status(400).json({ error: 'Missing "prompt" in request body.' });
    }

    try {
        console.log(`Received prompt for generation. Length: ${prompt.length}.`);

        // --- GEMINI API CALL ---
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash', 
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                temperature: 0.8,
                maxOutputTokens: 1500,
            }
        });
        // --- END API CALL ---

        const generatedText = response.candidates?.[0]?.content?.parts[0]?.text || 
                             "Hindi makabuo ng sagot. Subukan ulit. (AI generation failed)";

        // Send the generated text back to the frontend
        res.status(200).json({ generatedText });

    } catch (error) {
        // Log the detailed error on the server side
        console.error('Error during Gemini API call:', error.message);
        
        // Send a generic error message back to the client if the error occurred 
        // before the timeout handler caught it.
        if (!res.headersSent) {
             // 408 is Request Timeout, 500 is Internal Server Error
            res.status(500).json({ 
                error: `Naganap ang internal server error sa pag-access sa AI service. (${error.message.substring(0, 50)}...)`
            });
        }
    }
});


// --- SERVER STARTUP ---

const server = app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    console.log(`Access the API at http://localhost:${PORT}`);
});

// Set a global socket timeout on the server to handle idle connections
server.setTimeout(SERVER_TIMEOUT_MS); 
console.log(`Server socket timeout set to ${SERVER_TIMEOUT_MS / 1000} seconds.`);
