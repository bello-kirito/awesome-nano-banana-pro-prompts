import "dotenv/config";
import fetch from "node-fetch";
import { stringify } from "qs-esm";
import type { Prompt } from "./utils/cms-client.js";

const CMS_HOST = process.env.CMS_HOST;
const CMS_API_KEY = process.env.CMS_API_KEY;
const RANDOM_COUNT = 20;
const MAX_PAGE_SIZE = 100;

interface CMSResponse {
  docs: Prompt[];
  totalDocs: number;
}

async function fetchTotalCount(): Promise<number> {
  const query = {
    limit: 1,
    where: {
      model: {
        equals: "nano-banana-pro",
      },
    },
  };

  const url = `${CMS_HOST}/api/prompts${stringify(query, { addQueryPrefix: true })}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `users API-Key ${CMS_API_KEY}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`CMS API error: ${response.statusText}`);
  }

  const data = (await response.json()) as CMSResponse;
  return data.totalDocs;
}

async function fetchPromptPage(page: number, limit: number): Promise<Prompt[]> {
  const query = {
    limit,
    page,
    where: {
      model: {
        equals: "nano-banana-pro",
      },
    },
  };

  const url = `${CMS_HOST}/api/prompts${stringify(query, { addQueryPrefix: true })}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `users API-Key ${CMS_API_KEY}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`CMS API error: ${response.statusText}`);
  }

  const data = (await response.json()) as CMSResponse;
  return data.docs;
}

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

async function main() {
  try {
    if (!CMS_HOST || !CMS_API_KEY) {
      throw new Error("CMS_HOST and CMS_API_KEY must be set in environment variables");
    }

    console.log("🔢 Fetching total prompt count...");
    const total = await fetchTotalCount();
    console.log(`📊 Total prompts available: ${total}`);

    // Pick a random page to start from, ensuring we get enough prompts
    const pageSize = Math.min(MAX_PAGE_SIZE, total);
    const maxPage = Math.ceil(total / pageSize);
    const randomPage = Math.floor(Math.random() * maxPage) + 1;

    console.log(`📥 Fetching a batch of prompts (page ${randomPage})...`);
    const prompts = await fetchPromptPage(randomPage, pageSize);

    const selected = shuffleArray(prompts).slice(0, RANDOM_COUNT);

    console.log(`\n🎲 Here are ${RANDOM_COUNT} random Nano Banana Pro prompts:\n`);
    console.log("=".repeat(60));

    selected.forEach((prompt, index) => {
      console.log(`\n### ${index + 1}. ${prompt.title}`);
      console.log(`Language: ${prompt.language}`);
      if (prompt.description) {
        console.log(`Description: ${prompt.description}`);
      }
      console.log(`\nPrompt:\n${prompt.translatedContent || prompt.content}`);
      if (prompt.sourceLink) {
        console.log(`\nSource: ${prompt.sourceLink}`);
      }
      console.log("-".repeat(60));
    });
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

main();
