const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const scrapeRouter = require("./routes/scrape"); // Importar la ruta scrape
const { initializeBrowser } = require("./utils/browser");

dotenv.config();

async function startServer() {
  const app = express();

  app.use(express.json());

  app.get("/", (req, res) => {
    res.send("Hello World");
  });

  // Initialize browser and context
  const { context } = await initializeBrowser();

  // Pass the context to the scrape router
  app.use("/scrape", scrapeRouter(context));

  // Connect to MongoDB
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.log(err));

  app.listen(process.env.PORT || 3001, () => {
    console.log(`Server is running on port ${process.env.PORT || 3001}`);
  });
}

startServer().catch((err) => {
  console.error("Error starting the server:", err);
});
