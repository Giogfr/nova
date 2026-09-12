export interface DocumentChunk {
  fileId: string;
  fileName: string;
  chunkIndex: number;
  text: string;
}

export function chunkText(fileId: string, fileName: string, text: string, chunkSize = 800): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  const words = text.split(/\s+/);
  let currentChunk: string[] = [];
  let currentLength = 0;

  for (const word of words) {
    currentChunk.push(word);
    currentLength += word.length + 1;

    if (currentLength >= chunkSize) {
      chunks.push({
        fileId,
        fileName,
        chunkIndex: chunks.length,
        text: currentChunk.join(' '),
      });
      currentChunk = [];
      currentLength = 0;
    }
  }

  if (currentChunk.length > 0) {
    chunks.push({
      fileId,
      fileName,
      chunkIndex: chunks.length,
      text: currentChunk.join(' '),
    });
  }

  return chunks;
}

export function searchDocumentChunks(chunks: DocumentChunk[], query: string, topK = 3): DocumentChunk[] {
  const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  if (queryTerms.length === 0) return chunks.slice(0, topK);

  const scored = chunks.map(chunk => {
    const chunkLower = chunk.text.toLowerCase();
    let score = 0;
    for (const term of queryTerms) {
      if (chunkLower.includes(term)) {
        score += 1;
      }
    }
    return { chunk, score };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(s => s.chunk);
}
