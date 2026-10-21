import json
import os
import shutil
import subprocess
import time
import re
import tempfile 
try:
    from filelock import FileLock, Timeout
except ImportError:
    from contextlib import contextmanager
    @contextmanager
    def FileLock(path, timeout=10):
        yield
    class Timeout(Exception):
        pass
import string
import random
import sys
import ssl
import urllib.request
import urllib.error

# --- УМНЫЕ НАСТРОЙКИ ПУТЕЙ (ДЛЯ EXE И PY, WINDOWS И MAC) ---
if getattr(sys, 'frozen', False):
    # Если бот запущен как скомпилированный EXE
    PINTEREST_DIR = os.path.dirname(sys.executable)
else:
    # Если бот запущен как обычный .py скрипт
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    # Если скрипт уже лежит в папке Pinterest, не поднимаемся вверх!
    if os.path.basename(BASE_DIR).lower() == "pinterest":
        PINTEREST_DIR = BASE_DIR
    else:
        PINTEREST_DIR = os.path.dirname(BASE_DIR)

# Базы данных
ACCOUNTS_DB_PATH = os.path.join(PINTEREST_DIR, "Deploy_Sites_Bridges", "deploy_accounts.json")
LOCK_PATH = ACCOUNTS_DB_PATH + ".lock"

HISTORY_DB_PATH = os.path.join(PINTEREST_DIR, "Deploy_Sites_Bridges", "deploy_history.json")
HISTORY_LOCK_PATH = HISTORY_DB_PATH + ".lock"

ARCHIVED_DB_PATH = os.path.join(PINTEREST_DIR, "Deploy_Sites_Bridges", "archived_accounts.json")
GLITCHED_DB_PATH = os.path.join(PINTEREST_DIR, "Deploy_Sites_Bridges", "glitched_accounts.json")

# ==============================================================================
# БЛОК 1: БЕЗОПАСНАЯ РАБОТА С БАЗАМИ (FileLock)
# ==============================================================================

