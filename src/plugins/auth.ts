import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import fp from 'fastify-plugin'


const auth: FastifyPluginAsync = async (fastify, options) => {

  fastify.decorate('authenticated', async (request: FastifyRequest, reply: FastifyReply) => {
    // const { authorization } = request.headers
    // const token = authorization?.split(' ')[1]
    // if (!token) { return reply.status(401).send("Token required") }

    // const [ error, user ] = await validateToken({ token }, request.log)
   
    // if (error) {
    //   return reply.status(error.status || 401).send(error.message)
    // }

    // request.user = user
  })

  // fastify.decorate('admin', async (request: FastifyRequest, reply: FastifyReply) => {
  //   const { authorization } = request.headers

  //   const token = authorization?.split(' ')[1]
  //   if (!token) { return reply.status(401).send("Token required") }

  //   try {
  //     const decodedToken: any = await firebase.validateFireBaseToken(token)
  //     if (typeof decodedToken !== "object" || !decodedToken.uid) { 
  //       return reply.status(401).send("Unathorized")
  //     }
  //   } catch (error) {
  //     return reply.status(401).send("Unathorized")
  //   }
  // })
}

export default fp(auth, '3.x')

declare module 'fastify' {
  export interface FastifyInstance {
    authenticated(): string
    admin(): string
  }

  export interface FastifyRequest {
    user: any // TODO
  }
}
