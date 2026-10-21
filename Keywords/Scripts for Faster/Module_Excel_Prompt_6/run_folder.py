import os
import sys
import subprocess
import re

def get_full_prompt(templates_path, board_name, tags, stop_words):
    with open(templates_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Extract Prompt 6.1 section
    match = re.search(r'### 6.1\. Автономная версия.*?```text\n(.*?)```', content, re.DOTALL)
    if not match:
        print("ERROR: Could not find Prompt 6.1 in PROMPT_TEMPLATES.md")
        sys.exit(1)
        
    prompt = match.group(1)
    
    # We need to prepend the actual task for the LLM
    task_header = f"""
Твоя задача — сгенерировать контент для папки.
НАЗВАНИЕ ДОСКИ (board_name): {board_name}
ТЕГИ ДЛЯ АНАЛИЗА (tags):
{tags}

СТОП-СЛОВА ИЗ СОСЕДНИХ ПАПОК (ОБЯЗАТЕЛЬНО К ИСКЛЮЧЕНИЮ):
{stop_words if stop_words else "Нет"}

Ниже идут строгие правила генерации (Промпт 6):
--------------------------------------------------
{prompt}
"""
    return task_header

def get_stop_words(folder_path):
    # Determine sibling folders to extract their board names / keywords as stop words
    parent_dir = os.path.dirname(folder_path)
    current_name = os.path.basename(folder_path)
    
    siblings = [d for d in os.listdir(parent_dir) if os.path.isdir(os.path.join(parent_dir, d)) and d != current_name]
    
    stop_words = set()
    for sib in siblings:
        # Extract intent from folder name, usually after "Intent"
        # For example: 3 Bundles Christmas Journaling Intent Junk Journal -> Junk Journal
        if "Intent" in sib:
            parts = sib.split("Intent")
            if len(parts) > 1:
                words = parts[1].strip().lower().split()
                for w in words:
                    if len(w) > 2:
                        stop_words.add(w)
    
    return ", ".join(stop_words)

def process_folder(folder_path):
    module_dir = os.path.dirname(__file__)
    workspace_root = os.path.dirname(os.path.dirname(os.path.dirname(module_dir)))
    templates_path = os.path.join(workspace_root, "PROMPT_TEMPLATES.md")
    
    ask_script = os.path.join(module_dir, "ask_gemini.py")
    process_script = os.path.join(module_dir, "process_and_save.py")
    
    for_main = os.path.join(folder_path, "For Main")
    boards_name_file = os.path.join(for_main, "Boards_Name.txt")
    boards_tags_file = os.path.join(for_main, "Boards_Tags.txt")
    
    xlsx_files = [f for f in os.listdir(folder_path) if f.endswith('.xlsx') and not f.startswith('~')]
    if not xlsx_files:
        print("ERROR: No .xlsx file found in folder.")
        sys.exit(1)
    xlsx_path = os.path.join(folder_path, xlsx_files[0])
    
    with open(boards_name_file, 'r', encoding='utf-8') as f:
        board_name = f.read().strip()
    with open(boards_tags_file, 'r', encoding='utf-8') as f:
        tags = f.read().strip()
        
    stop_words = get_stop_words(folder_path)
    
    prompt = get_full_prompt(templates_path, board_name, tags, stop_words)
    prompt_file = os.path.join(module_dir, "temp_prompt.txt")
    response_file = os.path.join(module_dir, "temp_response.md")
    
    with open(prompt_file, 'w', encoding='utf-8') as f:
        f.write(prompt)
        
    max_retries = 3
    for attempt in range(max_retries):
        print(f"\n--- Attempt {attempt+1} of {max_retries} ---")
        
        print("[*] Calling ask_gemini.py...")
        res = subprocess.run([sys.executable, ask_script, prompt_file, response_file])
        if res.returncode != 0:
            print("[!] ask_gemini.py failed. Retrying...")
            continue
            
        print("[*] Calling process_and_save.py...")
        res = subprocess.run([sys.executable, process_script, response_file, xlsx_path])
        if res.returncode == 0:
            print("[*] SUCCESS! Excel file updated.")
            return True
        else:
            print("[!] Validation failed. Retrying generation...")
            
    print("ERROR: Failed to generate valid content after max retries.")
    sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python3 run_folder.py <folder_path>")
        sys.exit(1)
    process_folder(sys.argv[1])
