import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createCase, errMsg } from "../api.js";
import { btnPrimary, DIFFICULTY, ErrorBox, Pips, Spinner } from "../components.jsx";

const IDEAS = [
  "A jewel theft at a mountain ski lodge during a blizzard",
  "A poisoned cup of tea at a village bake-off",
  "A missing painting aboard a luxury night train",
  "A sabotaged launch party at a robotics startup",
];

export default function Create() {
  const nav = useNavigate();
  const [premise, setPremise] = useState("");
  const [difficulty, setDifficulty] = useState("easy");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const tooShort = premise.trim().length < 10;

  async function submit(e) {
    e.preventDefault();
    if (tooShort || loading) return;
    setLoading(true);
    setError("");
    try {
      const c = await createCase(premise.trim(), difficulty);
      nav(`/case/${c.id}`);
    } catch (err) {
      setError(errMsg(err));
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-xl mx-auto text-center py-16">
        <h1 className="font-display text-3xl mb-3">Gemini is writing your case</h1>
        <p className="text-muted mb-2">Placing the suspects and hiding the evidence. This can take up to 30 seconds.</p>
        <div className="flex justify-center"><Spinner label="Generating mystery" /></div>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
      <form onSubmit={submit}>
        <h1 className="font-display text-4xl mb-2">Open a new case</h1>
        <p className="text-muted mb-8">Describe the setting and what went wrong. Gemini fills in the rest.</p>

        <label htmlFor="premise" className="block font-semibold mb-2">Premise</label>
        <textarea
          id="premise"
          value={premise}
          onChange={(e) => setPremise(e.target.value)}
          maxLength={300}
          rows={4}
          placeholder="A stolen violin at a village music festival…"
          className="w-full bg-board border border-line rounded-md p-3 focus:border-tag outline-none"
        />
        <div className="flex justify-between text-xs text-muted mt-1">
          <span>{tooShort ? "At least 10 characters" : "Looks good"}</span>
          <span>{premise.length}/300</span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {IDEAS.map((i) => (
            <button type="button" key={i} onClick={() => setPremise(i)} className="text-xs border border-line rounded-full px-3 py-1.5 text-muted hover:text-tag hover:border-tag transition">
              {i}
            </button>
          ))}
        </div>

        <fieldset className="mt-8">
          <legend className="font-semibold mb-3">Difficulty</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            {Object.entries(DIFFICULTY).map(([key, d]) => (
              <label key={key} className={`cursor-pointer border rounded-lg p-4 transition ${difficulty === key ? "border-tag bg-board-2" : "border-line hover:border-muted"}`}>
                <input type="radio" name="difficulty" value={key} checked={difficulty === key} onChange={() => setDifficulty(key)} className="sr-only" />
                <span className="flex items-center justify-between mb-1">
                  <b>{d.label}</b>
                  <Pips level={d.level} />
                </span>
                <span className="block text-xs text-muted">{d.blurb}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <ErrorBox message={error} />

        <button type="submit" disabled={tooShort} className={`${btnPrimary} mt-8`}>
          Generate mystery
        </button>
      </form>

      <aside className="bg-board border border-line rounded-lg p-5 self-start">
        <h2 className="font-display text-xl text-tag mb-3">How scoring works</h2>
        <dl className="text-sm space-y-2">
          <div className="flex justify-between"><dt>Correct accusation</dt><dd>100 / 150 / 200</dd></div>
          <div className="flex justify-between"><dt>Each clue found</dt><dd className="text-tag">+5</dd></div>
          <div className="flex justify-between"><dt>Each hint used</dt><dd className="text-string">−10</dd></div>
          <div className="flex justify-between border-t border-line pt-2"><dt>Lowest possible score</dt><dd>0</dd></div>
        </dl>
        <p className="text-xs text-muted mt-4">Base points depend on difficulty: easy, medium, hard.</p>
      </aside>
    </div>
  );
}
