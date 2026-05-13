import { WebClient } from "@slack/web-api";
import { formatMorningBriefing, type MorningBriefing } from "./maxwell";

export { formatMorningBriefing, type MorningBriefing } from "./maxwell";

let _client: WebClient | null = null;

function getClient(): WebClient {
  if (_client) return _client;
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) {
    throw new Error(
      "SLACK_BOT_TOKEN must be set to post to Slack. Set it in Replit Secrets or your shell env.",
    );
  }
  _client = new WebClient(token);
  return _client;
}

export function isSlackConfigured(): boolean {
  return typeof process.env.SLACK_BOT_TOKEN === "string" && process.env.SLACK_BOT_TOKEN.length > 0;
}

export async function postMessage(channel: string, text: string): Promise<void> {
  const client = getClient();
  await client.chat.postMessage({ channel, text });
}

export async function postMorningBriefing(channel: string, briefing: MorningBriefing): Promise<void> {
  const text = formatMorningBriefing(briefing);
  await postMessage(channel, text);
}
