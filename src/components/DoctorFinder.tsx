import { useMemo, useState } from 'react';
import { Search, Sparkles } from 'lucide-react';
import { DoctorProfile, PROBLEMS, specialitiesOf, specialitiesForText } from '@/lib/doctors';
import { useApp } from '@/contexts/AppContext';

/** Filtering state + UI for "tell us your problem / pick a speciality". */
export function useDoctorFilter() {
  const { doctors: allDoctors } = useApp();
  const [query, setQuery] = useState('');
  const [problem, setProblem] = useState<number | null>(null);
  const [speciality, setSpeciality] = useState('');

  const { doctors, recommended } = useMemo(() => {
    let rec: string[] = [];
    if (problem !== null) rec = PROBLEMS[problem].specialities;
    else if (query.trim()) rec = specialitiesForText(query);
    let list: DoctorProfile[] = allDoctors;
    if (speciality) list = list.filter(d => d.speciality === speciality);
    if (rec.length) list = list.filter(d => rec.includes(d.speciality));
    else if (query.trim()) list = [];
    // best match (first listed speciality for the problem) first
    if (rec.length) list = [...list].sort((a, b) => rec.indexOf(a.speciality) - rec.indexOf(b.speciality) || b.rating - a.rating);
    return { doctors: list, recommended: rec };
  }, [query, problem, speciality, allDoctors]);

  const clear = () => { setQuery(''); setProblem(null); setSpeciality(''); };
  return { allDoctors, query, setQuery, problem, setProblem, speciality, setSpeciality, doctors, recommended, clear };
}

export default function DoctorFinder({ f }: { f: ReturnType<typeof useDoctorFilter> }) {
  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-52">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={f.query} onChange={e => { f.setQuery(e.target.value); f.setProblem(null); }}
            placeholder="Describe your problem (e.g. high sugar, chest pain) or doctor name…"
            className="w-full pl-9 pr-3 py-2.5 text-sm bg-muted rounded-xl focus:outline-none text-foreground" data-testid="doctor-search" />
        </div>
        <select value={f.speciality} onChange={e => f.setSpeciality(e.target.value)} data-testid="speciality-filter"
          className="bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none">
          <option value="">All specialities</option>
          {specialitiesOf(f.allDoctors).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div>
        <p className="text-[11px] text-muted-foreground mb-1.5">Or pick what you need help with</p>
        <div className="flex gap-2 flex-wrap">
          {PROBLEMS.map((p, i) => (
            <button key={p.label} onClick={() => { f.setProblem(f.problem === i ? null : i); f.setQuery(''); }}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${f.problem === i ? 'text-white border-transparent' : 'border-border bg-card hover:bg-muted text-foreground'}`}
              style={f.problem === i ? { background: '#7C3AED' } : undefined} data-testid={`problem-${i}`}>
              <span className="mr-1">{p.emoji}</span>{p.label}
            </button>
          ))}
        </div>
      </div>

      {f.recommended.length > 0 && (
        <p className="text-xs flex items-center gap-1.5 rounded-lg px-3 py-2" style={{ background: 'rgba(124,58,237,0.1)', color: '#7C3AED' }}>
          <Sparkles size={13} />Suggested for you: {f.recommended.join(' · ')}
        </p>
      )}
    </div>
  );
}
