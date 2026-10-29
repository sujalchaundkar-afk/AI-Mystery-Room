export const AVATAR_COLORS = ["#e0524d", "#e7c65a", "#5fa8d3", "#7fb685", "#b58be0", "#e89a5c"];

export const DIFFICULTY = {
  easy: { label: "Easy", level: 1, blurb: "3 suspects, 5 clues, 2 hints", base: 100 },
  medium: { label: "Medium", level: 2, blurb: "4 suspects, 7 clues, 3 hints", base: 150 },
  hard: { label: "Hard", level: 3, blurb: "5 suspects, 9 clues, 3 hints", base: 200 },
};

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 bg-string text-white font-semibold px-6 py-3 rounded-md shadow-lg shadow-string/20 hover:bg-[#ea625d] active:translate-y-px transition disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none";
export const btnGhost =
  "inline-flex items-center justify-center gap-2 border border-line text-paper px-4 py-2 rounded-md hover:border-tag hover:text-tag transition disabled:opacity-40 disabled:cursor-not-allowed";

export function Spinner({ label = "Loading…" }) {
  return (
    <div role="status" className="flex items-center gap-3 text-muted py-12">
      <span className="h-6 w-6 rounded-full border-2 border-line border-t-tag animate-spin" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorBox({ message, onRetry }) {
  if (!message) return null;
  return (
    <div role="alert" className="border border-string/60 bg-string/10 rounded-md px-4 py-3 my-4 flex flex-wrap items-center gap-x-4 gap-y-1">
      <p>{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="underline text-tag">
          Try again
        </button>
      )}
    </div>
  );
}

export function Avatar({ name, index = 0, size = 44 }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return (
    <span
      aria-hidden="true"
      className="inline-flex items-center justify-center rounded-full font-display text-ink shrink-0"
      style={{ width: size, height: size, background: AVATAR_COLORS[index % AVATAR_COLORS.length], fontSize: size * 0.4 }}
    >
      {initials}
    </span>
  );
}

export function Meter({ value, max, label }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="text-tag font-semibold">{value}/{max}</span>
      </div>
      <div className="h-2 rounded-full bg-line overflow-hidden" role="progressbar" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
        <div className="h-full bg-tag transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function Pips({ level }) {
  return (
    <span className="inline-flex gap-1" aria-hidden="true">
      {[1, 2, 3].map((n) => (
        <span key={n} className={`h-2 w-5 rounded-full ${n <= level ? "bg-string" : "bg-line"}`} />
      ))}
    </span>
  );
}

const icon = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
export const SearchIcon = () => (<svg {...icon}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>);
export const BulbIcon = () => (<svg {...icon}><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3Z" /></svg>);
export const LockIcon = () => (<svg {...icon}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>);
export const GavelIcon = () => (<svg {...icon}><path d="m14 13-8.5 8.5a2 2 0 0 1-3-3L11 10M16 16l6-6M8 8l6-6M9 7l8 8M21 11l-8-8" /></svg>);
