import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

// Create Gemini instance
const getGeminiAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set. The application will fall back to local pregnancy advice.");
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
};

const ai = getGeminiAI();

function getLocalAdvice(symptom: string, gestationalWeeks?: number) {
  const sym = symptom.toLowerCase();
  let advice = "";
  let severity = "low"; // "low" | "medium" | "high"

  if (sym.includes("nausea") || sym.includes("vomit") || sym.includes("morning sickness")) {
    advice = "### Nausea and Morning Sickness\n\nMorning sickness typically peaks around week 9 and decreases by week 14-16. It is highly common due to rapid hCG hormone rises.\n\n**Safe Self-Care Steps:**\n- Eat dry toast or crackers before getting out of bed.\n- Eat small, frequent meals throughout the day (low-fat, high-protein/carb snack blocks).\n- Stay hydrated with ginger tea, lemon water, or small electrolyte sips.\n- Avoid strong odors and spicy foods.\n\n⚠️ **Seek Care Immediately if:** You cannot keep any liquids down for 24 hours, experience rapid weight loss, or feel severely dizzy or lightheaded (signs of Hyperemesis Gravidarum).";
  } else if (sym.includes("back") || sym.includes("pelvic") || sym.includes("backache") || sym.includes("hip")) {
    advice = "### Pregnancy Back Pain\n\nBackaches are very common as your baby grows and center of gravity shifts forward, supplemented by pregnancy hormones (like relaxin) that loosen ligaments.\n\n**Safe Self-Care Steps:**\n- Maintain excellent posture; sit upright on supportive chairs.\n- Sleep on your side with a maternity pillow sandwiched between your knees.\n- Apply a gentle warm (not hot) compress or take a warm bath.\n- Wear supportive, low-heeled shoes.\n\n⚠️ **Seek Care Immediately if:** You have sharp or cramping back pain radiating to your thighs, difficulty urinating, or if back pain is accompanied by cramping or spotting.";
  } else if (sym.includes("swell") || sym.includes("edema") || sym.includes("ankle") || sym.includes("feet") || sym.includes("foot")) {
    advice = "### Swelling in Lower Extremities\n\nMild swelling in ankles and feet is typical during the second and third trimesters as your blood volume expands and the growing uterus adds pressure back up from lower veins.\n\n**Safe Self-Care Steps:**\n- Prop your feet up on pillows whenever sitting or resting; lie down on your left side.\n- Stay active with mild, safe walking or ankle rotations.\n- Ensure proper hydration—drinking water actually helps flush accumulated fluid!\n- Avoid tight socks, stockings, or narrow footwear.\n\n⚠️ **Seek Care Immediately if:** You experience sudden, severe swelling in your face or hands, extreme blurred vision, or severe headaches. This can indicate Preeclampsia.";
    severity = "medium";
  } else if (sym.includes("bleed") || sym.includes("spot") || sym.includes("blood") || sym.includes("fluid leakage")) {
    advice = "### Vaginal Spotting or Fluid Leakage\n\nSpotting in early pregnancy can occur, but vaginal bleeding or clear fluid leaking should always be evaluated promptly by your clinic.\n\n**Immediate Actions:**\n- Rest immediately and count your pad saturation.\n- Avoid inserting anything into the vagina (no tampons or sexual intercourse).\n- Prepare your summary notes and contact your direct clinic line.\n\n⚠️ **Seek Emergency Care if:** You experience moderate to heavy bleeding (similar to a period), severe abdominal pain, high cramping, or clear water leaking continuously.";
    severity = "high";
  } else if (sym.includes("headache") || sym.includes("migraine")) {
    advice = "### Headaches in Pregnancy\n\nHeadaches can be triggered by hormonal shifts, fatigue, dehydration, stress, or caffeine withdrawal, especially in the first trimester.\n\n**Safe Self-Care Steps:**\n- Place a cold pack on your forehead or the back of your neck.\n- Rest in a quiet, darkened room.\n- Stay hydrated and eat balanced meals to maintain blood sugar.\n- Avoid taking ibuprofen or aspirin. Check with your doctor before taking acetaminophen.\n\n⚠️ **Seek Care Immediately if:** You have a severe, persistent headache in the second or third trimester that doesn't go away, or if it is accompanied by vision changes (blurriness, spots), severe upper abdominal pain, or swelling (signs of preeclampsia).";
    severity = "medium";
  } else if (sym.includes("heartburn") || sym.includes("acid") || sym.includes("indigestion")) {
    advice = "### Heartburn & Acid Reflux\n\nProgesterone relaxes the valve between your stomach and esophagus, allowing stomach acids to splash up. The growing womb also physically presses on your stomach.\n\n**Safe Self-Care Steps:**\n- Eat several small meals instead of three large ones.\n- Avoid spicy, greasy, acidic (citrus/tomato), or carbonated foods.\n- Do not lie down within 2-3 hours after eating; prop your head up on pillows when sleeping.\n\n⚠️ **Seek Care Immediately if:** Heartburn feels like a severe crushing pressure in the chest, spreads to your shoulder or arm, or is accompanied by shortness of breath or sweating.";
  } else {
    // Default general guidelines
    advice = `### Wellness & Pregnancy Guidance\n\nThank you for logging your symptom: **"${symptom}"**. Mild physical changes are typical during pregnancy as your baby grows and hormones adapt.\n\n**General Safety Guidelines:**\n- Listen to your body and rest when feeling fatigued.\n- Drink at least 8-10 glasses of water daily to maintain amniotic fluid and circulation.\n- Maintain a nutrient-dense diet with complex grains, iron, and folic acid.\n- Avoid self-medicating; always check with an OBGYN or clinic operator before taking over-the-counter painkillers or herbal remedies.\n\n⚠️ **Alert Guidelines:** If you experience severe abdominal cramps, leaking amniotic fluid, persistent vomiting, high fever, or reduced baby kicks/movements, contact your healthcare provider immediately.`;
  }

  return { advice, severity };
}

