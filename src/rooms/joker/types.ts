import { Mosx, mx } from "mosx"

import { Card, Face, Cards, Player, GameItem, GameClient, GameState, IPlayerParams } from "./engine/types"
import { GameContext } from "./engine/context"

export const rand = (max: number, min = 0) => Math.floor(Math.random() * (max - min + 1)) + min
export const cardRank = ["A", "K", "Q", "J", "10", "9", "8", "7", "6"]

export interface IJokerOptions {
  name: string
  autoturn: boolean
  bet: number
  timer: number
  password: string
}

interface IJokerData {
  phase: string
  players: number
}

export interface IUser {
  id: string
  name: string
  imageUrl: string
  balance: number
}

export type JokerState = GameState<JokerBoard, JokerClient>

export type JokerContext = GameContext<JokerPlayer, JokerState, IJokerData>

interface IJokerClientParams {
  playerId?: string
  user?: IUser 
}

export class JokerClient extends GameClient<JokerPlayer> {
  @mx.string public id!: string
  @mx.string public name!: string
  @mx.string public imageUrl!: string

  public balance!: number

  constructor(state: GameState, params: IJokerClientParams) {
    super(state, params)
    if (!params.user) {
      const id = Math.random().toString(32).slice(5)
      this.id = id
      this.name = id
      this.imageUrl = "https://joeschmoe.io/api/v1/random?" + id
      this.balance = 0
    } else {
      this.id = params.user.id
      this.name = params.user.name
      this.imageUrl = params.user.imageUrl || ""
      this.balance = params.user.balance || 0
    }
  }
}

interface IJokerPlayerParams extends IPlayerParams {
  index: number
}

export class JokerCard extends Mosx {
  @mx public higher: boolean = true
  @mx public suit: number = -1
}

export class JokerPlayer extends Player<IJokerPlayerParams> {
  @mx.string public active!: boolean
  @mx.number public index!: number
  @mx.string public bid!: number
  @mx.string public tricks!: number
  @mx.string public joker!: JokerCard

  @mx.private public dialog!: string
  
  public hand!: Cards
  public cardSlot!: Cards
  public trash!: Cards
  public jokerTrump!: boolean

  public reconnectCount!: number
  public userRef!: IUser | null

  protected onCreate(params: IJokerPlayerParams) {
    this.tricks = 0
    this.dialog = ""
    this.bid = -1
    this.joker = new JokerCard(this)
    this.jokerTrump = true
    this.active = false
    this.index = params.index 

    this.reconnectCount = 0
    this.hand = this.addProp(Cards, "hand", { itemsType: "Card", cardsSide: Face.down })
    this.cardSlot = this.addProp(Cards, "cardSlot", { itemsType: "Card", cardsSide: Face.up })
    this.trash = this.addProp(Cards, "trash", { cardsSide: Face.down })
  }
}

export class Trump extends GameItem {
  @mx.number public suit: number = -1
}

export class JokerOptions extends Mosx {
  @mx public bet: number = 100
  @mx public autoturn: boolean = true
  @mx public timer: number = 30
  @mx public name: string = ""
  @mx public password: string = ""

  constructor(owner: Mosx, options: IJokerOptions) {
    super(owner)
    this.name = options.name || ""
    this.bet = options.bet || 100
    this.autoturn = options.autoturn || true
    this.timer = options.timer || 30
    this.password = options.password || ""
  }
}

export class JokerBoard extends GameItem {
  @mx public options!: JokerOptions
  @mx public scene!: string
  @mx public score!: number[]
  @mx public round!: number
  public deck!: Cards

  public trumpSlot!: Cards
  public trump!: Trump

  protected onCreate(options: IJokerOptions) {
    this.options = new JokerOptions(this, options)
    this.scene = "init"
    this.round = 0

    this.deck = this.addProp(Cards, "deck", { cardsSide: Face.down })
    this.trumpSlot = this.addProp(Cards, "trumpSlot",  { cardsSide: Face.up })
    this.trump = this.addProp(Trump, "trump")
  }

  public createDeck() {
    const deck: any[] = []
    for (let i = 0; i < 36 / 4; i++) {
      [0, 1, 2, 3].forEach((suit: number) => {
        deck.push({ value: cardRank[i], suit })
      })
    }

    while (deck.length) {
      const face = deck.splice(rand(deck.length - 1), 1)[0]
      this.deck.createItem(Card, { face })
    }
  }
}
