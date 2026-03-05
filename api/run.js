// api/run.js
const { postAndReactCycle } = require("../scheduler");

module.exports = async (req, res) => {
  try {
    const result = await postAndReactCycle();
    res.status(200).json(result);
  } catch (err) {
    console.error("Run API error:", err);
    res.status(500).json({ ok: false, error: String(err) });
  }
};
