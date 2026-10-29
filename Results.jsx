import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { errMsg, getResult } from "../api.js";
import { Avatar, btnGhost, btnPrimary, DIFFICULTY, ErrorBox, Spinner } from "../components.jsx";

export default function Results() {
  const { id } = useParams();
  const [r, setR] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getResult(id).then(setR).catch((e) => setError(errMsg(e)));
  }, [id]);

  if (error) {
    return (
      <div className="max-w-xl">
        <ErrorBox message={error} />
        <Link to={`/case/${id}`} className={btnGhost}>Back to the case</Link>
      </div>
    );
  }
  if (!r) return <Spinner label="Reading the verdict…" />;

  const accused = r.suspects.find((s) => s.id === r.accusedId);
  const culpritIdx = r.suspects.findIndex((s) => s.id === r.culprit.id);
  const b = r.breakdown;
  const tone = r.correct ? "text-tag" : "text-string";

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <div className={`${tone} mb-5`}>
          <span className="stamp">{r.correct ? "CASE CLOSED" : "CULPRIT FREE"}</span>
        </div>
        <h1 className="font-display text-3xl sm:text-5xl mb-2">
          {r.correct ? "You found the culprit." : "The culprit got away."}
        </h1>
        <p className="text-muted">
          {r.title}. You accused {accused?.name}. Difficulty: {DIFFICULTY[r.difficulty].label}.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[280px_1fr] mb-10">
        <div className="bg-board border border-line rounded-lg p-5 self-start">
          <p className="text-sm text-muted">Final score</p>
          <p className={`font-display text-6xl ${tone}`}>{r.score}</p>
          <dl className="mt-4 text-sm space-y-1">
            <div className="flex justify-between"><dt>Correct accusation</dt><dd>+{b.base}</dd></div>
            <div className="flex justify-between"><dt>Clues found ({r.progress.cluesFound})</dt><dd>+{b.clues}</dd></div>
            <div className="flex justify-between"><dt>Hints used ({r.progress.hintsUsed})</dt><dd>−{b.hints}</dd></div>
          </dl>
        </div>

        <div className="bg-board border border-line rounded-lg p-5">
          <p className="text-sm text-muted mb-3">The culprit</p>
          <div className="flex items-center gap-3 mb-4">
            <Avatar name={r.culprit.name} index={culpritIdx} size={56} />
            <div>
              <h2 className="font-display text-2xl leading-tight">{r.culprit.name}</h2>
              <p className="text-tag text-sm">{r.culprit.role}</p>
            </div>
          </div>
          <h3 className="font-semibold mb-1">What really happened</h3>
          <p className="whitespace-pre-line max-w-prose">{r.solution}</p>
        </div>
      </div>

      <section className="mb-10">
        <h2 className="font-display text-2xl mb-3">All the evidence</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {r.clues.map((c) => (
            <li key={c.id} className={`rounded-md p-4 ${c.discovered ? "bg-tag text-ink" : "border border-dashed border-line"}`}>
              <h3 className="font-semibold">{c.title}{!c.discovered && <span className="text-muted font-normal text-sm"> (you missed this)</span>}</h3>
              <p className={`text-sm mt-1 ${c.discovered ? "" : "text-muted"}`}>{c.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <div className="text-center">
        <Link to="/create" className={btnPrimary}>Start another mystery</Link>
      </div>
    </div>
  );
}
