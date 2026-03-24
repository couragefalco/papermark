/** @type {import("@tinybirdco/sdk").TinybirdConfig} */
const tinybirdConfig = {
  include: ["lib/tinybird-schema.ts"],
  token: process.env.TINYBIRD_TOKEN,
  baseUrl: process.env.TINYBIRD_URL,
};

export default tinybirdConfig;
