import OpenAI from "openai";

const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

const openai = new OpenAI({
    apiKey: API_KEY,
    dangerouslyAllowBrowser: true // Note: In a production app, you should use a backend to protect your API key
});

export const getChatGPTResponse = async (prompt, context = "") => {
    try {
        if (!API_KEY || API_KEY === "YOUR_OPENAI_API_KEY_HERE") {
            return "Please configure your OpenAI API Key in the .env file. Replace 'YOUR_OPENAI_API_KEY_HERE' with your actual key.";
        }

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are a professional financial advisor integrated into a SmartFinance application. Help users manage money, save for goals, and understand financial concepts."
                },
                {
                    role: "user",
                    content: `Context: ${context}\n\nUser Question: ${prompt}`
                }
            ],
            temperature: 0.7,
        });

        return response.choices[0].message.content;
    } catch (error) {
        console.error("OpenAI API Error:", error);
        return `I encountered an error with ChatGPT: ${error.message || "Unknown error"}. Please check your API key and billing status.`;
    }
};
