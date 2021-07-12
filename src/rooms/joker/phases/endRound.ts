import { JokerContext } from "../types"

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

const scorePos = (bullet: number, round: number, player: number) => {
  const shift = [0, 8, 12, 20]
  return (shift[bullet - 1] + round - 1) * 12 + player * 3
}

const playerScore = (score: number[], bullet: number, round: number, p: number) => {
  const i = scorePos(bullet, round, p)
  return score.slice(i, i+3)
}

const maxPlayerScore = (scoreData: number[], bullet: number, p: number, win = false) => {
  const rounds = bullet % 2 ? 8 : 4

  let result = 0
  for (let r = 1; r <= rounds - 1; r++) {
    const score = playerScore(scoreData, bullet, r, p)
    if (win || !(score[0] === score[1] && score[0] === 0)) {
      result = Math.max(result, score[2])
    }
  }

  return result
}


// const testScore = () => {
//   return [
//     0, 0, 50,  1, 1, 100, 1, 0, -200, 0, 0, 50, // 1
//     1, 1, 100, 1, 1, 100, 1, 0, -200, 0, 0, 50, // 2
//     0, 0, 50,  0, 0, 50,  1, 1, 100,  1, 1, 100, // 3
//     1, 1, 100, 2, 2, 150, 0, 0, 50,   3, 1, 10,  // 4
//     1, 1, 100, 2, 2, 150, 0, 0, 50,   3, 1, 10, // 5
//     0, 0, 50,  0, 0, 50,  3, 3, 200,  3, 2, 20, // 6
//     2, 2, 150, 1, 1, 100, 2, 2, 150,  1, 1, 100, // 7
//     1, 1, 100, 2, 2, 150,  1, 1, 100,  2, 1, 10, // 8
//     1, 1, 100, 2, 2, 150, 0, 0, 50,   3, 1, 10,  // 4
//     1, 1, 100, 2, 2, 150, 0, 0, 50,   3, 1, 10, // 5
//     0, 0, 50,  0, 0, 50,  3, 3, 200,  3, 2, 20, // 6
//     2, 2, 150, 1, 1, 100, 2, 2, 150,  1, 1, 100, // 7
//     1, 1, 100, 2, 3, 30,  1, 1, 100,  2, 1, 10, // 8
//     0, 0, 50,  1, 1, 100, 1, 0, -200, 0, 0, 50, // 1
//     1, 1, 100, 1, 1, 100, 1, 0, -200, 0, 0, 50, // 2
//     0, 0, 50,  0, 1, 10,  1, 1, 100,  1, 1, 100, // 3
//     1, 1, 100, 2, 2, 150, 0, 0, 50,   3, 1, 10,  // 4
//     1, 1, 100, 2, 2, 150, 0, 0, 50,   3, 1, 10, // 5
//     0, 0, 50,  0, 0, 50,  3, 3, 200,  3, 2, 20, // 6
//     2, 2, 150, 1, 1, 100, 2, 2, 150,  1, 1, 100, // 7
//     1, 1, 100, 2, 3, 30,  1, 1, 100,  2, 1, 10, // 8
//     1, 1, 100, 2, 2, 150, 0, 0, 50,   3, 1, 10,  // 4
//     1, 1, 100, 2, 2, 150, 0, 0, 50,   3, 1, 10, // 5
//     0, 0, 50,  0, 0, 50,  3, 3, 200,  3, 2, 20, // 6
//     2, 2, 150, 1, 1, 100, 2, 2, 150,  1, 1, 100, // 7
//     1, 1, 100, 2, 3, 30,  1, 1, 100,  2, 1, 10, // 8
//   ]
// }

export const endRound = async (ctx: JokerContext) => {
  ctx.state.board.scene = "endRound"
  const { board } = ctx.state
  const { active } = ctx.roles

  // save round score
  ctx.players.forEach((p) => {
    const cards = board.bullet % 2 ? (board.bullet > 1 ? 9 - board.round : board.round) : 9
    const i = scorePos(board.bullet, board.round, p.index)
    board.score[i] = p.bid
    board.score[i+1] = p.tricks
    board.score[i+2] = calcScore(cards, p.bid, p.tricks)
  })

  // board.score = testScore()
  // board.round = 8

  // calculate bonus
  if (board.round === (board.bullet % 2 ? 8 : 4)) {
    const bonusPlayers = [true, true, true, true]
    for (let round = 1; round <= board.round; round++) {

      for (let p = 0; p < 4; p++ ) {
        if (!bonusPlayers[p]) { continue }
        const i = scorePos(board.bullet, round, p)
        bonusPlayers[p] = board.score[i] === board.score[i+1]
      }
    }
    const bonusPlayerIndex = bonusPlayers.indexOf(true)

    // add bonus
    if (bonusPlayerIndex >= 0) {
      active.player = ctx.players.find((p) => p.index === 0)!
      for (let p = 0; p < 4; p++) {
        const i = scorePos(board.bullet, board.round, p)

        if (p === bonusPlayerIndex) {
          board.score[i+2] += maxPlayerScore(board.score, board.bullet, p, true)
        } else if (!bonusPlayers[p]) {
          board.score[i+2] -= maxPlayerScore(board.score, board.bullet, p)
        } 
        active.moveNext()
      }
    }

  }
}
