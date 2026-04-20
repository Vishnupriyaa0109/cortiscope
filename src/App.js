import React, { useState, useRef, useEffect } from "react";
import "./App.css";

const WELCOME_MESSAGE = {
  role: "ai",
  text: "Hello 🌸 I'm your Corti-Scope AI Buddy.\n\nI'm here to listen, reflect, and gently help you understand what your body might be telling you. How are you feeling today?"
};

const SUGGESTION_CHIPS = [
  "😔 I'm feeling stressed",
  "😴 I can't sleep well",
  "💭 I feel anxious",
  "😢 I've been feeling low",
];

const FOLLOWUP_CHIPS = {
  sleep:    ["😴 I wake up tired", "🌙 I can't fall asleep", "💤 My sleep is broken", "😓 I feel exhausted daily"],
  stress:   ["🌀 Work is stressing me", "😤 I feel overwhelmed", "💭 My mind won't stop", "😰 I feel burnt out"],
  happy:    ["😊 What helps mood?", "🌟 How to stay positive?", "💫 I want more energy", "🌿 How to reduce cortisol?"],
  sad:      ["😢 I cry often", "💔 I feel empty inside", "🌧️ Nothing feels good", "🤍 How to feel better?"],
  anxious:  ["😰 My heart races", "🫁 Help me breathe", "🧘 Calming techniques?", "💊 Is this cortisol?"],
  cortisol: ["📊 High cortisol signs?", "🌿 How to lower it?", "🍎 Foods that help?", "⏰ Best time to test?"],
  default:  ["💗 I need support", "🌿 Give me a tip", "😌 Help me relax", "🌸 What should I do?"],
};

function getChipsForLastMessage(messages) {
  if (messages.length <= 1) return SUGGESTION_CHIPS;
  const lastAiMsg = [...messages].reverse().find(m => m.role === "ai");
  if (!lastAiMsg) return FOLLOWUP_CHIPS.default;
  const text = lastAiMsg.text.toLowerCase();
  if (text.includes("sleep") || text.includes("tired") || text.includes("exhausted")) return FOLLOWUP_CHIPS.sleep;
  if (text.includes("stress") || text.includes("overwhelm") || text.includes("pressure")) return FOLLOWUP_CHIPS.stress;
  if (text.includes("happy") || text.includes("positive") || text.includes("wonderful")) return FOLLOWUP_CHIPS.happy;
  if (text.includes("sad") || text.includes("cry") || text.includes("low") || text.includes("depress")) return FOLLOWUP_CHIPS.sad;
  if (text.includes("anxi") || text.includes("panic") || text.includes("nervous") || text.includes("breath")) return FOLLOWUP_CHIPS.anxious;
  if (text.includes("cortisol") || text.includes("hormone")) return FOLLOWUP_CHIPS.cortisol;
  return FOLLOWUP_CHIPS.default;
}

const questions = [
  { step: 0, tag: "SLEEP QUALITY", emoji: "🌙", question: "How restful has your sleep been this past week?", type: "slider", leftLabel: "Barely sleeping", rightLabel: "Sleeping great", stageHint: "stage1" },
  { step: 1, tag: "STRESS LEVEL", emoji: "🌀", question: "How would you rate your overall stress lately?", type: "slider", leftLabel: "Very calm", rightLabel: "Overwhelmed", stageHint: "stage1" },
  { step: 2, tag: "ENERGY PATTERNS", emoji: "⚡", question: "Do you feel wired at night but exhausted in the morning?", type: "options", options: ["No — I feel tired at night and awake in the morning", "Sometimes — occasional nights where I can't switch off", "Often — I get a second wind late at night regularly", "Always — I'm exhausted all day but alert at night"], stageHint: "stage1" },
  { step: 3, tag: "MOOD PATTERNS", emoji: "🌊", question: "How has your mood been fluctuating recently?", type: "options", options: ["Mostly stable and balanced", "Mild ups and downs", "Noticeable swings throughout the day", "Significant and unpredictable shifts"], stageHint: "stage2" },
  { step: 4, tag: "ENERGY CRASHES", emoji: "🔋", question: "Do you experience energy crashes during the day?", type: "options", options: ["Rarely — my energy stays consistent", "Mild afternoon dip but recovers quickly", "Regular 2–4pm crash, need caffeine or sugar", "Multiple crashes — I run on empty most of the day"], stageHint: "stage2" },
  { step: 5, tag: "LIFESTYLE & ACTIVITY", emoji: "🌿", question: "How active have you been this week?", type: "slider", leftLabel: "Mostly sedentary", rightLabel: "Very active", stageHint: "stage2" },
  { step: 6, tag: "PHYSICAL SIGNALS", emoji: "✨", question: "Have you noticed any of these physical symptoms recently?", type: "options", options: ["None of the below", "Fatigue, brain fog or poor concentration", "Cravings, bloating, weight changes or skin issues", "Headaches, hair thinning or body aches"], stageHint: "stage3" },
  { step: 7, tag: "EMOTIONAL RESILIENCE", emoji: "💗", question: "How do you feel about your ability to cope with daily challenges?", type: "options", options: ["I cope well — challenges feel manageable", "I manage but feel drained afterwards", "I struggle — small things feel overwhelming", "I feel emotionally numb or detached most days"], stageHint: "stage3" },
  { step: 8, tag: "HORMONAL SIGNALS", emoji: "🌸", question: "How has your cycle or hormonal health felt lately?", type: "options", options: ["Regular and no concerns", "Mild irregularities or discomfort", "Notable changes — PMS, cycle shifts or mood swings", "Significant disruptions affecting daily life"], stageHint: "stage3" },
];

