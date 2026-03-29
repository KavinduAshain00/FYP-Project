const ModelClient = require("@azure-rest/ai-inference").default;
const { isUnexpected } = require("@azure-rest/ai-inference");
const { AzureKeyCredential } = require("@azure/core-auth");
const { AI_FALLBACK_MODEL } = require("../constants/ai");

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
 * @param {object} options - { temperature, maxTokens, topP, fallbackModel } — set fallbackModel to null to disable retry
 * @returns {Promise<string>} The assistant's reply text
 */
async function chatCompletion(messages, model, options = {}) {
  if (!GITHUB_TOKEN) throw new Error("GITHUB_TOKEN not configured");

  const c = getClient();
  const bodyBase = {
    messages,
    temperature: options.temperature ?? 0.2,
    max_tokens: options.maxTokens ?? 512,
    top_p: options.topP ?? 1.0,
  };

  const fallback =
    options.fallbackModel === undefined
      ? AI_FALLBACK_MODEL
      : options.fallbackModel;

  async function requestOnce(modelId) {
    const response = await c.path("/chat/completions").post({
      body: { ...bodyBase, model: modelId },
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

  try {
    return await requestOnce(model);
  } catch (err) {
    if (fallback && fallback !== model) {
      console.warn(
        `[GitHub Models] Primary model "${model}" failed (${err.message}); retrying with "${fallback}".`,
      );
      return await requestOnce(fallback);
    }
    throw err;
  }
}

module.exports = { chatCompletion };
