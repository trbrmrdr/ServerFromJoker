import { JokerContext } from "../types"


export const endRound = async (ctx: JokerContext) => {

  await ctx.delay(ctx.options.endTurnDelay)

  // TODO
}
