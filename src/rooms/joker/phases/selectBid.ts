import { JokerContext } from "../types"

export const selectBid = async (ctx: JokerContext) => {
  const { active, initiator } = ctx.roles

  let totalBid = 0
  for (let i = 0; i < 4; i++) {
    const { player } = active
    let defAction = null
    for (let j = 0; j <= player.hand.cards.length; j++) {

      if (i === 3 && totalBid + j === player.hand.cards.length) { continue }

      const action = player.addAction("setBid", j)
      if (!defAction) {
        defAction = action
      }
    }
    player.dialog = "selectBid"

    await ctx.waitPlayerAction([{
      player,
      timeout: ctx.options.timer,
      timeoutActionId: defAction!.id
    }])

    totalBid += player.bid

    ctx.roles.active.moveNext()
  }

  initiator.player = active.player
}
