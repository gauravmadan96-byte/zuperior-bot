const express = require("express");
const app = express();
app.use(express.json());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

const SYSTEM_PROMPT = `You are a professional customer support agent for Zuperior trading platform. Reply in English only. Be polite, friendly and use emojis.

RULES:
1. UPI and UTR Number are the same thing.
2. Deposit via UPI or Crypto. UPI blocked 10:30 PM to 7:30 AM IST. Crypto 24/7.
3. In PROFIT: withdraw via any method. In LOSS: withdraw via same deposit method.
4. Withdrawal not received: ask for UTR and amount, allow 24 hours.
5. Only ONE bank account allowed. To change: email support@zuperior.com, done in 24hrs.
6. Only ONE crypto wallet allowed. To change: email support@zuperior.com, done in 24hrs.
7. KYC: share KYC video link [KYC VIDEO LINK].
8. Deposit guide: [DEPOSIT VIDEO LINK].
9. Bank verification: [BANK VIDEO LINK].
10. Withdrawal guide: [WITHDRAWAL VIDEO LINK].
11. UPI timings: 7:30 AM to 10:30 PM IST only.
12. Crypto withdrawal: NOT available 10:30 PM to 7:30 AM IST.
13. Terminal lagging: use MT5 platform.
14. Cannot answer after 2 tries: create ticket #ZUP-XXXX, team replies in 24hrs, email support@zuperior.com.
15. End of chat: ask for review and offer live agent.`;

const sessions = {};

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message || "";
  const sessionId = req.body.sessionId || "default";

  if (!sessions[sessionId]) {
    sessions[sessionId] = [];
  }

  if (userMessage === "__GREET__") {
    const greetMsg = "Welcome to Zuperior Support! 🙏\n\nHow can I help you today? 😊\n\nYou can ask me about:\n💰 Deposit\n💸 Withdrawal\n🏦 Bank / Wallet Details\n📋 KYC\n⏰ Timings\n🎫 Support Ticket";
    sessions[sessionId].push({ role: "assistant", content: greetMsg });
    return res.json({ reply: greetMsg });
  }

  sessions[sessionId].push({ role: "user", content: userMessage });

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 500,
        system: SYSTEM_PROMPT,
        messages: sessions[sessionId],
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error("Claude Error:", data.error);
      return res.json({ reply: "Sorry, please email support@zuperior.com" });
    }

    const reply = data.content[0].text;
    sessions[sessionId].push({ role: "assistant", content: reply });
    console.log("User:", userMessage);
    console.log("Bot:", reply);
    res.json({ reply, sessionId });

  } catch (error) {
    console.error("Error:", error);
    res.json({ reply: "Sorry for the inconvenience. Please email support@zuperior.com" });
  }
});

app.get("/", (req, res) => {
  res.send("Zuperior Bot is Running ✅");
});

setInterval(() => {
  Object.keys(sessions).forEach((key) => { delete sessions[key]; });
}, 3600000);

app.listen(process.env.PORT || 3000, () => {
  console.log("Zuperior Bot is live! ✅");
});
