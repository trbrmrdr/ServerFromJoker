import { debuglog, cardSuit } from "./common"
import { Card, Container, IAction } from "./engine/types"
import { onReadyAction } from "./events"
import { JokerContext, JokerPlayer } from "./types"

/**
 * card move action andler
 */

export const move = async (ctx: JokerContext, actionPlayer: JokerPlayer, moveAction: IAction) => {
  const { objectId, destId } = moveAction.data

  // move card
  const card = ctx.state.objects.get(objectId) as Card
  const dest = ctx.state.objects.get(destId) as Container
  const owner = card.owner as Container
  owner.move(card.id, dest)

  // log action
  debuglog(ctx, actionPlayer, `move card ${card.face.value}${cardSuit(card)}`)
  actionPlayer.removeActions()
  actionPlayer.timer.stop()
}

/**
 * setTrump action handler
 */

export const setTrump = async (ctx: JokerContext, actionPlayer: JokerPlayer, action: IAction) => {
  actionPlayer.removeActions()
  ctx.state.board.trump.suit = action.data
  actionPlayer.timer.stop()
  actionPlayer.dialog = ""
}

/**
 * setBid action handler
 */

export const setBid = async (ctx: JokerContext, actionPlayer: JokerPlayer, action: IAction) => {
  actionPlayer.removeActions()
  actionPlayer.bid = action.data
  actionPlayer.timer.stop()
  actionPlayer.dialog = ""
}

/**
 * setJoker action handler
 */

export const setJoker = async (ctx: JokerContext, actionPlayer: JokerPlayer, action: IAction) => {
  actionPlayer.removeActions()
  actionPlayer.joker = action.data
  actionPlayer.timer.stop()
  actionPlayer.dialog = ""
}

/***
 * button action handler
 */

export const button = async (ctx: JokerContext, player: JokerPlayer, action: IAction) => {

  if (action.data === "ready") {
    return onReadyAction(ctx, player)
  }
}
