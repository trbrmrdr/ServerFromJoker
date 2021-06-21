import { Mosx, mx } from "mosx"

import { GameItem, GameState, Container } from "."

export const Face = { up: "face", down: "back" }

class CardSide extends Mosx {
  @mx.string public value: string

  constructor(owner: Card, params: any) {
    super(owner)
    this.value = params && params.value || ""
  }
}

class FaceSide extends CardSide {
  @mx.number public suit: number

  constructor(owner: Card, params: any) {
    super(owner, params)
    this.suit = params && params.suit || 0
  }
}

export class Card extends GameItem {
  @mx.string
  public side: string

  @mx.computed
  get data() {
    const data = this.side === Face.up ? this.face : this.back
    return { ...data }
  }

  @mx.private.object(FaceSide)
  public face: FaceSide

  @mx.private.object(CardSide)
  public back: FaceSide

  constructor(state: GameState, owner?: GameItem, params: any = {}, create: boolean = true) {
    super (state, owner, params, false)
    this.side = params && params.side || Face.down
    this.face = new FaceSide(this, params.face)
    this.back = new FaceSide(this, params.back)
    create && this.create(params)
  }

  public flip(side?: string): Card {
    if (this.side === side) {
      return this
    }
    this.side = this.side === Face.up ? Face.down : Face.up
    return this
  }
}

export class Cards extends Container {
  @mx.string
  public cardsSide: string

  get cards(): Card[] {
    return this.__items as Card[]
  }

  get top(): Card {
    return this.cards[this.cards.length - 1]
  }

  constructor(state: GameState, owner?: GameItem, params?: any, create = true) {
    super(state, owner, params, false)
    this.cardsSide = params && params.cardsSide || Face.down
    create && this.create(params)
  }

  public push(card: Card): number {
    if (!(card instanceof Card)) {
      throw new Error(`Cannot push item to ${this.id} - item is not GameItem baseType`)
    }
    card.flip(this.cardsSide)
    return super.push(card)
  }

  public pop(id?: string, side?: string): Card {
    const card = super.pop(id) as Card
    return card.flip(side || card.side)
  }

  public popRandom(side?: string): Card | null {
    if (side && !(side === "face" || side === "back")) {
      throw new Error(`Cannot pop random item from ${this.id} - side "${side}" must be "face" or "back"`)
    }
    if (this.items.length) {
      const cardId = this.items[Math.floor(Math.random() * (this.items.length))]
      return this.pop(cardId, side)
    }
    return null
  }

  public move(id: string, dest: Container, side?: string): Card {
    const index = this.items.indexOf(id)
    if (index < 0) {
      throw new Error(`Cannot move "${id}" to ${dest.type} - item not found in ${this.id}`)
    } else if (side && !(side === "face" || side === "back")) {
      throw new Error(`Cannot move items from ${this.id} to ${dest.id} - side "${side}" must be "face" or "back"`)
    }

    const card = this.__items[index] as Card
    side && card.flip(side)
    return super.move(id, dest) as Card
  }

  public moveAll(dest: Container, side?: string) {
    while (this.items.length) {
      this.move(this.items[0], dest, side)
    }
  }

  public moveTop(dest: Container, amount = 1, side?: string) {
    amount = Math.min(amount, this.items.length)
    for (let i = 0; i < amount; i++) {
      this.move(this.top.id, dest, side)
    }
  }

  public shuffle(index: number = 0) {
    for (let n = 0; n <= index; n++) {
      for (let i = this.items.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        const face = { ...this.cards[i].face }
        this.cards[i].face.suit = this.cards[j].face.suit
        this.cards[i].face.value = this.cards[j].face.value
        this.cards[j].face.suit = face.suit
        this.cards[j].face.value = face.value
      }
    }
  }
}
