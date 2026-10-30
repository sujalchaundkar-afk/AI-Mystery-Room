
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { GoogleGenAI } from '@google/genai';
import { randomUUID } from 'node:crypto';

const app = express();
const PORT = Number(process.env.PORT?.trim()) || 5000;

app.use(cors({ origin: true }));
app.use(express.json({ limit: '1mb' }));

// Difficulty settings:
// [number of suspects, number of clues, number of hints, base score]
const rules = {
  Easy: [3, 5, 2, 100],
  Medium: [4, 7, 3, 150],
  Hard: [5, 9, 3, 200]
};

// In-memory storage is used if MongoDB is unavailable.
const cases = new Map();

let CaseModel = null;
let mongoReady = false;

// Connect to MongoDB
async function connectMongoDB() {
  if (!process.env.MONGODB_URI) {
    console.log('MongoDB URI not found. Using memory storage.');
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const schema = new mongoose.Schema(
      {
        caseId: { type: String, unique: true },
        data: Object
      },
      { timestamps: true }
    );

    CaseModel =
      mongoose.models.MysteryCase ||
      mongoose.model('MysteryCase', schema);

    mongoReady = true;
    console.log('MongoDB connected successfully.');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    console.log('Using memory storage instead.');
  }
}

// Save a case
async function saveCase(caseData) {
  cases.set(caseData.id, caseData);

  if (mongoReady && CaseModel) {
    await CaseModel.findOneAndUpdate(
      { caseId: caseData.id },
      {
        caseId: caseData.id,
        data: caseData
      },
      { upsert: true, new: true }
    );
  }
}

// Load a case
async function loadCase(id) {
  if (cases.has(id)) {
    return cases.get(id);
  }

  if (mongoReady && CaseModel) {
    const savedCase = await CaseModel.findOne({ caseId: id });

    if (savedCase) {
      cases.set(id, savedCase.data);
      return savedCase.data;
    }
  }

  return null;
}

// Never send the culprit or solution to the frontend
// before the player makes an accusation.
function safeCase(caseData) {
  const {
    culpritId,
    explanation,
    solution,
    hints,
    ...publicData
  } = caseData;

  return {
    ...publicData,

    clues: publicData.clues.map((clue) => {
      const { detail, ...publicClue } = clue;

      return {
        ...publicClue,
        detail: clue.discovered ? detail : undefined
      };
    })
  };
}

// Validate the generated mystery
function validateMystery(data, difficulty) {
  const [suspectCount, clueCount, hintCount] = rules[difficulty];

  if (!data || typeof data !== 'object') {
    throw new Error('Gemini returned invalid data.');
  }

  if (!Array.isArray(data.suspects) ||
      data.suspects.length !== suspectCount) {
    throw new Error('Incorrect number of suspects.');
  }

  if (!Array.isArray(data.clues) ||
      data.clues.length !== clueCount) {
    throw new Error('Incorrect number of clues.');
  }

  if (!Array.isArray(data.hints) ||
      data.hints.length !== hintCount) {
    throw new Error('Incorrect number of hints.');
  }

  if (!data.suspects.some(s => s.id === data.culpritId)) {
    throw new Error('The culprit must be one of the suspects.');
  }

  for (let i = 0; i < data.suspects.length; i++) {
    const suspect = data.suspects[i];

    if (!suspect.id || !suspect.name || !suspect.role ||
        !suspect.description) {
      throw new Error('A suspect is missing information.');
    }

    suspect.id = `s${i + 1}`;
  }

  for (let i = 0; i < data.clues.length; i++) {
    const clue = data.clues[i];

    if (!clue.title || !clue.description || !clue.detail) {
      throw new Error('A clue is missing information.');
    }

    clue.id = `c${i + 1}`;
  }

  if (
    !data.title ||
    !data.premise ||
    !data.setting ||
    !data.victim ||
    !data.explanation ||
    !data.solution
  ) {
    throw new Error('The mystery is missing required information.');
  }

  if (data.hints.some(h => typeof h !== 'string' || !h.trim())) {
    throw new Error('A hint is invalid.');
  }

  return data;
}

