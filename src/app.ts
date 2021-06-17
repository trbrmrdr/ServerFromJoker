import 'dotenv/config'
import { AutoloadPluginOptions } from 'fastify-autoload'
import { FastifyPluginAsync } from 'fastify'
import serve from "fastify-static"
import fp from 'fastify-plugin'
import { join } from 'path'

import plugins from './plugins'

import { startAgenda } from './lib/agenda'
import { db } from './lib/mongo'

// import validation from "./lib/validation"

export type AppOptions = {
  // Place your custom options for app below here.
} & Partial<AutoloadPluginOptions>

const app: FastifyPluginAsync<AppOptions> = async (fastify): Promise<void> => {
  // add schemas to swagger doc
  // for (const schema in schemas) {
  //   fastify.addSchema((schemas as any)[schema])
  // }

  // TODO [backlog] add validation
  // fastify.register(validation)
  
  // register plugins
  await fastify.register(fp(plugins))  
  // await fastify.register(AutoLoad, { dir: join(__dirname, 'plugins') })  

  startAgenda(db).then((agenda) => {
    // start check new mtches job
    fastify.log.info("Agenda started")
    // schedule agenda jobs

  })

  // init ws server
  // initSocketServer(fastify)
  
  // register web 
  fastify.register(serve, {
    root: join(__dirname, '/../public'),
    prefix: '/public/',
  })

  // register routes
  // fastify.register(AutoLoad, { dir: join(__dirname, 'routes') })
}

export default app
export { app }
