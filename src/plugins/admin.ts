import { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'

const plugin: FastifyPluginAsync = async (fastify, options) => {
  fastify.get('/admin*', { schema: { hide: true } }, (req: any, reply: any) => {
    return reply.sendFile('/admin.html')
  })
  fastify.get('/*', { schema: { hide: true } }, (req: any, reply: any) => {
    return reply.sendFile('/index.html')
  })
}

export default fp(plugin, '3.x')
