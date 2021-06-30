import { LocalClient } from "magx"

import { rand, JokerBoard, JokerPlayer, JokerContext, JokerState } from "./types"
import { GameState, PlayerAction } from "./engine/types"

export const createBot = (ctx: JokerContext, client: LocalClient, params?: any) => {
  let acting = false
  const state = client.room.state as JokerState
  const jokerClient = state.clients.get(client.id)

  if (!jokerClient || !jokerClient.player) { return }

  const player = jokerClient.player
  const board = state.objects.get(state.boardId) as JokerBoard
  const timerId = player.timer.id

  client.onChange("replace", `/objects/${state.boardId}/scene`, ({ value }) => {
    if (value === "end") {
      setTimeout(() => {
        if (board.scene === "game") { return }
        client.terminate()
      }, 30000)
    }
  })

  client.onChange("remove", `/clients/:id`, () => {
    setTimeout(() => {
      if (board.scene === "game") { return }
      client.terminate()
    }, 30000)
  })

  client.onChange("replace", `/objects/${timerId}/value`, ({ value }) => {
    if (value > 0 && !acting) {
      acting = true

      const actions = Array.from(player.actions.values())

      if (actions.length) {
        const action = selectBestAction(client.room.state, player)
        const delay = rand(10) * ctx.options.botDelay * 1000

        setTimeout(() => {
          client.send("action", { actionId: action.id })
          acting = false
        }, delay)
      } else {
        acting = false
        console.log("Error: no actions!!")
      }
    }
  })
}

// const higherCard = (state: GameState, card1Id: string, card2Id: string) => {
//   const board = state.board as JokerBoard
//   const trump = board.trump.suit

//   const card1 = state.objects.get(card1Id) as Card
//   const card2 = state.objects.get(card2Id) as Card

//   const cardValue = (card: Card) => cardRank.length - cardRank.indexOf(card.face.value)

//   return card1.face.suit === card2.face.suit
//     ? cardValue(card1) > cardValue(card2)
//     : trump && card1.face.suit === trump
// }

const selectBestAction = (state: GameState, player: JokerPlayer): PlayerAction => {
  const actions = Array.from(player.actions.values())
  return actions[rand(actions.length - 1)]
}
