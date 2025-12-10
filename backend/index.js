import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';

// --- CONFIGURATION ---

// 1. Securely check for the API key from environment variables (Render will set this)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
    console.error("FATAL ERROR: GEMINI_API_KEY is not set in environment variables.");
    process.exit(1); 
}

// 2. Initialize the Gemini AI client
// The GoogleGenAI class automatically looks for the GEMINI_API_KEY in process.env
const ai = new GoogleGenAI({});

// 3. Server Setup
const app = express();
const PORT = process.env.PORT || 3000; // Use port provided by Render or default to 3000

// --- MIDDLEWARE ---

// Enable Cross-Origin Resource Sharing (CORS)
// IMPORTANT: This allows your frontend (docs) on a different domain (Netlify/Vercel) 
// to send requests to this backend (Render).
// In a production environment, you should restrict this to your specific frontend domain.
app.use(cors({
    origin: '*', // Allows all origins for simplicity, restrict this later!
    methods: ['POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
}));

// Enable body parsing for JSON data (to read the prompt)
app.use(express.json());


// --- ROUTES ---

// Health Check Route (Good for Render monitoring)
app.get('/', (req, res) => {
    res.status(200).send('Lesson Plan Generator Backend is running and healthy.');
});


// Main API Route for Generation
app.post('/api/generate-lesson-plan', async (req, res) => {
    const { prompt } = req.body;

    // Basic input validation
    if (!prompt) {
        return res.status(400).json({ error: 'Missing "prompt" in request body.' });
    }

    try {
        console.log(`Received prompt for generation. Length: ${prompt.length}`);

        // --- GEMINI API CALL ---
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash', // Fast and capable model for text generation
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                temperature: 0.8,
                maxOutputTokens: 1500,
            }
        });
        // --- END API CALL ---

        const generatedText = response.candidates[0]?.content.parts[0]?.text || 
                             "Hindi makabuo ng sagot. Subukan ulit. (AI generation failed)";

        // Send the generated text back to the frontend
        res.status(200).json({ generatedText });

    } catch (error) {
        console.error('Error during Gemini API call:', error);
        // Send a generic error message back to the client
        res.status(500).json({ 
            error: 'Naganap ang internal server error sa pag-access sa AI service.' 
        });
    }
});


// --- SERVER STARTUP ---

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    console.log(`Access the API at http://localhost:${PORT}`);
});

