import { addPlaceAction, debuglog, removeAction, cardSuit } from "./common"
import { Card, Container, IAction } from "./engine/types"
import { onReadyAction } from "./events"
import { JokerContext, JokerPlayer } from "./types"

/**
 * place change action handler
 */

export const place = (ctx: JokerContext, player: JokerPlayer, action: IAction) => {
  const index = player.index
  player.index = action.data

  const players: JokerPlayer[] = new Array(ctx.options.players)
  ctx.state.clients.forEach((id) => {
    const p = ctx.state.objects.get(id) as JokerPlayer
    players[p.index] = p
  })

  players.forEach((p) => {
    // remove action with old index
    const actions = Array.from(p.actions.values())
    const a = actions.find(({ data }) => data === action.data)
    if (a) {
      removeAction(ctx, p, a.id)
    }

    // add action
    addPlaceAction(ctx, p, index)
  })
}

/**
 * card move action andler
 */

export const move = async (ctx: JokerContext, actionPlayer: JokerPlayer, moveAction: IAction) => {
  const { active } = ctx.roles
  const { objectId, destId } = moveAction.data

  // move card
  const card = ctx.state.objects.get(objectId) as Card
  const dest = ctx.state.objects.get(destId) as Container
  const owner = card.owner as Container
  owner.move(card.id, dest)

  // save prev actions
  await ctx.next("savePrevActions")

  // log action
  debuglog(ctx, actionPlayer, `move card ${card.face.value}${cardSuit(card)}`)

  // allow support
  if (active.player === actionPlayer && !actionPlayer.hand.cards.length && ctx.data.phase === "active") {
    ctx.data.phase = "support"
  }

  // update players actions
  active.forEach(async (player) => {
    // update actions
    await ctx.next("updateActions", player, moveAction)
  })

  const { deck, trumpSlot } = ctx.state.board

  // check if player win
  if (!actionPlayer.hand.cards.length && !deck.cards.length && !trumpSlot.cards.length) {
    // player win
    const queue = ctx.players.addPlayer(actionPlayer, "win")
    await ctx.next("setWinner", actionPlayer, queue.length)

    // check if end game
    if (ctx.players.inGroup("win").length === ctx.options.players - 1) {
      ctx.actionsData && ctx.actionsData.resolve(null)
      ctx.players.forEach((p) => {
        p.timer.stop()
        p.removeActions()
      })
      ctx.data.phase = "endTurn"
      // reset all actions
      return
    }

  }

  // check if end turn
  return ctx.next("checkEndTurn")
}

/**
 * pass action handler
 */

export const pass = async (ctx: JokerContext, actionPlayer: JokerPlayer, passAction: IAction) => {
  const { def, active } = ctx.roles

  if (passAction.playerId === def.player.id) {
    await ctx.next("savePrevActions")
  }

  // log action
  debuglog(ctx, actionPlayer, "pass")

  active.forEach(async (p) => {
    // update actions
    await ctx.next("updateActions", p, passAction)
  })

  // check if end turn
  return ctx.next("checkEndTurn")
}

/***
 * button action handler
 */

export const button = async (ctx: JokerContext, player: JokerPlayer, action: IAction) => {

  if (action.data === "ready") {
    return onReadyAction(ctx, player)
  }
}
