import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { EmptyState, Spinner } from '../../components/Bits';

export default function Messages() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const scrollRef = useRef(null);

  function loadConversations() {
    api.get('/messages').then((r) => setConversations(r.conversations));
  }
  useEffect(() => { loadConversations(); }, []);

  useEffect(() => {
    if (!conversationId) { setLoading(false); return; }
    setLoading(true);
    api.get(`/messages/${conversationId}`).then((r) => setMessages(r.messages)).finally(() => setLoading(false));
  }, [conversationId]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }); }, [messages]);

  const activeConvo = conversations.find((c) => c.id === conversationId);

  async function send(e) {
    e.preventDefault();
    if (!text.trim() || !activeConvo) return;
    await api.post('/messages', { toUserId: activeConvo.otherUser.id, listingId: activeConvo.listingId, body: text });
    setText('');
    const r = await api.get(`/messages/${conversationId}`);
    setMessages(r.messages);
    loadConversations();
  }

  if (conversations.length === 0 && !loading) {
    return <EmptyState title="No conversations yet" body="Message a seller from a listing page to start a conversation." />;
  }

  return (
    <div className="grid h-[560px] grid-cols-1 overflow-hidden rounded-lg border border-line bg-white sm:grid-cols-[260px_1fr]">
      <div className="overflow-y-auto border-r border-line">
        {conversations.map((c) => (
          <button
            key={c.id}
            onClick={() => navigate(`/dashboard/messages/${c.id}`)}
            className={`block w-full border-b border-line p-3 text-left hover:bg-paper ${c.id === conversationId ? 'bg-paper' : ''}`}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{c.otherUser?.name}</p>
              {c.unreadCount > 0 && <span className="rounded-full bg-bazaar-500 px-1.5 text-xs text-paper">{c.unreadCount}</span>}
            </div>
            {c.listingTitle && <p className="text-xs text-ink-soft">Re: {c.listingTitle}</p>}
            <p className="mt-1 line-clamp-1 text-xs text-ink-soft">{c.lastMessage}</p>
          </button>
        ))}
      </div>

      <div className="flex flex-col">
        {!conversationId ? (
          <div className="flex flex-1 items-center justify-center text-sm text-ink-soft">Select a conversation</div>
        ) : loading ? (
          <Spinner />
        ) : (
          <>
            <div className="border-b border-line p-3 text-sm font-medium">{activeConvo?.otherUser?.name}</div>
            <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto p-3">
              {messages.map((m) => (
                <div key={m.id} className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${m.sender_id === user.id ? 'ml-auto bg-ink text-paper' : 'bg-paper'}`}>
                  {m.body}
                </div>
              ))}
            </div>
            <form onSubmit={send} className="flex items-center gap-2 border-t border-line p-3">
              <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message…" className="focus-ring flex-1 rounded-full border border-line px-3 py-2 text-sm" />
              <button className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-paper"><Send size={15} /></button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
