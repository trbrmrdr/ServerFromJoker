import { getUserDocument } from "../../lib/common"
import { JokerContext, JokerPlayer, IJokerOptions, IUser } from "./types"
import { addPlaceAction, debuglog, removeAction } from "./common"
import { IAction } from "./engine/types"

export const onAuth = async (ctx: JokerContext, user: IUser, options: IJokerOptions) => {

  // check password
  if (ctx.options.password && (!options || ctx.options.password !== options.password)
    && !ctx.state.board.invites.includes(user.id)) {
    throw new Error("Wrong password")
  }

  // check credits
  if (ctx.options.bet > user.balance) {
    throw new Error("Not enough credits")
  }
}

/**
 * On player joined the room
 * @param ctx - game context
 * @param player - joined player
 * @param options - joined options
 */
export const onJoin = async (ctx: JokerContext, player: JokerPlayer, options: IJokerOptions) => {

  // check if real players
  if (player.userRef) {
    // TODO block money
  }

  // find free place
  const players: any[] = new Array(ctx.options.players)
  ctx.state.clients.forEach((id) => {
    const p = ctx.state.objects.get(id) as JokerPlayer
    players[p.index] = p
  })

  // add open action if room with password
  if (ctx.options.password) {
    player.addAction("button", "open")
  }

  // update place actions
  players.forEach((p) => {
    if (!p) { return }

    if (p === player) {
      // add actions
      for (let i = 0; i < ctx.options.players; i++) {
        !players[i] && addPlaceAction(ctx, p, i)
      }
    } else {
      // remove action with index
      const actions: IAction[] = Array.from(p.actions.values())
      const action = actions.find(({ data }) => data === player.index)
      if (action) {
        removeAction(ctx, p, action.id)
      }
    }
  })

  // if all players in room start game phase
  if (ctx.state.clients.size === ctx.options.players) {
    ctx.emit("lock")

    if (ctx.state.board.scene !== "init") { return }
    return ctx.next("startGame")
  }
}

/**
 * On player push ready button
 */
export const onReadyAction = async (ctx: JokerContext, player: JokerPlayer) => {
  // stop timer and remove player's actions
  player.timer.stop()
  player.removeActions()
  debuglog(ctx, player, `stop timer`)

  // add player to players list
  ctx.players[player.index] = player

  // start game flow if all players are ready
  if (ctx.players.filter((p) => !!p).length === ctx.options.players) {
    await ctx.next("gameFlow")
  }
}

/**
 * On invite friend
 * @param ctx - game context
 * @param player - player who invited friend
 * @param userId - user id of invited player
 */
export const onInvite = async (ctx: JokerContext, player: JokerPlayer, userId: string) => {
  // find user
  const user = await getUserDocument(userId)
  if (!user) { return }

  const { board } = ctx.state

  // add user to invited list in room's data
  const list = new Set(...(ctx.options.invites || "").split(";"))
  list.add(userId)
  if (!board.invites.includes(userId)) {
    board.invites.push(userId)
  }
  const invites = [...list.values()].join(";")
  ctx.emit("update_data", { ...board.options, invites, password: !!ctx.options.password })
}

/**
 * On player disconnected
 * @param ctx - game context
 * @param player - disconnected player
 */
export const onDisconnect = (ctx: JokerContext, player: JokerPlayer) => {

  // check if player is in game
  const index = ctx.players.indexOf(player)
  if (ctx.state.board.scene !== "game" || index < 0) { return }

  // reset all player's timers
  ctx.players.forEach((p) => {
    if (p.timer.value > 0) {
      p.timer.value = ctx.options.fast ? ctx.options.fastGameTimer : (ctx.options.timer || ctx.options.normalGameTimer)
    }
  })
}

export const onReconnect = async (ctx: JokerContext, player: JokerPlayer) => {
  console.log(`player reconnected`)

  // check if player is in game
  const index = ctx.players.indexOf(player)
  if (ctx.state.board.scene !== "game" || index < 0) { return }

  // check if player out of reconnection limit
  if (++player.reconnectCount >  ctx.options.reconnectionlimit) {
    return ctx.next("setJoker", player)
  }

  // reset all player's timers
  ctx.players.forEach((p) => {
    if (p.timer.value > 0) {
      p.timer.value = ctx.options.fast ? ctx.options.fastGameTimer : (ctx.options.timer || ctx.options.normalGameTimer)
    }
  })
}

/**
 * On player surrender
 * @param ctx - game context
 * @param player - surrendered player
 */
export const onSurrender = async (ctx: JokerContext, player: JokerPlayer) => {
  console.log(`player surrendered`)

  // check if player is in game
  const index = ctx.players.indexOf(player)
  if (ctx.state.board.scene === "game" && index >= 0 && ctx.players.notInGroup("win").includes(player)) {
    // end game
    return ctx.next("setJoker", player)
  } else {
    // drop player from room
    ctx.emit("player_dropped", player)
  }
}

/**
 * On player leave the room
 * @param ctx - game context
 * @param player - player
 */
export const onLeave = async (ctx: JokerContext, player: JokerPlayer) => {
  console.log(`player leaved`)

  // check if real players
  if (player.userRef) {
    // TODO return money
  }

  // check if player in game
  const index = ctx.players.indexOf(player)
  if (ctx.state.board.scene === "game" && index >= 0 && ctx.players.notInGroup("win").includes(player)) {
    // end game
    await ctx.next("setJoker", player)
  }

  // reset all players if count down started
  if (ctx.state.board.scene === "init") {
    for (const playerId of ctx.state.clients.values()) {
      const p = ctx.state.objects.get(playerId) as JokerPlayer
      p.timer.stop()
      p.removeActions()

      // add place action
      addPlaceAction(ctx, p, player.index)
    }
    // unlock room
    ctx.emit("unlock")
    ctx.state.objects.delete(player.id)

    // clear players list
    return ctx.players.clear()
  }

  // remove player from list
  if (index >= 0) {
    ctx.players.splice(index, 1)
  }
}
