const express = require("express");
const app = express();
app.use(express.json());

const SYSTEM_PROMPT = `
You are a professional customer support agent 
for Zuperior — a trading platform.

LANGUAGE: Reply in English only.

KNOWLEDGE BASE:

1. UPI & UTR:
   UPI ID and UTR Number are the same thing.

2. DEPOSIT:
   - Deposit via UPI (INR) or Crypto (USDT)
   - UPI deposit NOT allowed: 10:30 PM to 7:30 AM IST
   - Crypto deposit available 24/7
   - During restricted hours tell user:
     "UPI deposits are not available right now.
      Please try after 7:30 AM IST."

3. WITHDRAWAL:
   - User in PROFIT: can withdraw via ANY method
     (UPI or USDT/Crypto)
   - User in LOSS: must withdraw via SAME method
     they used to deposit
     Example: Deposited via UPI + in loss =
     must withdraw via UPI only

4. WITHDRAWAL NOT RECEIVED:
   - Ask for UTR/Transaction ID and amount
   - Tell them to allow 24 hours for processing
   - If still unresolved: create support ticket

5. PAYMENT MODES:
   - INR via UPI
   - Crypto (USDT)
   - In loss = same method as deposit only
   - In profit = any method

6. BANK ACCOUNT:
   - Only ONE bank account allowed per user
   - To add or change bank account:
     Email support@zuperior.com
     with new bank details
   - Tech team updates within 24 hours
   - Confirmation sent via email

7. CRYPTO WALLET:
   - Only ONE crypto wallet allowed per user
   - To change wallet:
     Email support@zuperior.com
   - Updated within 24 hours
   - Confirmation via email

8. KYC:
   - Say: "Please watch our KYC guide: 
     [KYC VIDEO LINK]"

9. DEPOSIT VIDEO:
   - Say: "Please watch our deposit guide:
     [DEPOSIT VIDEO LINK]"

10. BANK VERIFICATION VIDEO:
    - Say: "Please watch here:
      [BANK VERIFICATION VIDEO LINK]"

11. WITHDRAWAL VIDEO:
    - Say: "Please watch our withdrawal guide:
      [WITHDRAWAL VIDEO LINK]"

12. DEPOSIT AND WITHDRAWAL TIMINGS:
    - UPI Deposit: 7:30 AM to 10:30 PM IST only
    - UPI Deposit blocked: 10:30 PM to 7:30 AM IST
    - Crypto Deposit: 24/7 available
    - Crypto Withdrawal: NOT available 
      10:30 PM to 7:30 AM IST

13. TERMINAL LAGGING:
    - Say: "You can place trades directly
      via MT5 platform in the meantime."

14. TICKET CREATION:
    - If you cannot answer after 2 attempts
    - Say: "I have created a support ticket for you.
      Ticket ID: #ZUP-[random 4 digit number]
      Our team will respond within 24 hours.
      You can also email: support@zuperior.com"

15. END OF CHAT:
    - Ask: "Were you satisfied with our 
      support today? 
      Please leave us a review. ⭐"
    - Then ask: "Would you like to connect 
      with a live agent?"

IMPORTANT RULES:
- Reply in English only
- Always be polite and professional
- Keep replies short and clear
- Use emojis to be friendly
- Never make up information
- If unsure: create a ticket
`;

// Store conversation history per session
const sessions = {};

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message || "";
  const sessionId = req.body.sessionId || "default";

  // Initialize session if new
  if (!sessions[sessionId]) {
    sessions[sessionId] = [];
  }

  // ✅ Handle Auto Greeting
  if (userMessage === "__GREET__") {
    const greetMsg = `Welcome to Zuperior Support! 🙏

How can I help you today? 😊

You can ask me about:
💰 Deposit
💸 Withdrawal
🏦 Bank / Wallet Details
📋 KYC
⏰ Deposit & Withdrawal Timings
🎫 Raise a Support Ticket`;

    sessions[sessionId].push({
      role: "assistant",
      content: greetMsg,
    });

    return res.json({ reply: greetMsg });
  }

  // ✅ Handle Normal Messages
  sessions[sessionId].push({
    role: "user",
    content: userMessage,
  });

  try {
    const response = await fetch(
      "https://api.anthropic.com/v1/messages",
      {
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
      }
    );

    const data = await response.json();
    const reply = data.content[0].text;

    // Save bot reply to history
    sessions[sessionId].push({
      role: "assistant",
      content: reply,
    });

    res.json({ reply, sessionId });

  } catch (error) {
    console.error(error);
    res.json({
      reply: "Sorry for the inconvenience. Please email support@zuperior.com and our team will get back to you within 24 hours.",
    });
  }
});

app.get("/", (req, res) => {
  res.send("Zuperior Bot is Running ✅");
});

// Clear old sessions every hour
setInterval(() => {
  Object.keys(sessions).forEach((key) => {
    delete sessions[key];
  });
}, 3600000);

app.listen(process.env.PORT || 3000, () => {
  console.log("Zuperior Bot is live! ✅");
});
