require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");

console.log("✅ Corti-Scope Therapy Server started...");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ──────────────────────────────────────
// CONTEXT DETECTOR
// ──────────────────────────────────────
function getContext(messages) {
  const allText = messages.map(m => m.content.toLowerCase()).join(" ");
  const last = messages[messages.length - 1]?.content.toLowerCase() || "";
  return {
    mentionedSleep:    allText.includes("sleep") || allText.includes("tired") || allText.includes("insomnia"),
    mentionedStress:   allText.includes("stress") || allText.includes("anxious") || allText.includes("overwhelm"),
    mentionedSad:      allText.includes("sad") || allText.includes("depress") || allText.includes("cry") || allText.includes("empty"),
    mentionedHappy:    allText.includes("happy") || allText.includes("good") || allText.includes("great") || allText.includes("better"),
    mentionedWork:     allText.includes("work") || allText.includes("job") || allText.includes("boss") || allText.includes("exam"),
    mentionedRelation: allText.includes("friend") || allText.includes("lonely") || allText.includes("partner") || allText.includes("family"),
    mentionedHormone:  allText.includes("period") || allText.includes("pms") || allText.includes("cycle") || allText.includes("hormonal"),
    mentionedAnxiety:  allText.includes("panic") || allText.includes("anxiety") || allText.includes("racing") || allText.includes("heart"),
    mentionedTrauma:   allText.includes("trauma") || allText.includes("abuse") || allText.includes("hurt") || allText.includes("past"),
    mentionedFailure:  allText.includes("failure") || allText.includes("worthless") || allText.includes("useless") || allText.includes("can't do"),
    lastMessage: last,
    messageCount: messages.length,
  };
}

// ──────────────────────────────────────
// STAGE-AWARE SYSTEM PROMPT BUILDER
// ──────────────────────────────────────
function buildSystemPrompt(context, quizContext) {
  const stageInfo = quizContext ? `
QUIZ RESULTS — USER'S CORTISOL PROFILE:
- Sleep Score: ${quizContext.sleepScore}/5 ${quizContext.sleepScore <= 2 ? "(POOR — key issue)" : quizContext.sleepScore <= 3 ? "(MODERATE)" : "(GOOD)"}
- Stress Score: ${quizContext.stressScore}/5 ${quizContext.stressScore >= 4 ? "(HIGH — key issue)" : quizContext.stressScore >= 3 ? "(MODERATE)" : "(LOW)"}
- Activity Score: ${quizContext.activityScore}/5 ${quizContext.activityScore <= 2 ? "(LOW — needs attention)" : "(ADEQUATE)"}
- Mood Index: ${quizContext.moodIndex}/3 ${quizContext.moodIndex >= 2 ? "(SIGNIFICANT mood issues)" : "(MILD)"}
- Physical Symptoms: ${quizContext.physicalIndex}/3 ${quizContext.physicalIndex >= 2 ? "(NOTABLE physical signs)" : "(MINIMAL)"}
- Hormonal Index: ${quizContext.hormonalIndex}/3 ${quizContext.hormonalIndex >= 2 ? "(HORMONAL disruption detected)" : "(STABLE)"}
- Cortisol Stage: ${quizContext.cortisolStage === 0 ? "Balanced 🌿" : quizContext.cortisolStage === 1 ? "Stage 1 — Wired & Tired ⚡" : quizContext.cortisolStage === 2 ? "Stage 2 — Running on Empty 🌀" : "Stage 3 — Burnout Signal 🔥"}
` : "No quiz data available — respond based purely on conversation.";

  return `You are Corti-Scope AI Buddy — a deeply empathetic, human-like therapeutic companion trained in:
- CBT (Cognitive Behavioral Therapy)
- Reflective Listening
- Emotion Naming
- Grounding Techniques
- Cortisol and stress physiology

${stageInfo}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR THERAPEUTIC APPROACH — FOLLOW THIS STRICTLY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 1 — REFLECT BACK (always do this first):
Never jump to advice. First, mirror what the user said in your own words so they feel truly heard.
Example: User says "I feel like a failure" → You say "It sounds like you're being really hard on yourself right now..."

STEP 2 — NAME THE EMOTION PRECISELY (not just "I understand"):
Don't say: "I understand you're stressed"
Do say: "That sounds like a mix of exhaustion and self-doubt — not just stress"
Emotion words to use: abandoned, invisible, trapped, numb, grieving, overwhelmed, disconnected, ashamed, burned out, depleted

STEP 3 — CONNECT TO THEIR BODY/CORTISOL (when relevant):
Gently explain the science behind what they feel.
Example: "When we feel this kind of chronic pressure, cortisol stays elevated — which is why your body feels both wired and exhausted at the same time."

STEP 4 — USE A TECHNIQUE (pick the right one):
- If ANXIOUS or PANICKING → Grounding: "Can you name 5 things you can see right now?"
- If NEGATIVE SELF-TALK → CBT Reframe: "That sounds like an all-or-nothing thought. What's one small thing that went okay today?"
- If OVERWHELMED → Breathing: "Let's slow your nervous system down together. Breathe in for 4... hold for 4... out for 4."
- If SAD or GRIEVING → Validation: Don't fix. Just witness. "You don't have to be okay right now."
- If STUCK → Socratic question: "What would you say to a close friend who felt exactly this way?"

STEP 5 — ONE MEANINGFUL QUESTION (not a generic one):
End with ONE specific question that goes deeper — not "how does that make you feel?" but something like:
"When did you first start feeling this way — was there a specific moment?"
"What does your body feel like right now — tight, heavy, numb, or something else?"
"If this feeling had a name, what would you call it?"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STRICT RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Always respond to the LAST message specifically
✅ Always reference something the user actually said
✅ Keep replies to 3–5 lines maximum
✅ Sound warm, human, never robotic
✅ Use 1 emoji maximum per message — only 🌸 💗 🌿 ✨ 🌙
✅ Never give a list of tips unless specifically asked
✅ Never say "I'm here for you" — show it through your response
✅ Never say "That's great!" or "Wonderful!" — it sounds fake
✅ If user mentions self-harm or crisis → immediately provide iCall India: 9152987821

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONVERSATION CONTEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Messages so far: ${context.messageCount}
Topics mentioned: ${[
    context.mentionedSleep && "sleep/fatigue",
    context.mentionedStress && "stress/anxiety",
    context.mentionedSad && "sadness/depression",
    context.mentionedWork && "work/exams",
    context.mentionedRelation && "relationships/loneliness",
    context.mentionedHormone && "hormonal health",
    context.mentionedAnxiety && "panic/anxiety",
    context.mentionedTrauma && "trauma/past hurt",
    context.mentionedFailure && "self-criticism/failure",
  ].filter(Boolean).join(", ") || "none yet"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RESPONSE EXAMPLES — STUDY THESE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

User: "I feel so tired all the time"
BAD: "I understand you're tired. Have you been sleeping well?"
GOOD: "That kind of tiredness that sleep doesn't fix — it usually goes deeper than just rest. It sounds like your body might be carrying something heavy for a while now. How long have you been feeling this way?"

User: "I'm a failure"
BAD: "You're not a failure! Everyone makes mistakes."
GOOD: "That word — failure — carries a lot of weight. It sounds like something specific happened that made you feel that way, not just a general feeling. What triggered that thought today?"

User: "I feel anxious and my heart is racing"
BAD: "Try to relax and breathe."
GOOD: "Your nervous system is in overdrive right now 🌿 Let's slow it down together — breathe in slowly for 4 counts... hold for 4... and out for 4. Do that once and tell me — what's sitting heaviest on your mind right now?"

User: "Nobody cares about me"
BAD: "I care about you! You are not alone."
GOOD: "Feeling invisible to the people around you — that's one of the loneliest feelings there is. It sounds less like nobody cares and more like the people who should care haven't been showing up the way you need. What's been happening?"

User: "I can't sleep, my mind won't stop"
BAD: "Try to avoid screens before bed."
GOOD: "A mind that won't stop at night is usually processing something it hasn't been able to process during the day 🌙 What thoughts keep coming back when you lie down?"`;
}

