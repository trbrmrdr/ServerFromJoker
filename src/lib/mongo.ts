import { Db, MongoClient, MongoClientOptions, ObjectId, Collection } from 'mongodb'

import { config } from '../config'
import { IGame, ISetting, ITournament, IUser } from '../schemas'

export * from 'mongodb'

// global db link
export let db: Db
export let client: MongoClient

ObjectId.prototype.valueOf = function () {
  return this.toString()
}

export interface Collections {
  Users: Collection
  Games: Collection
  Tournaments: Collection
  Settings: Collection
}

export function collections(): Collections {
  if (!db) {
    throw new Error("MongoDb not connected")
  }

  return {
    Users: db.collection<IUser>("users"),
    Games: db.collection<IGame>("games"),
    Settings: db.collection<ISetting>("settings"),
    Tournaments: db.collection<ITournament>("tournaments"),
  } 
}

export const connect = async (params: MongoClientOptions = {}) => {
  client = await MongoClient.connect(config.mongoUrl, {
    keepAlive: true,
    useUnifiedTopology: true,
    useNewUrlParser: true,
    ...params
  })
  db = client.db()

  return db
}
