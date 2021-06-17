import $ from "../lib/config"

export const config = { 
  // server
  nodeEnv: $("NODE_ENV", String, "dev"),
  port: $("SERVER_PORT", Number, 3000),
  baseUrl: $("BASE_URL"),
  logLevel: $("LOG_LEVEL", String, "info"),

  // agenda 
  reminderInviteDelay: $("REMINDER_INVITE_DELAY", Number, 3 * 24 * 60 * 60 * 1000), // 3 days
  checkNewMatchesInterval: $("CHECK_NEW_MATCHES_INTERVAL", String, "3 minutes"),

  // mongodb
  mongoUrl: $("MONGO_URL"),
  mongoTestUrl: $("MONGO_TEST_URL"),

  // redis
  redisUrl: $("REDIS_ENDPOINT"),

  // sendgrid
  // sendgridApiKey: $("SENDGRID_API_KEY"), 
  // sendgridEmailFrom: $("SENDGRID_EMAIL_FROM"), 

} as const

export * from "./messages"
export * from "./defaults"