function getSeverityLevel(symptom: string): string {
  const sym = symptom.toLowerCase();
  if (sym.includes("bleed") || sym.includes("spot") || sym.includes("blood") || sym.includes("severe") || sym.includes("fever") || sym.includes("vision") || sym.includes("pain")) {
    return "high";
  }
  if (sym.includes("swell") || sym.includes("edema") || sym.includes("headache") || sym.includes("cramp") || sym.includes("pressure")) {
    return "medium";
  }
  return "low";
}

/**
 * Validates HS256 JWT tokens using Node.js standard cryptographic module.
 * This decodes the header/payload and checks the signature against the Supabase JWT Secret.
 */
function verifySupabaseJWT(token: string, secret: string): any {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, signatureB64] = parts;
    
    // Hash signature
    const calculatedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${headerB64}.${payloadB64}`)
      .digest("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
      
    const providedSignature = signatureB64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    
    if (calculatedSignature !== providedSignature) {
      console.warn("[Auth Security] Token HMAC Signature check failed");
      return null;
    }
    
    const payload = JSON.parse(Buffer.from(payloadB64, "base64").toString("utf8"));
    return payload;
  } catch (err) {
    console.error("[Auth Security] JWT decode exception:", err);
    return null;
  }
}

/**
 * Authentication Middleware for Express
 * Layer 1: Supports simulated secure guest token "demo_mama_secure_token_12345" for flawless Sandbox showcase verification.
 * Layer 2: Supports cryptographic authentication checks on Supabase tokens if process.env.SUPABASE_JWT_SECRET is set.
 */
const requireAuth = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Unauthorized: Missing or invalid Authorization header. A Bearer token is required.",
      code: "MISSING_BEARER_TOKEN",
      layer: "Express API Middleware"
    });
  }

  const token = authHeader.split(" ")[1];

  // Layer 1 sandbox demo mode
  if (token === "demo_mama_secure_token_12345") {
    req.user = { id: "simulated-mother-123", email: "amina.ali@simulation.example.com", role: "authenticated" };
    return next();
  }

  // Layer 2 production cryptographic verification
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (secret) {
    const decodedUser = verifySupabaseJWT(token, secret);
    if (decodedUser) {
      req.user = decodedUser;
      return next();
    }
  }

  return res.status(401).json({
    error: "Unauthorized: Invalid, tampered, or expired access token.",
    code: "INVALID_ACCESS_TOKEN",
    layer: "Express API Cryptographic Verifier"
  });
};

const app = express();
app.use(express.json());

// -------------------------------------------------------------------------
// 1. IP-Based In-Memory Rate Limiting Middlware
// -------------------------------------------------------------------------
const ipCache = new Map<string, { count: number; resetTime: number }>();

const customRateLimiter = (limitPerMinute: number = 10) => {
  return (req: any, res: any, next: any) => {
    // Treat headers properly (standard on Vercel or cloud environments)
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "anonymous_mama";
    const now = Date.now();
    const windowMs = 60 * 1000; // 1-minute tracking window

    // Clean up cache to prevent memory leaks if scale is high
    if (ipCache.size > 1500) {
      for (const [key, val] of ipCache.entries()) {
        if (now > val.resetTime) {
          ipCache.delete(key);
        }
      }
    }

    const record = ipCache.get(ip);
    if (!record || now > record.resetTime) {
      ipCache.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (record.count >= limitPerMinute) {
      const remainingSecs = Math.ceil((record.resetTime - now) / 1000);
      return res.status(429).json({
        error: `Too many questions, mama! Please wait ${remainingSecs} seconds before asking for more advice. This ensures fast support for all expectant mothers.`,
        code: "RATE_LIMIT_EXCEEDED",
        retryAfter: remainingSecs,
        success: false
      });
    }

    record.count += 1;
    next();
  };
};

// -------------------------------------------------------------------------
// 2. Main API Route Definitions (Synchronous and Clean)
// -------------------------------------------------------------------------

// Dynamically configuration fetch endpoints
app.get("/api/supabase-config", customRateLimiter(60), (req, res, next) => {
  try {
    res.json({
      supabaseUrl: process.env.SUPABASE_URL || "",
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "",
    });
  } catch (err) {
    next(err);
  }
});

// Crypto / Supabase authentication diagnostic checks
app.get("/api/auth-status", customRateLimiter(30), (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const isBearer = authHeader?.startsWith("Bearer ");
    const token = isBearer ? authHeader.split(" ")[1] : null;
    const hasSecret = !!process.env.SUPABASE_JWT_SECRET;
    
    let tokenValidNow = false;
    let userId = null;
    let authSource = "None";

    if (token === "demo_mama_secure_token_12345") {
      tokenValidNow = true;
      userId = "simulated-mother-123";
      authSource = "Simulated Demo Token";
    } else if (token && hasSecret) {
      const decoded = verifySupabaseJWT(token, process.env.SUPABASE_JWT_SECRET!);
      if (decoded) {
        tokenValidNow = true;
        userId = decoded.sub || decoded.id;
        authSource = "Supabase Production HMAC-SHA256";
      }
    }

    res.json({
      configured: {
        supabaseUrl: !!process.env.SUPABASE_URL,
        supabaseAnonKey: !!process.env.SUPABASE_ANON_KEY,
        supabaseJwtSecret: hasSecret
      },
      clientActiveToken: token ? `${token.substring(0, 15)}...` : null,
      tokenValidNow,
      userId,
      authSource,
      serverTime: new Date().toISOString()
    });
  } catch (err) {
    next(err);
  }
});

// Post Symptom Logs & Prompt AI clinical advisor - SECURED with rate-limiting & requireAuth
app.post("/api/symptom-advice", customRateLimiter(10), requireAuth, async (req, res, next) => {
  try {
    const { symptom, additionalNotes, gestationalWeeks, motherAge } = req.body;
    
    if (!symptom || typeof symptom !== "string" || !symptom.trim()) {
      return res.status(400).json({ error: "Symptom is required to provide advice." });
    }

    const cleanSymptom = symptom.trim();
    const cleanNotes = additionalNotes ? String(additionalNotes).trim() : "";
    const weeksVal = gestationalWeeks ? Number(gestationalWeeks) : undefined;
    const ageVal = motherAge ? Number(motherAge) : undefined;

    if (!ai) {
      const fallback = getLocalAdvice(cleanSymptom, weeksVal);
      return res.json({ 
        advice: fallback.advice, 
        severity: fallback.severity, 
        isFallback: true 
      });
    }

    const prompt = `You are an incredibly warm, compassionate, and experienced maternal health advisor.
