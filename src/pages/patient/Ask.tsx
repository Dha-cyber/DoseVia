import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Copy, RotateCcw, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import PatientLayout from '@/layouts/PatientLayout';
import { callGemini, toGeminiHistory } from '@/lib/gemini';

const QUICK_QUESTIONS = [
  'Can I drink chai with this?',
  'Is it safe to drive?',
  'Can I take paracetamol too?',
  'What if I forget a dose?',
  'Can I drink alcohol?',
  'Is it safe to exercise today?',
];

const MYTHS = [
  { myth: 'Taking 2 medicines together always doubles the effect', fact: 'Not true! Some medicines cancel each other out, while others may increase — sometimes dangerously. Always ask your doctor.' },
  { myth: 'Herbal medicines are always safe to add', fact: 'Herbal products can seriously interact with prescription medicines. For example, St. John\'s Wort can reduce the effectiveness of many drugs.' },
  { myth: 'If I feel fine, I can stop taking my medicines', fact: 'Many medicines work silently — like blood pressure or thyroid medicines. Stopping suddenly can cause serious health problems.' },
];

interface Message { role: 'user' | 'ai'; text: string; }

function parseJson<T>(text: string): T {
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned) as T;
}

export default function Ask() {
  const { selectedPatient, drugs: allDrugs } = useApp();
  const patientDrugs = allDrugs.filter(d => selectedPatient?.drugs?.includes(d.id));
  const drugNames = patientDrugs.map(d => d.genericName).join(', ');

  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: `Hi ${selectedPatient?.name.split(' ')[0] ?? 'there'}! I'm here to answer your medicine questions in simple language. What would you like to know?` }
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flippedMyths, setFlippedMyths] = useState<number[]>([]);
  const [doctorQuestions, setDoctorQuestions] = useState<string[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  const systemPrompt = `You are a friendly, plain-language medical assistant for a patient named ${selectedPatient?.name ?? 'the patient'}.
Their current medications are: ${drugNames || 'none listed'}.
Their conditions: ${selectedPatient?.conditions?.join(', ') || 'none listed'}.
Answer in simple, reassuring language a non-medical person can understand.
Keep answers concise (3-5 sentences max). Always remind them to consult their doctor for personal advice.
Do NOT diagnose or prescribe. Focus only on general medication guidance and safety information.`;

  const generateDoctorQuestions = async () => {
    if (!selectedPatient) return;
    setQuestionsLoading(true);
    setError(null);

    const conditions = selectedPatient.conditions.join(', ');
    const meds = patientDrugs.map(d => `${d.genericName} (${d.class})`).join(', ');

    const prompt = `Generate 5 highly specific, intelligent questions a patient with these conditions and medications should ask their doctor at the next appointment. Focus on drug interactions, safety, and treatment optimisation for this specific combination.

Patient conditions: ${conditions}
Current medications: ${meds || 'not listed'}
Kidney function: ${selectedPatient.kidneyFunction}%
Liver function: ${selectedPatient.liverFunction}%
${selectedPatient.pregnant ? 'Patient is pregnant.' : ''}

Return ONLY valid JSON (no markdown):
{
  "questions": ["<question1>", "<question2>", "<question3>", "<question4>", "<question5>"]
}
Make each question specific to this patient's exact medication and condition profile — not generic.`;

    try {
      const response = await callGemini(prompt, 'You are a clinical AI assistant. Return only valid JSON with 5 specific patient questions.');
      const data = parseJson<{ questions: string[] }>(response);
      setDoctorQuestions(data.questions ?? []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      // Fallback questions
      setDoctorQuestions([
        'Is my current combination causing the occasional dizziness I experience?',
        'Can we review whether I still need all of my current medicines?',
        'What warning signs should make me call you immediately given my drug combination?',
        'Are there any newer medicines with fewer interactions than my current combination?',
        'What monitoring schedule would you recommend for my current medications?',
      ]);
    } finally {
      setQuestionsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPatient) {
      generateDoctorQuestions();
    }
  }, [selectedPatient?.id, selectedPatient?.drugs?.join(',')]);

  const sendMessage = async (text: string) => {
    const msg = text || input.trim();
    if (!msg) return;
    setMessages(m => [...m, { role: 'user', text: msg }]);
    setInput('');
    setTyping(true);
    setError(null);

    try {
      const history = toGeminiHistory(messages.slice(1));
      const response = await callGemini(msg, systemPrompt, history);
      setMessages(m => [...m, { role: 'ai', text: response }]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      setMessages(m => [...m, { role: 'ai', text: `⚠️ ${message}` }]);
    } finally {
      setTyping(false);
    }
  };

  useEffect(() => {
    chatRef.current?.scrollTo({ top: 9999, behavior: 'smooth' });
  }, [messages]);

  return (
    <PatientLayout>
      <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground">Ask Anything</h1>
          <p className="text-muted-foreground text-sm mt-1">Simple answers to your medicine questions</p>
        </motion.div>

        {/* API key warning */}
        {error && error.includes('VITE_GEMINI_API_KEY') && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Gemini API key not configured</p>
              <p className="text-xs mt-1">Add <code className="bg-amber-100 px-1 rounded">VITE_GEMINI_API_KEY=your_key</code> to your <code className="bg-amber-100 px-1 rounded">.env</code> file or Replit Secrets, then restart the dev server.</p>
            </div>
          </motion.div>
        )}

        {/* Chat */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-2xl flex flex-col overflow-hidden" style={{ height: '420px' }}>
          <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: msg.role === 'user' ? 30 : -30, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === 'user'
                  ? 'rounded-tr-sm text-white'
                  : 'bg-muted text-foreground rounded-tl-sm'}`}
                  style={msg.role === 'user' ? { background: 'linear-gradient(135deg, #7C3AED, #D4537E)' } : undefined}>
                  {msg.text}
                </div>
              </motion.div>
            ))}
            {typing && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-1.5 px-4 py-3 bg-muted rounded-2xl rounded-tl-sm w-fit">
                {[0, 1, 2].map(i => <motion.div key={i} className="w-2 h-2 rounded-full bg-muted-foreground" animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />)}
              </motion.div>
            )}
          </div>

          {/* Quick questions */}
          <div className="px-4 py-2 border-t border-border flex gap-2 overflow-x-auto scrollbar-none">
            {QUICK_QUESTIONS.map((q, i) => (
              <motion.button key={q}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                whileHover={{ y: -3, scale: 1.02 }}
                whileTap={{ scale: 0.93 }}
                onClick={() => sendMessage(q)}
                className="shrink-0 text-xs px-3 py-1.5 rounded-full border border-border bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-all"
                data-testid={`button-quick-q-${i}`}>
                {q}
              </motion.button>
            ))}
          </div>

          <div className="p-3 border-t border-border flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !typing && sendMessage('')}
              placeholder="Type your question here..."
              disabled={typing}
              className="flex-1 px-4 py-2.5 bg-muted rounded-xl text-sm focus:outline-none focus:ring-2 border border-border disabled:opacity-50"
              style={{ '--tw-ring-color': '#7C3AED40' } as React.CSSProperties}
              data-testid="input-ask-question"
            />
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.93 }}
              onClick={() => sendMessage('')}
              disabled={typing || !input.trim()}
              className="p-2.5 rounded-xl text-white disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #D4537E)' }}
              data-testid="button-send-question">
              <Send size={16} />
            </motion.button>
          </div>
        </motion.div>

        {/* Questions for doctor — AI */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-foreground">Questions for Your Doctor</h2>
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">AI Generated</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Based on your current {patientDrugs.length}-drug combination</p>
            </div>
            <motion.button
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.6 }}
              onClick={generateDoctorQuestions}
              disabled={questionsLoading}
              className="p-2 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground disabled:opacity-50"
              data-testid="button-generate-questions"
            >
              {questionsLoading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            </motion.button>
          </div>

          {questionsLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground text-sm">
              <Loader2 size={16} className="animate-spin text-purple-600" />
              AI is generating personalised questions for your appointment…
            </div>
          ) : (
            <div className="space-y-2">
              {doctorQuestions.map((q, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 group"
                >
                  <span className="text-xs font-bold text-purple-600 mt-0.5 shrink-0">{i + 1}.</span>
                  <p className="text-sm text-foreground flex-1">{q}</p>
                  <motion.button
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1, scale: 1.1 }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-muted transition-all"
                    onClick={() => navigator.clipboard.writeText(q)}
                    data-testid={`button-copy-question-${i}`}
                  >
                    <Copy size={12} />
                  </motion.button>
                </motion.div>
              ))}
            </div>
          )}
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="text-xs text-muted-foreground mt-4 text-center italic">
            Screenshot this list to take to your appointment
          </motion.p>
        </motion.div>

        {/* Myth busters */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h2 className="font-bold text-foreground mb-3">Myth Busters</h2>
          <div className="space-y-3">
            {MYTHS.map((item, i) => (
              <div key={i} className="relative h-24" style={{ perspective: '1000px' }} data-testid={`myth-card-${i}`}>
                <motion.div
                  animate={{ rotateY: flippedMyths.includes(i) ? 180 : 0 }}
                  transition={{ duration: 0.6, type: 'spring', stiffness: 200, damping: 25 }}
                  style={{ transformStyle: 'preserve-3d', width: '100%', height: '100%', position: 'relative' }}
                >
                  <div className="absolute inset-0 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between" style={{ backfaceVisibility: 'hidden' }}>
                    <div>
                      <span className="text-xs font-bold text-red-500 uppercase tracking-wider">MYTH</span>
                      <p className="text-sm text-red-800 mt-1 font-medium">{item.myth}</p>
                    </div>
                    <button onClick={() => setFlippedMyths(f => [...f, i])}
                      className="shrink-0 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-semibold rounded-lg transition-colors ml-3"
                      data-testid={`button-flip-myth-${i}`}>
                      See the truth
                    </button>
                  </div>
                  <div className="absolute inset-0 bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center justify-between" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                    <div>
                      <span className="text-xs font-bold text-green-600 uppercase tracking-wider">FACT ✓</span>
                      <p className="text-sm text-green-800 mt-1">{item.fact}</p>
                    </div>
                    <button onClick={() => setFlippedMyths(f => f.filter(n => n !== i))}
                      className="shrink-0 p-1.5 text-green-600 hover:bg-green-100 rounded-lg ml-3"
                      data-testid={`button-flip-back-myth-${i}`}>
                      <RotateCcw size={14} />
                    </button>
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </PatientLayout>
  );
}
