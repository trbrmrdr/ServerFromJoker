// import Redis from 'ioredis'
// import { config } from '../config'
// import { logger } from './logger'

// export const redis = new Redis(config.redisUrl)

// export interface ICacheMethods<T> {
//   set: (data: T, expiryMode?: string | any[], time?: number | string, setMode?: number | string) => Promise<"OK" | null>,
//   hset: (key: string, value: T) => Promise<number>,
//   hget: (key: string) => Promise<T | null>,
//   get: () => Promise<T | null>
//   del: () => Promise<number>
//   ttl: () => Promise<number>
// }

// export const cacheHandler = <T>(key: string): ICacheMethods<T> => ({
//   hset: async (param, value) => redis.hset(key, param, JSON.stringify(value)),
//   hget: async (param) => {
//     const data = await redis.hget(key, param)
//     return data ? JSON.parse(data) : null
//   },

//   set: async (data, ...args) => redis.set(key, JSON.stringify(data), ...args),
//   get: async () => {
//     const data = await redis.get(key)
//     return data ? JSON.parse(data) : null
//   },
//   del: async () => redis.del(key),
//   ttl: async () => redis.ttl(key)
// })

// export interface IChannelMethods<T> {
//   channel: string
//   publish: (data: T) => Promise<any>
// }

// export const channelHandler = <T>(channel: string): IChannelMethods<T> => ({
//   channel,
//   publish: async (data: T) => {
//     logger.info({ data, channel }, "Redis: message in channel")
//     redis.publish(channel, JSON.stringify(data))
//   }
// })