function getInsights(sliderValues, selectedOptions) {
  const sleep    = sliderValues[0] || 3;
  const stress   = sliderValues[1] || 3;
  const activity = sliderValues[5] || 3;
  const wired    = selectedOptions[2] ?? 0;
  const mood     = selectedOptions[3] ?? 0;
  const crashes  = selectedOptions[4] ?? 0;
  const physical = selectedOptions[6] ?? 0;
  const coping   = selectedOptions[7] ?? 0;
  const hormonal = selectedOptions[8] ?? 0;

  const stage1Score = ((5 - sleep) * 2 + stress * 1.5 + wired * 2) / 3;
  const stage2Score = (mood * 2 + crashes * 2 + (5 - activity) * 1.5) / 3;
  const stage3Score = (physical * 2 + coping * 2.5 + hormonal * 2) / 3;
  const totalScore  = (stage1Score + stage2Score + stage3Score) / 3;

  let stage, stageColor, stageEmoji, stageName, stageDesc, stageWhat;

  if (totalScore < 1.5 && stage1Score < 2 && stage2Score < 2 && stage3Score < 2) {
    stage = 0; stageName = "Balanced"; stageColor = "green"; stageEmoji = "🌿";
    stageDesc = "Your cortisol rhythm appears well-balanced across sleep, mood, energy and hormonal health.";
    stageWhat = "Keep nurturing the habits that are working — consistent sleep, movement and stress management are your best friends.";
  } else if (stage1Score >= stage2Score && stage1Score >= stage3Score) {
    stage = 1; stageName = "Stage 1 — Wired & Tired"; stageColor = "yellow"; stageEmoji = "⚡";
    stageDesc = "Your cortisol is likely elevated — especially at night. Your body is stuck in alert mode.";
    stageWhat = "This is the early warning stage. Your nervous system is overactivated. Sleep quality and stress management are the most urgent priorities.";
  } else if (stage2Score >= stage1Score && stage2Score >= stage3Score) {
    stage = 2; stageName = "Stage 2 — Running on Empty"; stageColor = "orange"; stageEmoji = "🌀";
    stageDesc = "Your cortisol rhythm has started to dysregulate — showing peaks and crashes. Mood swings and energy dips suggest sustained pressure.";
    stageWhat = "This stage needs attention. Your adrenal rhythm is disrupted, affecting mood, hormones and metabolism.";
  } else {
    stage = 3; stageName = "Stage 3 — Burnout Signal"; stageColor = "pink"; stageEmoji = "🔥";
    stageDesc = "Your responses suggest your cortisol may be significantly depleted. Persistent exhaustion and emotional numbness are signs of chronic stress.";
    stageWhat = "This stage requires gentle but serious attention. Your body is asking for real rest, nourishment and support.";
  }

  const stageScores = [
    Math.min(100, Math.round(stage1Score * 22)),
    Math.min(100, Math.round(stage2Score * 22)),
    Math.min(100, Math.round(stage3Score * 22)),
  ];

  const moodLabels = ["Mood swings", "Irritability", "Mental exhaustion"];
  const moodWidths = [
    Math.min(90, 20 + mood * 20),
    Math.min(85, 15 + stress * 15),
    Math.min(80, 15 + (5 - sleep) * 14),
  ];

  const sleepWidth      = Math.min(90, sleep * 18);
  const activityWidth   = Math.min(85, activity * 17);
  const resilienceWidth = Math.min(80, Math.max(10, 80 - coping * 20));

  const hormonalText = hormonal === 0
    ? "Your hormonal rhythms appear relatively stable. Continue monitoring and maintaining healthy stress habits."
    : hormonal === 1
    ? "Mild hormonal fluctuations detected. This may be early stress-hormone interaction. Monitor your cycle patterns and stress levels together."
    : "Your responses suggest a possible hormonal and stress interaction. Elevated cortisol can affect estrogen balance, cycle regularity, and mood. This is worth exploring gently with a specialist 🌼";

  const recommendations = stage === 0 ? [
    ["🌿", "Maintain your consistent sleep schedule — it's clearly working for you."],
    ["🧘", "Continue any mindfulness or movement practices that support your balance."],
    ["🍎", "Focus on anti-inflammatory foods to keep cortisol rhythms stable."],
    ["📊", "Consider a quarterly check-in with this assessment to track your patterns."],
  ] : stage === 1 ? [
    ["🌙", "Create a strict wind-down routine — no screens 1 hour before bed to help cortisol drop naturally."],
    ["🧘", "Try 5 minutes of box breathing before sleep: in 4, hold 4, out 4. This activates your parasympathetic system."],
    ["☕", "Cut caffeine after 2pm — it directly keeps cortisol elevated and worsens the wired-at-night pattern."],
    ["🌅", "Get 10 minutes of morning sunlight — it resets your cortisol rhythm and improves sleep quality."],
  ] : stage === 2 ? [
    ["🔋", "Eat protein and healthy fats at breakfast — this stabilises blood sugar and prevents cortisol crashes."],
    ["🚶", "Even a 20-minute walk daily can significantly rebalance cortisol rhythm within 2 weeks."],
    ["💊", "Consider magnesium glycinate before bed — it supports adrenal recovery and improves sleep depth."],
    ["📵", "Take tech breaks every 90 minutes — sustained screen time spikes cortisol throughout the day."],
  ] : [
    ["😴", "Prioritise sleep above everything else right now — your adrenal glands recover during deep sleep."],
    ["🤝", "Please consider speaking to a functional health doctor or naturopath about adrenal support."],
    ["🌿", "Adaptogenic herbs like ashwagandha and rhodiola may support cortisol recovery — ask a professional first."],
    ["💗", "Be extremely gentle with yourself — pushing through burnout worsens it. Rest is productive right now."],
  ];

  return { stage, stageName, stageColor, stageEmoji, stageDesc, stageWhat, stageScores, moodLabels, moodWidths, sleepWidth, activityWidth, resilienceWidth, hormonalText, recommendations };
}

