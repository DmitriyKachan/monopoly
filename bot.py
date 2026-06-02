# ==========================================================================
# TELEGRAM BOT CONTROLLER - MONOPOLY UKRAINE
# ==========================================================================

import os
import json
import time
import urllib.request
import urllib.parse
import threading

CONFIG_FILE = 'config.json'
DEFAULT_TOKEN = ''

DB_BIN_ID = "deaeead"
DB_URL = f"https://extendsclass.com/api/json-storage/bin/{DB_BIN_ID}"
DB_LOCK = threading.Lock()

def db_load():
    req = urllib.request.Request(DB_URL, method='GET')
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=5) as response:
                data = json.loads(response.read().decode('utf-8'))
                if data is not None and isinstance(data, dict) and "users" in data:
                    return data
        except Exception as e:
            print(f"Помилка завантаження БД з хмари (спроба {attempt+1}): {e}")
            time.sleep(1)
            
    # Локальний бекап як резервний варіант
    print("Спроба завантажити дані з локального бекапу...")
    try:
        if os.path.exists("db_local_backup.json"):
            with open("db_local_backup.json", "r", encoding="utf-8") as f:
                data = json.load(f)
                if data is not None and isinstance(data, dict) and "users" in data:
                    print("Успішно завантажено локальний бекап!")
                    return data
    except Exception as e:
        print(f"Помилка читання локального бекапу: {e}")
    return None

def db_save(data):
    if not data or not isinstance(data, dict) or "users" not in data:
        print("Помилка: Спроба зберегти некоректні або порожні дані в БД!")
        return False
        
    req = urllib.request.Request(
        DB_URL, 
        data=json.dumps(data).encode('utf-8'), 
        headers={"Content-Type": "application/json"}, 
        method='PUT'
    )
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=5) as response:
                res = json.loads(response.read().decode('utf-8'))
                if res.get("status") == 0:
                    # Записуємо локальний бекап
                    try:
                        with open("db_local_backup.json", "w", encoding="utf-8") as f:
                            json.dump(data, f, indent=4, ensure_ascii=False)
                    except Exception as backup_error:
                        print(f"Помилка створення локального бекапу: {backup_error}")
                    return True
        except Exception as e:
            print(f"Помилка збереження БД в хмару (спроба {attempt+1}): {e}")
            time.sleep(1)
    return False

def update_db(update_fn):
    with DB_LOCK:
        db = db_load()
        if db is None:
            return False
        try:
            update_fn(db)
        except Exception as e:
            print(f"Помилка виконання функції оновлення БД: {e}")
            return False
        return db_save(db)

def save_user(chat_id):
    chat_id_str = str(chat_id)
    db = db_load()
    if db and "users" in db and chat_id in db["users"] and "user_data" in db and chat_id_str in db["user_data"]:
        return
        
    def update(db_to_update):
        if "users" not in db_to_update:
            db_to_update["users"] = []
        if "user_data" not in db_to_update:
            db_to_update["user_data"] = {}
        if chat_id_str not in db_to_update["user_data"]:
            db_to_update["user_data"][chat_id_str] = {"coins": 0, "purchased_frames": []}
        if chat_id not in db_to_update["users"]:
            db_to_update["users"].append(chat_id)
            
    if update_db(update):
        print(f"Користувач {chat_id} збережений в БД.")
    else:
        print(f"Помилка збереження користувача {chat_id}!")

def create_invoice_link(token, title, description, payload, amount):
    params = {
        "title": title,
        "description": description,
        "payload": payload,
        "provider_token": "", # Пусто для Telegram Stars
        "currency": "XTR",    # Валюта Telegram Stars
        "prices": [{"label": "Stars", "amount": amount}]
    }
    res = api_request(token, "createInvoiceLink", params)
    if res and res.get("ok"):
        return res["result"]
    else:
        print(f"Помилка створення інвойсу: {res}")
        return None

def load_config():
    # Проверяем переменные окружения (для безопасного запуска на хостинге)
    env_token = os.environ.get("TELEGRAM_TOKEN")
    env_web_url = os.environ.get("WEB_APP_URL")
    env_ws_url = os.environ.get("WS_SERVER_URL")
    
    if env_token:
        return {
            "telegram_token": env_token,
            "web_app_url": env_web_url or "https://dmitriykachan.github.io/monopoly/?v=35",
            "ws_server_url": env_ws_url or "wss://monopoly-backend-piny.onrender.com"
        }

    if not os.path.exists(CONFIG_FILE):
        config = {
            "telegram_token": DEFAULT_TOKEN,
            "web_app_url": "https://dmitriykachan.github.io/monopoly/?v=35",
            "ws_server_url": "wss://monopoly-backend-piny.onrender.com"
        }
        with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
            json.dump(config, f, indent=4, ensure_ascii=False)
        return config
    
    with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def get_clean_web_app_url():
    config = load_config()
    url = config.get("web_app_url", "https://dmitriykachan.github.io/monopoly/?v=35")
    try:
        parsed = urllib.parse.urlparse(url)
        params = urllib.parse.parse_qs(parsed.query)
        params['v'] = ["35"]
        new_query = urllib.parse.urlencode(params, doseq=True)
        return urllib.parse.urlunparse((
            parsed.scheme,
            parsed.netloc,
            parsed.path,
            parsed.params,
            new_query,
            parsed.fragment
        ))
    except Exception:
        return url