// Generate a mystery using Gemini
async function makeMystery(premise, difficulty) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is missing from server/.env');
  }

  const [suspectCount, clueCount, hintCount] = rules[difficulty];

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
  });

  const prompt = `
You are an expert detective mystery writer.

Create a complete, fair, logically solvable detective mystery.

USER'S MYSTERY PREMISE:
${premise}

DIFFICULTY: ${difficulty}

REQUIREMENTS:
1. Generate exactly ${suspectCount} suspects.
2. Generate exactly ${clueCount} clues.
3. Generate exactly ${hintCount} hints.
4. There must be exactly one culprit.
5. The culprit must be one of the suspects.
6. Every suspect must have a believable motive, opportunity, and alibi.
7. The clues must contain enough evidence to identify the culprit.
8. At least two clues must directly or indirectly connect to the culprit.
9. The clues must not contradict the final explanation.
10. The explanation must clearly show why the culprit is guilty.
11. Do not reveal the culprit in the premise, suspect descriptions, or undiscovered clue descriptions.
12. Each clue must have a description and a detailed discovery explanation.
13. Hints should guide the player without directly revealing the culprit.
14. Keep all IDs in the requested format.

IMPORTANT:
The solution must be logically consistent.
Do not randomly select a culprit.
The final explanation must match the clues exactly.

Return valid JSON only, using this structure:

{
  "title": "Mystery title",
  "premise": "Mystery premise",
  "setting": "Location",
  "victim": "Victim or stolen object",
  "suspects": [
    {
      "id": "s1",
      "name": "Suspect name",
      "role": "Suspect role",
      "description": "Public suspect description"
    }
  ],
  "clues": [
    {
      "id": "c1",
      "title": "Clue title",
      "description": "Short public description",
      "detail": "Detailed evidence discovered by the player"
    }
  ],
  "hints": [
    "A useful hint"
  ],
  "culpritId": "s1",
  "explanation": "Detailed explanation of why this suspect is guilty.",
  "solution": "The complete solution."
}
`;

  // Retry if Gemini returns an invalid mystery.
  let lastError;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`Generating mystery. Attempt ${attempt}/3`);

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.4
        }
      });

      const generatedText = response.text;

      if (!generatedText) {
        throw new Error('Gemini returned an empty response.');
      }

      const mystery = JSON.parse(generatedText);

      validateMystery(mystery, difficulty);

      console.log('Mystery generated and validated.');

      return mystery;

    } catch (error) {
      lastError = error;
      console.error(`Generation attempt ${attempt} failed:`, error.message);
    }
  }

  throw new Error(
    `Could not generate a valid mystery. ${lastError?.message || ''}`
  );
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: mongoReady ? 'connected' : 'memory storage'
  });
});

// Create a new mystery
app.post('/api/cases', async (req, res) => {
  try {
    const { premise = '', difficulty = 'Medium' } = req.body;

    if (typeof premise !== 'string' || !premise.trim()) {
      return res.status(400).json({
        message: 'Please enter a mystery premise.'
      });
    }

    if (premise.length > 500) {
      return res.status(400).json({
        message: 'Premise must be under 500 characters.'
      });
    }

    if (!rules[difficulty]) {
      return res.status(400).json({
        message: 'Invalid difficulty level.'
      });
    }

    const generated = await makeMystery(
      premise.trim(),
      difficulty
    );

    const caseData = {
      ...generated,
      id: randomUUID(),
      difficulty,
      clues: generated.clues.map(clue => ({
        ...clue,
        discovered: false
      })),
      hintsUsed: 0,
      score: 0,
      baseScore: rules[difficulty][3],
      status: 'investigating'
    };

    await saveCase(caseData);

    res.status(201).json({
      case: safeCase(caseData)
    });

  } catch (error) {
    console.error('Create case error:', error);

    res.status(500).json({
      message: error.message || 'Could not create mystery.'
    });
  }
});

