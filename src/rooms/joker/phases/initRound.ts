import { debuglog, rand } from "../common"
import { Container } from "../engine/types"
import { JokerContext } from "../types"

export const initRound = async (ctx: JokerContext) => {
  // clear players status and timer
  ctx.players.forEach((player) => {
    player.tricks = 0
    player.bid = -1
  })

  const { deck } = ctx.state.board

  // move all cards to deck
  ctx.state.objects.forEach((obj) => {
    if (obj.type === "Card" && obj.owner !== deck) {
      const container = obj.owner as Container
      container.move(obj.id, deck)
    }
  })

  // shuffle cards
  debuglog(ctx, ctx.roles.active.player, `>> shuffle cards`)
  ctx.state.board.deck.shuffle()
  
  // select dealer
  ctx.roles.active.index = rand(3)


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

  if (ctx.data.phase === "endGame") { return }

  await ctx.delay(ctx.options.initGameDelay)
}
