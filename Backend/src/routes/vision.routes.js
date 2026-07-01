import { Router } from "express";

const router = Router();

async function fetchWithRetry(url, options, retries = 2, delay = 1500) {
    for (let i = 0; i <= retries; i++) {
        const response = await fetch(url, options);
        if (response.status === 429 && i < retries) {
            console.warn(`Gemini API returned 429. Retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
        }
        return response;
    }
}

router.post("/analyze-image", async(req, res) => {
    try {
        const { image } = req.body;

        if (!image) {
            return res.status(400).json({ error: "Image is required" });
        }

        if (!image.startsWith("data:image/")) {
            return res.status(400).json({ error: "Invalid image format. Please provide a base64 encoded image." });
        }

        const googleKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
        if (!googleKey) {
            return res.status(503).json({
                error: "Sorry, our AI service is temporarily unavailable. Please try again."
            });
        }

        const systemPrompt = `You are an expert AI Plant Doctor. Analyze the uploaded plant/crop image and return a JSON object with the following schema:

{
  "plantName": "string",
  "cropName": "string",
  "growthStage": "Seed" | "Germination" | "Baby Plant" | "Vegetative Stage" | "Flowering Stage" | "Fruiting Stage" | "Harvest Stage",
  "plantHealth": "Healthy" | "Slightly Unhealthy" | "Diseased" | "Critical",
  "confidenceScore": "string",
  "diseaseDetected": boolean,
  "diseaseDetails": {
    "diseaseName": "string",
    "cause": "string",
    "symptoms": "string",
    "severity": "Mild" | "Moderate" | "Severe",
    "organicTreatment": "string",
    "chemicalTreatment": "string",
    "preventionTips": "string"
  },
  "healthyDetails": {
    "message": "✅ Plant is Healthy",
    "expectedNextStage": "string",
    "recommendedCare": "string"
  },
  "growthStageAdvice": {
    "waterRequirement": "string",
    "sunlight": "string",
    "fertilizer": "string",
    "protection": "string",
    "commonProblems": "string"
  }
}`;

        const imageData = image.split(",")[1];
        const imageMimeType = image.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,/)[1];

        const response = await fetchWithRetry(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-goog-api-key": googleKey,
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: systemPrompt },
                            {
                                inline_data: {
                                    mime_type: imageMimeType,
                                    data: imageData,
                                },
                            },
                        ],
                    }],
                    generationConfig: {
                        responseMimeType: "application/json",
                        temperature: 0.2,
                    },
                }),
            }
        );

        if (!response.ok) {
            const errBody = await response.text().catch(() => "");
            console.error("Gemini Vision API Error status:", response.status, "body:", errBody);
            return res.status(503).json({
                error: "Sorry, our AI service is temporarily unavailable. Please try again."
            });
        }

        const data = await response.json();
        const analysisText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!analysisText) {
            throw new Error("No response from model");
        }

        let parsedResult;
        try {
            parsedResult = JSON.parse(analysisText);
        } catch (e) {
            throw new Error("Failed to parse AI output");
        }

        res.json({
            analysis: parsedResult,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("Image analysis error:", error);
        res.status(503).json({
            error: "Sorry, our AI service is temporarily unavailable. Please try again."
        });
    }
});

export default router;