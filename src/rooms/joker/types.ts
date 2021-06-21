import { Mosx, mx } from "mosx"

import { Card, Face, Cards, Player, GameItem, Container } from "./engine/types"
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
}

export interface IUser {
  id: string
  name: string
  imageUrl: string
  balance: number
}

export type JokerContext = GameContext<JokerPlayer, JokerBoard, IJokerData>

@mx.Object
export class UserSchema {
  @mx.string public id: string
  @mx.string public name: string
  @mx.string public imageUrl: string

  public balance: number

  constructor(user?: IUser) {
    if (!user) {
      const id = Math.random().toString(32).slice(5)
      this.id = ""
      this.name = "Bot-" + id
      this.imageUrl = "https://joeschmoe.io/api/v1/random?" + id
      this.balance = 0
    } else {
      this.id = user.id
      this.name = user.name
      this.imageUrl = user.imageUrl
      this.balance = user.balance
    }
  }
}

export class JokerPlayer extends Player {
  @mx.string public active!: boolean
  @mx.number public index!: number
  @mx.string public bid!: number
  @mx.string public tricks!: number

  @mx.private public dialog!: string
  
  @mx.object(UserSchema) public user!: UserSchema
  
  public hand!: Cards
  public cardSlot!: Cards
  public trash!: Cards

  public reconnectCount!: number
  public userRef!: IUser | null

  protected onCreate(params: any = {}) {
    this.tricks = 0
    this.dialog = ""
    this.bid = -1
    this.active = false
    this.index = params.index

    this.reconnectCount = 0
    this.userRef = params.user
    this.user = new UserSchema(params.user)
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
  @mx public password: string = ""

  constructor(owner: Mosx, options: IJokerOptions) {
    super(owner)
    this.bet = options.bet || 100
    this.autoturn = options.autoturn || true
    this.timer = options.timer || 30
    this.password = options.password || ""
  }
}

export class JokerBoard extends Container {
  @mx public options!: JokerOptions
  @mx public scene!: string
  @mx public invites!: string[]
  @mx public score!: number[]
  @mx public round!: number
  public deck!: Cards

  public trumpSlot!: Cards
  public trump!: Trump

  protected onCreate(options: IJokerOptions) {
    this.options = new JokerOptions(this, options)
    this.scene = "init"
    this.round = 0
    this.invites = []

    for (let i = 0; i < 7; i++) {
      this.createItem(Cards, { cardsSide: Face.up })
    }

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
