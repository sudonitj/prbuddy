import OpenAI from 'openai';
import dotenv from 'dotenv';
import { createPrompt } from './prompts.js';
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

export async function analyzeDiff(diff, roast = false) {
  const prompt = createPrompt(diff, roast);

  const completion = await openai.chat.completions.create({
    model: 'llama3-70b-8192',
    messages: [{ role: 'user', content: prompt }],
  });

  return completion.choices[0].message.content || '[No response]';
}
