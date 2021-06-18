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

export const settingsSchema = Type.Object({
  _id: Type.Any({ format: "ObjectId" }),
  waitTime: Type.Number({ description: "Wait time in seconds"}),
  turnTime: Type.Number({ description: "Turn time in seconds" }),
  
  reconnectionTimeout: Type.Number({ description: "Reconnection timeout in seconds" }),
  reconnectionLimit: Type.Number({ description: "Reconnection limit" }),
  reconnectionDeleay: Type.Number({ description: "Extra turn time after reconnnection" }),
}, {
	$id: "settings",
	name: "Settings",
})

export type ISetting = Static<typeof settingsSchema>

export const tournamentSchema = Type.Object({
  _id: Type.Any({ format: "Object Id" }),
  name: Type.String({ description: "Tournament name"}),
  createdAt: Type.Any({ format: "date-time" }),
  maxPlayers: Type.Number({ description: "Tournament max players" }),
  
  registrationFee: Type.Number({ description: "" }),
  totalAward: Type.Number({ description: "Total award" }),
  awardDistribution: Type.Array(Type.Number(), { description: "Award distribution in % among 4 players" }),

  startTime: Type.Any({ format: "date-time" }),
  repeatEvery: Type.Number({ description: "Repeat tournament after N seconds" }),
  roundDuration: Type.Number({ description: "Round duration in seconds" }),
  registrationDuration: Type.Number({ description: "Registration duration in seconds" }),

  requiredPlayers: Type.Number({ description: "% of required players to start" }),
  autoDuplicate: Type.Boolean({ description: "Create copy if full" }),
}, {
	$id: "tournament",
	name: "Tournament",
})

export type ITournament = Static<typeof tournamentSchema>

export const gameSchema = Type.Object({
  _id: Type.Any({ format: "ObjectId" }),
  searchId: Type.String({ description: "" }),
  name: Type.String({ description: "Tournament name"}),
  createdAt: Type.Any({ format: "date-time" }),
  startedAt: Type.Any({ format: "date-time" }),
  
  players: Type.Array(Type.String(), { description: "Players" }),
  type: Type.String({ description: "tornament | normal" }),
  password: Type.Array(Type.Number(), { description: "Room password ??" }),

  bet: Type.Number({ description: "Game bet" }),
  result: Type.Array(Type.Array(Type.Number()), { description: "Game result" }),
  logs: Type.Array(Type.Any(), { description: "Game turn logs"}),
}, {
	$id: "game",
	name: "Game",
})

export type IGame = Static<typeof gameSchema>