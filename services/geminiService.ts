
import { GoogleGenAI, Type } from "@google/genai";
import { SecurityAnalysis } from "../types";

// Always use the process.env.API_KEY directly when initializing.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeSecurity = async (password: string): Promise<SecurityAnalysis> => {
  if (!password || password.length < 3) {
    return {
      strength: 'weak',
      feedback: 'Insufficient security parameters.',
      tips: ['Input at least 8 alphanumeric characters.']
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the security of this system password: "${password}". 
                 Provide a JSON object with 'strength' (weak, moderate, strong, legendary), 
                 'feedback' (a technical, sharp security comment), and 'tips' (an array of 2 improvement suggestions).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            strength: { type: Type.STRING },
            feedback: { type: Type.STRING },
            tips: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["strength", "feedback", "tips"]
        }
      }
    });

    // Directly access .text property from GenerateContentResponse
    return JSON.parse(response.text || "{}") as SecurityAnalysis;
  } catch (error) {
    console.error("Security analysis failed:", error);
    return {
      strength: 'moderate',
      feedback: 'Verification sub-routines offline. Proceed with caution.',
      tips: ['Include complex symbols', 'Increase entropy']
    };
  }
};

export const getWelcomeMessage = async (name: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a short, professional, high-tech welcome greeting for a user named "${name}" who just logged into A.R.C. (Automated Reporting Central). Keep it under 15 words and sound authoritative yet welcoming.`,
    });
    // Directly access .text property from GenerateContentResponse
    return (response.text || "").trim();
  } catch (error) {
    return `Access authorized. Welcome to A.R.C. Command, ${name}.`;
  }
};
