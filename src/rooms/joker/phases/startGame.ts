import { JokerContext } from "../types"
import { removeActions } from "../common"

export const startGame = async (ctx: JokerContext) => {
  // remove players
  ctx.players.clear()

  ctx.data.phase = "init"

  for (const { player } of ctx.state.clients.values()) {
    if (!player) { continue }

    // check if player has enough credits
    if (player.clientId.length > 10) { // skip bots
      const user = player.userRef
      if (!user || user.balance < ctx.options.bet) {
        ctx.emit("player_dropped", player)
        continue
      }
    }

    // add ready action
    removeActions(ctx, player)
    player.addAction("button", "ready")

    // strat count down for readiness
    player.timer.start(ctx.options.waitTime, () => {
      ctx.emit("player_dropped", player)
    })
  }
}
