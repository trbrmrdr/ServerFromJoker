import { Mosx, mx } from "mosx"

import { GameState } from "."

/**
 * GameItem
 */

type GameItemClass<T extends GameItem> = new(state: GameState, owner?: GameItem, params?: any, create?: boolean) => T

export class GameItem extends Mosx {

  @mx.string public id!: string
  @mx.string public type: string

  @mx.map("string") public props: Map<string, string>

  public owner!: GameItem | null

  get path(): string[] {
    return this.owner ? [ ...this.owner.path, this.owner.id ] : []
  }

  public listeners: any[] = []

  constructor(public state: GameState, owner?: GameItem, params: any = {}, create = true) {
    super (owner)
    this.owner = owner || null
    this.type = params && params.type || this.constructor.name
    this.props = new Map()

    // const itemId = type + state.objectIds.filter((id) => (state.objects.get(id) as GameItem).type === type).length
    this.id = this.type + "-" + state.generateId()
    this.props.set("owner", owner && owner.id || "")
    create && this.create(params)
  }

  public create(params: any) {
    this.onCreate(params)
    this.state.addObject(this)
  }

  public addProp<T extends GameItem>(constructor: GameItemClass<T>, name: string, params: any = {}) {
    const item = new constructor(this.state, this, { name, ...params })
    this.props.set(name, item.id)
    return item
  }

  public setOwner(owner?: GameItem) {
    this.owner = owner || null
    Mosx.setParent(this, owner)
    this.props.set("owner", owner && owner.id || "")
  }

  protected onCreate(params?: any) {}
}

/**
 * Container - GameItem with flex subitems
 */

export class Container extends GameItem {
  @mx.array("string") public items: Array<string>

  protected __items: GameItem[]

  get top(): GameItem {
    return this.__items[this.__items.length - 1]
  }

  constructor(state: GameState, owner?: GameItem, params: any = {}, create = true) {
    super (state, owner, params, false)
    this.items = new Array<string>()
    this.__items = []
    create && this.create(params)
  }

  public createItem<T extends GameItem>(schema: GameItemClass<T>, params?: any): T {
    const item = new schema(this.state, this, params)
    this.push(item)
    return item
  }

  public push(item: GameItem): number {
    if (!item) {
      throw new Error(`Cannot push undefined item to ${this.type}`)
    } else if (!(item instanceof GameItem)) {
      throw new Error(`Cannot push item to ${this.type} - item is not GameItem baseType`)
    } else if (item.owner) {
      if (!(item.owner instanceof Container)) {
        throw new Error(`Cannot pop item ${this.type} - item continer is not Container baseType`)
      } else if (item.owner !== this) {
        item.owner.pop(item.id)
        item.setOwner(this)
      }
    }
    this.__items.push(item)
    return this.items.push(item.id)
  }

  public pop(id?: string): GameItem {
    const index = id ? this.items.indexOf(id) : this.__items.length - 1
    if (index < 0) {
      throw new Error(`Cannot pop "${id}" from ${this.type} - item not found`)
    }
    this.items.splice(index, 1)
    return this.__items.splice(index, 1)[0]
  }

  public move(id: string, dest: Container): GameItem {
    const index = this.items.indexOf(id)
    if (index < 0) {
      throw new Error(`Cannot move "${id}" to ${dest.id} - item not found in ${this.type}`)
    } else if (!dest) {
      throw new Error(`Cannot move "${id}" from ${this.type} to unknown destination`)
    } else if (!(dest instanceof Container)) {
      throw new Error(`Cannot move "${id}" to ${dest} - destination is not Container baseType`)
    } else if (id in dest.path) {
      throw new Error(`Cannot move "${id}" to ${dest.type}`)
    }

    const item = this.state.objects.get(id) as GameItem
    dest.push(item)
    return item
  }

}

/**
 * Timer
 */

export class Timer extends GameItem {
  @mx.number public value: number

  constructor(state: GameState, owner?: GameItem, params: any = {}, create = true) {
    super (state, owner, params, false)
    this.value = -1
    create && this.create(params)
  }

  public timer: NodeJS.Timeout | undefined

  public start(value: number, handler: () => any) {
    this.value = value
    this.timer && clearInterval(this.timer)
    this.timer = setInterval(() => {
      if (--this.value <= 0) {
        this.stop()
        handler()
      }
    }, 1000)
  }

  public stop() {
    const timer = this.value
    if (this.timer) {
      clearInterval(this.timer)
    }
    if (this.value >= 0) {
      this.value = -1
    }
    return timer
  }
}

/**
 * GameStatus
 */

export class GameStatus extends GameItem {
  @mx.map("string") public status: Map<string, string>

  constructor(state: GameState, owner: GameItem, params: any, created = true) {
    super (state, owner, params, false)
    this.status = new Map<string, string>()
    created && this.create(params)
  }
}
