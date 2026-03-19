// api/run.js

const { postAndReactCycle } = require("../scheduler");

export default async function handler(req, res) {
  try {
    const result = await postAndReactCycle();

    return res.status(200).json({
      ok: true,
      message: "Bot executed successfully",
      result
    });

  } catch (err) {
    console.error("Run API error:", err);

    return res.status(500).json({
      ok: false,
      error: String(err)
    });
  }
}
