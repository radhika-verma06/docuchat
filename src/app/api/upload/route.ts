import { NextRequest, NextResponse } from 'next/server';
import pdf from 'pdf-parse';

function chunkText(text: string, chunkSize: number = 500, overlap: number = 100): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  let current = '';

  for (const sentence of sentences) {
    if ((current + ' ' + sentence).length > chunkSize && current.length > 0) {
      chunks.push(current.trim());
      // Keep overlap
      const words = current.split(' ');
      const overlapWords = words.slice(-Math.floor(overlap / 5));
      current = overlapWords.join(' ') + ' ' + sentence;
    } else {
      current = current ? current + ' ' + sentence : sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    let text = '';
    const fileName = file.name;

    if (fileName.endsWith('.pdf')) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const data = await pdf(buffer);
      text = data.text;
    } else {
      text = await file.text();
    }

    if (!text.trim()) {
      return NextResponse.json({ error: 'No text content found in file' }, { status: 400 });
    }

    const textChunks = chunkText(text);
    const chunks = textChunks.map((chunkText, i) => ({
      id: Date.now() + i,
      text: chunkText,
      source: fileName,
      chunkIndex: i,
    }));

    return NextResponse.json({ chunks, totalChunks: chunks.length, fileName });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to process file' }, { status: 500 });
  }
}
