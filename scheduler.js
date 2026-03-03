// scheduler.js
// Node 18+ script — posts a message (text or images) and then makes other bots react.
// Uses dotenv + node-cron. Keep your real tokens in .env (never commit .env).

require('dotenv').config();
const cron = require('node-cron');

// CONFIG from .env
const POST_BOT = process.env.BOT_TOKEN_POSTER;
const REACT_BOTS = (process.env.BOT_TOKENS || "")
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const CHAT_ID = process.env.CHAT_ID || "@daviestips";
const IMAGE_URLS = (process.env.IMAGE_URLS || "")
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const PREDICTION_TEXT = process.env.PREDICTION_TEXT || "📊 Prediction (confident): Team A vs Team B\nFinal Score: 2 - 1\nGood luck!";
const EMOJIS = (process.env.EMOJIS || "🔥,👍,💯")
  .split(/[,\s]+/)
  .map(s => s.trim())
  .filter(Boolean);

const DELAY_MS = parseInt(process.env.DELAY_MS || "400", 10);
const CRON_EXPR = process.env.CRON_EXPR || "0 * * * *"; // default: every hour
const TIMEZONE = process.env.TIMEZONE || "UTC";

// helper: sleep
function sleep(ms){ return new Promise(r=>setTimeout(r, ms)); }

// helper: call Telegram Bot API
async function tgApi(token, method, body) {
  const url = `https://api.telegram.org/bot${token}/${method}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const json = await res.json();
  return json;
}

// post prediction; returns message_id or null
async function postPrediction() {
  if (!POST_BOT) throw new Error("BOT_TOKEN_POSTER not set in .env");
  if (!CHAT_ID) throw new Error("CHAT_ID not set in .env");

  try {
    if (IMAGE_URLS.length > 1) {
      // sendMediaGroup: first item holds caption
      const media = IMAGE_URLS.map((url, i) => {
        const item = { type: "photo", media: url };
        if (i === 0) item.caption = PREDICTION_TEXT;
        return item;
      });
      const resp = await tgApi(POST_BOT, "sendMediaGroup", {
        chat_id: CHAT_ID,
        media
      });
      if (!resp.ok) {
        console.error("sendMediaGroup error:", resp);
        return null;
      }
      return resp.result && resp.result[0] ? resp.result[0].message_id : null;
    } else if (IMAGE_URLS.length === 1) {
      const resp = await tgApi(POST_BOT, "sendPhoto", {
        chat_id: CHAT_ID,
        photo: IMAGE_URLS[0],
        caption: PREDICTION_TEXT
      });
      if (!resp.ok) {
        console.error("sendPhoto error:", resp);
        return null;
      }
      return resp.result ? resp.result.message_id : null;
    } else {
      const resp = await tgApi(POST_BOT, "sendMessage", {
        chat_id: CHAT_ID,
        text: PREDICTION_TEXT,
        parse_mode: "HTML"
      });
      if (!resp.ok) {
        console.error("sendMessage error:", resp);
        return null;
      }
      return resp.result ? resp.result.message_id : null;
    }
  } catch (err) {
    console.error("postPrediction exception:", err);
    return null;
  }
}

// make reactions using each reactor bot
async function reactToMessage(messageId) {
  if (!messageId) throw new Error("messageId required to react");
  for (const token of REACT_BOTS) {
    if (!token) continue;
    for (const emoji of EMOJIS) {
      try {
        const resp = await tgApi(token, "setMessageReaction", {
          chat_id: CHAT_ID,
          message_id: parseInt(messageId, 10),
          reaction: [{ type: "emoji", emoji }]
        });
        if (resp && resp.ok) {
          console.log(`Bot ${token.slice(0,8)} reacted with ${emoji}`);
        } else {
          console.warn(`Bot ${token.slice(0,8)} reaction response:`, resp);
        }
      } catch (err) {
        console.error(`Error reacting (bot ${token.slice(0,8)}):`, err);
      }
      await sleep(DELAY_MS);
    }
  }
}

// full cycle
async function postAndReactCycle() {
  console.log(new Date().toISOString(), "Start cycle");
  const msgId = await postPrediction();
  if (!msgId) {
    console.error("Failed to post — skipping reactions");
    return;
  }
  console.log("Posted message id:", msgId);
  await reactToMessage(msgId);
  console.log(new Date().toISOString(), "Cycle finished");
}

// run once immediately and schedule
if (require.main === module) {
  console.log("Scheduler starting. CRON:", CRON_EXPR, "TZ:", TIMEZONE);
  postAndReactCycle().catch(err => console.error("Immediate run error:", err));

  cron.schedule(CRON_EXPR, () => {
    postAndReactCycle().catch(err => console.error("Scheduled run error:", err));
  }, {
    scheduled: true,
    timezone: TIMEZONE
  });
}
