# ==========================================================================
# TELEGRAM BOT CONTROLLER - MONOPOLY UKRAINE
# ==========================================================================

import os
import json
import time
import urllib.request
import urllib.parse

CONFIG_FILE = 'config.json'
DEFAULT_TOKEN = ''

DB_BIN_ID = "deaeead"
DB_URL = f"https://extendsclass.com/api/json-storage/bin/{DB_BIN_ID}"

def db_load():
    req = urllib.request.Request(DB_URL, method='GET')
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        print(f"Помилка завантаження БД з хмари: {e}")
        return {"telegram_chat_id": None, "users": []}

def db_save(data):
    req = urllib.request.Request(
        DB_URL, 
        data=json.dumps(data).encode('utf-8'), 
        headers={"Content-Type": "application/json"}, 
        method='PUT'
    )
    try:
        with urllib.request.urlopen(req) as response:
            res = json.loads(response.read().decode('utf-8'))
            return res.get("status") == 0
    except Exception as e:
        print(f"Помилка збереження БД в хмару: {e}")
        return False

def save_user(chat_id):
    db = db_load()
    if "users" not in db:
        db["users"] = []
    if chat_id not in db["users"]:
        db["users"].append(chat_id)
        db_save(db)
        print(f"Користувач {chat_id} збережений в БД.")

