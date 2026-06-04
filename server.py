# ==========================================================================
# REAL-TIME MULTIPLAYER GAME SERVER - MONOPOLY UKRAINE
# ==========================================================================

import asyncio
import json
import random
import websockets

import os

# Import psycopg2 for database compatibility
try:
    import psycopg2
except ImportError:
    psycopg2 = None

# Store active game rooms
# Format: { room_code: { "clients": set(), "players": [ { "id": idx, "name": name, "avatar": avatar, "socket": ws } ] } }
ROOMS = {}

LEADERBOARD_FILE = "leaderboard.json"
LEADERBOARD = {}

DATABASE_URL = os.environ.get("DATABASE_URL")
if not psycopg2:
    DATABASE_URL = None

DB_CONN = None

def get_db_connection():
    global DB_CONN
    if not DATABASE_URL:
        return None
    try:
        if DB_CONN is None or DB_CONN.closed != 0:
            print("Підключення до бази даних PostgreSQL...")
            DB_CONN = psycopg2.connect(DATABASE_URL)
            DB_CONN.autocommit = True
        return DB_CONN
    except Exception as e:
        print(f"Помилка підключення до PostgreSQL: {e}")
        DB_CONN = None
        return None

def init_db():
    conn = get_db_connection()
    if conn:
        try:
            with conn.cursor() as cursor:
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS leaderboard (
                        name TEXT PRIMARY KEY,
                        avatar TEXT,
                        wins INTEGER,
                        games INTEGER,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                """)
                cursor.execute("""
                    CREATE INDEX IF NOT EXISTS idx_leaderboard_sorting ON leaderboard (wins DESC, games DESC);
                """)
                print("Базу даних PostgreSQL успішно ініціалізовано.")
        except Exception as e:
            print(f"Помилка ініціалізації бази даних: {e}")

def query_db(query, params=None, fetch=False):
    conn = get_db_connection()
    if not conn:
        return None
    try:
        with conn.cursor() as cursor:
            cursor.execute(query, params)
            if fetch:
                return cursor.fetchall()
            return True
    except psycopg2.OperationalError as e:
        print(f"Operational error in DB connection, attempting reconnect: {e}")
        global DB_CONN
        DB_CONN = None
        conn = get_db_connection()
        if conn:
            try:
                with conn.cursor() as cursor:
                    cursor.execute(query, params)
                    if fetch:
                        return cursor.fetchall()
                    return True
            except Exception as ex:
                print(f"Reconnect retry failed: {ex}")
        return None
    except Exception as e:
        print(f"Помилка запиту до БД: {e}")
        return None

def load_leaderboard():
    global LEADERBOARD
    if DATABASE_URL:
        return
    if os.path.exists(LEADERBOARD_FILE):
        try:
            with open(LEADERBOARD_FILE, "r", encoding="utf-8") as f:
                LEADERBOARD = json.load(f)
            print(f"Завантажено {len(LEADERBOARD)} гравців у лідерборд")
        except Exception as e:
            print(f"Помилка завантаження лідерборду: {e}")
            LEADERBOARD = {}
    else:
        LEADERBOARD = {}

def save_leaderboard():
    if DATABASE_URL:
        return
    try:
        with open(LEADERBOARD_FILE, "w", encoding="utf-8") as f:
            json.dump(LEADERBOARD, f, indent=4, ensure_ascii=False)
    except Exception as e:
        print(f"Помилка збереження лідерборду: {e}")

if DATABASE_URL:
    init_db()
else:
    load_leaderboard()

async def broadcast_to_room(room_code, message, exclude_ws=None):
    if room_code not in ROOMS:
        return
    
    clients = ROOMS[room_code]["clients"]
    data = json.dumps(message)
    
    for ws in clients:
        if ws != exclude_ws:
            try:
                await ws.send(data)
            except Exception:
                pass

async def handle_connection(websocket):
    current_room = None
    player_name = "Гість"
    
    try:
        async for message in websocket:
            data = json.loads(message)
            msg_type = data.get("type")
            
            if msg_type == "get_profile":
                tg_id = data.get("tg_id")
                username = data.get("username")
                if tg_id:
                    import bot
                    tg_id_str = str(tg_id)
                    def init_profile(db):
                        if "user_data" not in db:
                            db["user_data"] = {}
                        if tg_id_str not in db["user_data"]:
                            db["user_data"][tg_id_str] = {"coins": 0, "purchased_frames": []}
                    
                    bot.update_db(init_profile)
                    
                    is_admin = False
                    try:
                        config = bot.load_config()
                        admins = config.get("admins", ["670845978"])
                        if str(tg_id) in [str(a) for a in admins]:
                            is_admin = True
                    except Exception as ex:
                        print(f"Помилка авторизації адміна: {ex}")
                    
                    db = bot.db_load()
                    if db and "user_data" in db and tg_id_str in db["user_data"]:
                        user_wallet = db["user_data"][tg_id_str]
                        await websocket.send(json.dumps({
                            "type": "profile_data",
                            "coins": user_wallet.get("coins", 0),
                            "purchased_frames": user_wallet.get("purchased_frames", []),
                            "is_admin": is_admin
                        }))
                    else:
                        await websocket.send(json.dumps({
                            "type": "error",
                            "message": "Не вдалося завантажити профіль з бази даних."
                        }))
                    
            elif msg_type == "buy_frame":
                tg_id = data.get("tg_id")
                frame_id = data.get("frame_id")
                
                # Стоимость рамок
                FRAME_PRICES = {
                    "neon": 100,
                    "gold": 250,
                    "rainbow": 500
                }
                
                if tg_id and frame_id in FRAME_PRICES:
                    import bot
                    price = FRAME_PRICES[frame_id]
                    tg_id_str = str(tg_id)
                    
                    result = {"status": "error", "message": "Невідома помилка", "coins": 0}
                    
                    def perform_purchase(db):
                        if "user_data" not in db:
                            db["user_data"] = {}
                        if tg_id_str not in db["user_data"]:
                            db["user_data"][tg_id_str] = {"coins": 0, "purchased_frames": []}
                            
                        user_data = db["user_data"][tg_id_str]
                        current_coins = user_data.get("coins", 0)
                        purchased = user_data.get("purchased_frames", [])
                        
                        if frame_id in purchased:
                            result["status"] = "already_purchased"
                            result["coins"] = current_coins
                        elif current_coins >= price:
                            user_data["coins"] = current_coins - price
                            if frame_id not in purchased:
                                purchased.append(frame_id)
                            user_data["purchased_frames"] = purchased
                            db["user_data"][tg_id_str] = user_data
                            
                            result["status"] = "success"
                            result["coins"] = user_data["coins"]
                        else:
                            result["status"] = "insufficient_funds"
                            result["coins"] = current_coins
                    
                    if bot.update_db(perform_purchase):
                        if result["status"] in ["success", "already_purchased"]:
                            await websocket.send(json.dumps({
                                "type": "buy_frame_success",
                                "frame_id": frame_id,
                                "coins": result["coins"]
                            }))
                            if result["status"] == "success":
                                print(f"Игрок {tg_id_str} успешно купил рамку {frame_id} за {price} коинов.")
                        elif result["status"] == "insufficient_funds":
                            await websocket.send(json.dumps({
                                "type": "error",
                                "message": f"Недостатньо Моно-Коїнів! Потрібно: 🪙{price}, у вас: 🪙{result['coins']}"
                            }))
                    else:
                        await websocket.send(json.dumps({
                            "type": "error",
                            "message": "Не вдалося зберегти покупку в базі даних. Спробуйте ще раз."
                        }))
                        
            elif msg_type == "get_invoice":
                tg_id = data.get("tg_id")
                package = data.get("package")
                
                # Стоимость пакетов
                PACK_VALUES = {
                    "pack_50": {"title": "50 Моно-Коїнів 🪙", "amount": 50, "coins": 50},
                    "pack_120": {"title": "120 Моно-Коїнів 🪙", "amount": 100, "coins": 120},
                    "pack_300": {"title": "300 Моно-Коїнів 🪙", "amount": 200, "coins": 300}
                }
                
                if tg_id and package in PACK_VALUES:
                    import bot
                    pack = PACK_VALUES[package]
                    token = bot.load_config().get("telegram_token")
                    
                    payload = f"{package}_{tg_id}"
                    desc = f"Пакет монет для придбання унікальних анімованих рамок профілю в грі Монополія Україна."
                    
                    invoice_link = bot.create_invoice_link(token, pack["title"], desc, payload, pack["amount"])
                    if invoice_link:
                        await websocket.send(json.dumps({
                            "type": "invoice_link",
                            "url": invoice_link
                        }))
                    else:
                        await websocket.send(json.dumps({
                            "type": "error",
                            "message": "Не вдалося згенерувати посилання на оплату. Спробуйте пізніше."
                        }))

            elif msg_type == "admin_set_coins":
                admin_tg_id = data.get("admin_tg_id")
                admin_username = data.get("admin_username")
                
                is_authorized = False
                import bot
                try:
                    config = bot.load_config()
                    admins = config.get("admins", ["670845978"])
                    if admin_tg_id and str(admin_tg_id) in [str(a) for a in admins]:
                        is_authorized = True
                except Exception as ex:
                    print(f"Помилка перевірки адміна: {ex}")

                if not is_authorized:
                    await websocket.send(json.dumps({
                        "type": "error",
                        "message": "Помилка доступу: Ви не є адміністратором!"
                    }))
                    continue
                
                target_tg_id = data.get("target_tg_id")
                coins_val = int(data.get("coins", 0))
                
                if target_tg_id:
                    target_id_str = str(target_tg_id)
                    
                    def update_target_coins(db):
                        if "user_data" not in db:
                            db["user_data"] = {}
                        if target_id_str not in db["user_data"]:
                            db["user_data"][target_id_str] = {"coins": 0, "purchased_frames": []}
                        db["user_data"][target_id_str]["coins"] = coins_val
                        
                    if bot.update_db(update_target_coins):
                        for room_code, room in list(ROOMS.items()):
                            if "websockets" in room:
                                for p_idx, p in enumerate(room["players"]):
                                    if str(p.get("tg_id")) == target_id_str:
                                        target_ws = room["websockets"].get(p["id"])
                                        if target_ws:
                                            try:
                                                db = bot.db_load()
                                                u_data = db.get("user_data", {}).get(target_id_str, {})
                                                await target_ws.send(json.dumps({
                                                    "type": "profile_data",
                                                    "coins": u_data.get("coins", 0),
                                                    "purchased_frames": u_data.get("purchased_frames", []),
                                                    "is_admin": target_id_str in [str(a) for a in config.get("admins", ["dmitriykachan"])]
                                                }))
                                            except Exception as e:
                                                print(f"Error syncing target: {e}")
                        
                        if str(admin_tg_id) == target_id_str:
                            db = bot.db_load()
                            u_data = db.get("user_data", {}).get(target_id_str, {})
                            await websocket.send(json.dumps({
                                "type": "profile_data",
                                "coins": u_data.get("coins", 0),
                                "purchased_frames": u_data.get("purchased_frames", []),
                                "is_admin": True,
                                "debug_db_raw": json.dumps(db.get("user_data", {}).get(target_id_str, {})),
                                "debug_db_success": "True"
                            }))
                        else:
                            await websocket.send(json.dumps({
                                "type": "profile_data",
                                "coins": bot.db_load().get("user_data", {}).get(str(admin_tg_id), {}).get("coins", 0),
                                "purchased_frames": bot.db_load().get("user_data", {}).get(str(admin_tg_id), {}).get("purchased_frames", []),
                                "is_admin": True,
                                "debug_db_success": "False_non_matching"
                            }))
                        print(f"Адміністратор {admin_tg_id} встановив {coins_val} коїнів для {target_id_str}")
                    else:
                        await websocket.send(json.dumps({
                            "type": "error",
                            "message": "Не вдалося зберегти зміни в базі даних."
                        }))

            elif msg_type == "create":
                # Create a new room
                room_code = str(random.randint(1000, 9999))
                while room_code in ROOMS:
                    room_code = str(random.randint(1000, 9999))
                
                player_name = data.get("name", "Організатор")
                avatar = data.get("avatar", "")
                
                ROOMS[room_code] = {
                    "clients": {websocket},
                    "players": [{
                        "id": 0,
                        "name": player_name,
                        "avatar": avatar,
                        "tg_id": data.get("tg_id"),
                        "is_host": True
                    }],
                    "websockets": {
                        0: websocket
                    }
                }
                current_room = room_code
                
                await websocket.send(json.dumps({
                    "type": "created",
                    "room_code": room_code,
                    "players": ROOMS[room_code]["players"]
                }))
                print(f"Кімнату {room_code} створено гравцем {player_name}")
                
            elif msg_type == "join":
                # Join an existing room
                room_code = data.get("room_code")
                player_name = data.get("name", "Гравець")
                avatar = data.get("avatar", "")
                
                if room_code not in ROOMS:
                    await websocket.send(json.dumps({
                        "type": "error",
                        "message": f"Кімнату {room_code} не знайдено!"
                    }))
                    continue
                
                room = ROOMS[room_code]
                if len(room["players"]) >= 4:
                    await websocket.send(json.dumps({
                        "type": "error",
                        "message": "Кімната заповнена! Максимум 4 гравці."
                    }))
                    continue
                
                # Add player to room
                player_id = len(room["players"])
                room["clients"].add(websocket)
                room["players"].append({
                    "id": player_id,
                    "name": player_name,
                    "avatar": avatar,
                    "tg_id": data.get("tg_id"),
                    "is_host": False
                })
                if "websockets" not in room:
                    room["websockets"] = {}
                room["websockets"][player_id] = websocket
                current_room = room_code
                
                # Notify sender
                await websocket.send(json.dumps({
                    "type": "joined",
                    "room_code": room_code,
                    "player_id": player_id,
                    "players": room["players"]
                }))
                
                # Broadcast player update to all clients in the room
                await broadcast_to_room(room_code, {
                    "type": "player_update",
                    "players": room["players"]
                })
                print(f"Гравець {player_name} приєднався до кімнати {room_code}")
                
            elif msg_type == "start":
                # Start game broadcast
                if current_room in ROOMS:
                    await broadcast_to_room(current_room, {
                        "type": "game_start"
                    })
                    print(f"Гру в кімнаті {current_room} розпочато!")
                    
            elif msg_type == "action":
                # Broadcast in-game updates (rolls, buys, chat reactions) to other room clients
                if current_room in ROOMS:
                    action_payload = data.get("payload")
                    await broadcast_to_room(current_room, {
                        "type": "sync_action",
                        "payload": action_payload
                    }, exclude_ws=websocket)
                    
            elif msg_type == "sync_stats":
                # Register player stats and send back top 50 leaderboard
                name = data.get("name", "Гість")
                avatar = data.get("avatar", "")
                wins = int(data.get("wins", 0))
                games = int(data.get("games", 0))
                
                # Filter/replace large base64 avatar strings to save storage space
                if avatar.startswith("data:image"):
                    avatar = "assets/cossack_tycoon.png"
                
                if DATABASE_URL:
                    # DB mode: insert/update stats
                    query_db("""
                        INSERT INTO leaderboard (name, avatar, wins, games, updated_at) 
                        VALUES (%s, %s, %s, %s, CURRENT_TIMESTAMP)
                        ON CONFLICT (name) DO UPDATE 
                        SET avatar = EXCLUDED.avatar, wins = EXCLUDED.wins, games = EXCLUDED.games, updated_at = CURRENT_TIMESTAMP
                    """, (name, avatar, wins, games))
                    
                    # Get Top 50
                    rows = query_db("SELECT name, avatar, wins, games FROM leaderboard ORDER BY wins DESC, games DESC LIMIT 50", fetch=True)
                    top50 = []
                    if rows:
                        for row in rows:
                            top50.append({
                                "name": row[0],
                                "avatar": row[1],
                                "wins": row[2],
                                "games": row[3]
                            })
                            
                    # Get Rank of current player: Count how many players have more wins, or same wins but more games
                    rank_rows = query_db("""
                        SELECT COUNT(*) FROM leaderboard 
                        WHERE wins > %s OR (wins = %s AND games > %s)
                    """, (wins, wins, games), fetch=True)
                    
                    your_rank = 1
                    if rank_rows and rank_rows[0][0] is not None:
                        your_rank = rank_rows[0][0] + 1
                else:
                    # JSON mode: insert/update stats
                    LEADERBOARD[name] = {
                        "name": name,
                        "avatar": avatar,
                        "wins": wins,
                        "games": games
                    }
                    save_leaderboard()
                    
                    # Sort players
                    sorted_board = sorted(
                        LEADERBOARD.values(),
                        key=lambda x: (x.get("wins", 0), x.get("games", 0)),
                        reverse=True
                    )
                    
                    your_rank = -1
                    for idx, player in enumerate(sorted_board):
                        if player["name"] == name:
                            your_rank = idx + 1
                            break
                    
                    top50 = [{
                        "name": p["name"],
                        "avatar": p["avatar"],
                        "wins": p["wins"],
                        "games": p["games"]
                    } for p in sorted_board[:50]]
                
                await websocket.send(json.dumps({
                    "type": "leaderboard",
                    "top50": top50,
                    "your_rank": your_rank
                }))
                    
    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        # Handle disconnect cleanups
        if current_room and current_room in ROOMS:
            room = ROOMS[current_room]
            room["clients"].discard(websocket)
            
            # Find and remove player list entry
            # In a real game we would handle reconnection, here we just remove
            room["players"] = [p for p in room["players"] if not (p["name"] == player_name)]
            
            if not room["clients"]:
                # Delete room if empty
                del ROOMS[current_room]
                print(f"Кімнату {current_room} видалено (порожня)")
            else:
                # Notify remaining players
                await broadcast_to_room(current_room, {
                    "type": "player_update",
                    "players": room["players"]
                })
                await broadcast_to_room(current_room, {
                    "type": "player_left",
                    "name": player_name
                })
                print(f"Гравець {player_name} залишив кімнату {current_room}")

async def main():
    # Runs WebSocket server on port 8765
    async with websockets.serve(handle_connection, "0.0.0.0", 8765):
        print("============================================================")
        print("   ІГРОВИЙ СЕРВЕР МУЛЬТИПЛЕЄРА (WSS) ЗАПУЩЕНО НА ПОРТУ 8765")
        print("============================================================")
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    asyncio.run(main())
