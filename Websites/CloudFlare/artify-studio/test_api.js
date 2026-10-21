const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const MODEL = "gemini-3.5-flash";
const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;
const prompt = "test";
fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 8192,
        }
    })
}).then(async r => {
    console.log(r.status, r.statusText);
    console.log(await r.text());
}).catch(e => console.error(e));
