import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

function getGroq() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

interface Chunk {
  id: number;
  text: string;
  source: string;
  chunkIndex: number;
}

// Simple TF-IDF-like scoring for retrieval
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2);
}

function computeTF(text: string): Map<string, number> {
  const tokens = tokenize(text);
  const tf = new Map<string, number>();
  for (const t of tokens) {
    tf.set(t, (tf.get(t) || 0) + 1);
  }
  for (const [k, v] of tf) {
    tf.set(k, v / tokens.length);
  }
  return tf;
}

function retrieveChunks(query: string, chunks: Chunk[], topK: number = 3): Chunk[] {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0 || chunks.length === 0) return chunks.slice(0, topK);

  // Compute IDF
  const docFreq = new Map<string, number>();
  const tfs = chunks.map(c => computeTF(c.text));

  for (const tf of tfs) {
    for (const token of tf.keys()) {
      docFreq.set(token, (docFreq.get(token) || 0) + 1);
    }
  }

  const N = chunks.length;

  // Score each chunk
  const scored = chunks.map((chunk, i) => {
    const tf = tfs[i];
    let score = 0;
    for (const qt of queryTokens) {
      const tfVal = tf.get(qt) || 0;
      const df = docFreq.get(qt) || 0;
      const idf = Math.log((N + 1) / (df + 1)) + 1;
      score += tfVal * idf;
    }
    // Bonus for exact phrase match
    const lowerText = chunk.text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    if (lowerText.includes(lowerQuery)) score *= 2;

    return { chunk, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK).map(s => s.chunk);
}

export async function POST(request: NextRequest) {
  try {
    const { question, chunks } = await request.json();

    if (!question || !chunks || chunks.length === 0) {
      return NextResponse.json(
        { error: 'Question and document chunks are required' },
        { status: 400 }
      );
    }

    // Retrieve relevant chunks
    const relevantChunks = retrieveChunks(question, chunks, 3);
    const context = relevantChunks.map((c: Chunk) =>
      `[Source: ${c.source}, Chunk ${c.chunkIndex + 1}]\n${c.text}`
    ).join('\n\n---\n\n');

    const systemPrompt = `You are DocuChat, an intelligent document Q&A assistant. You answer questions based on the provided document context.

Rules:
- Answer based ONLY on the provided context
- If the context doesn't contain enough information, say so clearly
- Be concise and accurate
- Cite which document/part you're referencing
- Use markdown formatting for clarity`;

    const userPrompt = `Context from documents:\n\n${context}\n\n---\n\nQuestion: ${question}\n\nAnswer based on the context above:`;

    const groq = getGroq();
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 1024,
    });

    const answer = completion.choices[0]?.message?.content || 'No response generated.';
    const sources = [...new Set(relevantChunks.map((c: Chunk) => c.source))];

    return NextResponse.json({ answer, sources, relevantChunks: relevantChunks.length });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}
