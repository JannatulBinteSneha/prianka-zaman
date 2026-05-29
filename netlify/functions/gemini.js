// Netlify Function to securely call Gemini API
// GEMINI_API_KEY should be set as an environment variable in Netlify

exports.handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    // Parse request body
    let body;
    try {
        body = JSON.parse(event.body);
    } catch (error) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Invalid JSON in request body' })
        };
    }

    const { message, actressData } = body;

    // Validate required fields
    if (!message || !actressData) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Missing required fields: message and actressData' })
        };
    }

    // Get API key from environment variable
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
        console.error('GEMINI_API_KEY not set in environment variables');
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Server configuration error' })
        };
    }

    const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';

    // Build system prompt
    const systemPrompt = `You are a helpful general assistant on this website.

You can help users with:
- Any general questions they ask (weather, facts, advice, etc.)
- Questions about the actress using this data:

${actressData}

Rules:
- Be friendly, helpful and conversational
- For actress related questions use only the provided dataset
- For general questions answer naturally and helpfully
- Keep answers short, clear and easy to read (2-3 sentences max)
- Use emojis occasionally to keep it friendly`;

    // Build request body for Gemini API
    const requestBody = {
        contents: [
            {
                parts: [
                    {
                        text: systemPrompt + '\n\nUser Question: ' + message
                    }
                ]
            }
        ],
        generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 500,
        }
    };

    try {
        // Call Gemini API
        const response = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-goog-api-key': GEMINI_API_KEY
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            console.error(`Gemini API Error: ${response.status}`);
            return {
                statusCode: response.status,
                body: JSON.stringify({ error: `Gemini API Error: ${response.status}` })
            };
        }

        const data = await response.json();

        // Extract response text
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            const reply = data.candidates[0].content.parts[0].text;
            return {
                statusCode: 200,
                body: JSON.stringify({ reply })
            };
        } else {
            return {
                statusCode: 200,
                body: JSON.stringify({ reply: 'I could not generate a response. Please try again.' })
            };
        }
    } catch (error) {
        console.error('Error calling Gemini API:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to process your request' })
        };
    }
};
