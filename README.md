<div align="center">

# 📄 DocuChat — RAG-Powered Document Q&A

**Upload any document and ask questions. Built with Retrieval-Augmented Generation, Groq Llama 3.3, and Next.js.**

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat&logo=next.js&logoColor=white)](https://nextjs.org)
[![Groq](https://img.shields.io/badge/Groq-Llama_3.3_70B-FF6B00?style=flat&logo=groq&logoColor=white)](https://groq.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat)](LICENSE)

**[→ Live Demo](https://docuchat-xi.vercel.app)**

</div>

---

## What Is This?

DocuChat is a **Retrieval-Augmented Generation (RAG)** system that lets you upload documents and ask natural language questions about their content. Instead of relying solely on an LLM's training data, DocuChat:

1. **Ingests** your documents (PDF, TXT, Markdown)
2. **Chunks** text into overlapping segments for better retrieval
3. **Retrieves** the most relevant chunks using TF-IDF scoring
4. **Generates** accurate answers using Groq's Llama 3.3 70B model

---

## How RAG Works

```
┌─────────────────────────────────────────────────────────┐
│                    USER QUERY                            │
│         "What are the key findings in the report?"       │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│               RETRIEVAL (TF-IDF)                         │
│  • Tokenize query + all document chunks                  │
│  • Compute Term Frequency-Inverse Document Frequency     │
│  • Rank chunks by relevance score                        │
│  • Return top-3 most relevant chunks                     │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              AUGMENTATION                                │
│  • Inject retrieved chunks into prompt                   │
│  • Add system instructions for grounded answers          │
│  • Format context with source citations                  │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│            GENERATION (Groq Llama 3.3 70B)              │
│  • LLM generates answer grounded in document context     │
│  • Answer includes source references                     │
│  • Sub-second response time via Groq inference           │
└─────────────────────────────────────────────────────────┘
```

---

## Features

- 📄 **Multi-format support** — PDF, TXT, Markdown, CSV
- 🔍 **TF-IDF retrieval** — Keyword-based relevance scoring
- 🧠 **Groq-powered generation** — Llama 3.3 70B for fast, accurate answers
- 📊 **Chunk visualization** — See how documents are split
- 🎯 **Source citations** — Answers reference which document/section
- 💬 **Chat interface** — Natural conversation with your documents
- 🚀 **Fully serverless** — Deployed on Vercel, zero infrastructure

---

## Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Frontend | Next.js 16, React 19, Tailwind 4 | UI framework |
| Backend | Next.js API Routes (Serverless) | API layer |
| Retrieval | TF-IDF (custom implementation) | Document search |
| Generation | Groq + Llama 3.3 70B | Answer generation |
| PDF Parsing | pdf-parse | Text extraction |
| Hosting | Vercel | Deployment |

---

## Local Development

```bash
git clone https://github.com/radhika-verma06/docuchat.git
cd docuchat
npm install

# Create .env.local
echo "GROQ_API_KEY=your_groq_api_key_here" > .env.local

# Start dev server
npm run dev

# Open http://localhost:3000
```

---

## Project Structure

```
docuchat/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Main UI (upload + chat)
│   │   ├── layout.tsx            # Root layout
│   │   ├── globals.css           # Tailwind styles
│   │   └── api/
│   │       ├── upload/route.ts   # Document upload & chunking
│   │       └── chat/route.ts     # RAG retrieval + Groq generation
│   └── lib/                      # Shared utilities
├── package.json
└── vercel.json
```

---

## Architecture Decisions

### Why TF-IDF over Vector Embeddings?
For a self-contained demo, TF-IDF provides good retrieval without requiring a vector database. In production, you'd swap this for cosine similarity with sentence-transformers embeddings + a vector store (Pinecone, Weaviate, or pgvector).

### Why Groq over OpenAI?
Groq offers free API access with Llama 3.3 70B — competitive quality at zero cost, with the fastest inference speeds available.

### Why Client-Side Chunking?
Keeps the backend stateless and serverless-friendly. Chunks are sent with each request, eliminating the need for persistent storage in the demo.

---

## What I Built

- **Full RAG pipeline** — ingestion → chunking → retrieval → generation
- **Custom TF-IDF implementation** — no external search dependencies
- **PDF parsing** — extract text from uploaded PDFs
- **Source citation** — answers reference which document they came from
- **Production-ready architecture** — easily swap TF-IDF for vector search

---

## License

MIT

---

Built by [Radhika Verma](https://github.com/radhika-verma06)
