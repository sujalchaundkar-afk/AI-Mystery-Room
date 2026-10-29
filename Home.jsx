import { Link } from "react-router-dom";
import { btnPrimary, DIFFICULTY, Pips } from "../components.jsx";

function Polaroid({ x, y, rot, label, mark }) {
  return (
    <g transform={`rotate(${rot} ${x + 60} ${y + 75})`}>
      <rect x={x} y={y} width="120" height="150" rx="3" fill="#e8e4d8" />
      <rect x={x + 10} y={y + 22} width="100" height="92" fill="#2c4262" />
      {mark ? (
        <text x={x + 60} y={y + 90} textAnchor="middle" fontSize="54" fill="#e7c65a" fontFamily="'Special Elite', monospace">?</text>
      ) : (
        <>
          <circle cx={x + 60} cy={y + 62} r="17" fill="#172840" />
          <path d={`M${x + 25} ${y + 114} q0 -32 35 -32 q35 0 35 32 z`} fill="#172840" />
        </>
      )}
      <text x={x + 60} y={y + 138} textAnchor="middle" fontSize="12" fill="#0f1b2d" fontFamily="'Special Elite', monospace">{label}</text>
      <circle cx={x + 60} cy={y + 8} r="6" fill="#e0524d" />
      <circle cx={x + 58} cy={y + 6} r="2" fill="#fff" opacity=".5" />
    </g>
  );
}

function EvidenceBoard() {
  return (
    <svg viewBox="0 0 480 420" className="w-full max-w-md mx-auto" role="img" aria-label="A pinboard with three suspect photos connected by red string">
      <rect x="4" y="4" width="472" height="412" rx="10" fill="#172840" stroke="#2c4262" strokeWidth="2" />
      <polyline points="110,98 350,86 230,268 110,98" fill="none" stroke="#e0524d" strokeWidth="2.5" strokeLinejoin="round" />
      <Polaroid x={50} y={90} rot={-5} label="The Heir" />
      <Polaroid x={290} y={78} rot={4} label="The Cook" />
      <Polaroid x={170} y={262} rot={-2} label="Who?" mark />
      <g transform="rotate(6 400 330)">
        <rect x="340" y="305" width="104" height="52" fill="#e7c65a" />
        <text x="392" y="327" textAnchor="middle" fontSize="12" fill="#0f1b2d" fontFamily="'Special Elite', monospace">Clue found:</text>
        <text x="392" y="345" textAnchor="middle" fontSize="12" fill="#0f1b2d" fontFamily="'Special Elite', monospace">muddy boots</text>
      </g>
    </svg>
  );
}

export default function Home() {
  return (
    <div>
      <section className="grid gap-10 lg:grid-cols-2 items-center py-4 lg:py-10">
        <div>
          <p className="font-display text-string text-lg mb-3">A new case is waiting</p>
          <h1 className="font-display text-4xl sm:text-6xl leading-[1.1] mb-6">Someone in this room is lying.</h1>
          <p className="text-muted text-lg max-w-prose mb-8">
            Tell Gemini where it happens and how hard you want it. It writes the suspects, their alibis, and the evidence.
            You find the clues and name the culprit.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link to="/create" className={btnPrimary}>Open a new case</Link>
            <span className="text-sm text-muted">No sign-up. A case takes 10 to 20 minutes.</span>
          </div>
        </div>
        <EvidenceBoard />
      </section>

      <section className="mt-16 grid gap-6 md:grid-cols-3">
        <div className="bg-board border border-line rounded-lg p-5">
          <h2 className="font-display text-xl mb-2 text-tag">Examine the evidence</h2>
          <p className="text-sm text-muted">Each clue you uncover is worth 5 points. Clues stay hidden until you examine them.</p>
        </div>
        <div className="bg-board border border-line rounded-lg p-5">
          <h2 className="font-display text-xl mb-2 text-tag">Ask for a hint</h2>
          <p className="text-sm text-muted">Stuck? A hint nudges you in the right direction, but costs 10 points.</p>
        </div>
        <div className="bg-board border border-line rounded-lg p-5">
          <h2 className="font-display text-xl mb-2 text-tag">Make one accusation</h2>
          <p className="text-sm text-muted">You get a single guess. The culprit stays secret until you commit.</p>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl mb-4">Pick your difficulty</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {Object.entries(DIFFICULTY).map(([k, d]) => (
            <div key={k} className="border border-line rounded-lg p-4">
              <div className="flex items-center justify-between mb-1">
                <b>{d.label}</b>
                <Pips level={d.level} />
              </div>
              <p className="text-sm text-muted">{d.blurb}</p>
              <p className="text-sm text-tag mt-2">{d.base} points for a correct accusation</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
