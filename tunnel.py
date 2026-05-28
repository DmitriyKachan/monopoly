# ==========================================================================
# PUBLIC SSH TUNNEL AUTOMATOR - MONOPOLY UKRAINE
# ==========================================================================

import subprocess
import re
import json
import os
import sys

CONFIG_FILE = 'config.json'

def main():
    print("=" * 60)
    print("      ЗАПУСК SSH ТУНЕЛЮ ДЛЯ MULTIPLAYER SERVER (PORT 8765)")
    print("=" * 60)
    print("Використовується вбудований клієнт OpenSSH Windows.")
    print("Ніяких сторонніх програм (Node, NPM, Ngrok) не потрібно.\n")
    
    # Check if config exists
    if not os.path.exists(CONFIG_FILE):
        print(f"ПОМИЛКА: Файл {CONFIG_FILE} не знайдено! Спочатку запустіть bot.py")
        sys.exit(1)

    cmd = ["ssh", "-o", "StrictHostKeyChecking=no", "-R", "80:localhost:8765", "serveo.net"]
    
    # Start SSH process
    try:
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1, encoding='utf-8')
    except FileNotFoundError:
        print("ПОМИЛКА: Клієнт 'ssh' не знайдено у вашій системі. Переконайтеся, що OpenSSH встановлено.")
        sys.exit(1)
        
    url_found = False
    
    # Read output line by line
    while True:
        line = process.stdout.readline()
        if not line:
            break
        
        print(line.strip())
        
        # Parse serveo subdomain
        match = re.search(r'from (https://[a-zA-Z0-9\-\.]+)', line)
        if match:
            url = match.group(1)
            wss_url = url.replace("https://", "wss://")
            print("\n" + "=" * 60)
            print(f"🎉 ТУНЕЛЬ СТВОРЕНО!")
            print(f"Публічна адреса сервера: {wss_url}")
            print("=" * 60)
            
            # Read and update config.json
            with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                config = json.load(f)
                
            config['ws_server_url'] = wss_url
            
            with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
                json.dump(config, f, indent=4, ensure_ascii=False)
                
            print("💾 Файл config.json успішно оновлено!")
            print("👉 Тепер ПЕРЕЗАПУСТІТЬ bot.py та введіть /start у Telegram.")
            print("⚠️ НЕ ЗАКРИВАЙТЕ ЦЕ ВІКНО, поки граєте з друзями!")
            print("=" * 60 + "\n")
            url_found = True

    process.wait()
    if not url_found:
        print("\nЗ'єднання з тунелем розірвано. Будь ласка, спробуйте запустити знову.")

if __name__ == '__main__':
    main()
