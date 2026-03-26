const ModelClient = require("@azure-rest/ai-inference").default;
const { isUnexpected } = require("@azure-rest/ai-inference");
const { AzureKeyCredential } = require("@azure/core-auth");

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const ENDPOINT = "https://models.github.ai/inference";

if (!GITHUB_TOKEN) {
  console.warn(
    "Warning: GITHUB_TOKEN not set. GitHub Models calls will fail until configured.",
  );
}

let client = null;

function getClient() {
  if (!client && GITHUB_TOKEN) {
    client = ModelClient(ENDPOINT, new AzureKeyCredential(GITHUB_TOKEN));
  }
  return client;
}

/**
 * Send a chat completion request to GitHub Models.
 * @param {Array<{role: string, content: string}>} messages
 * @param {string} model - GitHub Models model identifier (e.g. "meta/Llama-4-Scout-17B-16E-Instruct")
 * @param {object} options - { temperature, maxTokens, topP }
 * @returns {Promise<string>} The assistant's reply text
 */
async function chatCompletion(messages, model, options = {}) {
  if (!GITHUB_TOKEN) throw new Error("GITHUB_TOKEN not configured");

  const c = getClient();
  const response = await c.path("/chat/completions").post({
    body: {
      messages,
      model,
      temperature: options.temperature ?? 0.2,
      max_tokens: options.maxTokens ?? 512,
      top_p: options.topP ?? 1.0,
    },
  });

  if (isUnexpected(response)) {
    const err = response.body.error;
    throw new Error(
      err?.message || JSON.stringify(err) || "GitHub Models request failed",
    );
  }

  const choice = response.body.choices?.[0];
  return choice?.message?.content || "";
}

module.exports = { chatCompletion };
