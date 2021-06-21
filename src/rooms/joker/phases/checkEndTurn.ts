import { removeActions } from "../common"
import { JokerContext } from "../types"

export const checkEndTurn = (ctx: JokerContext) => {

  let actionsCount = 0

  // if no action -> endTurn
  if (actionsCount <= 0) {
    ctx.players.forEach((player) => {
      removeActions(ctx, player)
    })
    ctx.data.phase = "endTurn"
  }
}
