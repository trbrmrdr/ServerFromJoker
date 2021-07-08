import { JokerContext, JokerPlayer, IJokerOptions, JokerClient } from "./types"
import { addPlaceAction, debuglog } from "./common"

export const onJoinRoom = async (ctx: JokerContext, client: JokerClient, options: IJokerOptions) => {

  // check password
  if (ctx.options.password && (!options || ctx.options.password !== options.password)) {
    throw new Error("Wrong password")
  }


}

/**
 * On player take place in room
 * @param ctx - game context
 * @param client - 
 * @param options - joined options
 */
export const onTakePlace = async (ctx: JokerContext, client: JokerClient, data: any) => {

  // check credits
  // if (ctx.options.bet > client.balance) {
  //   throw new Error("Not enough credits")
  // }
  // check if real players
  // if (player.userRef) {
    // TODO block money
  // }

  // find free place
  // const players: any[] = new Array(ctx.options.players)
  // ctx.state.clients.forEach(({ player }) => {
  //   if (!player) { return }
  //   players[player.index] = player
  // })


}

/**
 * On player push ready button
 */
export const onReadyAction = async (ctx: JokerContext, player: JokerPlayer) => {
  // stop timer and remove player's actions
  player.timer.stop()
  player.removeActions()
  debuglog(ctx, player, `stop timer`)

  // start game flow if all players are ready
  if (ctx.players.filter((p) => !!p).length === ctx.options.players) {
    await ctx.next("gameFlow")
  }
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
    return ctx.next("gameOver", player) 
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
    return ctx.next("gameOver", player)
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
    await ctx.next("gameOver", player)
  }

  // reset all players if count down started
  if (ctx.state.board.scene === "init") {
    for (const { player } of ctx.state.clients.values()) {
      if (!player) { continue }
      player.timer.stop()
      player.removeActions()

      // add place action
      addPlaceAction(ctx, player, player.index)
    }
    ctx.state.objects.delete(player.id)

    // clear players list
    return ctx.players.clear()
  }

  // remove player from list
  if (index >= 0) {
    ctx.players.splice(index, 1)
  }
}
