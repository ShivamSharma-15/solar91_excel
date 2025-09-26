const express = require("express");
const cronRoute = require("./routes/cron");
const app = express();

app.set("trust proxy", 1);

// app.use(enforceHttps);

// -----------------------------------------------------------------------------
// Request Body Parsing
// -----------------------------------------------------------------------------

app.use(express.json());

// -----------------------------------------------------------------------------
// Routes
// -----------------------------------------------------------------------------

app.use("/apps/api/solar91", cronRoute);

// -----------------------------------------------------------------------------
// Server Start
// -----------------------------------------------------------------------------

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on 0.0.0.0:${PORT}`);
});
