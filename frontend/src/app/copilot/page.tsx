'use client';
import { useState, useRef, useEffect } from 'react';
import Shell from '@/components/Shell';
import { api } from '@/lib/api';
import { Bot, Send, User, Loader2 } from 'lucide-react';

type Message = { role: 'user' | 'assistant'; content: string; data?: any; };

export default function Copilot() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I\'m TaxPilot AI — your CA automation assistant. Ask me about GST, Income Tax, TDS, compliance, or any financial query.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    const query = input.trim();
    if (!query || loading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: query }]);
    setLoading(true);

    try {
      const res = await api.askCopilot(query);
      setMessages(prev => [...prev, { role: 'assistant', content: res.answer || 'No response', data: res.data }]);
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Shell>
      <div className="animate-in flex flex-col" style={{ height: 'calc(100vh - 8rem)' }}>
        <div className="mb-4">
          <h1 className="text-2xl font-semibold tracking-tight">AI Copilot</h1>
          <p className="text-sm text-[var(--text-tertiary)] mt-1">Ask anything about GST, ITR, TDS, compliance</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-auto space-y-4 pr-2">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''} animate-in`}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 bg-[var(--accent)] rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot size={14} className="text-white" />
                </div>
              )}
              <div className={`max-w-[75%] ${
                msg.role === 'user'
                  ? 'bg-[var(--accent)] text-white rounded-2xl rounded-br-md px-4 py-2.5'
                  : 'bg-[var(--bg)] border border-[var(--border)] rounded-2xl rounded-bl-md px-4 py-2.5'
              }`}>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              </div>
              {msg.role === 'user' && (
                <div className="w-7 h-7 bg-[var(--bg-tertiary)] rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User size={14} className="text-[var(--text-secondary)]" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-3 animate-in">
              <div className="w-7 h-7 bg-[var(--accent)] rounded-lg flex items-center justify-center flex-shrink-0">
                <Bot size={14} className="text-white" />
              </div>
              <div className="bg-[var(--bg)] border border-[var(--border)] rounded-2xl rounded-bl-md px-4 py-3">
                <Loader2 size={16} className="animate-spin text-[var(--text-tertiary)]" />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div className="mt-4 flex gap-2">
          <input
            className="input flex-1"
            placeholder="Ask about GST, ITR, TDS, compliance..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            disabled={loading}
          />
          <button className="btn btn-primary" onClick={send} disabled={loading || !input.trim()}>
            <Send size={16} />
          </button>
        </div>

        {/* Quick prompts */}
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            'What is my GST liability?',
            'Compare old vs new tax regime',
            'List upcoming compliance deadlines',
            'TDS rate for professional fees',
          ].map(q => (
            <button
              key={q}
              className="text-xs px-3 py-1.5 rounded-full border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
              onClick={() => { setInput(q); }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </Shell>
  );
}
