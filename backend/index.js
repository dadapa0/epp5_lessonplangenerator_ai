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
const ai = new GoogleGenAI({});

// 3. Server Setup
const app = express();
const PORT = process.env.PORT || 3000;

// Set a global timeout for the server to close idle sockets
const SERVER_TIMEOUT_MS = 60000; // 60 seconds

// --- MIDDLEWARE ---

app.use(cors({
    origin: '*', 
    methods: ['POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
}));

app.use(express.json());

// --- ROUTES ---

app.get('/', (req, res) => {
    res.status(200).send('Lesson Plan Generator Backend is running and healthy.');
});


// Main API Route for Generation
app.post('/api/generate-lesson-plan', async (req, res) => {
    const { prompt } = req.body;

    // Set a response timeout for this specific route.
    const RESPONSE_TIMEOUT_MS = 60000; // 60 seconds
    res.setTimeout(RESPONSE_TIMEOUT_MS, () => {
        console.warn('Request timed out after 60 seconds (response.setTimeout).');
        if (!res.headersSent) {
            res.status(503).json({ error: 'Nalampasan ang timeout (60s). Subukan ulit. (AI Service Unavailable)' });
            // IMPORTANT: Ensure the connection is closed after sending the error response
            res.end(); 
        }
    });
    
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
        console.error('Error during Gemini API call:', error.message);
        
        // Only send an error response if headers haven't already been sent 
        // by the timeout handler (503 error).
        if (!res.headersSent) {
            res.status(500).json({ 
                error: `Naganap ang internal server error sa pag-access sa AI service. (${error.message.substring(0, 50)}...)`
            });
            res.end(); // Ensure clean exit after sending the 500 error
        }
    }
});


// --- SERVER STARTUP ---

const server = app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    console.log(`Access the API at http://localhost:${PORT}`);
});

server.setTimeout(SERVER_TIMEOUT_MS); 
console.log(`Server socket timeout set to ${SERVER_TIMEOUT_MS / 1000} seconds.`);
    console.log(`Server listening on port ${PORT}`);
    console.log(`Access the API at http://localhost:${PORT}`);
});

// Set a global socket timeout on the server to handle idle connections
server.setTimeout(SERVER_TIMEOUT_MS); 
console.log(`Server socket timeout set to ${SERVER_TIMEOUT_MS / 1000} seconds.`);
