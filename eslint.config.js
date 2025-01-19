import config from "@echristian/eslint-config";

export default config({
  ignores: ["drizzle.config.ts"],
  reactHooks: {
    enabled: true,
  }
});
