import { Room, Client, LocalClient, IRoomData } from "magx"
import { Mosx } from "mosx"

import { GameState, Player, GameContext, PlayerQueueIndex, GamePlayers } from "./engine"
import { onDisconnect, onJoinRoom, onLeave, onReconnect, onSurrender, onTakePlace } from "./events"
import { getSettingsDocument, getUserDocument } from "../../lib/common"
import { JokerPlayer, JokerBoard, IUser, JokerClient, JokerContext } from "./types"
import { createBot } from "./bot"

import * as actions from "./actions"
import * as phases from "./phases"

type GameClient = Client<any>

export interface IJokerPlayers extends GamePlayers<JokerPlayer> {
  active: PlayerQueueIndex<JokerPlayer>
  dealer: PlayerQueueIndex<JokerPlayer>
  initiator: PlayerQueueIndex<JokerPlayer>
}

export class JokerRoom extends Room<GameState<JokerBoard, JokerClient>> {
  public context: JokerContext | null = null
  public reconnectionTimeout!: number

  constructor(roomData: IRoomData) {
    super(roomData)
    this.id = Math.random().toString(32).slice(3)
  }

  public async onCreate(params: any) {
    // create context
    const engine = { phases, actions, roles: ["active", "dealer", "initiator"] }
    const state = new GameState(JokerBoard, params.options)

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
    const jokerClient = this.state.clients.get(client.id)

    if (!jokerClient) { return }
   
    switch (type) {
      case "place": 
        return this.takePlace(jokerClient, data)
      case "addbot":
        return this.addBot(data)
      case "leave":
        return this.leaveRoom(jokerClient)
      case "action":
        if (!jokerClient || !jokerClient.playerId || !this.context) { return }
        const player = this.state.objects.get(jokerClient.playerId) as JokerPlayer
  
        if (!player.actions.has(data.actionId)) { return }
        return this.context.execPlayerAction(player, data.actionId, data.params)
    }
  }

  public async onAuth(sessionId: string, options: any) {
    if (!this.context) {
      throw new Error(`Engine not defined`)
    }

    let user
    try {
      // get user data
      user = sessionId ? await getUserDocument(sessionId) : null
      
    } catch (error) {
      console.log(error)
      user = null
    }

    if (user) {
      await onJoinRoom(this.context, user, options)
    }

    return user as any
  }

  public async onJoin(client: Client, options: any, user?: IUser) {
    if (!this.context) {
      throw new Error(`Engine not defined`)
    }

    const jokerClient = new JokerClient(this.state, { user })

    // room host take place
    if (!this.state.clients.size) {
      this.takePlace(jokerClient, 0)
    }
        
    // add client to state
    this.state.addClient(client.id, jokerClient)
    
    // this.updateTrackingParams(client, { tags: client.id, serializer: "mpack" })
    this.updateTrackingParams(client, { tags: jokerClient.id })
  }

  public async onLeave(client: Client, consented?: boolean) {
    const jokerClient = this.state.clients.get(client.id)

    if (!jokerClient || !this.context) { return }

    if (!jokerClient.player) {
      return this.leaveRoom(jokerClient)
    }

    jokerClient.player.connected = false
    await onDisconnect(this.context, jokerClient.player)

    if (!consented && this.reconnectionTimeout > 0) {
      try {
        await this.waitReconnection(client, this.reconnectionTimeout)
        jokerClient.player.connected = true
        onReconnect(this.context, jokerClient.player)
        return
      } catch (error) { }
    }

    await onLeave(this.context, jokerClient.player)
    this.leaveRoom
    this.state.removeClient(client.id)
    this.state.objects.delete(jokerClient.playerId)
  }

  public onClose() {
    this.context && this.context.emit("room_close")
  }

  public async addBot(index: number) {
    if (!this.context) { return }
    const id = Math.random().toString(32).slice(3)

    const client = new LocalClient(this, { id })

    await this.onJoin(client, this.context.options)

    if (index === undefined) {
      const places = [0, 1, 2, 3]
      for (const [, { player }] of this.state.clients) {
        if (player) {
          places[player.index] = -1
        }
      }
      const freePlaces = places.filter((index) => index >= 0)
      if (freePlaces.length > 0) {
        index = freePlaces[0]
      } else {
        // no free places
        return 
      }
    }
    const jokerClient = this.state.clients.get(id)!
    // join game
    const player = new JokerPlayer(this.state, { clientId: jokerClient.id, index })
    jokerClient.playerId = player.id

    // save user name to room's data
    this.context.emit("update_data", { users: { ...this.data.users, [jokerClient.id]: jokerClient.name } })
    
    createBot(this.context, client)
    
    Mosx.addTag(player, jokerClient.id)
    Mosx.setParent(player, this.state)

    // count players
    let players = 0
    this.state.clients.forEach(({ player }) => players += player ? 1 : 0)
    
    // if all players took place start game
    if (players === 4) {
      this.context.emit("lock")

      return this.context.next("gameFlow")
    }

  }

  public async leaveRoom(client: JokerClient) {
    if (!this.context) { return }

    if (client.player) {
      await onSurrender(this.context, client.player)
    }

    this.state.removeClient(client.id)
  }

  public async takePlace(client: JokerClient, index: number) {
    if (!this.context) { return }

    // check if place is empty
    for (const [, { player }] of this.state.clients) {
      if (player && player.index === index) { return }
    }

    if (client.player) {
      // change place
      client.player.index = index
    } else {
      try {
        // notify about new player
        await onTakePlace(this.context, client, index)
      } catch (error) {
        return
      }
      // join game
      const player = new JokerPlayer(this.state, { clientId: client.id, index })
      client.playerId = player.id

      // save user name to room's data
      this.context.emit("update_data", { users: { ...this.data.users, [client.id]: client.name } })
      
      Mosx.addTag(player, client.id)
      Mosx.setParent(player, this.state)

      // count players
      let players = 0
      this.state.clients.forEach(({ player }) => players += player ? 1 : 0)
      
      // if all players took place start game
      if (players === 4) {
        this.context.emit("lock")

        return this.context.next("gameFlow")
      }
    }

  }
}
