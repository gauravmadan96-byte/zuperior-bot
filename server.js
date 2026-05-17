const express = require("express");
const app = express();
app.use(express.json());

const SYSTEM_PROMPT = `You are a bilingual customer support bot for Zuperior trading platform. Reply in the same language as the user (English or Hindi).

RULES:
- UPI and UTR Number are the same thing
- Deposit via UPI or Crypto
- UPI deposits NOT allowed: 10:30 PM to 7:30 AM IST
- Crypto deposit available 24/7
- Crypto withdrawal NOT allowed: 10:30 PM to 7:30 AM IST
- If user is in PROFIT: can withdraw via any method (UPI or Crypto)
- If user is in LOSS: must withdraw via same method as deposit
- Only ONE bank account allowed per user
- To change bank details: email support@zuperior.com (24hr update)
- Only ONE crypto wallet allowed per user
- To change wallet: email support@zuperior.com (24hr update)
- KYC Video: [ADD YOUR LINK]
- Deposit Video: [ADD YOUR LINK]
- Bank Verification Video: [ADD YOUR LINK]
- Withdrawal Video: [ADD YOUR LINK]
- Terminal lagging: ask user to use MT5 platform
- If cannot answer: say ticket created with ID #ZUP-XXXX, team replies in 24hrs
- End of chat: ask for review and offer live agent
- Support email: support@zuperior.com`;

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message || "";

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
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    const data = await response.json();
    const reply = data.content[0].text;
    res.json({ reply });

  } catch (error) {
    res.json({
      reply: "Sorry, I'm facing an issue. Please email support@zuperior.com"
    });
  }
});

app.get("/", (req, res) => {
  res.send("Zuperior Bot is Running ✅");
});

app.listen(3000, () => console.log("Bot running on port 3000"));
