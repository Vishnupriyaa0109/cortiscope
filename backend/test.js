require("dotenv").config({ path: "./.env" }); // ✅ force load

const Groq = require("groq-sdk");

// 🔥 DEBUG: check if key is loaded
console.log("API KEY:", process.env.GROQ_API_KEY);

if (!process.env.GROQ_API_KEY) {
  console.error("❌ ERROR: GROQ_API_KEY not found in .env");
  process.exit(1);
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function testGroq() {
  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "user",
          content: "Say hello in a friendly way"
        }
      ]
    });

    console.log("✅ SUCCESS:");
    console.log(response.choices[0].message.content);

  } catch (err) {
    console.error("❌ ERROR:");
    console.error(err.response?.data || err.message);
  }
}

testGroq();