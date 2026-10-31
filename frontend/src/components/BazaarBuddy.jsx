import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, X, Send, RotateCcw, Sparkles, Shield, Tag, HelpCircle } from 'lucide-react';
import { api } from '../lib/api';
import { useBuddyContext } from '../context/BuddyContext';

export default function BazaarBuddy() {
  const { context } = useBuddyContext();
  const { listingId, listingTitle } = context;
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState('');
  const [suggestedPrompts, setSuggestedPrompts] = useState([]);
  const scrollRef = useRef(null);
  const lastCheckedListing = useRef(null);

  // Initial welcome and listing context synchronization
  useEffect(() => {
    if (!open) return;

    if (listingId) {
      if (lastCheckedListing.current !== listingId) {
        lastCheckedListing.current = listingId;
        checkListingPrice();
      }
    } else if (messages.length === 0) {
      setMessages([
        {
          from: 'buddy',
          text: "Hey! I'm **BazaarBuddy** 👋 Your AI assistant for CampusBazaar. Ask me about buying, selling, checking fair prices, or staying safe on campus!",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setSuggestedPrompts([
        'How to sell an item?',
        'Browse categories',
        'Safety tips',
        'How to edit listings?',
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, listingId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  async function checkListingPrice() {
    setLoading(true);
    try {
      const res = await api.post('/ai/buddy', { listingId });
      setMessages((m) => [
        ...m,
        {
          from: 'buddy',
          text: res.reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      if (res.suggestedPrompts?.length) {
        setSuggestedPrompts(res.suggestedPrompts);
      }
    } catch {
      setMessages((m) => [
        ...m,
        {
          from: 'buddy',
          text: "I couldn't check that listing right now, but feel free to ask me anything else about this item or CampusBazaar!",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setSuggestedPrompts(['Tell me about this item', 'Safety checklist', 'How to contact seller']);
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage(textToSend) {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMsg = {
      from: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((m) => [...m, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/ai/buddy', {
        message: text,
        listingId: listingId || undefined,
        history: messages.slice(-6).map((m) => ({ from: m.from, text: m.text })),
      });

      setMessages((m) => [
        ...m,
        {
          from: 'buddy',
          text: res.reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);

      if (res.suggestedPrompts && res.suggestedPrompts.length > 0) {
        setSuggestedPrompts(res.suggestedPrompts);
      }
    } catch {
      setMessages((m) => [
        ...m,
        {
          from: 'buddy',
          text: "Sorry, I had a momentary hiccup. Try asking again or check our [Help Center](/help)!",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    sendMessage();
  }

  function handleResetChat() {
    lastCheckedListing.current = null;
    setMessages([
      {
        from: 'buddy',
        text: "Chat cleared! ✨ How can I help you on CampusBazaar today?",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setSuggestedPrompts(
      listingId
        ? ['Is this price fair?', 'Tell me about this item', 'Safety checklist']
        : ['How to sell an item?', 'Browse categories', 'Safety tips', 'How to edit listings?']
    );
  }

  // Parse text into formatted components with clickable links
  function renderFormattedText(text) {
    if (!text) return null;

    // Pattern for markdown links: [Label](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: text.substring(lastIndex, match.index) });
      }
      parts.push({ type: 'link', label: match[1], url: match[2] });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push({ type: 'text', content: text.substring(lastIndex) });
    }

    return (
      <div className="whitespace-pre-wrap leading-relaxed">
        {parts.map((p, idx) => {
          if (p.type === 'link') {
            const isInternal = p.url.startsWith('/');
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  if (isInternal) {
                    navigate(p.url);
                  } else {
                    window.open(p.url, '_blank', 'noopener,noreferrer');
                  }
                }}
                className="font-medium text-bazaar-600 underline decoration-bazaar-300 underline-offset-2 hover:text-bazaar-800 transition-colors inline"
              >
                {p.label}
              </button>
            );
          }

          // Format bold text **word**
          const boldParts = p.content.split(/(\*\*[^*]+\*\*)/g);
          return (
            <span key={idx}>
              {boldParts.map((bp, bIdx) => {
                if (bp.startsWith('**') && bp.endsWith('**')) {
                  return <strong key={bIdx} className="font-semibold text-ink">{bp.slice(2, -2)}</strong>;
                }
                return bp;
              })}
            </span>
          );
        })}
      </div>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <div className="mb-3 flex h-[520px] w-[350px] sm:w-[380px] flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-2xl transition-all">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-line bg-bazaar-600 px-4 py-3 text-paper">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-paper/20">
                <Sparkles size={16} className="text-paper" />
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-bazaar-600 bg-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="font-display text-sm font-semibold tracking-wide">BazaarBuddy</p>
                  <span className="rounded bg-paper/20 px-1 py-0.2 text-[10px] font-medium text-paper">AI</span>
                </div>
                {listingTitle ? (
                  <p className="text-[11px] text-paper/80 line-clamp-1">Viewing: {listingTitle}</p>
                ) : (
                  <p className="text-[11px] text-paper/80">Campus Marketplace Assistant</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleResetChat}
                title="Restart chat"
                aria-label="Restart chat"
                className="rounded-full p-1.5 text-paper/80 hover:bg-paper/20 hover:text-paper transition"
              >
                <RotateCcw size={15} />
              </button>
              <button
                onClick={() => setOpen(false)}
                title="Close chat"
                aria-label="Close"
                className="rounded-full p-1.5 text-paper/80 hover:bg-paper/20 hover:text-paper transition"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Active Listing Badge Banner if on a listing */}
          {listingId && listingTitle && (
            <div className="flex items-center justify-between border-b border-line bg-bazaar-50/70 px-3 py-1.5 text-xs text-bazaar-800">
              <span className="truncate flex items-center gap-1 font-medium">
                <Tag size={12} className="shrink-0 text-bazaar-600" />
                <span>Listing in focus: {listingTitle}</span>
              </span>
              <button
                type="button"
                onClick={checkListingPrice}
                className="shrink-0 text-[11px] font-semibold text-bazaar-700 underline hover:text-bazaar-900"
              >
                Re-check price
              </button>
            </div>
          )}

          {/* Messages Container */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-3.5 bg-paper/20">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex flex-col transition-all ${
                  m.from === 'buddy' ? 'items-start' : 'items-end'
                }`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm shadow-sm ${
                    m.from === 'buddy'
                      ? 'rounded-tl-sm border border-line bg-white text-ink'
                      : 'rounded-tr-sm bg-ink text-paper'
                  }`}
                >
                  {renderFormattedText(m.text)}
                </div>
                {m.time && (
                  <span className="mt-1 px-1 text-[10px] text-ink-soft/70">
                    {m.time}
                  </span>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {loading && (
              <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm border border-line bg-white px-3.5 py-2.5 text-xs text-ink-soft shadow-sm w-fit">
                <div className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-bazaar-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-bazaar-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-bazaar-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-[11px]">BazaarBuddy is thinking…</span>
              </div>
            )}
          </div>

          {/* Suggested Quick Replies / Questions */}
          {suggestedPrompts.length > 0 && !loading && (
            <div className="border-t border-line/60 bg-paper/40 px-3 py-2">
              <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-ink-soft">
                Suggested questions:
              </p>
              <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto">
                {suggestedPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => sendMessage(prompt)}
                    className="rounded-full border border-line bg-white px-2.5 py-1 text-[11px] font-medium text-ink hover:border-bazaar-500 hover:text-bazaar-700 transition-colors shadow-2xs"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={handleFormSubmit} className="flex items-center gap-2 border-t border-line bg-white p-2.5">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about buying, selling, prices, safety…"
              disabled={loading}
              className="focus-ring flex-1 rounded-full border border-line bg-paper/30 px-3.5 py-2 text-xs sm:text-sm outline-none placeholder:text-ink-soft/70 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              aria-label="Send message"
              className="focus-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-paper transition hover:bg-ink/90 disabled:opacity-40"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open BazaarBuddy AI assistant"
        className="focus-ring group relative flex h-14 w-14 items-center justify-center rounded-full bg-bazaar-600 text-paper shadow-xl transition-all duration-200 hover:scale-105 hover:bg-bazaar-700"
      >
        {open ? (
          <X size={24} />
        ) : (
          <>
            <MessageSquare size={24} />
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mustard-400 opacity-75" />
              <span className="relative inline-flex h-4 w-4 rounded-full bg-mustard-500 text-[9px] font-bold text-ink items-center justify-center">
                ✨
              </span>
            </span>
          </>
        )}
      </button>
    </div>
  );
}
