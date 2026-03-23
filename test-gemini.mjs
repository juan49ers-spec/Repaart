import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.VITE_GOOGLE_AI_KEY;

async function test() {
  if (!API_KEY) {
    console.error("NO API KEY");
    return;
  }
  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  try {
    const chat = model.startChat();
    const result = await chat.sendMessage("hola, dime 1+1");
    console.log(result.response.text());
  } catch (e) {
    console.error("ERROR", e);
  }
}
test();
