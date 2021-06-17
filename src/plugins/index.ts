import { FastifyPluginAsync } from "fastify"
import fp from 'fastify-plugin'

import auth from "./auth"
import mongodb from "./mongodb"
import swagger from "./swagger"
import admin from "./admin"


const plugins: FastifyPluginAsync = async (fastify, options): Promise<void> => {
  await fastify.register(fp(auth))
  await fastify.register(fp(mongodb)) 
  await fastify.register(fp(swagger))
  await fastify.register(fp(admin))
}

export default plugins
