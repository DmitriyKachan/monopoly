# ==========================================================================
# TELEGRAM BOT CONTROLLER - MONOPOLY UKRAINE
# ==========================================================================

import os
import json
import time
import urllib.request
import urllib.parse

CONFIG_FILE = 'config.json'
DEFAULT_TOKEN = '8954602175:AAGuHQ-UmyqGsgGlxcQ8m_VyIHoRAGUMFZA'

def load_config():
    if not os.path.exists(CONFIG_FILE):
        config = {
            "telegram_token": DEFAULT_TOKEN,
            "web_app_url": "https://dmytro-monopoly.github.io/" # Example URL. Replace with your actual HTTPS URL
        }
        with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
            json.dump(config, f, indent=4, ensure_ascii=False)
        return config
    
    with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def api_request(token, method, params=None):
    url = f"https://api.telegram.org/bot{token}/{method}"
    headers = {"Content-Type": "application/json"}
    
    data = json.dumps(params).encode('utf-8') if params else None
    req = urllib.request.Request(url, data=data, headers=headers, method='POST' if data else 'GET')
    
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        try:
            error_body = e.read().decode('utf-8')
            print(f"Помилка API ({method}) HTTP {e.code}: {error_body}")
        except Exception:
            print(f"Помилка API ({method}): {e}")
        return None
    except Exception as e:
        print(f"Помилка запиту до API ({method}): {e}")
        return None

def main():
    config = load_config()
    token = config.get("telegram_token")
    web_app_url = config.get("web_app_url")
    
    print("=" * 60)
    print("   МОНОПОЛІЯ УКРАЇНА - TELEGRAM БОТ ЗАПУСКАЄТЬСЯ")
    print("=" * 60)
    print(f"Токен: {token[:10]}...{token[-10:]}")
    print(f"URL додатку (WebApp): {web_app_url}")
    print("Редагуйте config.json, щоб змінити токен або URL.")
    print("-" * 60)
    
    # Verify bot identity
    me = api_request(token, "getMe")
    if not me or not me.get("ok"):
        print("ПОМИЛКА: Невірний токен або немає підключення до мережі.")
        return
    
    bot_info = me["result"]
    print(f"Бот успішно підключений: @{bot_info['username']} ({bot_info['first_name']})")
    print("Початок прослуховування повідомлень (Long Polling)... Натисніть Ctrl+C для виходу.")
    print("-" * 60)

    offset = 0
    while True:
        try:
            updates = api_request(token, "getUpdates", {"offset": offset, "timeout": 20})
            if updates and updates.get("ok"):
                for update in updates["result"]:
                    offset = update["update_id"] + 1
                    
                    if "message" in update:
                        msg = update["message"]
                        chat_id = msg["chat"]["id"]
                        user = msg.get("from", {})
                        first_name = user.get("first_name", "Гість")
                        text = msg.get("text", "")
                        
                        if text == "/start":
                            welcome_msg = (
                                f"Вітаємо, {first_name}! 🇺🇦🏦\n\n"
                                "Ласкаво просимо до Монополії з відомими українськими брендами.\n"
                                "Купуйте АТБ, Нову Пошту, Монобанк, будуйте філії та збирайте капітал у гривнях!\n\n"
                                "Натисніть кнопку нижче, щоб розпочати гру прямо в Telegram:"
                            )
                            
                            # Inline Keyboard Markup with WebApp link
                            keyboard = {
                                "inline_keyboard": [
                                    [
                                        {
                                            "text": "Грати в Монополію 🏦🎮",
                                            "web_app": {"url": web_app_url}
                                        }
                                    ]
                                ]
                            }
                            
                            api_request(token, "sendMessage", {
                                "chat_id": chat_id,
                                "text": welcome_msg,
                                "reply_markup": keyboard
                            })
                            print(f"Надіслано привітання для {user.get('username', first_name)}")
            
        except KeyboardInterrupt:
            print("\nБот зупинений.")
            break
        except Exception as e:
            print(f"Помилка в циклі: {e}")
            time.sleep(2)

if __name__ == '__main__':
    main()
