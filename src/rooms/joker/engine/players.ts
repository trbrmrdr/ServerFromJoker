import { Player } from "./types"

export function isPromise(value: any) {
  return Boolean(value && typeof value.then === "function")
}

// export class QueueNode<T> {
//   public next: QueueNode<T> | null = null
//   constructor(public data: T, public prev: QueueNode<T> | null) {
//     if (prev) {
//       prev.next = this
//       this.next = prev.next
//     }
//   }

//   public addNext(data: T): QueueNode<T> {
//     return new QueueNode(data, this)
//   }

//   public remove(): {

//   }
// }

// export class Queue<T extends object> {
//   public _nodes: WeakMap<T, QueueNode<T>> = new WeakMap()
//   public _markers: Map<string, QueueNode<T> | null> = new Map()
//   public _last: QueueNode<T> | null = null

//   constructor() { }

//   get size() {
//     return this._nodes.
//   }

//   public addIndex(name: string, data: T) {
//     const that = this as any
//     if (this.hasOwnProperty(name) || typeof that[name] === "function") {
//       throw new Error(`Cannot add index "${name}" - already exist or reserved`)
//     }
//     const node = this._nodes.get(data) || null
//     this._markers.set(name, node)

//     Object.defineProperty(this, name, {
//       get: () => node,
//     })
//     return node
//   }

//   public add(data: T, after?: QueueNode<T> | null) {
//     after = after || this._last
//     const node = new QueueNode(data, after)
//     node.
//     this._nodes.set(data, node)
//   }

//   public delete(data: T) {
//     const node = this._nodes.get(data)

//     if (node) {
//       if (node.prev) {
//         node.prev.next = node.next
//       }
//       if (node.next) {
//         node.next.prev = node.prev
//       }
//     }

//     this._nodes.delete(data)
//   }
// }

// const player1 = new Player({} as any)
// const player2 = new Player({} as any)
// const player3 = new Player({} as any)

// const players = new Queue<Player>()
// players.add(player1)
// players.add(player1)
// players.add(player1)

export class PlayerQueueIndex<P extends Player> {
  constructor(public queue: PlayerQueue<P>, public index: number) {}

  get player(): P {
    return this.queue[this.index]
  }

  set player(value) {
    const i = this.queue.indexOf(value)
    if (i >= 0) {
      this.index = i
    } else {
      this.index = this.queue.length - 1
    }
  }

  get next(): P {
    return this.queue[this.index >= this.queue.length - 1 ? 0 : this.index  + 1]
  }

  get prev(): P {
    return this.queue[this.index === 0 ? this.queue.length - 1 : this.index - 1]
  }

  public moveNext(): void {
    this.index = this.index >= this.queue.length - 1 ? 0 : this.index  + 1
  }

  public movePrev(): void {
    this.index = this.index > 0 ? this.index - 1 : this.queue.length - 1
  }

  public async forEach(action: (item: P, index: number, items: PlayerQueue<P>) => Promise<void> | void) {
    for (let i = 0; i < this.queue.length; i++) {
      const index = this.index + i >= this.queue.length
        ? Math.abs(this.index + i - this.queue.length)
        : this.index + i
      if (isPromise(action)) {
        await action(this.queue[index], index, this.queue)
      } else {
        action(this.queue[index], index, this.queue)
      }
    }
  }
}

export class PlayerQueue<P extends Player> extends Array<P> {
  public index: { [name: string]: PlayerQueueIndex<P> } = {}

  public addIndex(name: string, index: number = 0) {
    const that = this as any
    if (this.hasOwnProperty(name) || typeof that[name] === "function") {
      throw new Error(`Cannot add index "${name}" - already exist or reserved`)
    }
    this.index[name] = new PlayerQueueIndex(this, index)
    Object.defineProperty(this, name, {
      get: () => this.index[name],
    })
    return this.index[name]
  }

  public shuffle() {
    for (let i = this.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this[i], this[j]] = [this[j], this[i]]
    }
  }

  public delete(player: P) {
    const index = this.indexOf(player)

    Object.keys(this.index).forEach((name: string) => {
      if (this.index[name].index >= index) {
        this.index[name].index = this.index[name].index - 1
      }
    })

    // if (index === this.length - 1) {
    //   Object.keys(this.index).forEach((name: string) => {
    //     if (this.index[name].index === index) {
    //       this.index[name].index = 0
    //     }
    //   })
    // }
    this.splice(index, 1)
  }

  public clear() {
    this.length = 0
    Object.keys(this.index).forEach((name: string) => {
      this.index[name].index = 0
    })
  }
}

export class GamePlayers<T extends Player> extends PlayerQueue<T> {
  public groups: Map<string, PlayerQueue<T>> = new Map()

  public setGroup(name: string, players: T[] = []) {
    this.groups.set(name, new PlayerQueue<T>(...players))
  }

  public inGroup(name: string): T[] {
    return this.groups.get(name) || []
  }

  public notInGroup(name: string): T[] {
    const inGroup = this.inGroup(name)
    return this.filter((player) => inGroup.indexOf(player) < 0)
  }

  public addPlayer(player: T, name: string = ""): PlayerQueue<T> {
    let queue = name ? this.groups.get(name) : this
    if (!queue) {
      queue = new PlayerQueue(player)
      this.groups.set(name, queue)
    } else if (queue.indexOf(player) < 0) {
      queue.push(player)
    }
    return queue
  }

  public removePlayer(player: T, name: string = ""): PlayerQueue<T> | undefined {
    const queue = name ? this.groups.get(name) : this
    if (queue) {
      queue.delete(player)
    }
    return queue
  }

  public movePlayer(player: T, from: string, to: string) {
    this.removePlayer(player, from)
    this.addPlayer(player, to)
  }
}
