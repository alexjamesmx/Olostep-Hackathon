const express = require("express");
const router = express.Router();
const { chromium } = require("playwright");
const OpenAI = require("openai");
const stopword = require("stopword");

const tf = require("@tensorflow/tfjs");

const use = require("@tensorflow-models/universal-sentence-encoder");
const dotenv = require("dotenv");

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

const systemPrompt =
  "Role: You are a web scraper expert. You need to summarize the content of a webpage. If you have more info about the website add that: \n\nContent: ";

let model;
use.load().then((m) => {
  model = m;
  console.log("Universal Sentence Encoder model loaded.");
});

router.post("/", async (req, res) => {
  const url = req.body.url;

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(url);

    // Scrape and process content as usual
    const title = await page.title();
    const description = await page.$eval(
      'meta[name="description"]',
      (element) => element.content
    );
    const headings = await page.$$eval("h1, h2, h3, h4, h5, h6", (elements) =>
      elements.map((el) => el.innerText)
    );

    const paragraphs = await page.$$eval("p", (elements) =>
      elements.map((el) => el.innerText)
    );

    console.log("Headings:", headings);
    // Clean the content using NLP techniques
    // const filteredHeadings = await cleanAndFilterContent(headings);
    // const filteredParagraphs = await cleanAndFilterContent(paragraphs);

    // Use OpenAI for summarization on the cleaned content
    const openAISummary = await summarizeWithOpenAI(
      url,
      title,
      description,
      headings,
      paragraphs
    );
    await browser.close();

    res.json({
      title,
      openAISummary,
    });
  } catch (error) {
    console.error("Error during scraping:", error);
    res.status(500).json({ error: "Error during scraping" });
  }
});
async function cleanAndFilterContent(textArray) {
  // Step 1: Clean the text
  const cleanedTextArray = textArray
    .map((text) => {
      // Convert text to lowercase
      text = text.toLowerCase();

      // Remove special characters and numbers
      text = text.replace(/[^a-z\s]/g, "");

      // Tokenize the text (split into words)
      let words = text.split(/\s+/);

      // Remove stopwords
      words = stopword.removeStopwords(words);

      // Rejoin the cleaned words into a cleaned string
      return words.join(" ").trim();
    })
    .filter((cleanedText) => cleanedText.length > 0); // Remove empty strings
  return cleanedTextArray;
}

// Function to summarize content using OpenAI
async function summarizeWithOpenAI(
  websiteLink,
  title,
  description,
  headings,
  paragraphs
) {
  // Combine all the content into a single string, add before each content type a label

  const headingsContent = headings.join(",");
  const paragraphsContent = paragraphs.join(",");

  console.log("Headings content:", headingsContent);

  const content = [
    `Website: ${websiteLink}`,
    `Title: ${title}`,
    `Description: ${description}`,
  ].join;

  try {
    //   const prompt = `${content}:`;

    //   console.log("OpenAI prompt to summarize:", prompt);

    //   const response = await openai.chat.completions.create({
    //     model: "gpt-4o-mini",
    //     messages: [
    //       {
    //         role: "system",
    //         content: systemPrompt,
    //       },
    //       {
    //         role: "user",
    //         content: prompt,
    //       },
    //     ],
    //   });

    //   console.log("OpenAI response:", response.choices[0].message.content);
    //   return response.choices[0].message.content;
    return content;
  } catch (error) {
    console.error("Error during OpenAI summarization:", error);
    return "Error during OpenAI summarization";
  }
}

module.exports = router;
