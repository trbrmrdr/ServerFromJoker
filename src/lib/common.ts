import { collections, ObjectId } from "./mongo"
import * as defaults from "../config"

export const getSettingsDocument = async () => {
  const { Settings } = collections()

  const settings = await Settings.find().toArray()

  return settings[0] || defaults.settings
}

export const getUserDocument = async (id: string) => {
  const { Users } = collections()

  const user = await Users.findOne({ _id: new ObjectId(id) })

  return user
}