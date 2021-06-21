import { Room, Client, LocalClient, IRoomData } from "magx"
import { Mosx } from "mosx"

import { GameState, Player, GameContext, PlayerQueueIndex, GamePlayers } from "./engine"
import { onAuth, onDisconnect, onJoin, onLeave, onReconnect, onSurrender } from "./events"
import { getSettingsDocument, getUserDocument } from "../../lib/common"
import { JokerPlayer, JokerBoard, IUser } from "./types"
import { createBot } from "./bot"

import * as actions from "./actions"
import * as phases from "./phases"

type GameClient = Client<any>

export interface IJokerPlayers extends GamePlayers<JokerPlayer> {
  active: PlayerQueueIndex<JokerPlayer>
  dealer: PlayerQueueIndex<JokerPlayer>
  def: PlayerQueueIndex<JokerPlayer>
}

export class JokerRoom extends Room<GameState<any>> {
  public context: GameContext<JokerPlayer, JokerBoard> | null = null
  public reconnectionTimeout!: number

  constructor(roomData: IRoomData) {
    super(roomData)
    this.id = Math.random().toString(32).slice(3)
  }

  public async onCreate(params: any) {
    // create context
    const engine = { phases, actions, roles: ["active", "dealer"] }
    const state = new GameState<JokerBoard>(JokerBoard, params.options)

    this.context = new GameContext(engine, state, this.id)
    const settings = await getSettingsDocument()

    this.context.options = { ...settings.gameOptions, ...params.options }

    this.reconnectionTimeout = settings.reconnectionTimeout || 0

    this.context.on("player_dropped", (player: Player) => {
      const client = this.clients.get(player.clientId)
      if (client) {
        client.terminate(1000, "Dropped from room")
      }
    })

    this.context.on("update_data", (data) => {
      this.data = { ...this.data, ...data }
      if (this.clients.size) {
        this.updateCache()
      }
    })

    this.context.on("lock", () => {
      !this.locked && this.lock()
    })

    this.context.on("unlock", () => {
      this.locked && this.unlock()
    })

    this.context.on("log", (data: any) => {
      this.broadcast("log", data)
    })

    // save game options to room's data
    this.context.emit("update_data", { ...params.options, password: !!params.options.password })
  }

  // create game state
  public createState() {
    if (!this.context) {
      throw new Error(`Cannot create state - GameEngine is not defined`)
    }
    return this.context.state
  }

  public createPatchTracker() {
    return Mosx.createTracker(this.state)
  }

  public onMessage(client: GameClient, type: string, data: any) {
    const playerId = this.state.clients.get(client.id)
    if (!playerId || !this.context) { return }
    const player = this.state.objects.get(playerId) as JokerPlayer

    switch (type) {
      case "addbot":
        return this.addBot()
      case "action":
        if (!player.actions.has(data.actionId)) { return }
        return this.context.execPlayerAction(player, data.actionId, data.params)
      case "surrender":
        return onSurrender(this.context, player)
    }
  }

  public async onAuth(sessionId: string, options: any) {
    if (!this.context) {
      throw new Error(`Engine not defined`)
    }

    // get user data
    const user = sessionId ? await getUserDocument(sessionId) : null

    if (user) {
      await onAuth(this.context, user, options)
    }

    // check free space
    if (this.clients.size >= this.context.options.players) {
      throw new Error("Room is full")
    }

    return user as any
  }

  public async onJoin(client: Client, options: any, user: IUser | null = null) {
    if (!this.context) {
      throw new Error(`Engine not defined`)
    }

    // find free place
    const players: any[] = new Array(this.context.options.players)
    this.state.clients.forEach((id) => {
      const p = this.state.objects.get(id) as JokerPlayer
      players[p.index] = p
    })
    const index = players.findIndex((p) => !p)

    const params = { auth: client.auth, user, options, index }
    const player = new JokerPlayer(this.state, undefined, params)

    // add client to state
    this.state.addClient(client.id, player.id)

    try {
      // notify about new player
      await onJoin(this.context, player, options)
    } catch (error) {
      this.state.removeClient(client.id)
      this.state.objects.delete(player.id)
      throw new Error(error)
    }

    // save user name to room's data
    if (user) {
      this.context.emit("update_data", { users: { ...this.data.users, [client.auth.id]: user.name } })
    }

    Mosx.addTag(player, client.id)
    Mosx.setParent(player, this.state)

    // this.updateTrackingParams(client, { tags: client.id, serializer: "mpack" })
    this.updateTrackingParams(client, { tags: client.id })
  }

  public async onLeave(client: Client, consented?: boolean) {
    const playerId = this.state.clients.get(client.id)

    if (!playerId || !this.context) { return }

    const player = this.state.objects.get(playerId) as JokerPlayer
    player.connected = false
    await onDisconnect(this.context, player)

    if (!consented && this.reconnectionTimeout > 0) {
      try {
        await this.waitReconnection(client, this.reconnectionTimeout)
        player.connected = true
        onReconnect(this.context, player)
        return
      } catch (error) { }
    }

    await onLeave(this.context, player)
    this.state.removeClient(client.id)
    this.state.objects.delete(playerId)
  }

  public onClose() {
    this.context && this.context.emit("room_close")
  }

  public addBot() {
    if (!this.context) { return }
    const id = Math.random().toString(32).slice(3)

    const client = new LocalClient(this, { id })

    this.onJoin(client, this.context.options)

    createBot(this.context, client)
  }
}
