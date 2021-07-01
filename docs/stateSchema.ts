
enum Suit {
  spades = 0,
  clubs = 1,
  hearts = 2, 
  diams = 3
}

type IJokerScene = "waitPlayers" | "initGame" | "gameRound" | "gameScore" | "endGame"
type IPlayerDialog = "selectTrump" | "selectBid" | "selectJoker"

type CardValue = "A" | "K" | "Q" | "J" | "10" | "9" | "8" | "7" | "6"
type CardSide = "face" | "back"

type AnyObject = ICard | ICards | IJokerBoard | IJokerPlayer | ITimer | ITrump

interface IJokerClient {
  id: string
  name: string
  imageUrl: string
  playerId: string
  connected: boolean
}

interface IState {
  clients: {
    [key: string]: IJokerClient
  }
  objects: {
    [key: string]: AnyObject
  }
  boardId: string
}

interface IBaseItem {
  id: string
  type: string
  props: {
    owner: string
    [key: string]: string
  }
}

interface ICards extends IBaseItem {
  type: "Cards"
  cardsSide: CardSide
  items: string[] // Card
}

interface ITrump extends IBaseItem {
  type: "Trump"
  suit: Suit | -1 | 4
}

interface IJokerBoard extends IBaseItem {
  type: "JokerBoard"
  props: {
    owner: string
    deck: string // Cards
    trumpSlot: string  // Cards
    trump: string // Cards
  }
  options: {
    bet: number 
    autoturn: boolean
    timer: number
    name: string
    password: string
  }
  scene: IJokerScene
  score: number[]
  round: number
}

interface IJokerPlayer extends IBaseItem {
  type: "JokerPlayer"
  props: {
    owner: string
    cardSlot: string // Cards
    hand: string // Cards 
    trash: string // Cards
    timer: string // Timer 
  }
  active: boolean
  index: number
  bid: number
  tricks: number
  joker: {
    suit: Suit | -1
    higher: boolean
  }
  dialog: IPlayerDialog
  actions: {
    [key: string]: IPlayerAction
  }
}

interface IPlayerAction {
  id: string
  name: string
  data: any
  params?: any
}

interface ITimer extends IBaseItem {
  type: "Timer"
  value: number
}

interface ICard extends IBaseItem {
  type: "Card"
  side: CardSide
  data: {
    value: CardValue
    suit: Suit
  }
  face: {
    value: CardValue
    suit: Suit
  }
}

interface IJsonPatch {
  op: "add" | "replace" | "remove"
  path: string
  value: any
}