def get_available_account():
    lock = FileLock(LOCK_PATH, timeout=10)
    with lock:
        if not os.path.exists(ACCOUNTS_DB_PATH):
            return None
        with open(ACCOUNTS_DB_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
        for account in data.get("accounts", []):
            if account.get("status") == "active":
                return account
        return None

def update_account_in_db(token, new_status=None, increment_usage=False):
    lock = FileLock(LOCK_PATH, timeout=10)
    with lock:
        with open(ACCOUNTS_DB_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        account_to_archive = None
        for account in data.get("accounts", []):
            if account.get("token") == token:
                if new_status:
                    account["status"] = new_status
                if increment_usage:
                    account["usage_count"] = account.get("usage_count", 0) + 1
                
                # Если лимит исчерпан — сохраняем аккаунт для архивации
                if new_status == "limit_reached":
                    account_to_archive = account
                break
                
        # АРХИВАЦИЯ: Удаляем из основной базы и пишем в архив
        if account_to_archive:
            data["accounts"].remove(account_to_archive)
            
            if os.path.exists(ARCHIVED_DB_PATH):
                try:
                    with open(ARCHIVED_DB_PATH, 'r', encoding='utf-8') as f:
                        archive_data = json.load(f)
                except Exception:
                    archive_data = {"accounts": []}
            else:
                archive_data = {"accounts": []}
                
            archive_data["accounts"].append(account_to_archive)
            
            with open(ARCHIVED_DB_PATH, 'w', encoding='utf-8') as f:
                json.dump(archive_data, f, indent=4)
                
        with open(ACCOUNTS_DB_PATH, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4)

def quarantine_glitched_account(account, reason):
    """
    БЕЗОПАСНЫЙ КАРАНТИН:
    Если токен битый, фальшивый или накопил критические сбои,
    он немедленно удаляется из deploy_accounts.json и сохраняется в glitched_accounts.json.
    """
    token = account.get("token")
    lock = FileLock(LOCK_PATH, timeout=10)
    with lock:
        if not os.path.exists(ACCOUNTS_DB_PATH):
            return
        with open(ACCOUNTS_DB_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        # Удаляем сбойный аккаунт из основной базы
        data["accounts"] = [acc for acc in data.get("accounts", []) if acc.get("token") != token]
        
        with open(ACCOUNTS_DB_PATH, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4)
            
        # Записываем в карантин
        if os.path.exists(GLITCHED_DB_PATH):
            try:
                with open(GLITCHED_DB_PATH, 'r', encoding='utf-8') as f:
                    glitched_data = json.load(f)
            except Exception:
                glitched_data = {"glitched_accounts": []}
        else:
            glitched_data = {"glitched_accounts": []}
            
        entry = dict(account)
        entry["quarantined_at"] = time.strftime("%Y-%m-%d %H:%M:%S")
        entry["reason"] = str(reason)
        glitched_data["glitched_accounts"].append(entry)
        
        with open(GLITCHED_DB_PATH, 'w', encoding='utf-8') as f:
            json.dump(glitched_data, f, indent=4)
            
    print(f"🚫 [КАРАНТИН] Аккаунт {account.get('email')} перемещен в glitched_accounts.json. Причина: {reason}")

def log_successful_deploy(email, service_type, final_url):
    """Безопасно записывает успешно задеплоенный сайт в файл истории."""
    lock = FileLock(HISTORY_LOCK_PATH, timeout=10)
    with lock:
        if not os.path.exists(HISTORY_DB_PATH):
            data = {}
        else:
            try:
                with open(HISTORY_DB_PATH, 'r', encoding='utf-8') as f:
                    data = json.load(f)
            except Exception:
                data = {}
                
        if email not in data:
            data[email] = {"service": service_type, "sites": []}
            
        if final_url not in data[email]["sites"]:
            data[email]["sites"].append(final_url)
            
        with open(HISTORY_DB_PATH, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4)

# ==============================================================================
# БЛОК 2: ПРОВЕРКИ ТОКЕНА И LIVE HEALTH-CHECK
# ==============================================================================

def verify_cloudflare_token(token, account_id):
    """
    ПРЕДВАРИТЕЛЬНАЯ ПРОВЕРКА (Pre-Flight Check):
    1. Защита от плейсхолдеров типа "ВАШ_ТОКЕН".
    2. Реальный запрос к Cloudflare API.
    """
    if not token or not isinstance(token, str):
        return False, "Токен пустой или не строка"
    clean_token = token.strip()
    if "ТОКЕН" in clean_token.upper() or "TOKEN" in clean_token.upper() or len(clean_token) < 20:
        return False, f"Токен является текстовой заглушкой: '{clean_token[:15]}...'"
    if not account_id or len(str(account_id).strip()) < 15:
        return False, f"Некорректный account_id: '{account_id}'"

    url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/pages/projects?per_page=1"
    req = urllib.request.Request(
        url,
        headers={
            "Authorization": f"Bearer {clean_token}",
            "Content-Type": "application/json",
            "User-Agent": "DeployManager/2.0"
        }
    )
    
    ctx = ssl._create_unverified_context()
    try:
        with urllib.request.urlopen(req, timeout=10, context=ctx) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            if data.get("success"):
                return True, "OK"
            else:
                errors = data.get("errors", [])
                err_msg = "; ".join([e.get("message", "Unknown error") for e in errors])
                return False, f"Cloudflare API error: {err_msg}"
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8', errors='ignore')
        if e.code in (401, 403):
            return False, f"Ошибка авторизации HTTP {e.code}: Токен недействителен или не имеет прав Pages"
        return False, f"HTTP {e.code}: {err_body[:120]}"
    except Exception as e:
        # Сетевые сбои (таймаут) не банят токен сразу
        print(f"⚠️ [Cloudflare Pre-Flight] Сетевое предупреждение: {e}")
        return None, f"Network check warning: {e}"

def verify_live_url(url, max_retries=6, delay_between=3):
    """
    КОНТРОЛЬНЫЙ ВЫСТРЕЛ:
    Делает реальный HTTP GET запрос по задеплоенной ссылке.
    Проверяет, что сервер отдает 200 OK и HTML не пустой.
    """
    print(f"🔎 [Live Health-Check] Проверяем сайт в интернете: {url} ...")
    ctx = ssl._create_unverified_context()
    
    for attempt in range(1, max_retries + 1):
        try:
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
            )
            with urllib.request.urlopen(req, timeout=8, context=ctx) as resp:
                code = resp.getcode()
                body = resp.read().decode('utf-8', errors='ignore')
                if code == 200 and len(body.strip()) > 30:
                    print(f"✅ [Live Health-Check] Сайт 100% открывается! (HTTP {code}, размер {len(body)} байт)")
                    return True, "OK"
                else:
                    print(f"⏳ [Live Health-Check] Попытка {attempt}/{max_retries}: HTTP {code}, длина={len(body)}. Ждем {delay_between}с...")
        except urllib.error.HTTPError as e:
            print(f"⏳ [Live Health-Check] Попытка {attempt}/{max_retries}: HTTP {e.code}. Ждем {delay_between}с...")
        except Exception as e:
            print(f"⏳ [Live Health-Check] Попытка {attempt}/{max_retries}: {e}. Ждем {delay_between}с...")
            
        time.sleep(delay_between)
        
    return False, "Сайт не открылся (Timeout/404) после деплоя"

# ==============================================================================
# БЛОК 3: ЛОГИКА ДЕПЛОЯ (VERCEL И CLOUDFLARE)
# ==============================================================================

def deploy_to_vercel(temp_folder, token, project_name):
    print(f"🔹 [Vercel] Начинаем деплой проекта '{project_name}'...")
    json_path = os.path.join(temp_folder, 'vercel.json')
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump({"name": project_name}, f)
    command = ['vercel', '--prod', '--yes', '--cwd', temp_folder, '--token', token]
    
    bot_env = os.environ.copy()
    bot_env["VERCEL_TELEMETRY_DISABLED"] = "1" 
    bot_env["CI"] = "1" 
    
    try:
        result = subprocess.run(command, capture_output=True, text=True, shell=True, env=bot_env)
        
        if result.returncode == 0:
            all_text = result.stdout + "\n" + result.stderr
            print(f"✅ [Vercel] Деплой успешен!")
            
            links = re.findall(r'(https://[a-zA-Z0-9\-]+\.vercel\.app)', all_text)
            if links:
                links = list(set(links))
                final_url = min(links, key=len)
            else:
                final_url = f"https://{project_name}.vercel.app" 
                
            # Health check для Vercel
            healthy, _ = verify_live_url(final_url)
            if not healthy:
                return False, "HEALTH_CHECK_FAILED"
                
            return True, final_url
        else:
            error_msg = result.stderr
            print(f"❌ [Vercel] Ошибка CLI: {error_msg}")
            
            if "limit" in error_msg.lower() or "quota" in error_msg.lower():
                return False, "LIMIT_REACHED"
            if "not authorized" in error_msg.lower() or "unauthorized" in error_msg.lower():
                return False, f"TOKEN_INVALID: {error_msg}"
                
            return False, error_msg
    except Exception as e:
        return False, str(e)

def ensure_cloudflare_project(token, account_id, project_name):
    """
    Создает проект Cloudflare Pages через прямой REST API за 0.2 секунды.
    Мгновенно проверяет лимиты (100 проектов) и исключает зависания Wrangler.
    """
    url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/pages/projects"
    headers = {
        "Authorization": f"Bearer {token.strip()}",
        "Content-Type": "application/json",
        "User-Agent": "DeployManager/2.0"
    }
    payload = json.dumps({
        "name": project_name,
        "production_branch": "main"
    }).encode("utf-8")
    
    ctx = ssl._create_unverified_context()
    req = urllib.request.Request(url, data=payload, headers=headers, method="POST")
    
    try:
        with urllib.request.urlopen(req, timeout=10, context=ctx) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            if data.get("success"):
                return True, "CREATED"
            return True, "OK"
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="ignore")
        err_lower = err_body.lower()
        
        # 1. Проект уже существует (это норма, продолжаем деплой)
        if "already exists" in err_lower or "8000077" in err_body or e.code == 409:
            return True, "EXISTS"
            
        # 2. Лимит 100 проектов исчерпан
        if "limit" in err_lower or "quota" in err_lower or "maximum" in err_lower:
            return False, "LIMIT_REACHED"
            
        # 3. Проблема с правами / токеном
        if e.code in (401, 403):
            return False, f"TOKEN_INVALID: HTTP {e.code}"
            
        return False, f"API_ERROR_{e.code}: {err_body[:100]}"
    except Exception as e:
        return True, f"NETWORK_WARNING: {e}"

def deploy_to_cloudflare(temp_folder, token, account_id, project_name):
    print(f"\n🔹 [Cloudflare] Запуск деплоя проекта '{project_name}'...")
    
    # 1. Защита токена (Pre-Flight)
    is_valid, check_msg = verify_cloudflare_token(token, account_id)
    if is_valid is False:
        print(f"❌ [Cloudflare] Ошибка верификации токена: {check_msg}")
        return False, f"TOKEN_INVALID: {check_msg}"

    # 2. Ограничение DNS (макс 58 символов)
    safe_project_name = project_name[:58].rstrip("-").lower()
    
    # 3. Создаем проект через чистый REST API (надежно, быстро, без интерактивных запросов CLI)
    created_ok, create_status = ensure_cloudflare_project(token, account_id, safe_project_name)
    if not created_ok:
        if create_status == "LIMIT_REACHED":
            print(f"⚠️ [Cloudflare] Достигнут лимит проектов (100) на этом аккаунте!")
            return False, "LIMIT_REACHED"
        else:
            print(f"❌ [Cloudflare] Ошибка создания проекта: {create_status}")
            return False, create_status

    bot_env = os.environ.copy()
    bot_env["CLOUDFLARE_API_TOKEN"] = token
    bot_env["CLOUDFLARE_ACCOUNT_ID"] = account_id
    bot_env["CI"] = "1"
    
    wrangler_cmd = "wrangler" if shutil.which("wrangler") else "npx --yes wrangler"
    
    # 4. Загрузка статических файлов
    deploy_cmd = f"{wrangler_cmd} pages deploy \"{temp_folder}\" --project-name={safe_project_name} --branch=main"
    
    try:
        result = subprocess.run(deploy_cmd, capture_output=True, text=True, shell=True, env=bot_env)
        all_text = result.stdout + "\n" + result.stderr
        
        if result.returncode == 0:
            clean_url = f"https://{safe_project_name}.pages.dev"
            final_url = clean_url
            print(f"🔍 [Cloudflare] Основная ссылка: {final_url}")
            
            # 5. КОНТРОЛЬНЫЙ ВЫСТРЕЛ: Проверяем, что сайт реально открывается в интернете
            healthy, health_msg = verify_live_url(final_url)
            if not healthy:
                # Если корневой алиас еще разминается в DNS, проверяем хеш-ссылку
                links = re.findall(rf'(https://[a-zA-Z0-9\-\.]*{re.escape(safe_project_name)}\.pages\.dev)', all_text)
                if links:
                    hash_url = min(links, key=len)
                    print(f"🔄 [Cloudflare] Проверяем резервную прямую ссылку: {hash_url}")
                    healthy_fb, _ = verify_live_url(hash_url, max_retries=3, delay_between=2)
                    if healthy_fb:
                        final_url = hash_url
                        healthy = True
            
            if not healthy:
                return False, f"HEALTH_CHECK_FAILED: {health_msg}"
                
            print(f"🎉 [Cloudflare] Деплой и онлайн-проверка успешно завершены!")
            return True, final_url
        else:
            err_msg = result.stderr if result.stderr.strip() else result.stdout
            err_lower = err_msg.lower()
            print(f"❌ [Cloudflare] Ошибка CLI: {err_msg.strip()}")
            
            if "limit" in err_lower or "quota" in err_lower or "maximum" in err_lower:
                return False, "LIMIT_REACHED"
            if "not authorized" in err_lower or "unauthorized" in err_lower or "invalid api token" in err_lower:
                return False, f"TOKEN_INVALID: {err_msg}"
                
            return False, err_msg
    except Exception as e:
        return False, str(e)

# ==============================================================================
# БЛОК 4: ГЛАВНЫЙ ОРКЕСТРАТОР
# ==============================================================================

def inject_google_analytics(temp_folder, code_analytics):
    if not code_analytics or code_analytics.lower() == "none":
        return
        
    ga_script = f"""
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id={code_analytics}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){{dataLayer.push(arguments);}}
  gtag('js', new Date());
  gtag('config', '{code_analytics}');
</script>
"""
    for root, dirs, files in os.walk(temp_folder):
        for file in files:
            if file.endswith(".html"):
                filepath = os.path.join(root, file)
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                if "</head>" in content:
                    content = content.replace("</head>", f"{ga_script}\n</head>")
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(content)

def run_smart_deploy(source_html_path, base_project_name, code_analytics):
    adjectives = [
        "top", "best", "new", "daily", "super", "hot", "cool", 
        "pro", "smart", "easy", "viral", "fresh", "epic", "true", 
        "pure", "elite", "prime", "mega", "ultra"
    ]
    nouns = [
        "ideas", "trends", "blog", "hub", "gallery", "style", 
        "tips", "art", "design", "board", "pins", "collection", 
        "guide", "life", "zone", "world", "spot", "picks", "finds"
    ]
    
    adj = random.choice(adjectives)
    noun = random.choice(nouns)
    number = random.randint(10, 999)
    
    project_name = f"{base_project_name}-{adj}-{noun}-{number}".lower()
    # Ограничение DNS (не более 58 символов)
    if len(project_name) > 58:
        project_name = project_name[:58].rstrip("-")

    if not os.path.isabs(source_html_path):
        source_html_path = os.path.join(PINTEREST_DIR, source_html_path)

    print(f"\n🚀 Запуск Smart Deploy для проекта: {project_name}")
    print(f"🔍 Ищем исходники по пути: {source_html_path}")
    
    temp_folder = None
    
    try:
        while True:
            account = get_available_account()
            if not account:
                raise Exception("❌ Нет ни одного доступного (активного) аккаунта в базе!")
                
            token = account["token"]
            acc_type = account["type"]
            acc_email = account.get("email", "unknown_email")
            
            print(f"🔑 Взят аккаунт типа '{acc_type}' ({acc_email})")
            
            # Кроссплатформенный путь к Desktop
            user_home = os.environ.get("USERPROFILE") or os.environ.get("HOME") or os.path.expanduser("~")
            desktop_temp_base = os.path.join(user_home, "Desktop", "temp_deploy_site_bridges", acc_type)
            if not os.path.exists(desktop_temp_base):
                os.makedirs(desktop_temp_base, exist_ok=True)
                
            temp_folder = os.path.join(desktop_temp_base, f"temp_{project_name}_{int(time.time())}")
            
            if os.path.exists(temp_folder):
                shutil.rmtree(temp_folder)
            os.makedirs(temp_folder)

            # Поиск index.html
            target_html = None
            path_direct = os.path.join(source_html_path, "index.html")
            path_redirect = os.path.join(source_html_path, "Redirect cpatcha", "index.html")
            
            if os.path.isfile(path_direct):
                target_html = path_direct
            elif os.path.isfile(path_redirect):
                target_html = path_redirect
            elif os.path.exists(source_html_path):
                for item in os.listdir(source_html_path):
                    item_path = os.path.join(source_html_path, item)
                    if item.endswith(".html") and os.path.isfile(item_path):
                        target_html = item_path
                        break

            if not target_html or not os.path.exists(target_html):
                raise Exception(f"❌ Не найден HTML файл в папке: {source_html_path}")

            # Проверка, что исходный HTML не пустой (> 30 байт)
            if os.path.getsize(target_html) < 30:
                raise Exception(f"❌ Исходный HTML файл пустой (размер {os.path.getsize(target_html)} байт)!")

            shutil.copy2(target_html, os.path.join(temp_folder, "index.html"))
            print(f"📁 Изолированный HTML скопирован: {temp_folder}")
            
            # Внедрение аналитики
            inject_google_analytics(temp_folder, code_analytics)
            print(f"📈 Код аналитики {code_analytics} внедрен в HTML!")
                    
            success = False
            result_url_or_err = ""
            
            if acc_type == "vercel":
                success, result_url_or_err = deploy_to_vercel(temp_folder, token, project_name)
            elif acc_type == "cloudflare":
                acc_id = account.get("account_id", "")
                success, result_url_or_err = deploy_to_cloudflare(temp_folder, token, acc_id, project_name)
            
            if success:
                update_account_in_db(token, increment_usage=True)
                log_successful_deploy(acc_email, acc_type, result_url_or_err)
                print(f"🎉 Готовая ссылка: {result_url_or_err}")
                return result_url_or_err
            else:
                if result_url_or_err == "LIMIT_REACHED":
                    print(f"⚠️ Аккаунт '{acc_type}' исчерпал лимит! Архивируем и берем следующий...")
                    update_account_in_db(token, new_status="limit_reached")
                    if temp_folder and os.path.exists(temp_folder):
                        shutil.rmtree(temp_folder, ignore_errors=True)
                elif result_url_or_err.startswith("TOKEN_INVALID"):
                    print(f"🚫 Аккаунт '{acc_type}' имеет недействительный токен! Отправляем в карантин...")
                    quarantine_glitched_account(account, reason=result_url_or_err)
                    if temp_folder and os.path.exists(temp_folder):
                        shutil.rmtree(temp_folder, ignore_errors=True)
                else:
                    print(f"❌ Сбой деплоя: {result_url_or_err}")
                    # Учитываем сбой
                    consec = account.get("consecutive_errors", 0) + 1
                    account["consecutive_errors"] = consec
                    if consec >= 3:
                        quarantine_glitched_account(account, reason=f"3 сбоя подряд: {result_url_or_err}")
                    if temp_folder and os.path.exists(temp_folder):
                        shutil.rmtree(temp_folder, ignore_errors=True)

    finally:
        if temp_folder and os.path.exists(temp_folder):
            time.sleep(1)
            try:
                shutil.rmtree(temp_folder, ignore_errors=True)
                print("🧹 Временная папка очищена.")
            except Exception:
                pass

if __name__ == "__main__":
    test_source_path = os.path.join("_HTMLs for Publish", "Artify-Studio", "cliparts", "Baby Cliparts", "Redirect cpatcha")
    test_project_name = "test-smart-deploy-cf-1"
    
    try:
        final_link = run_smart_deploy(test_source_path, test_project_name, "G-1234567890")
        print(f"\n✅✅✅ УСПЕХ! ИТОГОВАЯ ССЫЛКА: {final_link}")
    except Exception as e:
        print(f"\n❌❌❌ ТЕСТ ПРОВАЛЕН: {e}")