'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, FileText, MessageSquare, Send, Loader2, Trash2, Brain, Zap, Database } from 'lucide-react';

interface Chunk {
  id: number;
  text: string;
  source: string;
  chunkIndex: number;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
}

export default function Home() {
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeDoc, setActiveDoc] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.chunks) {
        setChunks(prev => [...prev, ...data.chunks]);
        setActiveDoc(file.name);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `📄 Uploaded "${file.name}" — ${data.chunks.length} chunks indexed. Ask me anything about this document!`,
        }]);
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const question = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: question }]);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, chunks }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.answer,
        sources: data.sources,
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠️ Error getting response. Please try again.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  const clearAll = () => {
    setChunks([]);
    setMessages([]);
    setActiveDoc(null);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">DocuChat</h1>
            <p className="text-xs text-zinc-500">RAG-Powered Document Q&A</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {chunks.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Database className="w-3.5 h-3.5" />
              <span>{chunks.length} chunks indexed</span>
            </div>
          )}
          {chunks.length > 0 && (
            <button onClick={clearAll} className="text-zinc-500 hover:text-red-400 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      <div className="flex h-[calc(100vh-65px)]">
        {/* Sidebar */}
        <aside className="w-80 border-r border-white/10 p-4 flex flex-col gap-4">
          <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
            <h2 className="text-sm font-bold mb-3 flex items-center gap-2">
              <Upload className="w-4 h-4 text-violet-400" />
              Upload Document
            </h2>
            <p className="text-xs text-zinc-500 mb-4">
              Upload a PDF or text file to start asking questions about its content.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.md,.csv"
              onChange={handleUpload}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-dashed border-white/10 hover:border-violet-500/50 text-sm text-zinc-400 hover:text-violet-400 transition-all cursor-pointer"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Choose file
                </>
              )}
            </label>
          </div>

          {/* Documents list */}
          <div className="bg-white/5 rounded-2xl p-5 border border-white/5 flex-1 overflow-y-auto">
            <h2 className="text-sm font-bold mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              Documents
            </h2>
            {chunks.length === 0 ? (
              <p className="text-xs text-zinc-600">No documents uploaded yet.</p>
            ) : (
              <div className="space-y-2">
                {[...new Set(chunks.map(c => c.source))].map(source => (
                  <div
                    key={source}
                    className={`p-3 rounded-lg text-xs transition-colors cursor-pointer ${
                      activeDoc === source
                        ? 'bg-violet-500/10 border border-violet-500/30 text-violet-300'
                        : 'bg-white/5 border border-white/5 text-zinc-400 hover:bg-white/10'
                    }`}
                    onClick={() => setActiveDoc(source)}
                  >
                    <div className="font-medium truncate">{source}</div>
                    <div className="text-zinc-600 mt-1">
                      {chunks.filter(c => c.source === source).length} chunks
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* How it works */}
          <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
            <h2 className="text-sm font-bold mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              How it works
            </h2>
            <div className="space-y-2 text-xs text-zinc-500">
              <div className="flex gap-2"><span className="text-violet-400">1.</span> Upload a document</div>
              <div className="flex gap-2"><span className="text-violet-400">2.</span> Text is chunked & indexed</div>
              <div className="flex gap-2"><span className="text-violet-400">3.</span> Relevant chunks are retrieved</div>
              <div className="flex gap-2"><span className="text-violet-400">4.</span> Groq LLM generates answer</div>
            </div>
          </div>
        </aside>

        {/* Chat area */}
        <main className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-600/20 border border-violet-500/20 flex items-center justify-center mb-4">
                  <MessageSquare className="w-7 h-7 text-violet-400" />
                </div>
                <h2 className="text-xl font-bold mb-2">Ask anything about your documents</h2>
                <p className="text-sm text-zinc-500 max-w-md">
                  Upload a PDF or text file, then ask questions. DocuChat uses RAG (Retrieval-Augmented Generation)
                  to find relevant passages and generate accurate answers.
                </p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-2xl rounded-2xl px-5 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-violet-600 text-white'
                    : 'bg-white/5 border border-white/10 text-zinc-300'
                }`}>
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Sources</div>
                      <div className="flex flex-wrap gap-1">
                        {msg.sources.map((s, j) => (
                          <span key={j} className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full text-zinc-400">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3 flex items-center gap-2 text-sm text-zinc-400">
                  <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                  Thinking...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-white/10 p-4">
            <div className="flex gap-3 max-w-3xl mx-auto">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder={chunks.length > 0 ? "Ask a question about your documents..." : "Upload a document first..."}
                disabled={loading || chunks.length === 0}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-violet-500/50 transition-colors disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim() || chunks.length === 0}
                className="bg-violet-600 hover:bg-violet-500 disabled:opacity-30 disabled:hover:bg-violet-600 rounded-xl px-5 py-3 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
