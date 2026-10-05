import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Check, CheckCheck, MessageSquareText } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

const dayLabel = (ts: number) => {
  const d = new Date(ts); const t = new Date();
  const y = new Date(); y.setDate(t.getDate() - 1);
  if (d.toDateString() === t.toDateString()) return 'Today';
  if (d.toDateString() === y.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

/** One doctor<->patient conversation. `me` decides which side the bubbles sit on. */
export default function ChatThread({
  patientId, doctorId, me, accent, quickReplies = [], emptyHint,
}: { patientId: string; doctorId: string; me: 'doctor' | 'patient'; accent: string; quickReplies?: string[]; emptyHint?: string }) {
  const { messages, sendMessage, markThreadRead } = useApp();
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  const thread = useMemo(
    () => messages.filter(m => m.patientId === patientId && m.doctorId === doctorId).sort((a, b) => a.ts - b.ts),
    [messages, patientId, doctorId]);

  // mark as read whenever the thread is open and new messages arrive
  useEffect(() => { markThreadRead(patientId, doctorId); /* eslint-disable-next-line */ }, [patientId, doctorId, thread.length]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [thread.length, patientId, doctorId]);

  const send = (t = text) => {
    if (!t.trim()) return;
    sendMessage(patientId, doctorId, t);
    setText('');
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5" data-testid="chat-scroll">
        {thread.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground gap-2 py-10">
            <MessageSquareText size={36} style={{ color: accent }} className="opacity-60" />
            <p className="text-sm max-w-xs">{emptyHint ?? 'No messages yet. Say hello!'}</p>
          </div>
        )}
        {thread.map((m, i) => {
          const mine = m.from === me;
          const showDay = i === 0 || dayLabel(thread[i - 1].ts) !== dayLabel(m.ts);
          const seen = me === 'doctor' ? m.readByPatient : m.readByDoctor;
          return (
            <div key={m.id}>
              {showDay && <p className="text-center text-[11px] text-muted-foreground my-3">{dayLabel(m.ts)}</p>}
              <motion.div initial={{ opacity: 0, y: 8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[78%] px-3.5 py-2 rounded-2xl text-sm shadow-sm ${mine ? 'text-white rounded-br-md' : 'bg-muted text-foreground rounded-bl-md'}`}
                  style={mine ? { background: accent } : undefined}>
                  {!mine && <p className="text-[11px] font-semibold opacity-70 mb-0.5">{m.senderName}</p>}
                  <p className="whitespace-pre-wrap break-words">{m.text}</p>
                  <p className={`text-[10px] mt-1 flex items-center gap-1 justify-end ${mine ? 'text-white/70' : 'text-muted-foreground'}`}>
                    {new Date(m.ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    {mine && (seen ? <CheckCheck size={12} /> : <Check size={12} />)}
                  </p>
                </div>
              </motion.div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {quickReplies.length > 0 && (
        <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
          {quickReplies.map(q => (
            <button key={q} onClick={() => send(q)} className="shrink-0 text-xs px-3 py-1.5 rounded-full border border-border bg-card hover:bg-muted transition-colors">{q}</button>
          ))}
        </div>
      )}

      <div className="p-3 border-t border-border flex items-end gap-2 bg-card/60">
        <textarea value={text} onChange={e => setText(e.target.value)} rows={1} placeholder="Type a message…"
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          className="flex-1 resize-none max-h-28 bg-muted rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
          style={{ ['--tw-ring-color' as string]: accent }} data-testid="chat-input" />
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => send()} disabled={!text.trim()}
          className="w-10 h-10 rounded-full flex items-center justify-center text-white disabled:opacity-40 shrink-0"
          style={{ background: accent }} data-testid="chat-send" aria-label="Send">
          <Send size={16} />
        </motion.button>
      </div>
    </div>
  );
}
