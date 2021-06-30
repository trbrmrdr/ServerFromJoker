# **Архитектура сервера**

![Architecture](/images/architecture.png)

Верхнеуровневая архитектура сервера состоит из следующих компонент:
- API - интерфейс взаимодействия с сервером
- Lobby - главная комната
  - Rooms - список комнат
  - Websocket - интерфейс взаимодействия с комнатой
- Rooms - игровые комнаты
  - Websocket - интерфейс взаимодействия с комнатой
  - Engine - логика игры
  - State - состояние игры

## API

Игровое API реализовано через библиотеку [Magx](https://github.com/udamir/magx) и подключается через клиент magx-client. Библиотека реализует следующие методы:
| Method | url                  | Description  |
| ------ | -------------------- | ------------ |
| GET    | /auth/:token         | Verify token |
| POST   | /auth/               | Authenticate |
| GET    | /rooms?:query        | Get rooms    |
| GET    | /rooms/:roomId       | Reconnect    |
| POST   | /rooms               | Create room  |
| POST   | /rooms/:roomId/join  | Join room    |
| POST   | /rooms/:roomId/leave | Leave room   |

## Lobby

Lobby - это главная комната, в которой можно получить актуальный список комнат, взаимодействовать с другими игроками.

Чтобы подключиться к lobby комнате необходимо установить websocket соединение, использую библиотеку [magx-client](https://github.com/udamir/magx-client).

### Входящие сообщения в Lobby комнате

После подключения в лобби приходят следующие сообщения:
```js
  lobby.onMessage("rooms", (rooms) => { ... })
  lobby.onMessage("room_update", (update) => { ... })
  lobby.onMessage("profile_update", (update) => { ... })
  lobby.onMessage("chat_messages", ({ userId, messages, profile }) => { ... })
  lobby.onMessage("error", (error) => { ... })
```

#### rooms
Первоначальный список комнат приходит в виде массива объектов IRoomData:
```js
{
  name: string                  // room name
  port?: number                 // port of server
  hostId?: string               // host client id
  data?: { [key: string]: any } // custom data
  id: string                    // room id
  pid: string | number          // process id
  clients: string[]             // room clients
}
```

#### room_update
Изменения комнат приходят в виде объекта IRoomUpdate:
```js
{
 roomId: string            // room Id
 data: IRoomData || null   // room data if updated, null if deleted 
}
```

#### profile_update
Изменения профиля игрока приходят в виде объекта, содержащего измененные параметры профиля, например:
```js
{
  credites: 50,
  social: {
    requests: [ ... ]
  }
}
```

#### chat_messages
Сообщения в чат приходят в следующем формате:
```js
{
  userId: string                    // from id
  messages: IMessage[]              // message body
  profile: { [key: string]: any }   // profile_update
}

{
  chatId: string          // chat id
  messageId: number       // message id
  from: string            // from Id 
  date: number            // date
  text: string            // message text
}
```

#### error
Сообщения об ошибках приходнят в следующем формате:
```js
{
  status: number
  message: text
  meta: any
}
```

### Исходящие сообщения в Lobby комнате

```js
lobby.send("invite, { id: userId })       // отправить запрос на добавление в друзья
lobby.send("accept, { id: userId })       // принять запрос на добавление в друзья
lobby.send("reject, { id: userId })       // отклонить запрос на добавление в друзья
lobby.send("remove, { id: userId })       // удалить из друзей
lobby.send("chat", { id: userId, text })  // отправить игроку сообщение
lobby.send("messages", { id: userId })    // запросить список сообщений от пользователя
```

#### Параметры запроса ("messages") сообщений пользователя
  * id: string - id пользователя
  * imit: number - кол-во сообщений
  * page: number - номер страницы
  * fromId: number - сообщения начиная с id сообщения
  * toId: number - сообщения до id сообщения

## Durak rooms

Игровая комната содержит реализацию всей логики игры за столом (Engine) и текущее состояние игры (State). Взаимодействие с игровой комнатой происходит по средствам WebSpcket соединения через библиотеку [magx-client](https://github.com/udamir/magx-client).

### Структура данных состояния комнаты

Состояние состоит из 2-х объектов:
- **Objects** - объект, key - ID игрового объекта, value - игровой объект
- **Clients** - объект, key - ID клиента, value - Id объекта игрока
```js
{
  clients: {
    "5f78cb2f5a4a0eb58016b335":"DurakPlayer-w2itso44",
    ...
  },
  objects: {
    "DurakPlayer-w2itso44":{
      "id": "DurakPlayer-w2itso44",
      "user":{...},
      "type": "DurakPlayer",
      "props": { ... },
      "connected": true,
      "actions": { ...},
      "status":"",
      "index":1,
      ...
    },
    ...
  }
}
```

### Типы объектов
| Name        | Description     |
| :---------- | :-------------- |
| DurakBoard  | Игровой стол    |
| DurakPlayer | Объект игрока   |
| DurakTrump  | Объект козыря   |
| Cards       | Контейнер карт  |
| Card        | Игральная карта |
| Timer       | Таймер игрока   |

Объекты храняться в линейном виде (в коллекции), но содержат ссылки на дочерние и родительские объекты формирую дерево:
![objects](/images/objects.png)
![objects](/images/objects2.png)

Все объекты имеют базовые параметры:
 * id: string - Id объекта
 * type: string - тип объекта
 * owner: string - id родительского объекта
 * props: object - коллекция с id дочерних объектов

#### Схема объектов типа DurakBoard
 * **scene:** string - текущая сцена в игре: 
   - "init" - ожидание игроков
   - "game" - во время игры
   - "end" - конец игры
 * **options**: object - коллекция с параметрами комнаты:
   - deckSize: number - кол-во карт
   - players: number - кол-во игроков
   - fast: boolean - быстрая игра
   - reflect: boolean - переводной
   - supportAll: boolean - подкидывают все
   - autoturn: boolean - автоход (временная опция)
   - bet: number - ставка
   - timer: number - время на ход (временная опция)
   - password: string - пароль от комнаты
 * **props**: object - коллекция с id дочерних объектов:
   - deck: string - id объекта колоды карт
   - trash: string - id объекта сброса
   - trumpSlot: string - id объекта места козырной карты
   - trump: string - id объекта козыря
 * **items**: string[] - массив id объектов слотов для карт на столе
   - [0] - id объекта контейнера нижнего слоя карт
   - [1-6] - id объектов контейнеров верхних карт
 * **invites**: string[] - массив id приглашенных клиентов

Привер:
```json
{
  "DurakBoard-0rg0k8mx": {
    "id": "DurakBoard-0rg0k8mx",
    "type": "DurakBoard",
    "props": {
      "owner": "",
      "deck": "Cards-sgtjyrhx",
      "trash": "Cards-y6vrfiww",
      "trumpSlot": "Cards-pchvio29",
      "trump": "DurakTrump-3aez5ily"
    },
    "items": [
      "Cards-83hii7im",
      "Cards-3jvvd1ya",
      "Cards-coihy00j",
      "Cards-ckaydwbc",
      "Cards-epk48gq8",
      "Cards-j52g4t88",
      "Cards-sityfkip"
    ],
    "options": {
      "deckSize": 36,
      "players": 4,
      "bet": 100,
      "fast": false,
      "reflect": false,
      "supportAll": false,
      "autoturn": true,
      "timer": 30,
      "password": ""
    },
    "scene": "game",
    "invites": []
  }
}
```

#### Схема объекта типа DurakPlayer
 * **connected**: boolen - статус подключения
 * **status**: string - статус игрока
   - "pass" - игрок сказал "пас" или "бито"
   - "ready" - игрок сказал "готов"
   - "durak" - игрок проиграл
 * **defence**: boolean - статус защищающегося игрока
 * **index**: number - номер позиции за столом
 * **props**: object - ids of child objects:
   - hand: string - id объекта контейнера карт руки
   - timer: string - id объекта таймера
 * **user**: object - данные пользователя:
   - id: string - id пользователя
   - name: string - имя
   - imageUrl: string - картинка
 * **actions**: object - коллекция доступных действий игрока, со следующими параметрами
   - id: string - id действия
   - name: string - тип действия
   - data: any - данные действия
 * **winCredits**: number - кол-во выигранных кредитов в текущей игре
 * **winStars**: number - кол-во выигранных очков в текущей игре

```json
{
  "DurakPlayer-p5bc3ddv": {
    "id": "DurakPlayer-p5bc3ddv",
    "type": "DurakPlayer",
    "props": {
      "owner": "",
      "timer": "Timer-bychlwxk",
      "hand": "Cards-5es991nc"
    },
    "connected": true,
    "actions": {
      "il7a4h5to8": {
        "id": "il7a4h5to8",
        "name": "button",
        "data": "pass",
        "params": ""
      },
      "7ovlpl46b8": {
        "id": "7ovlpl46b8",
        "name": "move",
        "data": {
          "objectId": "Card-q1h5dxye",
          "destId": "Cards-3jvvd1ya"
        },
        "params": ""
      },
    },
    "status": "",
    "defence": true,
    "index": 1,
    "winCredits": 0,
    "winStars": 0,
    "user": {
      "id": "5f56as26f2a5592cdaad66f3",
      "name": "Namw",
      "imageUrl": "/durak/meiuxkdrgboacq2sfroz.png"
    }
  }
}
```

#### Схема объекта типа DurakTrump
  * **suit**: number - текущий козырь в игре

Пример:
```json
{
  "DurakTrump-3aez5ily": {
    "id": "DurakTrump-3aez5ily",
    "type": "DurakTrump",
    "props": {
      "owner": "DurakBoard-0rg0k8mx"
    },
    "suit": 3
  }
}
```
  
#### Схема объекта типа Cards
  * **cardsSide**: string - сторона карт в контейнере:
   - "face" - карты в контейнере лицом вверх
   - "back" - карты в контейнере лицом вниз
  * **items**: string[] - массив id объектов карт в контейнере
  * **inShuffle**: boolean - флаг для анимации колоды карт (не используется)

Пример:
```json
{
 "Cards-5es991nc": {
    "id": "Cards-5es991nc",
    "type": "Cards",
    "props": {
      "owner": "DurakPlayer-p5bc3ddv"
    },
    "items": [
      "Card-q1h5dxye",
      "Card-rhu3stbk",
      "Card-ca8z2hsc",
      "Card-7a25vdou",
      "Card-1mmuslw3",
      "Card-z1f7y90u",
      "Card-rhu3stbk",
      "Card-ca8z2hsc",
      "Card-7a25vdou",
      "Card-1mmuslw3",
      "Card-z1f7y90u"
    ],
    "cardsSide": "back",
    "inShuffle": false
  },
}
```

#### Схема объекта типа Card

  * **side**: string - сторона карты
   - "face" - карта в лицом вверх
   - "back" - карта в лицом вниз
  * **data**: object - данные карты текущей стороны:
   - value: string - значение: 2-10, J, Q, K, A
   - suit: number - масть 0-3
  * **face**: object - данные карты лицевой стороны (доступно только в картах в своей руке):
   - value: string - значение: 2-10, J, Q, K, A
   - suit: number - масть 0-3
  * **back**: object - данные карты лицевой стороны (доступно только в картах в своей руке):
   - value: string - значение: 2-10, J, Q, K, A
   - suit: number - масть 0-3

Пример карты в руке противника и карты в своей руке:
```json
{
  "Card-yg1i5spe": {
    "id": "Card-yg1i5spe",
    "type": "Card",
    "props": {
      "owner": "Cards-c7qhwdl2"
    },
    "side": "back",
    "data": {
      "value": "",
      "suit": 0
    }
  },
  "Card-z1f7y90u": {
    "id": "Card-z1f7y90u",
    "type": "Card",
    "props": {
      "owner": "Cards-5es991nc"
    },
    "side": "back",
    "data": {
      "value": "",
      "suit": 0
    },
    "face": {
      "value": "8",
      "suit": 3
    },
    "back": {
      "value": "",
      "suit": 0
    }
  },
}
```

#### Схема объекта типа Timer
  * **value**: number - текущий значение таймера

Пример:
```json
{
  "Timer-bychlwxk": {
    "id": "Timer-bychlwxk",
    "type": "Timer",
    "props": {
      "owner": "DurakPlayer-p5bc3ddv"
    },
    "value": 14
  },
}
```

### Типы действий игрока
Все доступные действия игрока содержатся в коллекции actions в объекте игрока. 
| Name   | Описание                                 | 
| :----- | :--------------------------------------- | 
| place  | Смена места игрока                       |
| move   | Перемещение карты                        |
| button | Кнопка действия ("пас", "бито", "готов") |
| undo   | Отмена хода                              |

#### data действия place
  * **data**: number - номер слота

Пример:
```json
{
  "actions": {
    "il7a4h5to8": {
      "id": "il7a4h5to8",
      "name": "place",
      "data": "0",
      "params": ""
    }
  }
}
```

#### data действия move и undo
* **data**: object
  - objectId: string - id перемещаемого объекта
  - destId: string - id контейнера куда перемещается объект
  - type: string - тип перемещения ("" - переместить, "reflect" - перевести)

Пример:
```json
{
  "actions": {
    "7ovlpl46b8": {
      "id": "7ovlpl46b8",
      "name": "move",
      "data": {
        "objectId": "Card-q1h5dxye",
        "destId": "Cards-3jvvd1ya"
      },
      "params": ""
    },
    "7ovlasd46b8": {
      "id": "7ovlasd46b8",
      "name": "undo",
      "data": {
        "objectId": "Card-qaa5dxye",
        "destId": "Cards-3jvdd1ya"
      },
      "params": ""
    },
  }
}
```

#### data действия button
  * **data**: string
    - "pass" - "пас" или "бито"
    - "ready" - готов играть
    - "open" - открыть стол

Пример:
```json
{
  "actions": {
    "il7a4hdxcv": {
      "id": "il7a4hdxcv",
      "name": "button",
      "data": "pass",
      "params": ""
    },
    "il7a4h5sdd": {
      "id": "il7a4h5sdd",
      "name": "button",
      "data": "ready",
      "params": ""
    },
    "il74asto8": {
      "id": "il74asto8",
      "name": "button",
      "data": "open",
      "params": ""
    }
  }
}
```

### Взаимодействия сервера и клиентов

При подключении клиента, сервер отправляет на клиент все текущее состояние игры. При изменения состояни, сервер синхронизирует их со всеми клиентами.

Пример:
```js
room.onPatch((patch) => { ... }) // patch - изменение состояния
room.onSnapshot((snapshot) => { ... }) // sbapshot - все состояние
room.onMessage("update_player", (data) => { ... }) // data - изменение профиля игрока
```

Пример изменения состояния:
1. Один из игроков потерял связь: В объекте игрока параметр connected поменяет значение с true на false. 
2. Игрок пошел картой: В объекте карты поменяется параметр owner c id объекта руки игрока на id объект слота на столе.

#### Формат изменений отправляемых на клиент (patch)
Сообщения передаются через websocket соединение и декодируются magx-client библиотекой в [JsonPatch](http://jsonpatch.com/) формат:
```js
{
  op: 'replace',
  path: '/objects/Player-0/connected',
  value: false
}

{
  op: 'replace',
  path: '/objects/Card-0/owner',
  value: 'Slots-0'
}
```
#### Сообщения 
Клиент не может изменять состояние игры напрямую, только отправляю сообщения на сервер через библиотеку [magx-client](https://github.com/udamir/magx-client):

Пример:
```js
  room.send("action", { actionId: "il74asto8" }) // выполнить действие
  room.send("surrender") // сдаться
  room.send("invite", userId) // пригласить друга
  room.send("addbot") // добавить бота (временное действие)
```
