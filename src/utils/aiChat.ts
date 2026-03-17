import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateChatResponse(propertyContext: any, history: { role: string, content: string }[]): Promise<string> {
    const contextStr = JSON.stringify(propertyContext, null, 2);

    const instructions = `Du är en expertmäklare och bolånehandläggare. Du svarar på användarens frågor om bostaden och dess bostadsrättsförenings ekonomi. 
Du har tillgång till all data om bostaden och en tidigare genererad analys av årsredovisningen.
Svara koncist, professionellt, insiktsfullt och på svenska. Referera till specifik data från kontexten när du svarar. 
Undvik att använda emojis.

KONTEXT OM BOSTADEN OCH FÖRENINGEN:
${contextStr}
`;

    const contents = history.map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.content }]
    }));

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents,
            config: {
                systemInstruction: instructions,
                temperature: 0.3,
            }
        });

        return response.text || "Tyvärr kunde jag inte generera ett svar just nu.";
    } catch (error) {
        console.error("Gemini Chat Error:", error);
        throw new Error("Kunde inte nå AI-experten. Vänligen försök igen.");
    }
}