function buildQuizWelcome(sliderValues, selectedOptions) {
  const sleep    = sliderValues[0] || 3;
  const stress   = sliderValues[1] || 3;
  const activity = sliderValues[5] || 3;
  const wired    = selectedOptions[2] ?? 0;
  const crashes  = selectedOptions[4] ?? 0;
  const coping   = selectedOptions[7] ?? 0;
  const hormonal = selectedOptions[8] ?? 0;

  const flags = [];
  if (sleep <= 2)    flags.push("poor sleep");
  if (stress >= 4)   flags.push("high stress");
  if (wired >= 2)    flags.push("being wired at night");
  if (crashes >= 2)  flags.push("energy crashes");
  if (coping >= 2)   flags.push("difficulty coping");
  if (hormonal >= 2) flags.push("hormonal changes");
  if (activity <= 2) flags.push("low activity");

  const insights = getInsights(sliderValues, selectedOptions);
  const stage = insights.stage;

  if (stage === 0) return "Welcome back 🌸 I just reviewed your responses and honestly — you seem to be in a really healthy place! Your cortisol patterns look balanced.\n\nI'd love to chat and help you maintain that. What's been working well for you lately?";
  if (stage === 1) {
    const flagText = flags.length > 0 ? `especially around ${flags.slice(0, 2).join(" and ")}` : "your sleep and stress patterns";
    return `Hey 🌸 I've looked at your responses carefully. Your body seems to be in the 'Wired & Tired' stage — ${flagText}.\n\nYour cortisol is likely elevated at night, making it hard to truly rest. The good news? This stage responds really well to targeted changes.\n\nWhat's been the hardest part — falling asleep, switching off mentally, or waking up exhausted?`;
  }
  if (stage === 2) {
    const flagText = flags.length > 0 ? `things like ${flags.slice(0, 3).join(", ")}` : "energy, mood and stress patterns";
    return `Hi 💗 I've gone through your responses and I can see your body is showing signs of Stage 2 — 'Running on Empty'.\n\nYou're experiencing ${flagText}, which suggests your cortisol rhythm has started to dysregulate.\n\nWhat feels most draining right now — your energy, your mood, or something else?`;
  }
  return `Hi 💗 I want to gently acknowledge something — your responses show signs of Stage 3, the 'Burnout Signal'.\n\nYour body has been under a lot of pressure for a long time, showing in ${flags.slice(0, 3).join(", ")}.\n\nYou don't have to push through this alone 🌿 What's felt the heaviest lately?`;
}

function goToChat(setMessages, setPage, sliderValues, selectedOptions) {
  const hasQuizData   = sliderValues && Object.keys(sliderValues).length > 0;
  const fromInsights  = selectedOptions && Object.keys(selectedOptions).length > 0;
  if (hasQuizData && fromInsights) {
    setMessages([{ role: "ai", text: buildQuizWelcome(sliderValues, selectedOptions) }]);
  } else {
    setMessages([WELCOME_MESSAGE]);
  }
  setPage("chat");
}

