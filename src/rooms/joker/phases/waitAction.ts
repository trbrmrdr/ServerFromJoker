import { JokerContext, JokerPlayer, JokerBoard } from "../types"
import { IPlayerActionOption } from "../engine/context"

export const waitAction = async (ctx: JokerContext) => {
  const activePlayers: IPlayerActionOption<JokerPlayer, JokerBoard>[] = []

  if (!activePlayers.length) {
    ctx.data.phase = "endTurn"
  } else {
    await ctx.waitPlayerAction(activePlayers)
  }
}
