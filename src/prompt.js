export function createPrompt(diff, roast = false) {
  return `
You are a senior engineer reviewing a GitHub pull request. The following is the diff:

${diff}

Provide a clear review:
1. Summary of changes
2. Code quality issues
3. Suggestions for improvement
${roast ? '4. Roast the code humorously but constructively' : ''}
  `.trim();
}
