# ==========================================================================
# UNIFIED LAUNCHER - WEBSOCKET SERVER & TELEGRAM BOT
# ==========================================================================

import threading
import asyncio
import os
import http
import websockets

# Import our original modules
import server
import bot

# Port is provided by environment variable (7860 on Hugging Face, or custom PORT on Render)
PORT = int(os.environ.get("PORT", 8765))

def run_bot():
    print("🤖 Запуск Telegram-бота в фоновом потоке...")
    try:
        bot.main()
    except Exception as e:
        print(f"❌ Ошибка в работе Telegram-бота: {e}")

async def http_health_check(*args, **kwargs):
    # Версійно-незалежний обробник для сумісності з websockets 10.x та 11.x+
    path = None
    is_legacy = True
    
    if len(args) >= 2:
        first = args[0]
        second = args[1]
        if isinstance(first, str):
            path = first
            is_legacy = True
        elif hasattr(second, "path"):
            path = second.path
            is_legacy = False
            
    if path in ["/health", "/health/", "/"]:
        if is_legacy:
            return http.HTTPStatus.OK, [("Content-Type", "text/plain")], b"OK"
        else:
            try:
                from websockets.http11 import Response
                from websockets.datastructures import Headers
                return Response(200, "OK", Headers([("Content-Type", "text/plain")]), b"OK")
            except Exception:
                return http.HTTPStatus.OK, [("Content-Type", "text/plain")], b"OK"
    return None

async def run_server():
    # Запуск WebSocket-сервера с поддержкой HTTP GET запросов для пинга
    async with websockets.serve(
        server.handle_connection, 
        "0.0.0.0", 
        PORT, 
        process_request=http_health_check
    ):
        print(f"============================================================")
        print(f"   ІГРОВИЙ СЕРВЕР (WSS) ЗАПУЩЕНО НА ПОРТУ {PORT}")
        print(f"============================================================")
        await asyncio.Future()  # Бесконечное ожидание

def main():
    # Тест підключення для діагностики
    import socket
    import urllib.request
    print("Діагностика: Перевірка мережевої доступності...")
    for domain in ["google.com", "github.com", "api.telegram.org"]:
        try:
            ip = socket.gethostbyname(domain)
            print(f"Діагностика: DNS {domain} -> {ip}")
            try:
                with urllib.request.urlopen(f"https://{domain}", timeout=5) as response:
                    print(f"Діагностика: HTTPS GET {domain} успішний! Код: {response.getcode()}")
            except Exception as e:
                print(f"Діагностика: HTTPS GET {domain} помилка: {e}")
        except Exception as e:
            print(f"Діагностика: DNS {domain} помилка: {e}")

    # 1. Запускаем Telegram-бота в отдельном демоническом потоке
    bot_thread = threading.Thread(target=run_bot, daemon=True)
    bot_thread.start()
    
    # 2. Запускаем WebSocket-сервер в основном цикле событий asyncio
    try:
        asyncio.run(run_server())
    except KeyboardInterrupt:
        print("\nСервер остановлен.")

if __name__ == "__main__":
    main()
