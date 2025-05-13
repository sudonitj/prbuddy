/**
 * Splits a git diff into manageable chunks for API processing
 */

const MAX_CHUNK_SIZE = 4000; // Characters per chunk (tune based on context window)

/**
 * Splits a git diff into logical chunks by files
 * @param {string} diff - The complete git diff
 * @return {Array<string>} Array of diff chunks
 */
export function chunkDiffByFiles(diff) {
  // Split by file boundaries (diff --git lines mark new files)
  const filePattern = /diff --git .+?\n/g;
  const fileMatches = [...diff.matchAll(filePattern)];
  
  const chunks = [];
  
  // Handle case where diff is small enough
  if (diff.length <= MAX_CHUNK_SIZE) {
    return [diff];
  }
  
  // Process each file section
  for (let i = 0; i < fileMatches.length; i++) {
    const currentMatch = fileMatches[i];
    const nextMatch = fileMatches[i + 1];
    
    const startIdx = currentMatch.index;
    const endIdx = nextMatch ? nextMatch.index : diff.length;
    
    const fileChunk = diff.substring(startIdx, endIdx);
    
    // If file chunk is too large, split it further
    if (fileChunk.length > MAX_CHUNK_SIZE) {
      const subChunks = splitLargeFile(fileChunk);
      chunks.push(...subChunks);
    } else {
      chunks.push(fileChunk);
    }
  }
  
  // Handle edge case where no file patterns were matched
  if (chunks.length === 0 && diff.trim().length > 0) {
    return splitBySize(diff);
  }
  
  return chunks;
}

/**
 * Split an individual file diff into smaller chunks
 * @param {string} fileDiff - Diff content for a single file
 * @return {Array<string>} Array of chunks for this file
 */
function splitLargeFile(fileDiff) {
  // Get file header (diff, index, path lines)
  const headerEndMatch = fileDiff.match(/^(\+\+\+.*?\n)/m);
  const headerEndPos = headerEndMatch ? headerEndMatch.index + headerEndMatch[0].length : 0;
  const header = fileDiff.substring(0, headerEndPos);
  
  // Split the hunks (each @@ section)
  const hunks = [];
  const hunkPattern = /@@\s+-\d+,\d+\s+\+\d+,\d+\s+@@.*?\n/g;
  const hunkMatches = [...fileDiff.substring(headerEndPos).matchAll(hunkPattern)];
  
  for (let i = 0; i < hunkMatches.length; i++) {
    const currentMatch = hunkMatches[i];
    const nextMatch = hunkMatches[i + 1];
    
    const startIdx = headerEndPos + currentMatch.index;
    const endIdx = nextMatch ? headerEndPos + nextMatch.index : fileDiff.length;
    
    hunks.push(fileDiff.substring(startIdx, endIdx));
  }
  
  // Combine hunks into chunks respecting MAX_CHUNK_SIZE
  const chunks = [];
  let currentChunk = header;
  
  for (const hunk of hunks) {
    if (currentChunk.length + hunk.length > MAX_CHUNK_SIZE) {
      chunks.push(currentChunk);
      currentChunk = header + hunk;
    } else {
      currentChunk += hunk;
    }
  }
  
  if (currentChunk !== header) {
    chunks.push(currentChunk);
  }
  
  return chunks;
}

/**
 * Simple fallback to split by size
 * @param {string} diff - Diff content
 * @return {Array<string>} Array of chunks
 */
function splitBySize(diff) {
  const chunks = [];
  for (let i = 0; i < diff.length; i += MAX_CHUNK_SIZE) {
    chunks.push(diff.substring(i, i + MAX_CHUNK_SIZE));
  }
  return chunks;
}