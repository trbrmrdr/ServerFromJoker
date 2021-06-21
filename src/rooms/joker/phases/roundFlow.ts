import { JokerContext } from "../types"
import { debuglog } from "../common"

export const roundFlow = async (ctx: JokerContext) => {
  ctx.state.board.scene = "gameRound"
  debuglog(ctx, ctx.roles.active.player, `>> init game`)

  // init game phase
  await ctx.next("initRound")

  // game round cycle
  while (ctx.data.phase !== "endGame" && ctx.data.phase !== "endRound") {
    debuglog(ctx, ctx.roles.active.player, `>> game round`)


    // ctx.data.phase = "active"
    // await ctx.next("updateActions", ctx.roles.active.player)

    debuglog(ctx, ctx.roles.active.player, `>> wait for player action`)
    await ctx.next("waitAction")
 

    if (ctx.data.phase === "endGame") { continue }
  }
  debuglog(ctx, ctx.roles.active.player, `>> end game`)
  return ctx.next("endRound")
}
