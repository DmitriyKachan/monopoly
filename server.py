# ==========================================================================
# REAL-TIME MULTIPLAYER GAME SERVER - MONOPOLY UKRAINE
# ==========================================================================

import asyncio
import json
import random
import websockets

# Store active game rooms
# Format: { room_code: { "clients": set(), "players": [ { "id": idx, "name": name, "avatar": avatar, "socket": ws } ] } }
ROOMS = {}

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
            
            if msg_type == "create":
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
                        "is_host": True
                    }]
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
                    "is_host": False
                })
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