def load_config():
    # Проверяем переменные окружения (для безопасного запуска на хостинге)
    env_token = os.environ.get("TELEGRAM_TOKEN")
    env_web_url = os.environ.get("WEB_APP_URL")
    env_ws_url = os.environ.get("WS_SERVER_URL")
    
    if env_token:
        return {
            "telegram_token": env_token,
            "web_app_url": env_web_url or "https://dmitriykachan.github.io/monopoly/?v=7",
            "ws_server_url": env_ws_url or "wss://jiubehb-monopoly-backend.hf.space"
        }

    if not os.path.exists(CONFIG_FILE):
        config = {
            "telegram_token": DEFAULT_TOKEN,
            "web_app_url": "https://dmitriykachan.github.io/monopoly/?v=7",
            "ws_server_url": "wss://jiubehb-monopoly-backend.hf.space"
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

def post_changelog(token, chat_id, web_app_url):
    photo_url = "https://dmitriykachan.github.io/monopoly/assets/changelog_v31.png"
    
    changelog_text = (
        "📢 *ОНОВЛЕННЯ МОНОПОЛІЯ УКРАЇНА: ВЕРСІЯ v31* 📢\n\n"
        "Магнати, ми підготували для вас велике оновлення гри! Що змінилося:\n\n"
        "🛡️ *Класична Тюрма замість Укриття:*\n"
        "• Клітка 'Укриття' тепер офіційно стала *Тюрмою*.\n"
        "• Клітка 'Повітряна тривога' тепер називається *'Іди в Тюрму'*.\n"
        "• Донати волонтерам при виході замінено на сплату класичного штрафу ₴500.\n"
        "• Оновлено всі лог-повідомлення та картки Шансу відповідно до класичних правил.\n\n"
        "🎯 *Оновлене позиціонування фішок:*\n"
        "• Фішки тепер розташовані у верхній половині клітин і не перекривають ціну та філії внизу.\n\n"
        "🎉 *Оптимізація конфетті:*\n"
        "• Конфетті більше не заважає при звичайних покупках, а стріляє тільки на великих подіях (виграш в грі, джекпот Фонду або бонусні гроші з Шансу).\n\n"
        "🔍 *Повна інспекція ячейок:*\n"
        "• Тепер можна клікнути на *будь-яку* ячейку на полі для перегляду детальної інформації про ціни, оренду або правила клітини.\n\n"
        "⚡️ *Автоматичне скидання кэшу:* більше жодних проблем зі старими версіями на смартфонах!\n\n"
        "🎮 Натискайте кнопку нижче та розпочинайте гру на новій версії!"
    )

    import time
    dynamic_url = web_app_url
    cache_bust = f"t={int(time.time())}"
    if "?" in dynamic_url:
        dynamic_url = f"{dynamic_url}&{cache_bust}"
    else:
        dynamic_url = f"{dynamic_url}?{cache_bust}"

    keyboard = {
        "inline_keyboard": [
            [
                {
                    "text": "Грати в оновлену версію 🏦🎮",
                    "web_app": {"url": dynamic_url}
                }
            ]
        ]
    }

    params = {
        "chat_id": chat_id,
        "photo": photo_url,
        "caption": changelog_text,
        "parse_mode": "Markdown",
        "reply_markup": keyboard
    }
    return api_request(token, "sendPhoto", params)

def main():
    config = load_config()
    token = config.get("telegram_token")
    web_app_url = config.get("web_app_url")
    ws_server_url = config.get("ws_server_url", "")
    
    if ws_server_url:
        param = urllib.parse.urlencode({"ws_server": ws_server_url})
        if "?" in web_app_url:
            web_app_url = f"{web_app_url}&{param}"
        else:
            web_app_url = f"{web_app_url}?{param}"
    
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
    
    # Встановлюємо кнопку меню (Menu Button) для швидкого запуску WebApp з останнім URL
    try:
        menu_button_params = {
            "menu_button": {
                "type": "web_app",
                "text": "Грати 🏦🎮",
                "web_app": {"url": web_app_url}
            }
        }
        res = api_request(token, "setChatMenuButton", menu_button_params)
        if res and res.get("ok"):
            print("Кнопка меню WebApp успішно налаштована!")
        else:
            print(f"Не вдалося налаштувати кнопку меню: {res}")
    except Exception as e:
        print(f"Помилка при встановленні кнопки меню: {e}")
        
    print("Початок прослуховування повідомлень (Long Polling)... Натисніть Ctrl+C для виходу.")
    print("-" * 60)

    # Сбрасываем очередь старых обновлений при старте, чтобы не отвечать на старые сообщения
    try:
        print("Скидання черги старих повідомлень...")
        clear_updates = api_request(token, "getUpdates", {"offset": -1, "timeout": 0})
        if clear_updates and clear_updates.get("ok") and clear_updates["result"]:
            offset = clear_updates["result"][-1]["update_id"] + 1
            print(f"Чергу скинуто. Поточний offset: {offset}")
        else:
            offset = 0
    except Exception as e:
        print(f"Помилка при скиданні черги: {e}")
        offset = 0
    while True:
        try:
            updates = api_request(token, "getUpdates", {"offset": offset, "timeout": 20})
            if updates and updates.get("ok"):
                for update in updates["result"]:
                    offset = update["update_id"] + 1
                    
                    msg = None
                    if "message" in update:
                        msg = update["message"]
                    elif "channel_post" in update:
                        msg = update["channel_post"]
                        
                    if msg:
                        chat_id = msg["chat"]["id"]
                        user = msg.get("from", {}) if msg.get("from") else None
                        first_name = user.get("first_name", "Гість") if user else "Канал"
                        text = msg.get("text", "")
                        
                        chat_type = msg.get("chat", {}).get("type")
                        is_private = chat_type == "private"
                        is_channel = chat_type == "channel"
                        
                        if is_private:
                            save_user(chat_id)
                            # Видаляємо будь-які повідомлення користувача в ЛС, крім команд запуску та розсилки,
                            # щоб чат залишався візуально "тільки для читання", як новинний канал!
                            if text != "/start" and not text.startswith("/broadcast_changelog") and not text.startswith("/post_changelog") and text != "":
                                try:
                                    api_request(token, "deleteMessage", {"chat_id": chat_id, "message_id": msg["message_id"]})
                                except Exception as e:
                                    print(f"Не вдалося видалити повідомлення: {e}")
                        
                        if text.startswith("/start"):
                            # Извлекаем код комнаты (если он передан)
                            # Формат: "/start 1234" -> "1234"
                            room_code = None
                            parts = text.split(" ")
                            if len(parts) > 1:
                                room_code = parts[1].strip()

                            # Load config dynamically to read updated ws_server_url without restart
                            try:
                                dynamic_config = load_config()
                                dynamic_web_app_url = dynamic_config.get("web_app_url")
                                dynamic_ws_server_url = dynamic_config.get("ws_server_url", "")
                                
                                # Автоматический сброс кэша по timestamp
                                cache_bust = f"t={int(time.time())}"
                                if "?" in dynamic_web_app_url:
                                    dynamic_web_app_url = f"{dynamic_web_app_url}&{cache_bust}"
                                else:
                                    dynamic_web_app_url = f"{dynamic_web_app_url}?{cache_bust}"

                                if dynamic_ws_server_url:
                                    param = urllib.parse.urlencode({"ws_server": dynamic_ws_server_url})
                                    dynamic_web_app_url = f"{dynamic_web_app_url}&{param}"

                                # Добавляем код комнаты в ссылку запуска
                                if room_code and len(room_code) == 4:
                                    dynamic_web_app_url = f"{dynamic_web_app_url}&tgWebAppStartParam={room_code}"
                            except Exception as e:
                                print(f"Помилка при читанні конфігурації: {e}")
                                dynamic_web_app_url = f"{web_app_url}&t={int(time.time())}" if "?" in web_app_url else f"{web_app_url}?t={int(time.time())}"
                                if room_code and len(room_code) == 4:
                                    dynamic_web_app_url = f"{dynamic_web_app_url}&tgWebAppStartParam={room_code}"
                            
                            if room_code and len(room_code) == 4:
                                welcome_msg = (
                                    f"Привіт, {first_name}! 🎮🇺🇦\n\n"
                                    f"Твій друг запросив тебе приєднатися до гри в *Монополію Україна*!\n\n"
                                    f"Кімната для підключення: *{room_code}*.\n\n"
                                    "Натискай кнопку нижче та відразу заходь у лобі очікування! 👇"
                                )
                                button_text = "Приєднатися до гри 🏦🎮"
                            else:
                                welcome_msg = (
                                    f"Привіт, {first_name}! 🏦🇺🇦\n\n"
                                    "Ласкаво просимо до *Монополії Україна* — преміальної бізнес-стратегії прямо в Telegram!\n\n"
                                    "💼 *Твоя мета:* Створити найпотужнішу імперію брендів, викупити АТБ, Нову Пошту, Монобанк, будувати прибуткові філії та збанкрутувати суперників!\n\n"
                                    "⚡️ *Особливості гри:*\n"
                                    "• Нативне запрошення друзів одним кліком\n"
                                    "• Зручна система торгівлі та обміну\n"
                                    "• Розумний автономний бот АТБ-Борис 🤖 для одиночної гри\n"
                                    "• Преміальний 3D-дизайн та неонові ефекти\n\n"
                                    "Натискай кнопку нижче та розпочинай свою бізнес-імперію прямо зараз! 👇"
                                )
                                button_text = "Грати в Монополію 🏦🎮"
                            
                            # Inline Keyboard Markup with WebApp link
                            keyboard = {
                                "inline_keyboard": [
                                    [
                                        {
                                            "text": button_text,
                                            "web_app": {"url": dynamic_web_app_url}
                                        }
                                    ]
                                ]
                            }
                            
                            api_request(token, "sendMessage", {
                                "chat_id": chat_id,
                                "text": welcome_msg,
                                "parse_mode": "Markdown",
                                "reply_markup": keyboard
                            })
                            print(f"Надіслано привітання для {user.get('username', first_name) if user else 'Користувач'}")
                            
                        elif text.startswith("/setup_channel"):
                            is_authorized = is_private or is_channel
                            if not is_authorized and user:
                                user_id = user.get("id")
                                chat_member = api_request(token, "getChatMember", {"chat_id": chat_id, "user_id": user_id})
                                if chat_member and chat_member.get("ok"):
                                    status = chat_member["result"].get("status")
                                    if status in ["creator", "administrator"]:
                                        is_authorized = True
                            
                            if is_authorized:
                                try:
                                    db = db_load()
                                    db["telegram_chat_id"] = chat_id
                                    db_save(db)
                                except Exception as e:
                                    print(f"Помилка запису в БД: {e}")

                                if not is_private and not is_channel:
                                    permissions = {
                                        "can_send_messages": False,
                                        "can_send_media_messages": False,
                                        "can_send_polls": False,
                                        "can_send_other_messages": False,
                                        "can_add_web_page_previews": False,
                                        "can_change_info": False,
                                        "can_invite_users": True,
                                        "can_pin_messages": False
                                    }
                                    api_request(token, "setChatPermissions", {"chat_id": chat_id, "permissions": permissions})

                                # Для каналов мы удаляем команду /setup_channel, чтобы не засорять ленту
                                if is_channel:
                                    try:
                                        api_request(token, "deleteMessage", {"chat_id": chat_id, "message_id": msg["message_id"]})
                                    except Exception:
                                        pass
                                else:
                                    api_request(token, "sendMessage", {
                                        "chat_id": chat_id,
                                        "text": "✅ *Канал оновлень успішно налаштовано!*\n\nБот встановив режим 'Тільки для читання' для користувачів та публікує повідомлення про оновлення...",
                                        "parse_mode": "Markdown"
                                    })

                                post_changelog(token, chat_id, config.get("web_app_url"))
                            else:
                                api_request(token, "sendMessage", {
                                    "chat_id": chat_id,
                                    "text": "❌ Налаштувати канал може тільки адміністратор або творець чату!",
                                })

                        elif text.startswith("/post_changelog"):
                            is_authorized = is_private or is_channel
                            if not is_authorized and user:
                                user_id = user.get("id")
                                chat_member = api_request(token, "getChatMember", {"chat_id": chat_id, "user_id": user_id})
                                is_admin = False
                                if chat_member and chat_member.get("ok"):
                                    status = chat_member["result"].get("status")
                                    if status in ["creator", "administrator"]:
                                        is_admin = True
                                if is_admin:
                                    is_authorized = True
                            
                            if is_authorized:
                                # Для каналов удаляем команду, чтобы не засорять
                                if is_channel:
                                    try:
                                        api_request(token, "deleteMessage", {"chat_id": chat_id, "message_id": msg["message_id"]})
                                    except Exception:
                                        pass
                                config = load_config()
                                post_changelog(token, chat_id, config.get("web_app_url"))
                            else:
                                api_request(token, "sendMessage", {
                                    "chat_id": chat_id,
                                    "text": "❌ Надсилати ченджлог може тільки адміністратор!",
                                })

                        elif text.startswith("/broadcast_changelog"):
                            user_id = user.get("id") if user else None
                            config = load_config()
                            db = db_load()
                            channel_chat_id = db.get("telegram_chat_id")
                            
                            # Админом является тот, чей chat_id указан в telegram_chat_id (если это приват),
                            # либо администратор настроенного канала обновлений
                            is_authorized = False
                            if chat_id == channel_chat_id and is_private:
                                is_authorized = True
                            
                            if channel_chat_id and not is_authorized and user_id:
                                chat_member = api_request(token, "getChatMember", {"chat_id": channel_chat_id, "user_id": user_id})
                                if chat_member and chat_member.get("ok"):
                                    status = chat_member["result"].get("status")
                                    if status in ["creator", "administrator"]:
                                        is_authorized = True
                            
                            # Для удобства тестирования разрешаем, если чат приватный
                            if is_private:
                                is_authorized = True
                                
                            if is_authorized:
                                users = db.get("users", [])
                                
                                if not users:
                                    api_request(token, "sendMessage", {
                                        "chat_id": chat_id,
                                        "text": "❌ Список користувачів порожній! Нікому надсилати оновлення.",
                                    })
                                    continue
                                
                                api_request(token, "sendMessage", {
                                    "chat_id": chat_id,
                                    "text": f"🚀 Початок розсилки оновлень для {len(users)} користувачів...",
                                })
                                
                                success_count = 0
                                for u_id in users:
                                    try:
                                        res = post_changelog(token, u_id, config.get("web_app_url"))
                                        if res and res.get("ok"):
                                            success_count += 1
                                        time.sleep(0.05) # Лимиты Telegram API
                                    except Exception as e:
                                        print(f"Помилка надсилання до {u_id}: {e}")
                                
                                api_request(token, "sendMessage", {
                                    "chat_id": chat_id,
                                    "text": f"✅ Розсилку завершено! Успішно надіслано: {success_count} з {len(users)}.",
                                })
                            else:
                                api_request(token, "sendMessage", {
                                    "chat_id": chat_id,
                                    "text": "❌ У вас немає прав для запуску розсилки!",
                                })
            
        except KeyboardInterrupt:
            print("\nБот зупинений.")
            break
        except Exception as e:
            print(f"Помилка в циклі: {e}")
            time.sleep(2)

if __name__ == '__main__':
    main()
