import { debuglog, rand } from "../common"
import { JokerContext } from "../types"

const dealDelay = 0.2
const initGameDelay = 3

export const initGame = async (ctx: JokerContext) => {

  ctx.players.clear()

  ctx.state.clients.forEach(({ player }) => {
    if (!player) { return }
    // add player to players list
    ctx.players[player.index] = player
    // clear players status and timer
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

      // update players index
      for (let i = 0; i < 4; i ++) {
        ctx.roles.active.player.index = i
        ctx.roles.active.moveNext()
      }
      
      debuglog(ctx, active, `>> player: ${active.clientId} is dealer`)
      break
    }
    ctx.roles.active.moveNext()
    await ctx.delay(dealDelay)
  }

  await ctx.delay(initGameDelay)
}
