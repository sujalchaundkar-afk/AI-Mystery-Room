import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { discoverClue, errMsg, getCase, requestHint } from "../api.js";
import { Avatar, btnGhost, btnPrimary, BulbIcon, DIFFICULTY, ErrorBox, GavelIcon, LockIcon, Meter, SearchIcon, Spinner } from "../components.jsx";

export default function Investigation() {
  const { id } = useParams();
  const nav = useNavigate();
  const [c, setC] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getCase(id);
      if (data.status === "completed") return nav(`/case/${id}/result`, { replace: true });
      setC(data);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, [id, nav]);

  useEffect(() => { load(); }, [load]);

  async function act(fn) {
    setBusy(true);
    setError("");
    try {
      setC(await fn());
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Spinner label="Opening case file…" />;
  if (!c) return <ErrorBox message={error || "Case not found."} onRetry={load} />;

  const p = c.progress;
  const hintsLeft = p.hintsTotal - p.hintsUsed;
  const evidencePoints = Math.max(0, p.cluesFound * 5 - p.hintsUsed * 10);

  return (
    <div>
      <div className="mb-8">
        <span className="text-xs border border-line rounded-full px-3 py-1 text-muted">{DIFFICULTY[c.difficulty].label} case</span>
        <h1 className="font-display text-3xl sm:text-5xl mt-3 leading-tight">{c.title}</h1>
      </div>

      <ErrorBox message={error} />

      <div className="grid gap-10 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0">
          <section className="border-l-4 border-string bg-board rounded-r-lg p-5 mb-10">
            <h2 className="font-display text-xl text-string mb-2">The briefing</h2>
            <p className="whitespace-pre-line max-w-prose">{c.story}</p>
          </section>

          <section className="mb-10">
            <h2 className="font-display text-2xl mb-4">Suspects</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {c.suspects.map((s, i) => (
                <article key={s.id} className="bg-board border border-line rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar name={s.name} index={i} />
                    <div>
                      <h3 className="font-semibold leading-tight">{s.name}</h3>
                      <p className="text-tag text-sm">{s.role}</p>
                    </div>
                  </div>
                  <p className="text-sm mb-3">{s.description}</p>
                  <p className="text-sm text-muted border-t border-line pt-3"><b className="text-paper">Alibi:</b> {s.alibi}</p>
                </article>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl mb-4">Evidence</h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {c.clues.map((cl) =>
                cl.discovered ? (
                  <li key={cl.id} className="reveal bg-tag text-ink rounded-md p-4 -rotate-[0.4deg]">
                    <h3 className="font-semibold">{cl.title}</h3>
                    <p className="text-sm mt-1">{cl.description}</p>
                  </li>
                ) : (
                  <li key={cl.id} className="border border-dashed border-line rounded-md p-4 flex flex-col gap-3">
                    <div className="flex items-start gap-2 text-muted">
                      <span className="mt-0.5"><LockIcon /></span>
                      <h3 className="font-semibold text-paper">{cl.title}</h3>
                    </div>
                    <button disabled={busy} onClick={() => act(() => discoverClue(id, cl.id))} className={`${btnGhost} self-start text-sm`}>
                      <SearchIcon /> Examine
                    </button>
                  </li>
                )
              )}
            </ul>
          </section>
        </div>

        <aside className="lg:sticky lg:top-20 self-start space-y-6 bg-board border border-line rounded-lg p-5">
          <h2 className="font-display text-xl text-tag">Case progress</h2>
          <Meter label="Clues found" value={p.cluesFound} max={p.cluesTotal} />
          <Meter label="Hints used" value={p.hintsUsed} max={p.hintsTotal} />
          <p className="text-sm text-muted">
            Points from evidence so far: <b className="text-tag">{evidencePoints}</b>. The final score is calculated when you accuse.
          </p>

          <div>
            <h3 className="font-semibold mb-2">Hints</h3>
            {c.hints.length === 0 && <p className="text-sm text-muted mb-2">None used yet.</p>}
            <ol className="space-y-2 mb-3">
              {c.hints.map((h, i) => (
                <li key={i} className="reveal text-sm border-l-4 border-tag bg-tag/10 pl-3 py-2 pr-2 rounded-r">{h}</li>
              ))}
            </ol>
            <button disabled={busy || hintsLeft === 0} onClick={() => act(() => requestHint(id))} className={`${btnGhost} w-full text-sm`}>
              <BulbIcon /> {hintsLeft === 0 ? "No hints left" : `Get a hint (−10, ${hintsLeft} left)`}
            </button>
          </div>

          <div className="border-t border-line pt-5">
            <Link to={`/case/${id}/accuse`} className={`${btnPrimary} w-full`}>
              <GavelIcon /> Make an accusation
            </Link>
            <p className="text-xs text-muted mt-2 text-center">You only get one guess.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
