import { JokerContext, JokerPlayer } from "../types"

export const endGame = async (ctx: JokerContext) => {
  const { board } = ctx.state

  board.scene = "end"

  await ctx.delay(ctx.options.endGameDelay)

  ctx.players.groups.clear()

  board.trumpSlot.moveAll(board.deck)
  board.trump.suit = -1
 
  ctx.players.forEach((p) => {
    p.cardSlot.moveAll(board.deck)
    p.hand.moveAll(board.deck)
    p.trash.moveAll(board.deck)
  })

  board.scene = "init"

  if (ctx.state.clients.size < ctx.options.players) {

    for (const playerId of ctx.state.clients.values()) {
      const p = ctx.state.objects.get(playerId) as JokerPlayer
      p.timer.stop()
    }
    // unlock room
    ctx.emit("unlock")

  } else {
    return ctx.next("startGame")
  }
}
