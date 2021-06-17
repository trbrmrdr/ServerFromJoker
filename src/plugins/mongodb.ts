import { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'

import { connect } from '../lib/mongo'

const plugin: FastifyPluginAsync = async (fastify, options) => {
  try {
    await connect()
    fastify.log.info("MongoDb connected")
    
  } catch (error) {
    fastify.log.error("Cannot connect to MongoDb")
  }
}

export default fp(plugin, '3.x')
