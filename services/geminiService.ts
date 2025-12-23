import { GoogleGenAI, Type } from "@google/genai";
import { Stock, PortfolioItem } from "../types.ts";

const apiKey = process.env.API_KEY;

// Initialize the Gemini AI client
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const generateMarketAnalysis = async (
  stocks: Stock[],
  holdings: PortfolioItem[],
  totalEquity: number
): Promise<{ summary: string; recommendation: string } | null> => {
  if (!ai) {
    console.warn("Gemini API key is not set.");
    return null;
  }

  const stockSummary = stocks.map(s => 
    `${s.symbol} (${s.price.toFixed(2)} ₽, ${s.changePercent > 0 ? '+' : ''}${s.changePercent.toFixed(2)}%)`
  ).join(', ');

  const portfolioSummary = holdings.map(h => 
    `${h.symbol}: ${h.quantity} shares`
  ).join(', ');

  const prompt = `
    You are a senior financial analyst. Provide a brief, professional market analysis and a strategic tip for a trader using Russian Rubles (₽).
    
    Current Market Data: ${stockSummary}
    Trader Portfolio: ${portfolioSummary || "Cash positions only"}
    Total Equity: ${totalEquity.toFixed(2)} ₽

    Format the response as a JSON object with two fields:
    1. "summary": A 2-sentence market overview based on the simulated data provided.
    2. "recommendation": A 1-sentence actionable tip.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            recommendation: { type: Type.STRING }
          }
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text);
  } catch (error) {
    console.error("Failed to generate market analysis:", error);
    return null;
  }
};