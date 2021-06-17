import { Db, MongoClient, MongoClientOptions, ObjectId, Collection } from 'mongodb'

import { config } from '../config'

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
    Users: db.collection("users"),
    Games: db.collection("games"),
    Settings: db.collection("settings"),
    Tournaments: db.collection("tournaments"),
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
