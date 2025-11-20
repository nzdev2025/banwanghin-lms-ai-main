// src/api/gemini.js
import { GoogleGenAI } from "@google/genai";
import { config } from "../config";

export const callGeminiAPI = async (prompt) => {
    const apiKey = config.gemini.apiKey;
    if (!apiKey) {
        console.error("Gemini API Key is not configured.");
        throw new Error("API Key is not configured.");
    }

    try {
        const genAI = new GoogleGenAI({ apiKey });

        const result = await genAI.models.generateContent({
            model: config.gemini.model,
            contents: prompt,
        });

        const text = result.text;
        return text;

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        // Enhance error message if possible
        let errorMessage = error.message;
        if (error.message.includes('401')) {
            errorMessage = 'Invalid API Key or unauthorized access.';
        } else if (error.message.includes('429')) {
            errorMessage = 'Rate limit exceeded. Please try again later.';
        }
        throw new Error(`API Error: ${errorMessage}`);
    }
};