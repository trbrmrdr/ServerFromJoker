import { debuglog, isJocker } from "../common"
import { Container } from "../engine/types"
import { JokerContext } from "../types"

const dealDelay = 0.2

export const initRound = async (ctx: JokerContext) => {
  const { deck, round, bullet, trump, trumpSlot, lastTrick } = ctx.state.board
  // clear players status and timer
  ctx.players.forEach((player) => {
    player.tricks = 0
    player.bid = -1
    player.jokerTrump = true
    lastTrick[player.index].suit = -1
    lastTrick[player.index].value = ""
  })

  trump.suit = -1

  // move all cards to deck
  ctx.state.objects.forEach((obj) => {
    if (obj.type === "Card" && obj.owner !== deck && obj.owner !== ctx.state.board) {
      const container = obj.owner as Container
      container.move(obj.id, deck)
    }
  })

  // shuffle cards
  debuglog(ctx, ctx.roles.active.player, `>> shuffle cards`)
  deck.shuffle()

  const roundCards = bullet % 2 ? (bullet > 1 ? 9 - round : round) : 9

  const { player: dealer } = ctx.roles.dealer
  ctx.roles.active.player = ctx.roles.dealer.next
  while (dealer.hand.cards.length < roundCards && deck.cards.length && ctx.data.phase !== "endGame") {
    if (ctx.data.phase === "endGame") { return }
    const { player: active, prev } = ctx.roles.active
    if (dealer.hand.cards.length === 3 && roundCards === 9 && prev === dealer) {
      const defAction = active.addAction("setTrump", 4)
      for (let i = 0; i < 4; i++) {
        active.addAction("setTrump", i)
      }
      
      active.dialog = "selectTrump"
      debuglog(ctx, ctx.roles.active.player, `>> wait for player action`)
      await ctx.waitPlayerAction([{
        player: active,
        timeout: ctx.options.timer,
        timeoutActionId: defAction.id
      }])
    }
    if (!active) { return }
    deck.moveTop(active.hand)
    debuglog(ctx, dealer, `>> move card from deck to player: ${active.clientId}`)
    ctx.roles.active.moveNext()
    await ctx.delay(dealDelay)
  }

  if (roundCards !== 9) {
    deck.moveTop(trumpSlot)
    if (isJocker(trumpSlot.cards[0])) {
      trump.suit = 4
    } else {
      trump.suit = trumpSlot.cards[0].face.suit
    }
  }

  if (ctx.data.phase === "endGame") { return }
}
