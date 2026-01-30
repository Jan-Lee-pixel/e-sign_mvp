import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

/**
 * Converts a File or Blob to a GoogleGenerativeAI Part object.
 * @param {File | Blob} file
 * @returns {Promise<{inlineData: {data: string, mimeType: string}}>}
 */
async function fileToGenerativePart(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64Data = reader.result.split(",")[1];
            resolve({
                inlineData: {
                    data: base64Data,
                    mimeType: file.type,
                },
            });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export const secureAiService = {
    /**
     * Analyzes a document and returns a summary.
     * @param {File | Blob} file
     * @returns {Promise<string>} Summary text
     */
    async analyzeDocument(file) {
        try {
            const imagePart = await fileToGenerativePart(file);
            const prompt = "Please analyze this document and provide a concise summary of its key points.";

            const result = await model.generateContent([prompt, imagePart]);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error("Error analyzing document:", error);
            throw new Error("Failed to analyze document. Please try again.");
        }
    },

    /**
     * Generates a quiz based on the document.
     * @param {File | Blob} file
     * @returns {Promise<Array<{question: string, options: string[], answer: number}>>}
     */
    async generateQuiz(file) {
        try {
            const imagePart = await fileToGenerativePart(file);
            const prompt = `
        Create a quiz with 5-10 multiple choice questions based on this document.
        Return the result as a raw JSON array of objects (no markdown code blocks, just pure JSON).
        Each object should look like this:
        {
          "question": "The question text",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "answer": 0 // index of the correct option (0-3)
        }
      `;

            const result = await model.generateContent([prompt, imagePart]);
            const response = await result.response;
            let text = response.text();

            // Clean up markdown formatting if present
            text = text.replace(/```json/g, "").replace(/```/g, "").trim();

            return JSON.parse(text);
        } catch (error) {
            console.error("Error generating quiz:", error);
            throw new Error("Failed to generate quiz. Please try again.");
        }
    },
};
