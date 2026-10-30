
import { useState } from 'react';
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
});

function App() {
  const [premise, setPremise] = useState(
    'A priceless moonstone disappeared from a locked museum gallery during a private midnight event.'
  );

  const [difficulty, setDifficulty] = useState('Medium');
  const [game, setGame] = useState(null);
  const [choice, setChoice] = useState('');
  const [hint, setHint] = useState('');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Keep the case data in a safe format.
  function prepareCase(data) {
    return {
      ...data,
      id: data.id || data._id,
      clues: Array.isArray(data.clues) ? data.clues : [],
      suspects: Array.isArray(data.suspects) ? data.suspects : [],
      hints: Array.isArray(data.hints) ? data.hints : [],
      score: data.score || 0,
      hintsUsed: data.hintsUsed || 0
    };
  }

  // Generate a new mystery.
  async function start() {
    setBusy(true);
    setError('');

    try {
      const response = await api.post('/cases', {
        premise,
        difficulty
      });

      if (!response.data || !response.data.case) {
        throw new Error('The server did not return a valid mystery.');
      }

      const newCase = prepareCase(response.data.case);

      setGame(newCase);
      setChoice('');
      setHint('');
      setResult(null);

    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        'Cannot connect to the server.'
      );
    } finally {
      setBusy(false);
    }
  }

  // Discover a clue.
  async function discover(clueId) {
    if (!game?.id) return;

    setError('');

    try {
      const response = await api.post(
        `/cases/${game.id}/clues/${clueId}/discover`
      );

      if (response.data.case) {
        setGame(prepareCase(response.data.case));
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  }

  // Request a hint.
  async function askHint() {
    if (!game?.id) return;

    setError('');

    try {
      const response = await api.post(`/cases/${game.id}/hints`);

      setHint(response.data.hint || 'No hint was returned.');

      if (response.data.case) {
        setGame(prepareCase(response.data.case));
      } else {
        setGame(previous => ({
          ...previous,
          hintsUsed: response.data.hintsUsed ?? previous.hintsUsed,
          score: response.data.score ?? previous.score
        }));
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  }

  // Submit the final accusation.
  async function accuse() {
    if (!choice) {
      setError('Please select a suspect first.');
      return;
    }

    if (!game?.id) return;

    setError('');

    try {
      const response = await api.post(
        `/cases/${game.id}/accuse`,
        { suspectId: choice }
      );

      setResult(response.data.result || response.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  }

  const clues = game?.clues || [];
  const suspects = game?.suspects || [];
  const hints = game?.hints || [];

  const found = clues.filter(clue => clue.discovered).length;

  function newCase() {
    setGame(null);
    setResult(null);
    setChoice('');
    setHint('');
    setError('');
  }

  return (
    <div className="shell">

      <header>
        <a className="logo" href="#" onClick={e => {
          e.preventDefault();
          newCase();
        }}>
          <b>✦</b>
          <span>
            THE MYSTERY ROOM
            <small>AN INTERACTIVE DETECTIVE EXPERIENCE</small>
          </span>
        </a>

        <span className="top-tag">● CASE FILES / 001</span>
      </header>

      {!game ? (

        <section className="hero">

          <div className="intro">
            <div className="eyebrow">YOUR NEXT CASE IS WAITING</div>

            <h1>
              Every clue has
              <br />
              <i>a secret.</i>
            </h1>

            <p>
              Step into a world of hidden motives, suspicious alibis,
              and evidence that never tells the whole story.
              Your instincts are your greatest tool.
            </p>

            <div className="steps">
              <span><b>01</b> INVESTIGATE</span>
              <span><b>02</b> CONNECT</span>
              <span><b>03</b> ACCUSE</span>
            </div>
          </div>

          <section className="panel setup">

            <div className="tiny">
              NEW INVESTIGATION
              <span>● OPEN</span>
            </div>

            <h2>Set the scene</h2>

            <p className="muted">
              Give your mystery a starting point. The details are up to you.
            </p>

            <label>YOUR MYSTERY PREMISE</label>

            <textarea
              value={premise}
              maxLength={500}
              onChange={e => setPremise(e.target.value)}
            />

            <div className="count">{premise.length}/500</div>

            <label>SELECT DIFFICULTY</label>

            <div className="levels">
              {['Easy', 'Medium', 'Hard'].map((level, index) => (
                <button
                  key={level}
                  className={difficulty === level ? 'active' : ''}
                  onClick={() => setDifficulty(level)}
                >
                  <b>{['Ⅰ', 'Ⅱ', 'Ⅲ'][index]} {level}</b>
                  <small>
                    {[
                      '3 suspects · 5 clues',
                      '4 suspects · 7 clues',
                      '5 suspects · 9 clues'
                    ][index]}
                  </small>
                </button>
              ))}
            </div>

            {error && <div className="error">{error}</div>}

            <button
              className="gold-btn"
              disabled={busy || !premise.trim()}
              onClick={start}
            >
              {busy ? 'BUILDING YOUR CASE…' : 'GENERATE MYSTERY'}
              <b>↗</b>
            </button>

            <div className="note">
              ✧ Your investigation begins in a private case file.
            </div>

          </section>

          <div className="stamp">
            CONFIDENTIAL
            <br />
            <b>CASE FILE</b>
            <br />
            NO. 001
          </div>

        </section>

      ) : (

        <section className="investigation">

          <div className="case-head">
            <div>
              <div className="eyebrow">
                ACTIVE INVESTIGATION / {(game.difficulty || '').toUpperCase()}
              </div>

              <h1>{game.title || 'The Mystery Case'}</h1>
              <p>{game.premise || premise}</p>
            </div>

            <div className="score">
              <small>INVESTIGATION SCORE</small>
              <b>{game.score}</b>
              <small>+5 clue · −10 hint</small>
            </div>
          </div>

          {error && <div className="error">{error}</div>}

          {result ? (

            <div className="panel reveal">

              <div className="eyebrow">CASE CLOSED</div>

              <h2>
                {result.correct
                  ? 'Excellent detective work.'
                  : 'The evidence told another story.'}
              </h2>

              <p>
                {result.correct
                  ? 'You identified the culprit.'
                  : `The culprit was ${result.culprit || 'revealed in the case report'}.`}
              </p>

              <div className="final-score">
                FINAL SCORE
                <strong>{result.score ?? game.score}</strong>
              </div>

              <h3>THE REVEAL</h3>

              <p>{result.explanation || 'The investigation is complete.'}</p>

              {result.solution && (
                <p className="muted">{result.solution}</p>
              )}

              <button className="gold-btn" onClick={newCase}>
                START A NEW CASE ↗
              </button>

            </div>

          ) : (

            <div className="columns">

              <div className="main-col">

                <section className="panel">
                  <div className="section-title">01 / THE SCENE</div>

                  <h2>The incident</h2>

                  <p>{game.premise || premise}</p>

                  {game.victim && (
                    <div className="victim">
                      <small>VICTIM / TARGET</small>
                      <b>{game.victim}</b>
                    </div>
                  )}
                </section>

                <section className="panel">

                  <div className="section-title">
                    02 / EVIDENCE BOARD
                    <span>{found} OF {clues.length} EXAMINED</span>
                  </div>

                  <h2>Collected clues</h2>

                  <div className="clues">

                    {clues.length === 0 ? (
                      <p className="muted">No clues were returned by the server.</p>
                    ) : (
                      clues.map((clue, index) => (
                        <article
                          key={clue.id || clue._id || index}
                          className={clue.discovered ? 'found' : ''}
                        >
                          <span className="num">
                            {String(index + 1).padStart(2, '0')}
                          </span>

                          <div>
                            <h3>{clue.title || `Clue ${index + 1}`}</h3>

                            <p>
                              {clue.discovered
                                ? (clue.detail || clue.description || 'Clue discovered.')
                                : 'Evidence sealed. Examine this item to add it to your notes.'}
                            </p>
                          </div>

                          <button
                            className="outline-btn"
                            disabled={clue.discovered}
                            onClick={() => discover(clue.id || clue._id)}
                          >
                            {clue.discovered ? '✓ FOUND' : 'EXAMINE'}
                          </button>
                        </article>
                      ))
                    )}

                  </div>
                </section>

                <section className="panel">

                  <div className="section-title">03 / YOUR ACCUSATION</div>

                  <h2>Who did it?</h2>

                  <p className="muted">
                    Choose the person you believe is responsible.
                  </p>

                  <div className="suspects">

                    {suspects.map((suspect, index) => (
                      <button
                        key={suspect.id || suspect._id || index}
                        className={
                          choice === (suspect.id || suspect._id)
                            ? 'chosen'
                            : ''
                        }
                        onClick={() => setChoice(suspect.id || suspect._id)}
                      >
                        <span className="avatar">
                          {(suspect.name || '?')
                            .split(' ')
                            .map(name => name[0])
                            .join('')}
                        </span>

                        <span>
                          <small>SUSPECT 0{index + 1}</small>
                          <b>{suspect.name || 'Unknown suspect'}</b>
                          <em>{suspect.role || 'Person of interest'}</em>
                        </span>

                        <strong>
                          {choice === (suspect.id || suspect._id) ? '●' : '○'}
                        </strong>

                        <p>{suspect.description || ''}</p>
                      </button>
                    ))}

                  </div>

                  <button
                    className="gold-btn"
                    onClick={accuse}
                    disabled={suspects.length === 0}
                  >
                    SUBMIT FINAL ACCUSATION ↗
                  </button>

                </section>

              </div>

              <aside className="side-col">

                <section className="panel">

                  <div className="section-title">CASE NOTES / LIVE</div>

                  <h3>Investigator's log</h3>

                  <div className="stat">
                    <span>Clues examined</span>
                    <b>{found}/{clues.length}</b>
                  </div>

                  <div className="bar">
                    <i
                      style={{
                        width: `${clues.length ? (found / clues.length) * 100 : 0}%`
                      }}
                    />
                  </div>

                  <div className="stat">
                    <span>Hints used</span>
                    <b>{game.hintsUsed}/{hints.length}</b>
                  </div>

                  <button
                    className="outline-wide"
                    disabled={game.hintsUsed >= hints.length}
                    onClick={askHint}
                  >
                    REQUEST A HINT
                    <span>−10 PTS</span>
                  </button>

                  {hint && (
                    <div className="hint">
                      <small>FIELD NOTE / HINT {game.hintsUsed}</small>
                      {hint}
                    </div>
                  )}

                </section>

                <section className="panel">

                  <div className="section-title">SCORING PROTOCOL</div>

                  <div className="rule">
                    <b>+{game.baseScore || 0}</b> Correct accusation
                  </div>

                  <div className="rule">
                    <b>+5</b> Each clue examined
                  </div>

                  <div className="rule">
                    <b>−10</b> Each hint requested
                  </div>

                  <p className="muted">
                    Final score is calculated securely by the server.
                  </p>

                </section>

                <button className="abandon" onClick={newCase}>
                  ← ABANDON CASE / NEW GAME
                </button>

              </aside>

            </div>

          )}

        </section>

      )}

      <footer>
        <span>THE MYSTERY ROOM</span>
        <span>THINK CLOSELY. TRUST NOTHING.</span>
        <span>© 2026</span>
      </footer>

    </div>
  );
}

export default App;
