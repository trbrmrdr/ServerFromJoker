import pino from "pino"
import { config } from "../config"

export const logger = pino({
  prettyPrint: config.nodeEnv === "dev",
  level: config.logLevel
})
