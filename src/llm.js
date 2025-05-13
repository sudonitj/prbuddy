import OpenAI from "openai";
import dotenv from "dotenv";
import { createPrompt } from "./prompt.js";
import { chunkDiffByFiles } from "./chunker.js";
dotenv.config();



const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

export async function analyzeDiff(diff, roast = false) {
  // Check if the diff is large enough to need chunking
  const diffChunks = chunkDiffByFiles(diff);

  if (diffChunks.length === 1) {
    // If only one chunk, process normally
    const prompt = createPrompt(diff, roast);
    const completion = await openai.chat.completions.create({
      model: "llama3-70b-8192",
      messages: [{ role: "user", content: prompt }],
    });

    return completion.choices[0].message.content || "[No response]";
  } else {
    // Process multiple chunks
    console.log(`Diff is large, processing in ${diffChunks.length} chunks...`);

    const chunkAnalyses = [];

    for (let i = 0; i < diffChunks.length; i++) {
      const chunk = diffChunks[i];
      console.log(
        `Processing chunk ${i + 1}/${diffChunks.length} (${Math.round(
          chunk.length / 1024
        )}KB)...`
      );

      const chunkPrompt = createChunkPrompt(
        chunk,
        i + 1,
        diffChunks.length,
        roast
      );

      const completion = await openai.chat.completions.create({
        model: "llama3-70b-8192",
        messages: [{ role: "user", content: chunkPrompt }],
      });

      chunkAnalyses.push(
        completion.choices[0].message.content || "[No response for this chunk]"
      );
    }

    // Combine the chunk analyses with a summary request
    return combineChunkAnalyses(chunkAnalyses, roast);
  }
}

/**
 * Creates a prompt for a single chunk of the diff
 */
function createChunkPrompt(diffChunk, chunkNum, totalChunks, roast) {
  return `
You are a senior engineer reviewing a GitHub pull request. 
This is chunk ${chunkNum} of ${totalChunks} from the PR diff:

${diffChunk}

For this chunk only, provide a focused review:
1. Summary of changes in this chunk
2. Code quality issues
3. Suggestions for improvement
${roast ? "4. Roast the code humorously but constructively" : ""}

Label your analysis as "CHUNK ${chunkNum}/${totalChunks} ANALYSIS:"
`.trim();
}

/**
 * Combines analyses from multiple chunks into a cohesive review
 */
async function combineChunkAnalyses(chunkAnalyses, roast) {
  const combinedAnalysis = chunkAnalyses.join("\n\n---\n\n");

  // Make one final call to summarize and combine the analyses
  const summaryPrompt = `
You are a senior engineer reviewing a GitHub pull request.
This PR was analyzed in chunks due to its size. Below are the individual analyses.
Your task is to provide a coherent and unified review summary based on these individual analyses.

${combinedAnalysis}

Please provide a comprehensive review that:
1. Gives an overall summary of the PR based on all chunks
2. Highlights the most important code quality issues across all chunks
3. Provides key suggestions for improvement
${roast ? "4. Includes a fun, constructive roast of the code" : ""}

Focus on being concise and actionable.
`.trim();

  const completion = await openai.chat.completions.create({
    model: "llama3-70b-8192",
    messages: [{ role: "user", content: summaryPrompt }],
  });

  return (
    completion.choices[0].message.content || "[Failed to summarize analyses]"
  );
}

export async function analyzeDiff(diff, roast = false) {
  const prompt = createPrompt(diff, roast);

  const completion = await openai.chat.completions.create({
    model: "llama3-70b-8192",
    messages: [{ role: "user", content: prompt }],
  });

  return completion.choices[0].message.content || "[No response]";
}
