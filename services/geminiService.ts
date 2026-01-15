
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const askIA = async (question: string, context: any) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        Você é o assistente inteligente do Insufilm Pro.
        Contexto atual da loja: ${JSON.stringify(context)}
        Usuário perguntou: ${question}
        
        Responda de forma curta, direta e motivadora para um instalador de acessórios automotivos.
        Use termos simples. Se ele perguntar sobre o que comprar, analise o alerta_minimo.
      `,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Desculpe, tive um problema ao pensar. Tente novamente!";
  }
};
