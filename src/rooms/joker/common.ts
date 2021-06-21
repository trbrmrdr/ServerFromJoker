import { cardRank, JokerContext, JokerPlayer } from "./types"
import { Card, PlayerAction } from "./engine/types"

export const rand = (max: number, min = 0) => Math.floor(Math.random() * (max - min + 1)) + min
export const cardValue = (card: Card) => cardRank.length - cardRank.indexOf(card.face.value)
export const cardSuit = (card: Card) => ["\u2660", "\u2663", "\u2665", "\u2666"][card.face.suit]

export const debuglog = (ctx: JokerContext, player: JokerPlayer, message: string) => {
  if (!player) { return }
  const role = player === ctx.roles.def.player ? "def" : "active"
  const msg = `${ctx.gameId}: ${player.user.name} [${role}]: ${message}`
  ctx.emit("log", msg)
  console.log(msg)
}

export const cardText = (card: Card) => {
  return `${card.face.value}${["\u2660", "\u2663", "\u2665", "\u2666"][card.face.suit]}`
}

export const debugUpdateAction = (ctx: JokerContext, player: JokerPlayer, update: string, action?: PlayerAction) => {
  let msg = ""

  if (!action) {
    msg = `remove all actions`
  } else if (action.name === "place") {
    msg = `${update === "add" ? "added" : "removed"} [place] acion (${action.id}) from slot ${player.index} to ${action.data}`
  } else {
    const { id, name, data } = action
    const card = ctx.state.objects.get(data.objectId) as Card

    msg = `${update === "add" ? "added" : "removed"} [${name}] action (${id}) for card: ${cardText(card)}`
  }
  debuglog(ctx, player, msg)
}

export const addPassAction = (ctx: JokerContext, player: JokerPlayer) => {
  if (!player.hand.cards.length) { return }
  const action = player.addAction("button", "pass")
  debugUpdateAction(ctx, player, "add", action)
}

export const addMoveAction = (ctx: JokerContext, player: JokerPlayer,
                              objectId: string, destId: string, params: any = {}) => {
  const action = player.addAction("move", { objectId, destId, ...params })
  debugUpdateAction(ctx, player, "add", action)
}

export const addPlaceAction = (ctx: JokerContext, player: JokerPlayer, index: number) => {
  const action = player.addAction("place", index)
  debugUpdateAction(ctx, player, "add", action)
}

export const removeAction = (ctx: JokerContext, player: JokerPlayer, actionId: string) => {
  const action = player.actions.get(actionId)
  if (!action) { return }
  player.removeAction(actionId)
  debugUpdateAction(ctx, player, "remove", action)
}

export const removeActions = (ctx: JokerContext, player: JokerPlayer) => {
  player.removeActions()
  debugUpdateAction(ctx, player, "remove")
}
