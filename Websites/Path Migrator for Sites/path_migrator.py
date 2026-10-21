import os
import shutil

# ==========================================
# ⚙️ УМНАЯ НАСТРОЙКА ПУТЕЙ
# ==========================================
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PINTEREST_DIR = os.path.dirname(os.path.dirname(os.path.dirname(CURRENT_DIR)))

if not os.path.exists(os.path.join(PINTEREST_DIR, "Keywords")):
    PINTEREST_DIR = os.path.dirname(os.path.dirname(CURRENT_DIR))

if os.path.exists(os.path.join(PINTEREST_DIR, "Managers Pinterest", "Keywords")):
    KEYWORDS_DIR = os.path.join(PINTEREST_DIR, "Managers Pinterest", "Keywords", "Artify Studio", "ALL FOLDERS")
else:
    KEYWORDS_DIR = os.path.join(PINTEREST_DIR, "Keywords", "Artify Studio", "ALL FOLDERS")

HTMLS_DIR = os.path.join(PINTEREST_DIR, "_HTMLs for Publish")

def find_html_sources():
    html_map = {}
    print(f"🔍 Сканирую базу HTML: {HTMLS_DIR}")
    
    if not os.path.exists(HTMLS_DIR):
        print(f"❌ ОШИБКА: Не найдена папка {HTMLS_DIR}")
        return html_map

    for root, dirs, files in os.walk(HTMLS_DIR):
        if "Redirect cpatcha" in dirs:
            full_path = os.path.join(root, "Redirect cpatcha")
            niche_name = os.path.basename(root)
            
            # --- МАГИЯ: ДЕЛАЕМ КРАСИВЫЙ ОТНОСИТЕЛЬНЫЙ ПУТЬ ДЛЯ WINDOWS ---
            parts = full_path.split("_HTMLs for Publish")
            if len(parts) > 1:
                rel_path = "_HTMLs for Publish" + parts[1]
                # Меняем маковские слеши "/" на виндовые "\"
                win_path = rel_path.replace("/", "\\")
                
                # Пишем путь прямо до ПАПКИ, чтобы deploy_manager сразу брал его в работу
                html_map[niche_name.lower()] = win_path
            
    print(f"✅ Найдено готовых HTML шаблонов: {len(html_map)}")
    return html_map

def get_best_match(niche_name, html_keys):
    """Умный алгоритм поиска совпадений"""
    niche_lower = niche_name.lower()
    
    if niche_lower in html_keys:
        return niche_lower
        
    for h_key in html_keys:
        if h_key in niche_lower:
            return h_key
            
    niche_words = set(niche_lower.split())
    best_match = None
    best_score = 0
    
    for h_key in html_keys:
        h_words = h_key.split()
        match_count = 0
        for hw in h_words:
            hw_stem = hw.rstrip('s')
            for nw in niche_words:
                nw_stem = nw.rstrip('s')
                if hw_stem in nw_stem or nw_stem in hw_stem:
                    match_count += 1
                    break
                    
        score = match_count / len(h_words)
        
        if score >= 0.5 and score > best_score:
            best_score = score
            best_match = h_key
            
    return best_match

def plan_migration(html_map):
    planned_actions = []
    not_found = []
    
    print(f"\n🔍 Сканирую целевую папку: {KEYWORDS_DIR}")

    if not os.path.exists(KEYWORDS_DIR):
        print(f"❌ ОШИБКА: Не найдена папка {KEYWORDS_DIR}")
        return planned_actions, not_found

    html_keys = list(html_map.keys())

    for root, dirs, files in os.walk(KEYWORDS_DIR):
        if "For Main" in dirs:
            for_main_path = os.path.join(root, "For Main")
            old_link_file = os.path.join(for_main_path, "Link_Site.txt")
            google_link_file = os.path.join(for_main_path, "Google_Link_Site.txt")
            
            if os.path.exists(old_link_file) and not os.path.exists(google_link_file):
                # root - это папка конкретного аккаунта (например "1 Baby Cliparts Filter...")
                account_folder_name = os.path.basename(root)
                # niche_folder_name - это родительская папка (например "Baby Cliparts")
                niche_folder_name = os.path.basename(os.path.dirname(root))
                
                matched_key = get_best_match(niche_folder_name, html_keys)
                
                if matched_key:
                    target_html_path = html_map[matched_key]
                    planned_actions.append({
                        "account_name": account_folder_name,
                        "niche": niche_folder_name,
                        "matched_template": matched_key,
                        "old_file": old_link_file,
                        "new_path": target_html_path,
                        "google_backup": google_link_file
                    })
                else:
                    not_found.append(f"{niche_folder_name} (В папке: {account_folder_name})")
                    
    return planned_actions, not_found