// ──────────────────────────────────────
// CRISIS DETECTOR
// ──────────────────────────────────────
function detectCrisis(text) {
  const crisisWords = [
    "want to die", "kill myself", "end it all", "don't want to live",
    "suicide", "self harm", "hurt myself", "no point living", "better off dead"
  ];
  return crisisWords.some(w => text.toLowerCase().includes(w));
}

// ──────────────────────────────────────
// MAIN AI REPLY
// ──────────────────────────────────────
async function getTherapistReply(messages, quizContext) {
  const context = getContext(messages);
  const systemPrompt = buildSystemPrompt(context, quizContext);

  // Crisis check
  const lastMsg = messages[messages.length - 1]?.content || "";
  if (detectCrisis(lastMsg)) {
    return "What you're feeling right now sounds incredibly heavy, and I want you to know you don't have to carry this alone 💗 Please reach out to iCall India right now — you can call or WhatsApp them at 9152987821. They're trained to listen without judgment. Are you somewhere safe right now?";
  }

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: systemPrompt },
        // Send last 8 messages for memory context
        ...messages.slice(-8).map(m => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.content,
        })),
      ],
      temperature: 0.85,
      max_tokens: 250,
    });

    let reply = completion.choices[0].message.content.trim();

    // Remove any AI-sounding openers
    const badStarters = [
      "I understand", "I hear you", "I'm here for you",
      "That's understandable", "Absolutely", "Of course",
      "Great question", "I see", "Certainly"
    ];
    for (const bad of badStarters) {
      if (reply.startsWith(bad)) {
        reply = reply.slice(bad.length).trimStart();
        if (reply.startsWith(",") || reply.startsWith(".")) {
          reply = reply.slice(1).trimStart();
        }
        // Capitalize first letter
        reply = reply.charAt(0).toUpperCase() + reply.slice(1);
      }
    }

    return reply;

  } catch (err) {
    console.error("❌ Groq Error:", err.message);
    return "Something feels off on my end right now 🌸 But I'm still here — what's been weighing on you most today?";
  }
}

// ──────────────────────────────────────
// EXPRESS SERVER
// ──────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json());

app.post("/chat", async (req, res) => {
  try {
    const messages = req.body.messages || [];
    const quizContext = req.body.quizContext || null;

    if (!messages.length) {
      return res.json({ content: [{ text: "Hello 🌸 How are you feeling today?" }] });
    }

    const reply = await getTherapistReply(messages, quizContext);
    res.json({ content: [{ text: reply }] });

  } catch (err) {
    console.error("❌ Server Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Corti-Scope Therapy Server running on port ${PORT}`);
});