// Get case details
app.get('/api/cases/:id', async (req, res) => {
  try {
    const caseData = await loadCase(req.params.id);

    if (!caseData) {
      return res.status(404).json({
        message: 'Case not found.'
      });
    }

    res.json({
      case: safeCase(caseData)
    });

  } catch (error) {
    res.status(500).json({
      message: 'Could not load case.'
    });
  }
});

// Discover a clue
app.post('/api/cases/:id/clues/:clueId/discover', async (req, res) => {
  try {
    const caseData = await loadCase(req.params.id);

    if (!caseData) {
      return res.status(404).json({
        message: 'Case not found.'
      });
    }

    if (caseData.status !== 'investigating') {
      return res.status(400).json({
        message: 'This case is already completed.'
      });
    }

    const clue = caseData.clues.find(
      item => item.id === req.params.clueId
    );

    if (!clue) {
      return res.status(404).json({
        message: 'Clue not found.'
      });
    }

    if (!clue.discovered) {
      clue.discovered = true;
      caseData.score += 5;

      await saveCase(caseData);
    }

    res.json({
      case: safeCase(caseData)
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Could not discover clue.'
    });
  }
});

// Request a hint
app.post('/api/cases/:id/hints', async (req, res) => {
  try {
    const caseData = await loadCase(req.params.id);

    if (!caseData) {
      return res.status(404).json({
        message: 'Case not found.'
      });
    }

    if (caseData.status !== 'investigating') {
      return res.status(400).json({
        message: 'This case is already completed.'
      });
    }

    if (caseData.hintsUsed >= caseData.hints.length) {
      return res.status(400).json({
        message: 'No hints remaining.'
      });
    }

    const hint = caseData.hints[caseData.hintsUsed];

    caseData.hintsUsed += 1;
    caseData.score = Math.max(0, caseData.score - 10);

    await saveCase(caseData);

    res.json({
      hint,
      hintsUsed: caseData.hintsUsed,
      score: caseData.score
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Could not provide hint.'
    });
  }
});

// Submit accusation
app.post('/api/cases/:id/accuse', async (req, res) => {
  try {
    const caseData = await loadCase(req.params.id);

    if (!caseData) {
      return res.status(404).json({
        message: 'Case not found.'
      });
    }

    if (caseData.status !== 'investigating') {
      return res.status(400).json({
        message: 'This case is already completed.'
      });
    }

    const { suspectId } = req.body;

    const selectedSuspect = caseData.suspects.find(
      suspect => suspect.id === suspectId
    );

    if (!selectedSuspect) {
      return res.status(400).json({
        message: 'Please select a valid suspect.'
      });
    }

    const correct = suspectId === caseData.culpritId;

    const discoveredCount = caseData.clues.filter(
      clue => clue.discovered
    ).length;

    const score =
      (correct ? caseData.baseScore : 0) +
      discoveredCount * 5 -
      caseData.hintsUsed * 10;

    caseData.score = Math.max(0, score);
    caseData.status = 'completed';

    await saveCase(caseData);

    const culprit = caseData.suspects.find(
      suspect => suspect.id === caseData.culpritId
    );

    res.json({
      result: {
        correct,
        culprit: culprit.name,
        explanation: caseData.explanation,
        solution: caseData.solution,
        score: caseData.score
      }
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Could not submit accusation.'
    });
  }
});

// Get final result
app.get('/api/cases/:id/result', async (req, res) => {
  try {
    const caseData = await loadCase(req.params.id);

    if (!caseData) {
      return res.status(404).json({
        message: 'Case not found.'
      });
    }

    if (caseData.status !== 'completed') {
      return res.status(403).json({
        message: 'Submit an accusation first.'
      });
    }

    res.json({
      result: {
        culpritId: caseData.culpritId,
        explanation: caseData.explanation,
        solution: caseData.solution,
        score: caseData.score
      }
    });

  } catch (error) {
    res.status(500).json({
      message: 'Could not load result.'
    });
  }
});

// Start server
async function startServer() {
  await connectMongoDB();

  app.listen(PORT, () => {
    console.log(`Mystery API running on port ${PORT}`);
  });
}

startServer();
