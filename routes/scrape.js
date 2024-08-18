const express = require("express");
const OpenAI = require("openai");
const stopword = require("stopword");
const Website = require("../db/models/Website");
const dotenv = require("dotenv");

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

module.exports = (context) => {
  const router = express.Router();
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

      // Gracefully handle missing meta description
      const descriptionElement = await page.$('meta[name="description"]');
      let description = "";
      if (descriptionElement) {
        description = await page.$eval(
          'meta[name="description"]',
          (element) => element.content
        );
      } else {
        console.log("Description meta tag not found.");
      }

      let headings = await page.$$eval("h1, h2, h3, h4, h5, h6", (elements) =>
        elements
          .map((el) => el.innerText.trim())
          .filter((text) => text.length > 0)
      );

      let paragraphs = await page.$$eval("p", (elements) =>
        elements
          .map((el) => el.innerText.trim())
          .filter((text) => text.length > 0)
      );

      let lists = await page.$$eval("ul, ol", (elements) =>
        elements
          .map((el) => el.innerText.trim())
          .filter((text) => text.length > 0)
      );

      let rawText = await page.$$eval("div, span", (elements) =>
        elements
          .map((el) => el.innerText.trim())
          .filter((text) => text.length > 0)
      );

      // use at maximum 10 paragraphs, 20 raw text, 10 headings, 10 lists
      headings = headings.slice(0, 10);
      paragraphs = paragraphs.slice(0, 10);
      lists = lists.slice(0, 10);
      rawText = rawText.slice(0, 20);

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
        summary: openAISummary,
      });

      await summaryData.save();

      console.log("Saved");

      if (openAISummary === "") {
        return res.status(500).json({ error: "Response is empty" });
      }

      res.json({
        title,
        openAISummary,
      });
    } catch (error) {
      console.error("Error during scraping:", error);
      res.status(500).json({ error: "Internal Server Error: ", error });
    } finally {
      if (page) {
        await page.close();
      }
    }
  });

  async function cleanAndFilterContent(textArray) {
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
    lists,
    rawText
  ) {
    const headingsContent = headings.join(",");
    const listsContent = lists.join(",");

    let content = [
      `Website: ${websiteLink}`,
      `Title: ${title}`,
      `Description: ${description}`,
      `Headings: ${headingsContent}`,
      `Lists: ${listsContent}`,
      `Raw Text: ${rawText}`,
    ];

    console.log("Content:", content);

    try {
      let prompt = `Please provide a concise summary of the following website content and the website category or label it falls (sports, e-commerce, news, bloc, etc), return only a json object with this format: {sumamry, label}. no special characters:\n\n${content}. If  you can't summarize the content or find a category, return empty value mapped to the respecitve json key.`;
      let systemPrompt =
        "You are a web scraper expert. Provide a brief and concise summary of the website content, focusing only on key points and avoiding unnecessary details.";
      const summary_response = await openai.chat.completions.create({
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
    } catch (error) {
      console.error("Error during OpenAI summarization:", error);
      return "Error during OpenAI summarization";
    }
  }

  return router;
};
