const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const scrapeRouter = require("./routes/scrape"); // Importar la ruta scrape

dotenv.config();

app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.use("/scrape", scrapeRouter); // Usar la ruta scrape

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

app.listen(process.env.PORT || 3001, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
