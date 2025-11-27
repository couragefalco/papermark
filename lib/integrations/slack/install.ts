import { nanoid } from "nanoid";

import { redis } from "@/lib/redis";

import { getSlackEnv } from "./env";

// Get the installation URL for Slack
export const getSlackInstallationUrl = async (
  teamId: string,
): Promise<string> => {
  const env = getSlackEnv();

  if (!env.SLACK_APP_INSTALL_URL) {
    throw new Error(
      "Slack integration is not configured. Please set SLACK_APP_INSTALL_URL environment variable.",
    );
  }

  if (!redis) {
    throw new Error("Redis is required for Slack integration");
  }

  const state = nanoid(16);
  await redis.set(`slack:install:state:${state}`, teamId, {
    ex: 30 * 60,
  });

  const url = new URL(env.SLACK_APP_INSTALL_URL);
  url.searchParams.set(
    "redirect_uri",
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/integrations/slack/oauth/callback`,
  );
  url.searchParams.set("state", state);

  return url.toString();
};
