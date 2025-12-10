// **NOTE ON SECURITY:** // In a real application, replace 'YOUR_BACKEND_ENDPOINT' 
// with a server-side endpoint that securely calls the Gemini API, 
// rather than exposing the API key directly in client-side code.

const FORM_ENDPOINT = '/api/generate-lesson-plan'; // Hypothetical backend endpoint
const form = document.getElementById('lessonPlanForm');
const outputSection = document.getElementById('lessonPlanOutput');
const generateBtn = document.getElementById('generateBtn');

form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
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
    // We send a different, specific prompt for each required output.
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

    // 3. Loop through all requests and send to the API (or backend)
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
        generateBtn.textContent = 'Bumuo ng Lesson Plan';
        generateBtn.disabled = false;

    } catch (error) {
        console.error('API Generation Error:', error);
        alert('May naganap na error sa pagbuo ng lesson plan. Paki-check ang console para sa detalye.');
        generateBtn.textContent = 'Bumuo ng Lesson Plan';
        generateBtn.disabled = false;
    }
});

/**
 * Function to call the API for content generation
 * @param {string} prompt The specific instructional prompt for the AI
 * @returns {Promise<string>} The generated text content
 */
async function callApi(prompt) {
    // **This is where the API call happens. Replace with your actual implementation.**
    
    // ----------------------------------------------------------------------
    // OPTION A: Using a secure Backend Endpoint (RECOMMENDED)
    // ----------------------------------------------------------------------
    /*
    const response = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: prompt }),
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.generatedText; // Assuming the backend returns { generatedText: "..." }
    */

    // ----------------------------------------------------------------------
    // OPTION B: Direct Gemini API call for PROTOTYPING ONLY (INSECURE)
    // ----------------------------------------------------------------------
    
    // Replace YOUR_API_KEY with your actual Gemini API Key
    const GEMINI_API_KEY = 'YOUR_API_KEY_HERE'; 
    const GEMINI_MODEL = 'gemini-2.5-flash';
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    const payload = {
        contents: [{
            parts: [{ text: prompt }]
        }],
        config: {
            temperature: 0.8, // Adjust creativity
            maxOutputTokens: 1024 // Adjust length as needed
        }
    };

    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API Error! Status: ${response.status}. Details: ${errorText}`);
    }

    const data = await response.json();
    // Safely extract the generated text
    try {
        return data.candidates[0].content.parts[0].text;
    } catch (e) {
        console.warn("Could not parse Gemini response:", data);
        return "Hindi makabuo ng sagot. Subukan ulit. (AI parse error)";
    }
}


