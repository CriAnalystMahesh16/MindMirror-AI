import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

let aiInstance: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing. Please add it in the Secrets settings.");
    }
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON body parser
  app.use(express.json());

  // AI analysis endpoint
  app.post("/api/analyze", async (req: express.Request, res: express.Response) => {
    try {
      const { journal, mood, studyHours, sleepHours, examType } = req.body;

      // --- Security & Input Validation ---
      if (typeof journal !== "string" || journal.trim() === "") {
        return res.status(400).json({ error: "Journal entry is required and must be text." });
      }
      
      // Journal length limits
      if (journal.length > 2000) {
        return res.status(400).json({ error: "Journal entry exceeds the limit of 2000 characters." });
      }

      const parsedMood = Number(mood);
      if (isNaN(parsedMood) || parsedMood < 1 || parsedMood > 10) {
        return res.status(400).json({ error: "Mood score must be a number between 1 and 10." });
      }

      const parsedStudyHours = Number(studyHours);
      if (isNaN(parsedStudyHours) || parsedStudyHours < 0 || parsedStudyHours > 24) {
        return res.status(400).json({ error: "Study hours must be a number between 0 and 24." });
      }

      const parsedSleepHours = Number(sleepHours);
      if (isNaN(parsedSleepHours) || parsedSleepHours < 0 || parsedSleepHours > 24) {
        return res.status(400).json({ error: "Sleep hours must be a number between 0 and 24." });
      }

      // Quick sanitization to escape dangerous HTML/JavaScript tags
      const sanitizeHtml = (str: string): string => {
        return str
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
      };

      const safeJournal = sanitizeHtml(journal.trim());
      const safeExamType = typeof examType === "string" ? sanitizeHtml(examType.trim()).substring(0, 50) : "Competitive Exam";

      // --- Instantiate Gemini SDK & Run Analysis ---
      const ai = getGeminiClient();

      const prompt = `You are a high-empathy well-being analyst and advisor helping competitive exam aspirants.
Analyze the following student parameters and write a helpful analysis report that is realistic, supportive, and grounded in academic psychology.

Exam Type: ${safeExamType}
Mood Score (1-10): ${parsedMood}/10
Study Hours: ${parsedStudyHours} hours
Sleep Hours: ${parsedSleepHours} hours
Daily Journal Entry:
"${safeJournal}"

Compare these hours (e.g. high study hours vs short sleep hours indicates increased exhaustion) and emotional depth from the journal. Determine:
1. stressTriggers: Major stressors mentioned (e.g., mock test scores, parental expectations, backlogs, peer comparison, loneliness etc.).
2. emotionalPatterns: Insightful connections. E.g., if sleep is low, state how it damages memory or increases stress. Let them see their brain activity pattern.
3. burnoutRisk: 'Low', 'Medium', or 'High'.
4. confidenceLevel: 'Low', 'Medium', or 'High' based on general optimism in the journal.
5. copingStrategies: 3-4 highly specific, actionable mental habits or schedule changes (e.g., active recall pacing, pomodoro, 5-minute progressive muscle relaxation, block social media).
6. encouragement: A highly inspiring, 2-3 sentence motivational message addressing their chosen exam (${safeExamType}) and current mood with deep warmth and validation.

You must return ONLY a structured JSON reply conforming strictly to the requested schema.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are the core emotional engine of MindMirror AI, a cognitive reflective system designed for students facing intense competitive testing stresses. You analyze metrics alongside text to give profound, constructive feedback, with deep clinical-grade empathy coupled with real scientific validation.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              stressTriggers: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Array of detected major stress triggers (e.g. 'Backlog anxiety', 'Peer comparison')"
              },
              emotionalPatterns: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Array of observations linking their academic workload, physical rest, and mood"
              },
              burnoutRisk: {
                type: Type.STRING,
                description: "Burnout Risk Level: Low, Medium, or High"
              },
              confidenceLevel: {
                type: Type.STRING,
                description: "Confidence Level: Low, Medium, or High"
              },
              copingStrategies: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Array of 3-4 highly customized, actionable coping tips"
              },
              encouragement: {
                type: Type.STRING,
                description: "Deeply warm, encouraging psychological closure text"
              }
            },
            required: ["stressTriggers", "emotionalPatterns", "burnoutRisk", "confidenceLevel", "copingStrategies", "encouragement"]
          }
        }
      });

      const textOutput = response.text;
      if (!textOutput) {
        throw new Error("No analysis returned from Gemini AI.");
      }

      const analyzedJson = JSON.parse(textOutput.trim());
      return res.json(analyzedJson);

    } catch (error: any) {
      console.error("Gemini Error:", error);
      return res.status(500).json({
        error: "Our MindMirror AI analyzer is temporarily resting. Please verify your internet connection or check your GEMINI_API_KEY settings and try again."
      });
    }
  });

  // --- Vite Dev Server Middleware or Production Static Serve ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: express.Request, res: express.Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[MindMirror AI Server] running on http://localhost:${PORT}`);
  });
}

startServer();