function goToQuiz(setQuestionStep, setSliderValues, setSelectedOptions, setPage) {
  setQuestionStep(0);
  setSliderValues({ 0: 3, 1: 3, 5: 3 });
  setSelectedOptions({});
  setPage("quiz");
}

// ── LEARN PAGE DATA ──
const learnSections = [
  {
    emoji: "🧠",
    title: "What is Cortisol?",
    color: "#f5e6f0",
    accent: "#d4628a",
    content: "Cortisol is your body's primary stress hormone, produced by your adrenal glands. It follows a natural daily rhythm — peaking in the morning to wake you up and dropping at night to let you sleep.\n\nThink of it as your body's internal alarm system. It's not bad — you need it to function. But when it's chronically elevated or depleted, everything else starts to fall apart."
  },
  {
    emoji: "😴",
    title: "What Stress Does to Your Body",
    color: "#e8f0fa",
    accent: "#6b8ad4",
    content: "When you experience stress — physical, emotional or mental — your brain triggers a cortisol release. In short bursts, this is healthy. It gives you energy and focus.\n\nBut when stress is chronic, cortisol stays elevated for weeks or months. This is when real damage begins:\n\n• Your immune system weakens\n• Your digestion slows\n• Your brain becomes foggy\n• Your sleep becomes disrupted\n• Your body starts storing fat, especially around the belly\n• You feel wired but exhausted at the same time"
  },
  {
    emoji: "🌊",
    title: "How Stress Hijacks Your Mood",
    color: "#f0f5e8",
    accent: "#6ba86b",
    content: "Chronic cortisol directly suppresses serotonin and dopamine — your brain's happiness and motivation chemicals.\n\nThis is why prolonged stress often leads to:\n\n• Irritability and mood swings\n• Feeling flat, unmotivated or empty\n• Anxiety and a sense of dread\n• Difficulty feeling joy even in good moments\n• Emotional reactivity — small things feel huge\n\nThis is not weakness. This is your brain chemistry being altered by an ongoing hormonal response."
  },
  {
    emoji: "🌸",
    title: "What is Hormonal Imbalance?",
    color: "#fdf0f5",
    accent: "#c87aa0",
    content: "Hormonal imbalance happens when your body produces too much or too little of one or more hormones. Cortisol is just one of many — others include estrogen, progesterone, testosterone, insulin and thyroid hormones.\n\nWhen cortisol is chronically high, it directly interferes with:\n\n• Estrogen — causing heavier, irregular or painful periods\n• Progesterone — worsening PMS and mood before your cycle\n• Thyroid hormones — slowing metabolism, causing fatigue and weight gain\n• Insulin — driving sugar cravings and energy crashes\n\nHormonal imbalance is not just a 'women's issue' — it affects everyone. And it rarely happens in isolation. It's almost always connected to how your body is managing stress."
  },
  {
    emoji: "🔗",
    title: "The Sleep–Mood–Hormone Connection",
    color: "#f5f0e8",
    accent: "#c8a06b",
    content: "These three systems are deeply interconnected — each one directly influences the others:\n\n🌙 Poor Sleep → Cortisol stays elevated at night → Melatonin is suppressed → Even harder to sleep next night\n\n🌊 High Cortisol → Serotonin drops → Mood worsens → Anxiety increases → More cortisol released\n\n🌸 Elevated Cortisol → Estrogen and progesterone disrupted → Cycle irregularities, PMS worsens → Mood further affected\n\nThis is why fixing just one thing rarely works. When all three are addressed together — sleep, emotional health and hormonal support — real recovery begins."
  },
  {
    emoji: "⚡",
    title: "The 3 Stages of Cortisol Dysregulation",
    color: "#f5e8f0",
    accent: "#a06bc8",
    content: "Cortisol imbalance doesn't happen overnight. It progresses in stages:\n\nStage 1 — Wired & Tired ⚡\nCortisol is elevated, especially at night. You feel exhausted but can't switch off. Sleep is disrupted. You feel 'on edge' most of the time.\n\nStage 2 — Running on Empty 🌀\nCortisol starts to dysregulate — too high at some times, crashing at others. Energy becomes unpredictable. Mood swings, cravings and physical symptoms begin.\n\nStage 3 — Burnout Signal 🔥\nCortisol becomes significantly depleted. Deep exhaustion, emotional numbness, hormonal disruption and physical symptoms are all present. The body has been running on reserves for too long.\n\nEarly identification is everything. The earlier you recognise your stage, the easier recovery becomes."
  },
];

