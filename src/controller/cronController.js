const { delegator } = require("../service/delegate");
const { logicPower } = require("../service/delegateLogicPower");

async function cronController(req, res, next) {
  res.json({ success: true });
  await delegator();
  await logicPower();
}
module.exports = { cronController };
