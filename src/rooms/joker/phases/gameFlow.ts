import { JokerContext } from "../types"
import { debuglog } from "../common"

export const gameFlow = async (ctx: JokerContext) => {
  ctx.state.board.scene = "game"
  debuglog(ctx, ctx.roles.active.player, `>> init game`)

  // init game phase
  await ctx.next("initGame")

  // game cycle
  while (ctx.data.phase !== "endGame" && ctx.state.board.round < 24) {
    debuglog(ctx, ctx.roles.active.player, `>> game round`)

    await ctx.next("roundFlow")

    if (ctx.data.phase === "endGame") { continue }
    debuglog(ctx, ctx.roles.active.player, `>> end round`)
    await ctx.next("endRound")
  }
  debuglog(ctx, ctx.roles.active.player, `>> end game`)
  return ctx.next("endGame", ctx.players[0])
}
