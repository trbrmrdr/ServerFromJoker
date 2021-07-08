import { JokerContext } from "../types"
import { debuglog } from "../common"

const endRoundDelay = 3

export const gameFlow = async (ctx: JokerContext) => {
  const { board } = ctx.state
  board.scene = "initGame"
  debuglog(ctx, ctx.roles.active.player, `>> init game`)
  
  // init game phase
  await ctx.next("initGame")
  // game cycle
  for (let bullet = 0; bullet < 4; bullet ++) {
    board.bullet = bullet + 1
    const rounds = bullet % 2 ? 4 : 8
    for (let round = 0; round < rounds; round ++) {
      if (ctx.data.phase === "endGame") { continue }
      board.round = round + 1
      board.scene = "gameRound"
      debuglog(ctx, ctx.roles.active.player, `>> game round`)
      
      await ctx.next("roundFlow")
      
      if (ctx.data.phase === "endGame") { continue }
  
      board.scene = "gameScore"
      debuglog(ctx, ctx.roles.active.player, `>> end round`)
      await ctx.delay(endRoundDelay)  
    }    
  }
  board.scene = "endGame"
  debuglog(ctx, ctx.roles.active.player, `>> end game`)
  return ctx.next("endGame", ctx.players[0])
}
