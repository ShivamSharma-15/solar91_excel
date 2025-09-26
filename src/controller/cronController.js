const { delegator } = require("../service/delegate");
const { logicPower } = require("../service/delegateLogicPower");

async function cronController(req, res, next) {
  await delegator();
  await logicPower();
  return res.json({ success: true });
}
module.exports = { cronController };