function App() {
  const [page, setPage]                   = useState("home");
  const [questionStep, setQuestionStep]   = useState(0);
  const [sliderValues, setSliderValues]   = useState({ 0: 3, 1: 3, 5: 3 });
  const [selectedOptions, setSelectedOptions] = useState({});
  const [messages, setMessages]           = useState([WELCOME_MESSAGE]);
  const [inputText, setInputText]         = useState("");
  const [isTyping, setIsTyping]           = useState(false);
  const [expandedLearn, setExpandedLearn] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const getQuizContext = () => {
    if (Object.keys(selectedOptions).length === 0) return null;
    const insights = getInsights(sliderValues, selectedOptions);
    return {
      sleepScore:    sliderValues[0] || 3,
      stressScore:   sliderValues[1] || 3,
      activityScore: sliderValues[5] || 3,
      moodIndex:     selectedOptions[3] ?? 0,
      physicalIndex: selectedOptions[6] ?? 0,
      hormonalIndex: selectedOptions[8] ?? 0,
      cortisolStage: insights.stage,
      cortisolLevel: insights.stage === 0 ? "low" : insights.stage === 1 ? "moderate" : "elevated",
    };
  };

  const sendMessage = async (overrideText) => {
    const userMsg = (overrideText || inputText).trim();
    if (!userMsg) return;
    setInputText("");
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setIsTyping(true);
    try {
      const response = await fetch("http://localhost:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            ...messages.map(m => ({ role: m.role === "ai" ? "assistant" : "user", content: m.text })),
            { role: "user", content: userMsg },
          ],
          quizContext: getQuizContext(),
        }),
      });
      const data  = await response.json();
      const reply = data.content?.[0]?.text || "I'm here for you 🌸 Could you tell me more?";
      setIsTyping(false);
      setMessages(prev => [...prev, { role: "ai", text: reply }]);
    } catch {
      setIsTyping(false);
      setMessages(prev => [...prev, { role: "ai", text: "I'm here for you 🌸 Could you tell me a little more?" }]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const total    = questions.length;
  const percent  = Math.round(((questionStep + 1) / total) * 100);
  const current  = questions[questionStep];
  const insights = getInsights(sliderValues, selectedOptions);

  return (
    <>
      {/* ══ HOME ══ */}
      {page === "home" && (
        <div className="hero">
          <div className="logo">🌸</div>
          <h1 className="title">Corti<span className="scope">-Scope</span></h1>
          <p className="home-subtitle">Understanding you, beyond stress</p>
          <button className="btn" onClick={() => setPage("options")}>Let's Talk <span className="dot"></span></button>
          <p className="footer">💡 Corti-Scope AI provides guidance and emotional support, not medical diagnosis.</p>
        </div>
      )}

      {/* ══ OPTIONS ══ */}
      {page === "options" && (
        <div className="page">
          <button className="back-btn" onClick={() => setPage("home")}>← Back</button>
          <h1 className="main-title">What would you like today?</h1>
          <p className="option-subtitle">Choose your path — we're here either way 💗</p>
          <div className="card-container">
            <div className="card" onClick={() => goToQuiz(setQuestionStep, setSliderValues, setSelectedOptions, setPage)}>
              <div className="icon">🧬</div>
              <h3>Understand My Stress Patterns</h3>
              <p>Analyze your cortisol-related stress patterns through a gentle assessment</p>
              <span className="link">Start assessment →</span>
            </div>
            <div className="card" onClick={() => goToChat(setMessages, setPage, sliderValues, selectedOptions)}>
              <div className="icon">💗</div>
              <h3>AI Buddy</h3>
              <p>Talk, reflect, and feel supported by your empathetic health companion</p>
              <span className="link">Start chatting →</span>
            </div>

            {/* ── NEW: Learn Card ── */}
            <div className="card learn-card" onClick={() => setPage("learn")}>
              <div className="icon">📖</div>
              <h3>Understand Your Body</h3>
              <p>Learn what stress, cortisol and hormonal imbalance are actually doing inside you</p>
              <span className="link">Start learning →</span>
            </div>
          </div>
          <p className="footer">💡 Corti-Scope AI provides guidance and emotional support, not medical diagnosis.</p>
        </div>
      )}

      {/* ══ LEARN PAGE ══ */}
      {page === "learn" && (
        <div className="page learn-page">
          <button className="back-btn" onClick={() => setPage("options")}>← Back</button>

          <div className="learn-header">
            <h1 className="learn-title">Understand Your Body 📖</h1>
            <p className="learn-sub">Simple, honest science about what stress and hormones are really doing to you</p>
          </div>

          <div className="learn-sections">
            {learnSections.map((section, i) => (
              <div
                key={i}
                className={`learn-card-item ${expandedLearn === i ? "learn-card-expanded" : ""}`}
                style={{ borderLeft: `4px solid ${section.accent}`, background: section.color }}
              >
                <div
                  className="learn-card-header"
                  onClick={() => setExpandedLearn(expandedLearn === i ? null : i)}
                >
                  <div className="learn-card-left">
                    <span className="learn-card-emoji">{section.emoji}</span>
                    <span className="learn-card-title" style={{ color: section.accent }}>{section.title}</span>
                  </div>
                  <span className="learn-card-chevron">{expandedLearn === i ? "▲" : "▼"}</span>
                </div>

                {expandedLearn === i && (
                  <div className="learn-card-body">
                    {section.content.split("\n").map((line, j) => (
                      <p key={j} className={`learn-line ${line === "" ? "learn-spacer" : ""}`}>
                        {line}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="learn-cta">
            <p className="learn-cta-text">Ready to understand your personal patterns?</p>
            <div className="learn-cta-buttons">
              <button className="learn-cta-btn learn-cta-primary"
                onClick={() => goToQuiz(setQuestionStep, setSliderValues, setSelectedOptions, setPage)}>
                Take the Assessment 🧬
              </button>
              <button className="learn-cta-btn learn-cta-secondary"
                onClick={() => goToChat(setMessages, setPage, sliderValues, selectedOptions)}>
                Talk to AI Buddy 💗
              </button>
            </div>
          </div>

          <p className="footer">💡 Corti-Scope AI provides guidance and emotional support, not medical diagnosis.</p>
        </div>
      )}

      {/* ══ QUIZ ══ */}
      {page === "quiz" && (
        <div className="page">
          <button className="back-btn" onClick={() => setPage("options")}>← Back</button>
          <div className="progress-wrapper">
            <div className="progress-box">
              <span>Question {questionStep + 1} of {total}</span>
              <span>{percent}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${percent}%` }}></div>
            </div>
          </div>
          <div className="quiz-card">
            <h4 className="tag">{current.tag}</h4>
            <h2>{current.emoji} {current.question}</h2>
            {current.type === "slider" && (
              <div className="slider-wrapper">
                <div className="slider-labels">
                  <span>{current.leftLabel}</span>
                  <span>{current.rightLabel}</span>
                </div>
                <input type="range" min="1" max="5"
                  value={sliderValues[current.step] || 3}
                  onChange={(e) => setSliderValues({ ...sliderValues, [current.step]: Number(e.target.value) })} />
                <div className="slider-value">{sliderValues[current.step] || 3}</div>
              </div>
            )}
            {current.type === "options" && (
              <div className="options">
                {current.options.map((opt, i) => (
                  <div key={i}
                    className={`option-item ${selectedOptions[current.step] === i ? "selected" : ""}`}
                    onClick={() => setSelectedOptions({ ...selectedOptions, [current.step]: i })}>
                    <span className={`radio-circle ${selectedOptions[current.step] === i ? "radio-filled" : ""}`}></span>
                    {opt}
                  </div>
                ))}
              </div>
            )}
            <div className="quiz-buttons">
              {questionStep > 0
                ? <button className="back-inside-btn" onClick={() => setQuestionStep(questionStep - 1)}>← Back</button>
                : <div></div>}
              {questionStep < total - 1
                ? <button className="btn next-btn" onClick={() => setQuestionStep(questionStep + 1)}>Next →</button>
                : <button className="btn next-btn" onClick={() => setPage("insights")}>View My Insights ✨</button>}
            </div>
          </div>
          <p className="footer">💡 Corti-Scope AI provides guidance and emotional support, not medical diagnosis.</p>
        </div>
      )}

      {/* ══ INSIGHTS ══ */}
      {page === "insights" && (
        <div className="page insights-page">
          <button className="back-btn" onClick={() => setPage("quiz")}>← Back</button>
          <div className="insights-header">
            <h1 className="insights-title">Your Cortisol Insights 🌸</h1>
            <p className="insights-sub">Based on your responses — a gentle overview of your patterns</p>
          </div>

          <div className={`stage-banner stage-banner-${insights.stageColor}`}>
            <div className="stage-banner-left">
              <div className="stage-banner-emoji">{insights.stageEmoji}</div>
              <div>
                <div className="stage-banner-name">{insights.stageName}</div>
                <div className="stage-banner-desc">{insights.stageDesc}</div>
              </div>
            </div>
          </div>

          <div className="stage-what-card">
            <div className="ins-card-label">WHAT THIS MEANS FOR YOU</div>
            <p className="stage-what-text">{insights.stageWhat}</p>
          </div>

          <div className="stage-progress-card">
            <div className="ins-card-label">YOUR STAGE BREAKDOWN</div>
            <div className="ins-card-title" style={{ marginBottom: "20px" }}>Where you sit across all 3 stages</div>
            {[
              { label: "Stage 1 — Wired & Tired", emoji: "⚡", color: "#f0c060" },
              { label: "Stage 2 — Running on Empty", emoji: "🌀", color: "#f06c8f" },
              { label: "Stage 3 — Burnout Signal", emoji: "🔥", color: "#a57bd4" },
            ].map((s, i) => (
              <div key={i} className="stage-bar-row">
                <div className="stage-bar-label"><span>{s.emoji}</span><span>{s.label}</span></div>
                <div className="stage-bar-track">
                  <div className="stage-bar-fill" style={{ width: `${insights.stageScores[i]}%`, background: s.color }} />
                </div>
                <span className="stage-bar-pct">{insights.stageScores[i]}%</span>
              </div>
            ))}
          </div>

          <div className="insights-grid">
            <div className="ins-card">
              <div className="ins-card-label">EMOTIONAL INSIGHTS</div>
              <div className="ins-card-title">Mood & Feelings</div>
              <div className="ins-bars">
                {insights.moodLabels.map((label, i) => (
                  <div key={i} className="ins-bar-row">
                    <span className="ins-bar-label">{label}</span>
                    <div className="ins-bar-track">
                      <div className="ins-bar-fill" style={{ width: `${insights.moodWidths[i]}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="ins-card">
              <div className="ins-card-label">LIFESTYLE IMPACT</div>
              <div className="ins-card-title">Daily Patterns</div>
              <div className="ins-bars">
                {[["Sleep quality", insights.sleepWidth], ["Activity level", insights.activityWidth], ["Emotional resilience", insights.resilienceWidth]].map(([label, width], i) => (
                  <div key={i} className="ins-bar-row">
                    <span className="ins-bar-label">{label}</span>
                    <div className="ins-bar-track">
                      <div className="ins-bar-fill" style={{ width: `${width}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="ins-card" style={{ gridColumn: "1 / -1" }}>
              <div className="ins-card-label">HORMONAL INSIGHT 🌸</div>
              <div className="ins-card-title">Stress–Hormone Link</div>
              <div className="ins-hormonal-box">
                <p className="ins-hormonal-text" dangerouslySetInnerHTML={{
                  __html: insights.hormonalText.replace("possible hormonal and stress interaction", "<strong>possible hormonal and stress interaction</strong>")
                }} />
              </div>
            </div>
          </div>

          {/* ── BODY CONNECTION STORY ── */}
          <div className="connection-section">
            <div className="ins-card-label" style={{ textAlign: "center", marginBottom: "8px" }}>YOUR BODY'S CONNECTION STORY</div>
            <div className="ins-card-title" style={{ textAlign: "center", marginBottom: "6px" }}>How sleep, mood & hormones are linked in you 🔗</div>
            <p className="connection-intro">Based on your responses, here is what is likely happening inside your body right now:</p>
            <div className="connection-chain">
              <div className={`connection-node ${insights.sleepWidth < 45 ? "node-alert" : "node-ok"}`}>
                <div className="node-emoji">🌙</div>
                <div className="node-content">
                  <div className="node-title">Sleep</div>
                  <div className="node-status">{insights.sleepWidth < 45 ? "Disrupted" : insights.sleepWidth < 70 ? "Moderate" : "Healthy"}</div>
                  <div className="node-desc">
                    {insights.sleepWidth < 45 ? "Your poor sleep is keeping cortisol elevated at night — when it should be at its lowest."
                      : insights.sleepWidth < 70 ? "Your sleep is somewhat disrupted, causing mild cortisol elevation."
                      : "Your sleep is supporting healthy cortisol rhythm. Keep it up!"}
                  </div>
                </div>
              </div>
              <div className="connection-arrow">
                <div className="arrow-line"></div>
                <div className="arrow-effect">
                  {insights.sleepWidth < 45 ? "↓ Cortisol stays HIGH → suppresses Melatonin → harder to sleep next night"
                    : insights.sleepWidth < 70 ? "↓ Mild cortisol elevation → slight melatonin suppression"
                    : "↓ Cortisol drops naturally → melatonin rises → restful sleep cycle"}
                </div>
                <div className="arrow-head">↓</div>
              </div>
              <div className={`connection-node ${insights.moodWidths[0] > 55 ? "node-alert" : "node-ok"}`}>
                <div className="node-emoji">🌊</div>
                <div className="node-content">
                  <div className="node-title">Mood & Mental Health</div>
                  <div className="node-status">{insights.moodWidths[0] > 65 ? "Affected" : insights.moodWidths[0] > 40 ? "Mildly Affected" : "Stable"}</div>
                  <div className="node-desc">
                    {insights.moodWidths[0] > 65 ? "High cortisol is depleting your serotonin and dopamine — causing mood swings and irritability."
                      : insights.moodWidths[0] > 40 ? "Mild cortisol elevation is slightly affecting your serotonin levels, causing occasional mood dips."
                      : "Your serotonin and dopamine levels appear relatively stable — your mood is being well supported."}
                  </div>
                </div>
              </div>
              <div className="connection-arrow">
                <div className="arrow-line"></div>
                <div className="arrow-effect">
                  {insights.moodWidths[0] > 65 ? "↓ Low serotonin → anxiety spikes → more cortisol released → worsens sleep"
                    : insights.moodWidths[0] > 40 ? "↓ Slight serotonin dip → occasional anxiety → mild cortisol increase"
                    : "↓ Healthy serotonin → calm nervous system → supports hormonal balance"}
                </div>
                <div className="arrow-head">↓</div>
              </div>
              <div className={`connection-node ${insights.hormonalText.includes("interaction") ? "node-alert" : "node-ok"}`}>
                <div className="node-emoji">🌸</div>
                <div className="node-content">
                  <div className="node-title">Hormonal Health</div>
                  <div className="node-status">{insights.hormonalText.includes("interaction") ? "Disrupted" : insights.hormonalText.includes("Mild") ? "Mild Changes" : "Stable"}</div>
                  <div className="node-desc">
                    {insights.hormonalText.includes("interaction") ? "Elevated cortisol is directly competing with estrogen and progesterone — disrupting your cycle and worsening PMS."
                      : insights.hormonalText.includes("Mild") ? "Mild cortisol elevation may be causing early hormonal fluctuations. Monitor your cycle patterns closely."
                      : "Your hormonal rhythms appear stable. Healthy cortisol levels are supporting your estrogen and progesterone balance."}
                  </div>
                </div>
              </div>
              <div className="connection-arrow">
                <div className="arrow-line"></div>
                <div className="arrow-effect">
                  {insights.hormonalText.includes("interaction") ? "↓ Hormonal disruption → worsens mood → increases stress → poor sleep → cycle repeats 🔄"
                    : "↓ Balanced hormones → stable mood → lower stress → better sleep → healthy cycle ✅"}
                </div>
                <div className="arrow-head">↓</div>
              </div>
              <div className={`connection-summary ${insights.stage >= 2 ? "summary-alert" : insights.stage === 1 ? "summary-moderate" : "summary-ok"}`}>
                <div className="summary-emoji">
                  {insights.stage === 0 ? "✅" : insights.stage === 1 ? "⚠️" : "🚨"}
                </div>
                <div className="summary-text">
                  {insights.stage === 0 ? "Your sleep, mood and hormones are working together in a healthy cycle. Keep nurturing this balance 🌿"
                    : insights.stage === 1 ? "Your sleep disruption is the likely root cause — fix sleep first and mood + hormones will start to rebalance naturally."
                    : insights.stage === 2 ? "Your sleep, mood and hormones are caught in a stress cycle. Breaking it requires addressing all three together."
                    : "Your body's sleep-mood-hormone cycle is significantly disrupted. This needs gentle but consistent attention across all three areas."}
                </div>
              </div>
            </div>
          </div>

          <div className="ins-reco-card">
            <div className="ins-card-label">STAGE-SPECIFIC RECOMMENDATIONS</div>
            <div className="ins-card-title">Your personalised action plan ✨</div>
            <div className="ins-reco-list">
              {insights.recommendations.map(([emoji, text], i) => (
                <div key={i} className="ins-reco-item">
                  <span className="ins-reco-emoji">{emoji}</span>
                  <span className="ins-reco-text">{text}</span>
                </div>
              ))}
            </div>
            <button className="ins-buddy-btn"
              onClick={() => goToChat(setMessages, setPage, sliderValues, selectedOptions)}>
              Talk to AI Buddy 💗
            </button>
          </div>

          <p className="footer">💡 Corti-Scope AI provides guidance and emotional support, not medical diagnosis. Please consult a healthcare professional for clinical advice.</p>
        </div>
      )}

      {/* ══ CHAT ══ */}
      {page === "chat" && (
        <div className="chat-page">
          <div className="chat-header">
            <button className="back-btn" onClick={() => setPage("options")}>← Back</button>
            <div className="chat-header-center">
              <div className="chat-avatar">🌸</div>
              <div className="chat-header-info">
                <div className="chat-header-name">Corti-Scope AI Buddy</div>
                <div className="chat-header-sub">Your empathetic health companion</div>
              </div>
            </div>
            <div className="chat-online-dot"></div>
          </div>
          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-row ${msg.role === "user" ? "chat-row-user" : "chat-row-ai"}`}>
                {msg.role === "ai" && <div className="chat-bubble-avatar">🌸</div>}
                <div className={`chat-bubble ${msg.role === "user" ? "chat-bubble-user" : "chat-bubble-ai"}`}>
                  {msg.text.split("\n").map((line, j) => (
                    <span key={j}>{line}{j < msg.text.split("\n").length - 1 && <br />}</span>
                  ))}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="chat-row chat-row-ai">
                <div className="chat-bubble-avatar">🌸</div>
                <div className="chat-bubble chat-bubble-ai chat-typing">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="chat-input-area">
            {!isTyping && (
              <div className="chat-suggestions">
                {getChipsForLastMessage(messages).map((chip) => (
                  <button key={chip} className="suggestion-chip" onClick={() => sendMessage(chip)}>
                    {chip}
                  </button>
                ))}
              </div>
            )}
            <div className="chat-input-bar">
              <input type="text" className="chat-input"
                placeholder="Share how you're feeling..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown} />
              <button className="chat-send-btn" onClick={() => sendMessage()}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M22 2L11 13" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;