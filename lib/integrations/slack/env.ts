import { z } from "zod";

export const envSchema = z.object({
  SLACK_APP_INSTALL_URL: z.string().optional(),
  SLACK_CLIENT_ID: z.string().optional(),
  SLACK_CLIENT_SECRET: z.string().optional(),
  SLACK_INTEGRATION_ID: z.string().optional(),
});

type SlackEnv = z.infer<typeof envSchema>;

let env: SlackEnv | undefined;

export const getSlackEnv = () => {
  if (env) {
    return env;
  }

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    throw new Error(
      "Slack app environment variables are not configured properly.",
    );
  }

  env = parsed.data;

  return env;
};

export const isSlackConfigured = (): boolean => {
  try {
    const slackEnv = getSlackEnv();
    return !!(
      slackEnv.SLACK_CLIENT_ID &&
      slackEnv.SLACK_CLIENT_SECRET &&
      slackEnv.SLACK_APP_INSTALL_URL &&
      slackEnv.SLACK_INTEGRATION_ID
    );
  } catch {
    return false;
  }
};
