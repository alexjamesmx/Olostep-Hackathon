const express = require("express");
const router = express.Router();
const { chromium } = require("playwright");
const OpenAI = require("openai");
const stopword = require("stopword");
const Website = require("../db/models/Website");
const dotenv = require("dotenv");

dotenv.config();

const browser = chromium.launch({
  executablePath: "/app/browsers/chromium-1129/chrome-linux/chrome",
});

const context = browser.newContext({
  ignoreHTTPSErrors: true,
  bypassCSP: true,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

router.post("/", async (req, res) => {
  const url = req.body.url;

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  let page;

  try {
    page = await context.newPage();
    await page.goto(url, { waitUntil: "networkidle" });

    const title = await page.title();
    const description = await page.$eval(
      'meta[name="description"]',
      (element) => element.content
    );

    const headings = await page.$$eval("h1, h2, h3, h4, h5, h6", (elements) =>
      elements
        .map((el) => el.innerText.trim())
        .filter((text) => text.length > 0)
    );

    const paragraphs = await page.$$eval("p", (elements) =>
      elements
        .map((el) => el.innerText.trim())
        .filter((text) => text.length > 0)
    );

    const lists = await page.$$eval("ul, ol", (elements) =>
      elements
        .map((el) => el.innerText.trim())
        .filter((text) => text.length > 0)
    );

    const rawText = await page.$$eval("div, span", (elements) =>
      elements
        .map((el) => el.innerText.trim())
        .filter((text) => text.length > 0)
    );

    const filteredHeadings = await cleanAndFilterContent(headings);
    const filteredParagraphs = await cleanAndFilterContent(paragraphs);
    const filteredLists = await cleanAndFilterContent(lists);
    const filteredRawText = await cleanAndFilterContent(rawText);

    const openAISummary = await summarizeWithOpenAI(
      url,
      title,
      description,
      filteredHeadings,
      filteredLists
    );

    console.log("Saving summary to database");

    const summaryData = new Website({
      websiteLink: url,
      title,
      description,
      headings,
      paragraphs,
      summary: openAISummary,
    });

    await summaryData.save();

    console.log("Saved");

    res.json({
      title,
      openAISummary,
    });
  } catch (error) {
    console.error("Error during scraping:", error);
    res.status(500).json({ error: "Error during scraping" });
  } finally {
    page.close();
  }
});
async function cleanAndFilterContent(textArray) {
  // Step 1: Clean the text
  const cleanedTextArray = textArray
    .map((text) => {
      text = text.toLowerCase();
      text = text.replace(/[^a-z\s]/g, "");
      let words = text.split(/\s+/);
      words = stopword.removeStopwords(words);
      return words.join(" ").trim();
    })
    .filter((cleanedText) => cleanedText.length > 0);
  return cleanedTextArray;
}

async function summarizeWithOpenAI(
  websiteLink,
  title,
  description,
  headings,
  lists
) {
  const headingsContent = headings.join(",");
  const listsContent = lists.join(",");

  console.log("Headings content:", headingsContent);

  const content = [
    `Website: ${websiteLink}`,
    `Title: ${title}`,
    `Description: ${description}`,
    `Headings: ${headingsContent}`,
    `Lists: ${listsContent}`,
  ];

  console.log("Content:", content);

  try {
    const prompt = `Please provide a concise summary of the following website content, return only a summary. no special characthers:\n\n${content}`;
    const systemPrompt =
      "You are a web scraper expert. Provide a brief and concise summary of the website content, focusing only on key points and avoiding unnecessary details.";
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    console.log("OpenAI response:", response.choices[0].message.content);
    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error during OpenAI summarization:", error);
    return "Error during OpenAI summarization";
  }
}

module.exports = router;
