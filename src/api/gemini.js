// src/api/gemini.js
import { GoogleGenAI } from "@google/genai";

export const callGeminiAPI = async (prompt) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
        console.error("VITE_GEMINI_API_KEY is not set in .env file.");
        throw new Error("API Key is not configured.");
    }

    try {
        const genAI = new GoogleGenAI({ apiKey });
        
        // Use the exact pattern from the user's markdown file
        const result = await genAI.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        const text = result.text;
        return text;

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error(`API Error: ${error.message}`);
    }
};