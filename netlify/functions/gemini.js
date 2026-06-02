// Netlify Function to securely call Gemini API
// GEMINI_API_KEY should be set as an environment variable in Netlify
const https = require('https');

// Fallback logic to call the Gemini API using Node's native HTTPS module if fetch is missing
async function makePostRequest(url, headers, body) {
    if (typeof fetch === 'function') {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(body)
            });
            const data = await response.json();
            return {
                ok: response.ok,
                status: response.status,
                json: async () => data
            };
        } catch (e) {
            console.warn('Global fetch failed, trying https fallback:', e);
        }
    }

    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const bodyStr = JSON.stringify(body);
        const options = {
            hostname: urlObj.hostname,
            path: urlObj.pathname + urlObj.search,
            method: 'POST',
            headers: {
                ...headers,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(bodyStr)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({
                        ok: res.statusCode >= 200 && res.statusCode < 300,
                        status: res.statusCode,
                        json: async () => parsed
                    });
                } catch (err) {
                    reject(new Error(`Failed to parse JSON response: ${data}`));
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.write(bodyStr);
        req.end();
    });
}

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

    const { message, actressData = '', history = [] } = body;

    // Validate required fields
    if (!message) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Missing required field: message' })
        };
    }

    // Get API key from environment variable, fallback to test key if not set
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyAmYhaUT2e1zMvfXoY3KyFLpvnMctLFR0Q';
    if (!GEMINI_API_KEY) {
        console.error('GEMINI_API_KEY not set in environment variables');
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Server configuration error' })
        };
    }

    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    // Build system instructions instruction containing the actress information
    const systemPrompt = `You are a helpful assistant on Prianka Zaman's personal portfolio website.

Your task is to answer user questions:
- Provide information about Prianka Zaman using the provided actressData.
- Answer general questions helpfully and politely.

Information about Prianka Zaman:
${actressData || 'No actress data loaded currently.'}

Rules:
1. Be polite, engaging, and professional.
2. For questions about Prianka Zaman, rely ONLY on the information provided in the "Information about Prianka Zaman" section above. If the answer is not in the data, politely say that you don't have that information but can help with general questions.
3. For general questions (outside of Prianka Zaman), answer them naturally and accurately.
4. Keep all responses concise (maximum 3 sentences).
5. Use relevant emojis occasionally to make the chat friendly.`;

    // Map client conversation history to Gemini contents format
    // Ensure history roles are normalized to 'user' or 'model'
    const contents = history.map(item => ({
        role: item.role === 'model' ? 'model' : 'user',
        parts: [{ text: item.text }]
    }));

    // If the latest message is not already the last item in contents, append it
    const lastItem = contents[contents.length - 1];
    if (!lastItem || lastItem.parts[0].text !== message || lastItem.role !== 'user') {
        contents.push({
            role: 'user',
            parts: [{ text: message }]
        });
    }

    // Build request body for Gemini API using systemInstruction
    const requestBody = {
        systemInstruction: {
            parts: [
                {
                    text: systemPrompt
                }
            ]
        },
        contents: contents,
        generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 350,
        }
    };

    try {
        // Call Gemini API using our robust request method
        const response = await makePostRequest(GEMINI_API_URL, {}, requestBody);

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            console.error(`Gemini API Error Status: ${response.status}`, errData);
            return {
                statusCode: response.status,
                body: JSON.stringify({ error: `Gemini API Error: ${response.status}`, details: errData })
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
