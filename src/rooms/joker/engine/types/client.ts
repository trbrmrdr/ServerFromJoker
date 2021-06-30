import { Mosx, mx } from "mosx"

import { GameState } from "."
import { Player } from "./player"

export interface IGameClientParams {
  playerId?: string
}

export class GameClient<T extends Player = any> extends Mosx {
  @mx.string public playerId: string = ""


  public get player(): T | null {
    return this.state.objects.get(this.playerId) as T || null
  }

  constructor(public state: GameState, params?: IGameClientParams) {
    super ()
    this.playerId = params?.playerId || ""
  }
}
