import { NextRequest, NextResponse } from 'next/server';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFParser = require('pdf2json');

function chunkText(text: string, chunkSize: number = 500, overlap: number = 100): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  let current = '';

  for (const sentence of sentences) {
    if ((current + ' ' + sentence).length > chunkSize && current.length > 0) {
      chunks.push(current.trim());
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

function extractPdfText(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const parser = new PDFParser();

    parser.on('pdfParser_dataError', (errData: any) => {
      reject(new Error(errData.parserError));
    });

    parser.on('pdfParser_dataReady', (pdfData: any) => {
      let text = '';
      if (pdfData.Pages) {
        for (const page of pdfData.Pages) {
          if (page.Texts) {
            for (const line of page.Texts) {
              if (line.R) {
                for (const run of line.R) {
                  text += decodeURIComponent(run.T || '') + ' ';
                }
              }
            }
            text += '\n';
          }
        }
      }
      resolve(text);
    });

    parser.parseBuffer(buffer);
  });
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
      text = await extractPdfText(buffer);
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
