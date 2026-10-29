# SPEC.md — AI Mystery Room

## 1. Overview
**Problem:** Mystery games are usually fixed and replayable only once. **Solution:** a web app where the player supplies a premise and difficulty, Gemini generates a unique, logically consistent whodunit, and the player investigates, requests hints, and accuses a suspect. The backend owns the solution and the scoring.

**Target users:** casual puzzle and mystery fans, students. **Experience:** a short (10–20 min), self-contained game with no login.

**Core features:** generate mystery (3 difficulties), suspect cards, discoverable clues, progressive hints, accusation, verdict + score + explanation, play again.
**Optional enhancements:** share link, leaderboard, saved case history, image art.
**Stack:** React, Vite, Tailwind CSS, React Router, Axios · Node.js, Express, MongoDB, Mongoose, Zod · Gemini API (`@google/genai`).
**Limitations:** no authentication (cases are accessed by unguessable id), one accusation per case, English only, Gemini free-tier rate limits.
**Deliverables:** SPEC.md, GitHub repo, deployed frontend (Vercel) and backend (Render + MongoDB Atlas).

## 2. User Flow
1. Open the website → 2. Enter premise, choose difficulty → 3. Gemini generates mystery, suspects, clues, hints → 4. Examine clues → 5. Request hints if needed → 6. Accuse a suspect → 7. See verdict, culprit, explanation, score → 8. Start another mystery.

## 3. Pages
| Route | Purpose | Essential elements |
|---|---|---|
| `/` Home | Introduce the game | Title, pitch, scoring summary, "Open a new case" button |
| `/create` | Start a case | Premise textarea (10–300 chars) with counter and example chips, difficulty selector (3 options with counts and base points), generate button |
| `/case/:id` Investigation Room | Play | Title, story, progress (clues/hints), suspect cards (role, description, alibi), clue cards with "Examine", hints list + hint button, link to accuse |
| `/case/:id/accuse` Accusation | Decide | Radio list of suspects, confirm button, back link |
| `/case/:id/result` Results | Reveal | Verdict, score breakdown, culprit, explanation, all evidence, "Start another mystery" |

**Loading:** spinner on generation (message says up to 30 s), page loads, and result.
**Errors:** inline red alert box with a plain message and retry where useful; 404 page for unknown routes.
**Navigation:** header logo → Home; "New mystery" → Create. Completed cases redirect Investigation/Accusation to Results.
**Responsive:** single column on mobile; 2–3 column card grids from `sm`/`lg`. Keyboard-focusable controls, visible focus ring.

## 4. Backend & Database
Base path `/api`. All errors: `{ "error": "message" }`.

| Method & path | Body | Success | Errors |
|---|---|---|---|
| `GET /health` | – | `{ok:true}` | – |
| `POST /cases` | `{premise, difficulty}` | 201 public case | 400 validation, 502 bad AI output |
| `GET /cases/:id` | – | public case | 400 bad id, 404 |
| `POST /cases/:id/clues/:clueId/discover` | – | public case | 404 clue, 409 closed |
| `POST /cases/:id/hints` | – | public case + `newHint` | 400 none left, 409 closed |
| `POST /cases/:id/accuse` | `{suspectId}` | `{correct, score}` | 400 invalid suspect, 409 already accused |
| `GET /cases/:id/result` | – | full result | 403 if not yet accused |

**Validation:** premise trimmed, 10–300 chars; difficulty ∈ easy/medium/hard; ids must be valid ObjectIds; suspectId must belong to the case.

**Model `Case`:** `title, story, premise, difficulty, suspects[{key,name,role,description,alibi}], clues[{key,title,description,discovered}], hints[{text,used}], culpritKey, solution, status(active|completed), accusedKey, correct, score, breakdown{base,clues,hints}, timestamps`.

**Security:** `culpritKey` and `solution` are never serialized except by `/result`, which returns 403 until `status = completed`. Undiscovered clue descriptions and unused hints are also withheld. API key lives only in server env.

## 5. AI Behavior & Scoring
Gemini is called with JSON response mode and returns:
`{ title, story, suspects[{name,role,description,alibi}], culpritIndex, solution, clues[{title,description}], hints[string] }`

| Difficulty | Suspects | Clues | Hints | Base points |
|---|---|---|---|---|
| Easy | 3 | 5 | 2 | 100 |
| Medium | 4 | 7 | 3 | 150 |
| Hard | 5 | 9 | 3 | 200 |

**Validation (Zod, before saving):** exact counts, field lengths, unique suspect names, `culpritIndex` in range. Invalid output is retried (up to 3 attempts) then returns 502.
**Prompt rules:** exactly one culprit; solution supported by ≥3 clues; other clues exonerate innocents; nothing names the culprit; hints progressive; premise is treated as inspiration only (prompt-injection guard).

**Scoring (backend only):** `score = max(0, base + 5·cluesFound − 10·hintsUsed)` where `base` = 100/150/200 only if the accusation is correct, otherwise 0.

## 6. Acceptance Criteria
- [ ] Mysteries generate at easy, medium, and hard with the correct counts.
- [ ] Player can examine clues, request hints (max per difficulty), and accuse.
- [ ] Culprit/solution never appear in any response before accusation (check the Network tab).
- [ ] Score is computed on the backend and matches the formula; never below 0.
- [ ] Results show the correct culprit and explanation.
- [ ] Invalid AI output and API failures show friendly errors.
- [ ] Whole flow works on the deployed website.
