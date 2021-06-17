import Agenda from "agenda"
import { Db } from "mongodb"

export let agenda: Agenda

export const startAgenda = async (db: Db) => {
  agenda = new Agenda({ mongo: db })
  // define agenda jobs
  // await agenda.define("jobName", { lockLifetime: 1000 }, job)

  await agenda.start()
  return agenda
}
