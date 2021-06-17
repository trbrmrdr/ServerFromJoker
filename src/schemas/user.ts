import { Static, Type } from '@sinclair/typebox'

export const userSchema = Type.Object({
  _id: Type.Any({ format: "ObjectId" }),
  userId: Type.String({ description: "BC user id"}),
  createdAt: Type.Any({ format: "date-time" }),
  
  name: Type.String({ description: "User name" }),
  avatar: Type.String({ format: "url", description: "Avatar url" }),

  token: Type.String({ description: "BC token" }),
  
  
  email: Type.String({ format: "email" }),
  telegram: Type.Number({ description: "Telegram user Id"}),

}, {
	$id: "user",
	name: "User",
})

export type IUser = Static<typeof userSchema>
