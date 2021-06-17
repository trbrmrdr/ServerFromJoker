import 'dotenv/config'
import fastify from 'fastify'
import closeWithGrace from "close-with-grace"

import { logger } from './lib/logger'
import { config } from "./config"
import app from "./app"

const server = fastify({ logger })

server.register(app)

// delay is the number of milliseconds for the graceful close to finish
const closeListeners = closeWithGrace({ delay: 500 }, async ({ err }: any) => {
  if (err) {
    logger.error(err)
  }
  await server.close()
})

server.addHook('onClose', async (instance, done) => {
  closeListeners.uninstall()
  done()
})

server.listen(process.env.PORT || config.port, (err, address) => {
  if (err) {
    logger.error(err)
    process.exit(1)
  }
})
