// --- CONFIGURATION ---

// NOTE: Since your frontend and backend are deployed separately (e.g., Netlify/Render), 
// we cannot use a simple relative path like '/api/generate-lesson-plan'.
// We must assume the backend URL is either globally set (best practice, but complex) 
// or, for simplicity in a single-file script, we'll assume the client URL base.

// FIX: Set this variable to your live Render Backend URL. 
// Example: const API_BASE_URL = "https://lesson-plan-ai-api.onrender.com";
// If you cannot set a global environment variable in your frontend host, 
// you MUST manually update this URL after deploying your Render backend.
const API_BASE_URL = "https://epp5-lessonplangenerator-ai.onrender.com"; // **<<< UPDATE THIS URL!** const FORM_ENDPOINT = `${API_BASE_URL}/api/generate-lesson-plan`; 

const form = document.getElementById('lessonPlanForm');
const outputSection = document.getElementById('lessonPlanOutput');
const generateBtn = document.getElementById('generateBtn');

// --- MAIN FORM HANDLER ---

form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Clear previous output and set loading state
    generateBtn.textContent = 'Bumubuo... Sandali lang!';
    generateBtn.disabled = true;
    outputSection.style.display = 'none';

    // 1. Get all basic and user-defined inputs
    const formData = {
        teacherName: document.getElementById('teacherName').value,
        school: document.getElementById('school').value,
        schoolYear: document.getElementById('schoolYear').value,
        subject: document.getElementById('subject').value,
        element: document.getElementById('eppSelect').value,
        quarter: document.getElementById('selectQuarter').value,
        week: document.getElementById('weekSelect').value,
        
        contentStandards: document.getElementById('contentStandards').value,
        performanceStandards: document.getElementById('performanceStandards').value,
        learningCompetencies: document.getElementById('learningCompetencies').value,
        content: document.getElementById('content').value,
        integration: document.getElementById('integration').value,
        materials: document.getElementById('materials').value,
    };

    // Construct a consolidated context for the AI prompt
    const context = `
        Gagawa ka ng lesson plan sa Filipino para sa EPP 5.
        Elemento: ${formData.element} | Markahan: ${formData.quarter} | Linggo: ${formData.week}
        Nilalaman (Topic): ${formData.content}
        Pamantayang Pangnilalaman: ${formData.contentStandards}
        Kasanayan at Layunin: ${formData.learningCompetencies}
        Tandaan: Ang lahat ng output ay dapat nakasulat sa Wikang Filipino.
    `;

    // 2. Define the requests for the AI
    const requests = {
        // AI Prompts: Detailed and contextualized
        refOutput: `${context} Gumawa ng BATAYANG SANGGUNIAN SA PAGKATUTO, batay sa aklat ng EPP 5 at online resources. Magbigay ng 3-4 entries.`,
        balikAralOutput: `${context} Gumawa ng 1. Maikling Balik-aral. Magbigay ng 2-3 tanong na nakatuon sa nakaraang aralin.`,
        feedbackOutput: `${context} Gumawa ng 2. Pidbak: Tanong-Tugon. Magbigay ng 2-3 tanong para sa quick check ng pag-unawa.`,
        hookActivityOutput: `${context} Gumawa ng 1. Panghikayat na Gawain. Isang simpleng laro o aktibidad na may 2-3 hakbang.`,
        importanceOutput: `${context} Gumawa ng 2. Paglinang sa Kahalagahan sa Pagkatuto. Magbigay ng 3-4 na mahahalagang punto na isusulat sa loob ng bilog.`,
        vocabularyOutput: `${context} Gumawa ng 3. Paghawan ng Bokabolaryo. Magbigay ng 3-4 na mahihirap na salita mula sa Nilalaman/Topic, kasama ang depinisyon.`,
        processingOutput: `${context} Gumawa ng 1. Pagproseso sa Pag-unawa. Magbigay ng maikling talakayan (2-3 talata) at 2-3 tanong.`,
        guidedPracticeOutput: `${context} Gumawa ng 2. Pinatnubayang Pagsasanay. Isang simpleng gawain na ginagawa nang pangkat/magkasama. Magbigay ng 3 hakbang.`,
        applicationOutput: `${context} Gumawa ng 3. Paglalapat at Pag-uugnay. Isang indibidwal na gawain na nag-uugnay ng aralin sa tunay na buhay. Magbigay ng 3-4 na tanong/scenario.`,
        takeawayOutput: `${context} Gumawa ng 1. Pabaong Pagkatuto. Isang concise na paglalahat (generalization) ng buong aralin sa 2-3 pangungusap.`,
        assessmentOutput: `${context} Gumawa ng 1. Pagsusulit (5 items). Multiple Choice o Identification (fill in the blanks) batay sa Nilalaman/Topic.`,
    };

    // 3. Loop through all requests and send to the API
    const outputKeys = Object.keys(requests);
    const promises = outputKeys.map(key => callApi(requests[key]));
    
    try {
        const results = await Promise.all(promises);

        // 4. Update the DOM with the results
        outputKeys.forEach((key, index) => {
            document.getElementById(key).innerHTML = results[index];
        });

        // Display the output and restore button
        outputSection.style.display = 'block';

    } catch (error) {
        // Display a user-friendly error from the server
        const errorMessage = error.message.includes("HTTP error") 
                           ? `May naganap na error sa server: ${error.message}` 
                           : 'Hindi makakonekta. Paki-check ang iyong network at URL.';

        alert(`Generation Failed: ${errorMessage}`);
        console.error('API Generation Error:', error);
        
    } finally {
        generateBtn.textContent = 'Bumuo ng Lesson Plan';
        generateBtn.disabled = false;
    }
});

/**
 * Function to securely call the Backend API Endpoint (Render)
 * @param {string} prompt The specific instructional prompt for the AI
 * @returns {Promise<string>} The generated text content
 */
async function callApi(prompt) {
    const response = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: prompt }),
    });

    if (!response.ok) {
        // If the server sends a 503 (timeout), the text response will contain the JSON error message
        let errorBody = await response.json().catch(() => ({ error: `HTTP status ${response.status}` }));
        throw new Error(`HTTP error! status: ${response.status}. Server message: ${errorBody.error || 'Unknown error.'}`);
    }

    const data = await response.json();
    return data.generatedText; // The expected field from the backend/index.js
}
