import { useEffect, useRef, useState } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';
import { api } from '../lib/api';
import { useBuddyContext } from '../context/BuddyContext';

export default function BazaarBuddy() {
  const { context } = useBuddyContext();
  const { listingId, listingTitle } = context;
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState('');
  const scrollRef = useRef(null);
  const lastCheckedListing = useRef(null);

  useEffect(() => {
    if (!open) return;
    if (listingId) {
      if (lastCheckedListing.current !== listingId) {
        lastCheckedListing.current = listingId;
        checkPrice();
      }
    } else if (messages.length === 0) {
      setMessages([
        {
          from: 'buddy',
          text: "Hey! I'm BazaarBuddy 👋 Open any listing and I'll check if the price is fair based on similar items on campus.",
        },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, listingId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  async function checkPrice() {
    setLoading(true);
    try {
      const res = await api.post('/ai/buddy', { listingId });
      setMessages((m) => [...m, { from: 'buddy', text: res.reply }]);
    } catch {
      setMessages((m) => [...m, { from: 'buddy', text: "I couldn't check that listing right now - try again in a bit." }]);
    } finally {
      setLoading(false);
    }
  }

  function handleSend(e) {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages((m) => [...m, { from: 'user', text: input }]);
    setInput('');
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          from: 'buddy',
          text: listingId
            ? "Got it. I mainly help with pricing right now - tap the listing again if you'd like me to re-check the price, or reach out to the seller directly for other questions."
            : 'I can help most with pricing once you open a specific listing. Try browsing the marketplace and open something you like!',
        },
      ]);
    }, 500);
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <div className="mb-3 flex h-[420px] w-[320px] flex-col overflow-hidden rounded-xl border border-line bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-line bg-bazaar-500 px-4 py-3 text-paper">
            <div>
              <p className="font-display text-sm font-semibold">BazaarBuddy</p>
              {listingTitle && <p className="text-xs text-bazaar-100/80 line-clamp-1">on {listingTitle}</p>}
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close" className="rounded hover:opacity-80">
              <X size={18} />
            </button>
          </div>
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-snug ${
                  m.from === 'buddy' ? 'bg-paper text-ink' : 'ml-auto bg-ink text-paper'
                }`}
              >
                {m.text}
              </div>
            ))}
            {loading && <div className="w-fit rounded-lg bg-paper px-3 py-2 text-sm text-ink-soft">Checking similar listings…</div>}
          </div>
          <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-line p-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask BazaarBuddy..."
              className="focus-ring flex-1 rounded-full border border-line px-3 py-2 text-sm outline-none"
            />
            <button type="submit" className="focus-ring flex h-9 w-9 items-center justify-center rounded-full bg-ink text-paper" aria-label="Send">
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open BazaarBuddy assistant"
        className="focus-ring flex h-14 w-14 items-center justify-center rounded-full bg-ink text-paper shadow-lg transition-transform hover:scale-105"
      >
        {open ? <X size={22} /> : <MessageSquare size={22} />}
      </button>
    </div>
  );
}
