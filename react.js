// react.js
// You can run this without installing npm packages (Node 18+)

const botTokens = [
  process.env.BOT_TOKEN_1,
  process.env.BOT_TOKEN_2,
  process.env.BOT_TOKEN_3,
  process.env.BOT_TOKEN_4,
  process.env.BOT_TOKEN_5,
  process.env.BOT_TOKEN_6
];

const chatId = "@daviestips"; // your channel’s username

// Function to send a reaction for a bot
async function sendReaction(botToken, messageId, emoji) {
  try {
    const url = `https://api.telegram.org/bot${botToken}/setMessageReaction`;
    const payload = {
      chat_id: chatId,
      message_id: parseInt(messageId),
      reaction: [{ type: "emoji", emoji: emoji }]
    };

    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" }
    });

    const data = await response.json();
    console.log(`Bot ${botToken.slice(0,8)}… reacted with ${emoji}:`, data);
  } catch (err) {
    console.error(`Error with bot ${botToken.slice(0,8)}…:`, err);
  }
}

// Loop through bots and emojis
async function reactWithEmojis(messageId, emojis) {
  console.log("Reacting to message:", messageId);
  for (let emoji of emojis) {
    for (let token of botTokens) {
      if (!token) continue; // skip if token missing
      await sendReaction(token, messageId, emoji);
      await new Promise(r => setTimeout(r, 300)); // short delay
    }
  }
  console.log("Done reacting!");
}

// Get message ID & emojis from command line
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error("Usage: node react.js <message_id> <emoji1> [emoji2] …");
  process.exit(1);
}

const messageId = args[0];
const emojis = args.slice(1);

reactWithEmojis(messageId, emojis);
