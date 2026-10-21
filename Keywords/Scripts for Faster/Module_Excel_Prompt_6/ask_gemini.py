import sys
import json
import os
import time
from google import genai
from google.genai import types
from google.genai.errors import APIError

def load_config():
    config_path = os.path.join(os.path.dirname(__file__), "api_config.json")
    with open(config_path, 'r') as f:
        return json.load(f), config_path

def save_config(config, config_path):
    with open(config_path, 'w') as f:
        json.dump(config, f, indent=2, ensure_ascii=False)

def ask(prompt_text):
    config, config_path = load_config()
    accounts = config.get("accounts", [])
    
    # Check if there's at least one configured key (not starting with placeholder)
    valid_accounts = [acc for acc in accounts if acc.get("key") and not acc.get("key", "").startswith("ВСТАВЬ_КЛЮЧ")]
    if not valid_accounts:
        print("ERROR: API keys not configured in api_config.json")
        sys.exit(1)
        
    start_idx = config.get("current_index", 0)
    attempts = 0
    max_attempts = len(valid_accounts) * 2

    while attempts < max_attempts:
        current_idx = (start_idx + attempts) % len(accounts)
        account = accounts[current_idx]
        api_key = account.get("key", "")
        email = account.get("email", "unknown")
        
        if api_key.startswith("ВСТАВЬ_КЛЮЧ") or not api_key:
            attempts += 1
            continue
            
        try:
            client = genai.Client(api_key=api_key)
            print(f"[*] Sending request using account {email}...")
            response = client.models.generate_content(
                model='gemini-3.6-flash',
                contents=prompt_text,
            )
            
            # Update config with the working key index
            config["current_index"] = current_idx
            save_config(config, config_path)
            
            return response.text
            
        except APIError as e:
            if e.code == 429:
                print(f"[!] Rate limit hit on account {email}. Rotating...")
                attempts += 1
                time.sleep(2)
            else:
                print(f"[!] API Error on account {email}: {e}")
                attempts += 1
                time.sleep(2)
        except Exception as e:
            print(f"[!] Unknown error on account {email}: {e}")
            attempts += 1
            time.sleep(2)
            
    print("ERROR: All API keys exhausted or failed.")
    sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python3 ask_gemini.py <prompt_file.txt> <output_file.txt>")
        sys.exit(1)
        
    prompt_file = sys.argv[1]
    output_file = sys.argv[2]
    
    with open(prompt_file, 'r', encoding='utf-8') as f:
        prompt_text = f.read()
        
    result = ask(prompt_text)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(result)
    print(f"[*] Response saved to {output_file}")