def run_migrator():
    html_map = find_html_sources()
    if not html_map:
        return
        
    planned_actions, not_found = plan_migration(html_map)
    
    print("\n" + "="*80)
    print("📋 ПРЕДВАРИТЕЛЬНЫЙ ОТЧЕТ (НАЙДЕННЫЕ СОВПАДЕНИЯ)")
    print("="*80)
    
    if not planned_actions:
        print("🤷‍♂️ Ничего не найдено для изменения.")
        return
        
    # СОРТИРОВКА: Сначала по имени ниши, затем по имени папки (1, 2, 3...)
    planned_actions.sort(key=lambda x: (x['niche'], x['account_name']))
    
    current_niche = ""
    for action in planned_actions:
        if action['niche'] != current_niche:
            print(f"\n📁 НИША: {action['niche'].upper()}")
            print(f"   ↳ Привязан шаблон: '{action['matched_template']}'")
            print("-" * 80)
            current_niche = action['niche']
            
        print(f"   🟢 ПАПКА: {action['account_name']}")
        print(f"      ↳ Файл: {action['old_file']}")
        print(f"      ↳ Будет путь: {action['new_path']}\n")
        
    if not_found:
        print("\n" + "="*80)
        print(f"⚠️ НЕ НАШЛИ HTML ДЛЯ ЭТИХ НИШ (БУДУТ ПРОПУЩЕНЫ): {len(not_found)} шт.")
        for nf in not_found:
            print(f"   - {nf}")
            
    print("="*80)
    print(f"Итого готово к обновлению: {len(planned_actions)} папок.")
    
    answer = input("\n❓ Выполнить эти изменения? (введите 'y' для согласия): ").strip().lower()
    
    if answer == 'y':
        print("\n🚀 Поехали! Выполняю изменения...\n")
        success_count = 0
        
        print("="*80)
        print("📝 ОТЧЕТ ОБ ИЗМЕНЕНИЯХ (ДО И ПОСЛЕ)")
        print("="*80)

        for action in planned_actions:
            try:
                # 1. Читаем старое содержимое (то, что было до переименования)
                old_content = ""
                with open(action['old_file'], 'r', encoding='utf-8') as f:
                    old_content = f.read().strip()
                
                # 2. Переименовываем старый файл в Google_Link_Site.txt
                shutil.move(action['old_file'], action['google_backup'])
                
                # 3. Создаем новый Link_Site.txt и пишем путь
                with open(action['old_file'], 'w', encoding='utf-8') as f:
                    f.write(action['new_path'])
                
                # 4. Выводим красивый отчет "До и После"
                print(f"✅ ПАПКА: {action['account_name']}")
                print(f"   📄 Было (в Google_Link_Site.txt): '{old_content}'")
                print(f"   📄 Стало (в Link_Site.txt):       '{action['new_path']}'")
                print("-" * 50)

                success_count += 1
            except Exception as e:
                print(f"❌ Ошибка записи для папки {action['account_name']}: {e}")
                
        print(f"\n✅ ГОТОВО! Успешно обновлено {success_count} папок!")
    else:
        print("\n🛑 Отмена операции.")

if __name__ == "__main__":
    run_migrator()
    input("\nНажмите Enter, чтобы закрыть...")