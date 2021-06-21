import { EventEmitter } from "events"

import { GamePlayers, isPromise, PlayerQueueIndex } from "./players"
import { GameState, Player, GameItem, IAction } from "./types"

export type ActionHandler<P extends Player, B extends GameItem> =
  (ctx: GameContext<P, B>, player: P, action: IAction) => void

export type EventHandler<P extends Player, B extends GameItem> =
  (ctx: GameContext<P, B>, ...args: any[]) => void

export type PhaseHandler<P extends Player, B extends GameItem> =
  (ctx: GameContext<P, B>, ...args: any[]) => Promise<void> | void

export type Type<T> = new (...args: any[]) => T

export interface IContextEngine<P extends Player, B extends GameItem> {
  // data?: () => any
  // computed?: { [key: string]: any }
  phases: { [phase: string]: PhaseHandler<P, B> }
  actions?: { [action: string]: ActionHandler<P, B> }
  roles?: string[]
}

export interface IPlayerActionOption<P extends Player, B extends GameItem> {
  player: P
  cleanPlayerOnAction?: boolean
  cleanAllOnAction?: boolean
  timeout?: number
  timeoutActionId?: string
  timeoutHandler?: (ctx: GameContext<P, B>, player: P) => void
  stopTimer?: boolean
}

export interface IActionsData<P extends Player, B extends GameItem> {
  playersOptions?: IPlayerActionOption<P, B>[]
  resolve: (value: IAction | null) => void
}

export class GameContext<P extends Player, B extends GameItem, D = any> extends EventEmitter {
  public actionsData: IActionsData<P, B> | null = null
  public players: GamePlayers<P>
  public state: GameState<B>
  public roles: { [role: string]: PlayerQueueIndex<P> } = {}

  public options: { [key: string]: any }
  public gameId: string
  public data: D

  constructor(public engine: IContextEngine<P, B>, state: GameState<B>, gameId: string) {
    super()
    this.gameId = gameId
    this.state = state
    this.data = {} as D
    // const computed = engine.computed || {}

    // Object.keys(computed).forEach((key) => {
    //   Object.defineProperty(this, key, { get: computed[key].bind(this), enumerable: true })
    // })

    this.options = {}

    this.players = new GamePlayers()
    const roles = engine.roles || []
    roles.forEach((role) => this.roles[role] = this.players.addIndex(role))

    // const events = engine.events || {}
    // Object.keys(events).forEach((event) => {
    //   this.on(event, (...args: any[]) => events[event](this, ...args))
    // })
  }

  public next(phaseName: string, ...args: any[]): Promise<void> | void {
    const phase = this.engine.phases[phaseName]
    if (phase) {
      let result = phase(this, ...args)
      if (result && !isPromise(result)) {
        result = Promise.resolve(result)
      }
      return result
    } else {
      return Promise.reject(`Phase ${phaseName} not found!`)
    }
  }

  public delay(sec: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, sec * 1000)
    })
  }

  public execPlayerAction(player: P, actionId: string, params?: any) {

    const action = player.actions.get(actionId)

    if (!action) {
      throw new Error(`Cannot execute action ${actionId} - action not found`)
    }

    const actionHandler = this.engine.actions && this.engine.actions[action.name]
    if (actionHandler) {
      actionHandler(this, player, action)
    } else {
      this.emit("log", `${player.id}: Cannot execute action ${action.name} with `)
      throw new Error(`Cannot execute action ${action.name} - action handler not found`)
    }

    action.params = params

    if (this.actionsData) {
      const { playersOptions = [], resolve } = this.actionsData
      const options = playersOptions.find(({ player: p }) => player === p) || {} as IPlayerActionOption<P, B>

      if (options.timeout && options.stopTimer) {
        player.timer.stop()
      }
      if (options.cleanPlayerOnAction) {
        player.actions.clear()
      }
      if (options.cleanAllOnAction) {
        playersOptions.forEach(({ player: p }) => {
          p.actions.clear()
        })
      }
      resolve(action)
    }
  }

  public waitPlayerAction(playersOptions: IPlayerActionOption<P, B>[] = []): Promise<IAction | null> {
    return new Promise((resolve) => {
      this.actionsData = { playersOptions, resolve }

      playersOptions.forEach((playerOptions) => {
        const { player, timeout, timeoutActionId, timeoutHandler } = playerOptions
        if (!timeout) { return }

        player.timer.start(timeout, () => {
          if (timeoutActionId) {
            // execute timeoutAction
            this.execPlayerAction(player, timeoutActionId)
          } else if (timeoutHandler) {
            timeoutHandler(this, player)
          } else {
            resolve(null)
          }
        })
      })
    })
  }
}
