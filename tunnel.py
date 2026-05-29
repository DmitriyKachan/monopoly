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

    cmd = ["ssh", "-o", "StrictHostKeyChecking=no", "-R", "80:127.0.0.1:8765", "serveo.net"]
    
    while True:
        print("[INFO] Attempting to open SSH tunnel...")
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
                print(f"[OK] TUNNEL CREATED!")
                print(f"Public server address: {wss_url}")
                print("=" * 60)
                
                # Read and update config.json
                with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                    config = json.load(f)
                    
                config['ws_server_url'] = wss_url
                
                with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
                    json.dump(config, f, indent=4, ensure_ascii=False)
                    
                print("[SAVE] config.json updated successfully!")
                print("[INFO] Restart bot.py if needed and type /start in Telegram.")
                print("[WARNING] DO NOT CLOSE THIS WINDOW while playing!")
                print("=" * 60 + "\n")
                url_found = True

        process.wait()
        print("\n[WARNING] Tunnel connection dropped. Reconnecting in 5 seconds...")
        import time
        time.sleep(5)

if __name__ == '__main__':
    main()
