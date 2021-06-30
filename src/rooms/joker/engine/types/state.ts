import { Mosx, mx } from "mosx"

import { GameItem, GameClient } from "."

/**
 * GameState
 */

export class GameState<T extends GameItem = any, C extends GameClient = any> extends Mosx {
  @mx.map("string") public clients: Map<string, C>
  @mx.map(GameItem) public objects: Map<string, GameItem>
  @mx.string public boardId: string = ""

  public objectIds: string[]
  public board: T

  constructor(BoardClass: new (state: GameState<T>, owner?: GameItem, params?: any) => T, params?: any) {
    super()
    this.clients = new Map<string, C>()
    this.objects = new Map<string, GameItem>()
    this.objectIds = []
    this.board = new BoardClass(this, undefined, params)
    Mosx.setParent(this.board, this)
    this.boardId = this.board.id
  }

  public generateId() {
    let id = ""
    do {
      id = Math.random().toString(36).substring(3, 11)
    } while (this.objectIds.indexOf(id) >= 0)
    this.objectIds.push(id)
    return id
  }

  public addObject(obj: GameItem) {
    this.objects.set(obj.id, obj)
  }

  public addClient(clientId: string, client: C) {
    this.clients.set(clientId, client)
  }

  public removeClient(clientId: string) {
    this.clients.delete(clientId)
  }
}
