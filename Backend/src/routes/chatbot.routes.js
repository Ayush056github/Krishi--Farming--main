import { Router } from "express";

const router = Router();

function toSimplePlainText(text) {
    if (!text || typeof text !== "string") return "";

    return text
        .replace(/[*_`#>|~]/g, "")
        .replace(/[\/+-]/g, " ")
        .replace(/\s{2,}/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

router.post("/chat", async(req, res) => {
    try {
        const { message, context } = req.body;

        if (!message || typeof message !== "string") {
            return res.status(400).json({ error: "Message is required" });
        }

        // Build context string from farming details
        let contextPrompt = "";
        if (context) {
            const details = [];
            if (context.farmSize) details.push(`Farm Size: ${context.farmSize} acres`);
            if (context.location) details.push(`Location: ${context.location}`);
            if (context.cropType && context.cropType !== "None") details.push(`Crop Type: ${context.cropType}`);
            if (context.season && context.season !== "None") details.push(`Season: ${context.season}`);
            if (context.weather && context.weather !== "None") details.push(`Weather: ${context.weather}`);
            if (context.soilType) details.push(`Soil Type: ${context.soilType}`);

            if (details.length > 0) {
                contextPrompt = `\n\nFarmer's Context:\n${details.join("\n")}`;
            }
        }

        // System prompt for agriculture assistant
        const systemPrompt = `You are Krishi Kisan AI, an expert agricultural advisor helping Indian farmers. You are an authority on farming, crop recommendations, plant diseases, weather, climate, soil, fertilizers, pesticides, organic farming, hydroponics, government schemes, MSP, market prices, harvesting, irrigation, seeds, livestock, farm equipment, agri technology, crop rotation, and sustainable farming.

IMPORTANT RULES:
1. You must ONLY answer questions that are related to agriculture, farming, crops, livestock, soil, weather, or agricultural technology.
2. If the user's question is NOT related to agriculture, farming, crop management, or livestock, you MUST ignore the question and respond with exactly this sentence and nothing else:
"I am Krishi Kisan AI and currently support Agriculture and Farming related queries only."

${contextPrompt}

Provide a helpful, clear, and direct response in simple language. Do not use bullets, stars, or special symbols. Keep the response practical and simple.`;

        const googleKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

        if (!googleKey) {
            return res.status(503).json({
                error: "Sorry, our AI service is temporarily unavailable. Please try again."
            });
        }

        const response = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-goog-api-key": googleKey,
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: systemPrompt },
                            { text: message }
                        ],
                    }],
                    generationConfig: {
                        maxOutputTokens: 1024,
                        temperature: 0.3,
                    },
                }),
            }
        );

        if (!response.ok) {
            const errBody = await response.text().catch(() => "");
            console.error("Gemini API Error status:", response.status, "body:", errBody);
            return res.status(503).json({
                error: "Sorry, our AI service is temporarily unavailable. Please try again."
            });
        }

        const data = await response.json();
        const aiResponse =
            data?.candidates?.[0]?.content?.parts?.[0]?.text ||
            "Sorry, our AI service is temporarily unavailable. Please try again.";

        res.json({
            response: toSimplePlainText(aiResponse),
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error("Chatbot error:", error);
        res.status(503).json({
            error: "Sorry, our AI service is temporarily unavailable. Please try again."
        });
    }
});

export default router;