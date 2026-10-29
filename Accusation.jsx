import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { accuse, errMsg, getCase } from "../api.js";
import { Avatar, btnGhost, btnPrimary, ErrorBox, GavelIcon, Spinner } from "../components.jsx";

export default function Accusation() {
  const { id } = useParams();
  const nav = useNavigate();
  const [c, setC] = useState(null);
  const [picked, setPicked] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getCase(id)
      .then((d) => (d.status === "completed" ? nav(`/case/${id}/result`, { replace: true }) : setC(d)))
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  }, [id, nav]);

  async function submit() {
    setSending(true);
    setError("");
    try {
      await accuse(id, picked);
      nav(`/case/${id}/result`);
    } catch (e) {
      setError(errMsg(e));
      setSending(false);
    }
  }

  if (loading) return <Spinner />;
  if (!c) return <ErrorBox message={error || "Case not found."} />;

  const pickedSuspect = c.suspects.find((s) => s.id === picked);

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="font-display text-4xl mb-2">Who did it?</h1>
      <p className="text-muted mb-8">{c.title}. You have found {c.progress.cluesFound} of {c.progress.cluesTotal} clues. This choice is final.</p>

      <fieldset>
        <legend className="sr-only">Choose a suspect</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {c.suspects.map((s, i) => (
            <label
              key={s.id}
              className={`cursor-pointer rounded-lg border p-4 flex gap-3 items-start transition ${picked === s.id ? "border-string bg-board-2 ring-1 ring-string" : "border-line bg-board hover:border-muted"}`}
            >
              <input type="radio" name="suspect" value={s.id} checked={picked === s.id} onChange={() => { setPicked(s.id); setConfirming(false); }} className="sr-only" />
              <Avatar name={s.name} index={i} />
              <span>
                <b className="block leading-tight">{s.name}</b>
                <span className="text-tag text-sm block mb-1">{s.role}</span>
                <span className="text-xs text-muted">Alibi: {s.alibi}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <ErrorBox message={error} />

      <div className="mt-8 flex flex-wrap items-center gap-3">
        {!confirming ? (
          <button disabled={!picked} onClick={() => setConfirming(true)} className={btnPrimary}>
            <GavelIcon /> Accuse {pickedSuspect ? pickedSuspect.name : "a suspect"}
          </button>
        ) : (
          <div className="flex flex-wrap items-center gap-3 border border-string/60 bg-string/10 rounded-md px-4 py-3">
            <span>Accuse <b>{pickedSuspect.name}</b>? You can't undo this.</span>
            <button disabled={sending} onClick={submit} className={btnPrimary}>{sending ? "Submitting…" : "Yes, accuse"}</button>
            <button disabled={sending} onClick={() => setConfirming(false)} className={btnGhost}>Cancel</button>
          </div>
        )}
        {!confirming && <Link to={`/case/${id}`} className={btnGhost}>Keep investigating</Link>}
      </div>
    </div>
  );
}
