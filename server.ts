import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { 
  validateCheckInInputs, 
  sanitizeInput, 
  calculateBurnoutRisk, 
  calculateConfidenceLevel, 
  detectStressTriggers 
} from "./src/utils/analyzerUtils.js";

// Load environment variables
dotenv.config();

let aiInstance: GoogleGenAI | null = null;

/**
 * Instantiates generative AI client in a lazy, safe loader.
 */
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

// Lightweight in-memory rate limiting map
const ipRequestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_MINUTE = 15;

/**
 * Basic in-memory rate limiter to prevent server request flood attacks.
 */
function rateLimiter(req: express.Request, res: express.Response, next: express.NextFunction): void {
  const ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "anonymous";
  const numCurrentTime = Date.now();
  const userData = ipRequestCounts.get(ip);

  if (!userData || numCurrentTime > userData.resetTime) {
    ipRequestCounts.set(ip, { count: 1, resetTime: numCurrentTime + RATE_LIMIT_WINDOW_MS });
    return next();
  }

  if (userData.count >= MAX_REQUESTS_PER_MINUTE) {
    res.status(429).json({ error: "Too many mental reflections in a short time. Please take a deep breath and try again in a minute." });
    return;
  }

  userData.count += 1;
  next();
}

async function startServer(): Promise<void> {
  const app = express();
  const PORT = 3000;

  // Enforce rigid server security headers
  app.use((req: express.Request, res: express.Response, next: express.NextFunction): void => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    res.setHeader("Content-Security-Policy", "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https:;");
    next();
  });

  // Strict JSON body limit allocation to protect buffer allocation against high payloads
  app.use(express.json({ limit: "15kb" }));

  // AI analysis endpoint with rate limiting active
  app.post("/api/analyze", rateLimiter, async (req: express.Request, res: express.Response) => {
    try {
      const { journal, mood, studyHours, sleepHours, examType } = req.body;

      // --- Security & Input Validation ---
      const parsedMood = Number(mood);
      const parsedStudyHours = Number(studyHours);
      const parsedSleepHours = Number(sleepHours);

      const validationError = validateCheckInInputs(journal, parsedMood, parsedStudyHours, parsedSleepHours);
      if (validationError) {
        return res.status(400).json({ error: validationError });
      }

      const safeJournal = sanitizeInput(journal.trim());
      const safeExamType = typeof examType === "string" ? sanitizeInput(examType.trim()).substring(0, 50) : "Competitive Exam";

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

      let analyzedJson;
      try {
        analyzedJson = JSON.parse(textOutput.trim());
      } catch (parseErr) {
        console.error("Malformed AI response parsing error, fallback strategy active:", parseErr);
        // Fallback rule-based parsing matching the required strict schema
        analyzedJson = {
          stressTriggers: detectStressTriggers(safeJournal),
          emotionalPatterns: [
            `Active study load (${parsedStudyHours}h study today) indicates extreme concentration focus towards your ${safeExamType} goals.`,
            `Rest pattern (${parsedSleepHours}h sleep last night) is a critical indicator of emotional and intellectual processing support.`
          ],
          burnoutRisk: calculateBurnoutRisk(parsedStudyHours, parsedSleepHours, parsedMood),
          confidenceLevel: calculateConfidenceLevel(parsedMood, parsedSleepHours),
          copingStrategies: [
            "Adopt the 50-10 Pomodoro method (50 minutes of studying, 10 minutes of active deep breathing) to refresh mind energy.",
            "Establish a non-negotiable screen-free window 30 minutes before sleep to facilitate deep sleep consolidation."
          ],
          encouragement: `Your ${parsedStudyHours}-hour focus is a testament to your hard work. Stay persistent, sleep well, and success in the ${safeExamType} will follow.`
        };
      }
      return res.json(analyzedJson);

    } catch (error: unknown) {
      const loggerMsg = error instanceof Error ? error.message : "Internal Server Error";
      console.error("Gemini Router Error:", loggerMsg);
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
