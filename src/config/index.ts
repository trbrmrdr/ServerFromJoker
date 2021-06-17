import $ from "../lib/config"

export const config = { 
  // server
  nodeEnv: $("NODE_ENV", String, "dev"),
  port: $("PORT", Number, 3000),
  host: $("HOST", String, "::"),
  baseUrl: $("BASE_URL"),
  logLevel: $("LOG_LEVEL", String, "info"),

  // agenda 
  // mongodb
  mongoUrl: $("MONGO_URL"),
  mongoTestUrl: $("MONGO_TEST_URL"),

  // redis
  redisUrl: $("REDIS_ENDPOINT"),

  // sendgrid
  // sendgridApiKey: $("SENDGRID_API_KEY", String, ""), 
  // sendgridEmailFrom: $("SENDGRID_EMAIL_FROM", String, ""), 

} as const

export * from "./messages"
export * from "./defaults"