def api_request(token, method, params=None):
    url = f"https://api.telegram.org/bot{token}/{method}"
    headers = {"Content-Type": "application/json"}
    
    data = json.dumps(params).encode('utf-8') if params else None
    req = urllib.request.Request(url, data=data, headers=headers, method='POST' if data else 'GET')
    
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
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
    web_app_url = get_clean_web_app_url()
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
                    
                    # Обработка предзаказа (pre_checkout_query)
                    if "pre_checkout_query" in update:
                        pq = update["pre_checkout_query"]
                        pq_id = pq["id"]
                        api_request(token, "answerPreCheckoutQuery", {"pre_checkout_query_id": pq_id, "ok": True})
                        print(f"Дано відповідь на предзаказ {pq_id}")
                        continue
                    
                    msg = None
                    if "message" in update:
                        msg = update["message"]
                    elif "channel_post" in update:
                        msg = update["channel_post"]
                        
                    if msg:
                        # Проверяем успешный платеж
                        if "successful_payment" in msg:
                            sp = msg["successful_payment"]
                            payload = sp.get("invoice_payload", "")
                            if payload.startswith("pack_"):
                                try:
                                    parts = payload.split("_")
                                    pack_type = parts[0] + "_" + parts[1] # "pack_50"
                                    pay_user_id = parts[2] # "USERID"
                                    
                                    coins_to_add = 0
                                    if "pack_50" in pack_type:
                                        coins_to_add = 50
                                    elif "pack_120" in pack_type:
                                        coins_to_add = 120
                                    elif "pack_300" in pack_type:
                                        coins_to_add = 300
                                        
                                    if coins_to_add > 0:
                                        u_id_str = str(pay_user_id)
                                        def update_coins(db):
                                            if "user_data" not in db:
                                                db["user_data"] = {}
                                            if u_id_str not in db["user_data"]:
                                                db["user_data"][u_id_str] = {"coins": 0, "purchased_frames": []}
                                            db["user_data"][u_id_str]["coins"] += coins_to_add
                                            
                                        if update_db(update_coins):
                                            api_request(token, "sendMessage", {
                                                "chat_id": pay_user_id,
                                                "text": f"✅ *Оплата успішна!*\n\nНа ваш баланс зараховано *{coins_to_add}* Моно-Коїнів 🪙. Дякуємо за підтримку гри!",
                                                "parse_mode": "Markdown"
                                            })
                                            print(f"Успішне нарахування {coins_to_add} коїнів користувачу {pay_user_id}")
                                        else:
                                            print(f"Помилка збереження БД при нарахуванні {coins_to_add} коїнів користувачу {pay_user_id}!")
                                except Exception as e:
                                    print(f"Помилка обробки платежу {payload}: {e}")
                            continue

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
                            if not text.startswith("/start") and not text.startswith("/broadcast_changelog") and not text.startswith("/post_changelog") and text != "":
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
                                dynamic_web_app_url = get_clean_web_app_url()
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
                                    
                                # Дописываем монеты и купленные рамки в ссылку WebApp!
                                u_id_str = str(chat_id)
                                db = db_load()
                                wallet_coins = 0
                                wallet_frames = ""
                                
                                if db and "user_data" in db and u_id_str in db["user_data"]:
                                    user_wallet = db["user_data"][u_id_str]
                                    wallet_coins = user_wallet.get("coins", 0)
                                    wallet_frames = ",".join(user_wallet.get("purchased_frames", []))
                                else:
                                    def init_user(db_to_update):
                                        if "user_data" not in db_to_update:
                                            db_to_update["user_data"] = {}
                                        if u_id_str not in db_to_update["user_data"]:
                                            db_to_update["user_data"][u_id_str] = {"coins": 0, "purchased_frames": []}
                                        if "users" not in db_to_update:
                                            db_to_update["users"] = []
                                        if chat_id not in db_to_update["users"]:
                                            db_to_update["users"].append(chat_id)
                                    update_db(init_user)
                                
                                dynamic_web_app_url = f"{dynamic_web_app_url}&tg_id={chat_id}&coins={wallet_coins}&purchased_frames={wallet_frames}"
                            except Exception as e:
                                print(f"Помилка при читанні конфігурації: {e}")
                                dynamic_web_app_url = get_clean_web_app_url()
                                cache_bust = f"t={int(time.time())}"
                                if "?" in dynamic_web_app_url:
                                    dynamic_web_app_url = f"{dynamic_web_app_url}&{cache_bust}"
                                else:
                                    dynamic_web_app_url = f"{dynamic_web_app_url}?{cache_bust}"
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
                                    def update_chat_id(db):
                                        db["telegram_chat_id"] = chat_id
                                    update_db(update_chat_id)
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

                                post_changelog(token, chat_id, get_clean_web_app_url())
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
                                post_changelog(token, chat_id, get_clean_web_app_url())
                            else:
                                api_request(token, "sendMessage", {
                                    "chat_id": chat_id,
                                    "text": "❌ Надсилати ченджлог може тільки адміністратор!",
                                })

                        elif text.startswith("/broadcast_changelog"):
                            user_id = user.get("id") if user else None
                            db = db_load() or {}
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
                                        res = post_changelog(token, u_id, get_clean_web_app_url())
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
