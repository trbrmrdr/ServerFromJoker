import { debuglog, rand } from "../common"
import { JokerContext } from "../types"

export const initGame = async (ctx: JokerContext) => {
  // clear players status and timer
  ctx.players.forEach((player) => {
    player.tricks = 0
    player.bid = -1
  })

  // create deck
  debuglog(ctx, ctx.roles.active.player, `>> create deck`)
  if (!ctx.state.board.deck.cards.length) {
    ctx.state.board.createDeck()
  }

  // shuffle cards
  debuglog(ctx, ctx.roles.active.player, `>> shuffle cards`)
  ctx.state.board.deck.shuffle()
  
  // select dealer
  ctx.roles.active.index = rand(3)
  const { deck } = ctx.state.board

  while (deck.cards.length && ctx.data.phase !== "endGame") {
    const { player: active } = ctx.roles.active
    if (!active) { return }
    deck.moveTop(active.cardSlot)
    
    if (active.cardSlot.top.face.value === "A") {
      // set dealer
      ctx.roles.dealer.player = active
      ctx.roles.active.moveNext()
      
      debuglog(ctx, active, `>> player: ${active.user.name} is dealer`)
      break
    }
    await ctx.delay(ctx.options.dealDelay)
  }

  ctx.state.board.round = 1

  await ctx.delay(ctx.options.initGameDelay)
}
