import dotenv from 'dotenv'
import fs from "fs"

// function getEnvParam(name: string): string
function getEnvParam(name: string, type: NumberConstructor, def?: number): number
function getEnvParam(name: string, type?: StringConstructor, def?: string): string
function getEnvParam(name: string, type: BooleanConstructor, def?: boolean): boolean
function getEnvParam(name: string, type?: NumberConstructor | StringConstructor | BooleanConstructor, def?: any): string | boolean | number {
  if (def === undefined && !(name in process.env)) {
    throw new Error(`Missing env variable: ${name}`)
  }

  const envVar: any = process.env[name] || def

  if (type) {
    if (type === Number && typeof envVar !== "number") {
      if (isNaN(envVar * 1)) {
        throw new Error(`Env variable ${name} must be number`)
      }
      return envVar * 1
    }

    if (type === Boolean && typeof envVar !== "boolean") {
      const bool = envVar?.toLowerCase()
      if (bool !== "true" && bool !== "false") {
        throw new Error(`Env variable ${name} must be "true" or "false"`)
      }
      return bool === "true"
    }
  }

  return envVar
}


export const setupEnvParams = () => {
  if (process.env.NODE_ENV) {
    try {
      const envConfig = dotenv.parse(fs.readFileSync(`env/.${process.env.NODE_ENV}.env`))
      process.env = { ...process.env, ...envConfig }
    } catch (error) {
      dotenv.config()
    }
  } else {
    dotenv.config()
  }
}

export const $ = getEnvParam
export default getEnvParam
