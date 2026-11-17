import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});
try {
  console.log("Using model:", process.env.GEMINI_MODEL);
  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL || "gemini-3.8-flash",
    contents: "Hello Gemini! Hindi mein ek fitness tip do."
  });
  console.log("✅ Gemini API Connected!");
  console.log(response.text);
} catch (error) {
  console.error("❌ Gemini Error:", error.message);
}
