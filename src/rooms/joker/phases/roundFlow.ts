import { JokerContext, JokerPlayer } from "../types"
import { debuglog, isJocker, rand } from "../common"
import { Card } from "../engine"

const endTurnDelay = 3

const higherValue = (a: Card, b: Card) => {
  const score = ["6", "7", "8", "9", "10", "J", "Q", "K", "A", "X"]
  return score.indexOf(b.face.value) > score.indexOf(a.face.value)
}

const higherCard = (p1: JokerPlayer, p2: JokerPlayer, trump: number): boolean => {
  const a = p1.cardSlot.cards[0]
  const b = p2.cardSlot.cards[0]
  if (isJocker(a) && p1.joker.higher) {
    if (p1.joker.suit === trump || p1.joker.suit === 4) {
      return isJocker(b) && p2.joker.higher
    } else {
      return b.face.suit === trump || isJocker(b) && p2.joker.higher
    }
  }
  if (isJocker(b)) {
    return p2.joker.higher
  }
  if (a.face.suit === b.face.suit) {
    return higherValue(a,b)
  } 
  if (b.face.suit === trump) {
    return true
  }
  return false
}

export const roundFlow = async (ctx: JokerContext) => {
  ctx.state.board.scene = "gameRound"
  const { active, initiator } = ctx.roles
  const { board } = ctx.state

  debuglog(ctx, ctx.roles.active.player, `>> init game`)

  // init game phase
  await ctx.next("initRound")

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
  const steps = initiator.player.hand.cards.length
  const trump = ctx.state.board.trump.suit

  for (let step = 0; step < steps; step++) {
    for (let p = 0; p < 4; p++) {
      const { player } = active
      const initiatorCard = initiator.player.cardSlot.cards[0]

      let cards: Card[] = []
      if (initiator.player !== player) {
        if (isJocker(initiatorCard)) {
          if (initiator.player.joker.higher) {
            cards = player.hand.cards.filter((card) => !isJocker(card) && card.face.suit === initiator.player.joker.suit)
            if (cards.length) {
              cards = [cards.sort((c1, c2) => higherValue(c1, c2) ? 1 : -1)[0]]
            } else {
              cards = player.hand.cards.filter((card) => card.face.suit === trump)
            }
          }
        } else {
          cards = player.hand.cards.filter((card) => !isJocker(card) && card.face.suit === initiatorCard.face.suit)
          if (!cards.length) {
            cards = player.hand.cards.filter((card) => card.face.suit === trump)
          }
        }
      }
      cards = cards.length ? [...cards, ...player.hand.cards.filter(isJocker)] : player.hand.cards

      cards.forEach((c) => player.addAction("move", { objectId: c.id, destId: player.cardSlot.id }))
      const actions = Array.from(player.actions.values())
      const timeoutAction = actions[rand(actions.length - 1)]
      
      await ctx.waitPlayerAction([{
        player,
        timeout: ctx.options.timer,
        timeoutActionId: timeoutAction.id
      }])

      const playerCard = player.cardSlot.cards[0]

      if (isJocker(playerCard)) {
        if (player === initiator.player) {
          for (let suit = 0; suit < 4; suit ++) {
            if (suit === trump && !player.jokerTrump) { continue }
            player.addAction("setJoker", { suit, higher: true })
            player.addAction("setJoker", { suit, higher: false })
          }
          player.dialog = "selectFirstCardJoker"
        } else {
          player.addAction("setJoker", { suit: 4, higher: true })
          player.addAction("setJoker", { suit: 4, higher: false })
          player.dialog = "selectJoker"
        }
        const actions = Array.from(player.actions.values())
        const jokerAction = actions[rand(actions.length - 1)]
        await ctx.waitPlayerAction([{
          player,
          timeout: ctx.options.timer,
          timeoutActionId: jokerAction.id
        }])
      }

      if (player !== initiator.player && initiatorCard.face.suit !== trump && playerCard.face.suit !== initiatorCard.face.suit && !isJocker(playerCard)) {
        player.jokerTrump = false
      }

      ctx.roles.active.moveNext()
    }

    // find winner
    let winner = initiator.player
    active.player = initiator.next
    for (let p = 1; p < 4; p++) {
      if (higherCard(winner, active.player, ctx.state.board.trump.suit)) {
        winner = active.player
      }
      active.moveNext()
    }

    // set initiator
    winner.tricks++
    initiator.player = winner
    active.player = winner

    await ctx.delay(endTurnDelay)

    // move all cards from board
    ctx.roles.active.forEach((p) => {
      // save last trick
      board.lastTrick[p.index].suit = p.cardSlot.cards[0].face.suit
      board.lastTrick[p.index].value = p.cardSlot.cards[0].face.value

      p.joker.suit = -1
      p.cardSlot.moveAll(winner.trash)
    })
  }

  const calcScore = (cards: number, bid: number, tricks: number) => {
    if (bid === tricks) {
      if (tricks === 9) { return 900 }
      if (tricks === cards) { return tricks * 100 }
      return 50 + 50 * tricks
    } else {
      if (tricks === 0) { return -200 }
      return 10 * tricks
    }
  }

  // save round score
  ctx.players.forEach((p) => {
    const cards = board.bullet % 2 ? (board.bullet > 1 ? 9 - board.round : board.round) : 9
    const scoreLine = 5 * (board.bullet - 1) + (!(board.bullet % 2) ? 4 : 0) + board.round - 1
    const i = scoreLine * 12 + p.index * 3
    board.score[i] = p.bid
    board.score[i+1] = p.tricks
    board.score[i+2] = calcScore(cards, p.bid, p.tricks)
  })

  // // calculate bonus
  // if (board.round === (board.bullet % 2 ? 4 : 8)) {
  //   const bonusPlayers = [true, true, true, true]
  //   const scoreLine = 5 * board.bullet + (!(board.bullet % 2) ? 4 : 0) + board.round - 1
  //   for (let round = 1; round <= board.round; round++) {
  //     for (let p = 0; p < 4; p++ ) {
  //       if (!bonusPlayers[p]) { continue }
  //       const i = scoreLine * 12 + p * 3
  //       bonusPlayers[p] = board.score[i] === board.score[i+1]
  //     }
  //   }
  //   const bonusPlayer = bonusPlayers.indexOf(true)

  //   // add bonus
  //   if (bonusPlayer >= 0) {
      
  //   }

  // }

  ctx.roles.dealer.moveNext()
}
