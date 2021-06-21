import { Mosx, mx } from "mosx"

import { GameState, GameItem, Timer } from "."

/**
 * Player
 */

export interface IAction {
  playerId: string
  id: string
  name: string
  data?: any
  params?: any
}

export class PlayerAction extends Mosx {
  @mx public id: string
  @mx public name: string
  @mx public data: any
  @mx public params?: any

  public playerId: string

  constructor(player: Player, name: string, data: any, params?: any) {
    super(player)
    this.playerId = player.id
    this.id = Math.random().toString(32).slice(3)
    this.name = name
    this.data = data
    this.params = params
  }
}

export class Player extends GameItem {
  @mx.boolean public connected: boolean = true
  @mx.private public actions = new Map<string, PlayerAction>()

  public clientId: string
  public timer: Timer

  constructor(state: GameState, owner?: GameItem, params?: any, created = true) {
    super (state, owner, params, false)
    this.clientId = params.auth.id
    this.timer = this.addProp(Timer, "timer")
    created && this.create(params)
  }

  public setActions(actions: IAction[] = []) {
    this.actions.clear()
    const newActions = new Map()
    actions.forEach(({ name, data, params }) => {
      const action = new PlayerAction(this, name, data, params)
      newActions.set(action.id, action)
    })
    this.actions = newActions
  }

  public findAction(handler: (action: PlayerAction) => boolean): PlayerAction | undefined {
    for (const action of this.actions.values()) {
      if (handler && handler(action)) { return action }
    }
    return
  }

  public addAction(name: string, data?: any, params?: any) {
    const action = new PlayerAction(this, name, data, params)
    this.actions.set(action.id, action)
    return action
  }

  public removeAction(id: string) {
    this.actions.delete(id)
  }

  public removeActions() {
    this.actions = new Map()
  }
}
