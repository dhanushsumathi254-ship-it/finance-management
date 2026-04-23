import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
    console.warn("VITE_GEMINI_API_KEY is not set. Gemini AI features will not work.");
}

const genAI = new GoogleGenerativeAI(API_KEY || "");

export const getGeminiResponse = async (prompt, context = "") => {
    try {
        if (!API_KEY || API_KEY === "YOUR_GEMINI_API_KEY_HERE") {
            return "Please configure your Gemini API Key in the .env file. Replace 'YOUR_GEMINI_API_KEY_HERE' with your actual key from Google AI Studio.";
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const fullPrompt = `
            You are a professional financial advisor integrated into a SmartFinance application. 
            Your goal is to help users manage their money, save for goals, and understand financial concepts.
            
            Context about the user/request: ${context}
            
            User message: ${prompt}
            
            Please provide helpful, concise, and actionable financial advice. Use a friendly and professional tone.
        `;

        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Gemini API Error Detail:", error);
        
        if (error.message?.includes("API_KEY_INVALID")) {
            return "Your Gemini API Key appears to be invalid. Please double-check it in your .env file.";
        }
        if (error.message?.includes("network")) {
            return "I'm having trouble with the network connection. Please check your internet and try again.";
        }
        
        return `I encountered an error: ${error.message || "Unknown error"}. Please ensure your API key is correct and you have restarted your dev server.`;
    }
};