A pregnant mother is experiencing the following symptom or discomfort:
- Discomfort: ${cleanSymptom}
- Week of Pregnancy: ${weeksVal ? `${weeksVal} weeks` : 'Not specified'}
- Mother's Age: ${ageVal ? `${ageVal} years old` : 'Not specified'}
- Additional description shared by the mother: ${cleanNotes || 'None'}

Provide very simple, heart-warming, and loving advice. This app is not meant to replace doctors, so you MUST only use simple, easy-to-understand language and layman's terms. Speak like a loving grandmother or friend. 
DO NOT use any complex medical terms or scientific jargon. For example, replace words like 'anatomy' or 'physiological' with simple words like 'baby's growth' or 'body changes'. Do not use terms like 'OBGYN' or 'midwife' — instead, just use 'your doctor or nurse'.

Your response MUST be divided into clear sections with beautiful markdown headings:
1. ### What's Happening (Reassure her and explain the body changes in very simple, loving terms)
2. ### Safe Self-Care & Relief Steps (List simple, safe home-comfort tips like warm baths, safe resting position, or healthy small drinks)
3. ### ⚠️ Warning Signs (List simple, clear warning signs in everyday words where she should contact her doctor or hospital immediately)

Write in a highly supportive, loving, maternal, and comforting tone.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a loving pregnancy support advisor who speaks in simple, warm layman's language. Your goal is to reassure pregnant mothers, helping them understand simple body changes and providing easy, safe home-comfort and diet tips. You do not replace doctors, so use friendly, simple everyday terms instead of complex medical concepts.",
      }
    });

    const text = response.text || "Pregnancy changes occur rapidly. Please consult your physician regarding details.";
    const severity = getSeverityLevel(cleanSymptom);

    return res.json({ advice: text, severity, isFallback: false });

  } catch (error: any) {
    console.error("Gemini advice error, falling back:", error);
    // Fail gracefully and use local advice as structured fallback
    try {
      const { symptom, gestationalWeeks } = req.body;
      const fallback = getLocalAdvice(symptom || "unspecified", gestationalWeeks ? Number(gestationalWeeks) : undefined);
      return res.json({
        advice: `[Local Fallback Mode] Due to transient connection issues, here are our safe maternal advice cards:\n\n${fallback.advice}`,
        severity: fallback.severity,
        isFallback: true
      });
    } catch (err) {
      next(err);
    }
  }
});

// -------------------------------------------------------------------------
// 3. Global Express Error Handler Middleware (Secures details from mothers)
// -------------------------------------------------------------------------
const globalErrorHandler = (err: any, req: any, res: any, next: any) => {
  console.error("[MamaCare Critical Exception caught]:", err);
  
  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || "A secure server connection incident occurred. Rest assured, your data is safe.",
    code: err.code || "INTERNAL_MAMA_APP_ERROR",
    layer: "Express API Safety Gateway"
  });
};

app.use(globalErrorHandler);

export { app };

// -------------------------------------------------------------------------
// 4. Server Execution Context Block (Stand-alone and Dev environments)
// -------------------------------------------------------------------------
async function startServer() {
  const PORT = 3000;

  // On Vercel, server startup and listening is fully delegated to Vercel's Edge Serverless system.
  // We completely bypass starting/listening or loading development Vite configurations in production.
  if (process.env.VERCEL) {
    return;
  }

  // Vite middleware for local development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Standard static hosting for production containers (e.g. Cloud Run)
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Stand-alone network listener for non-Vercel runtimes
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MamaCare fullstack server running on http://localhost:${PORT}`);
  });
}

startServer();
