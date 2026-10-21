import os
import sys
import tempfile
import shutil
import json

# Подключаем deploy_manager
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, CURRENT_DIR)

from deploy_manager import (
    verify_cloudflare_token,
    verify_live_url,
    deploy_to_cloudflare,
    quarantine_glitched_account,
    ACCOUNTS_DB_PATH,
    GLITCHED_DB_PATH
)

def run_suite():
    print("=" * 70)
    print("🧪 СЮИТА ТЕСТОВ ДЕПЛОЯ CLOUDFLARE PAGES")
    print("=" * 70)
    
    # -------------------------------------------------------------
    # ТЕСТ 1: Проверка защиты от плейсхолдеров и битых токенов
    # -------------------------------------------------------------
    print("\n[ТЕСТ 1] Проверка отлова невалидных токенов...")
    
    # 1.1 Текстовая заглушка
    fake_placeholder = "ВАШ_CLOUDFLARE_ТОКЕН"
    is_valid_ph, msg_ph = verify_cloudflare_token(fake_placeholder, "74c1d5f74dd4b67a556f2569c5fedb64")
    print(f"   1.1 Проверка заглушки: is_valid = {is_valid_ph}, msg = '{msg_ph}'")
    
    # 1.2 Несуществующий/испорченный токен (проверка через API)
    fake_token = "cfut_REwtMfJ4u6WcM7lx5c5GtZzLq6rgbAWiIR55sJcjfc9930sd"
    is_valid_api, msg_api = verify_cloudflare_token(fake_token, "74c1d5f74dd4b67a556f2569c5fedb64")
    print(f"   1.2 Проверка битого токена через API: is_valid = {is_valid_api}, msg = '{msg_api}'")
    
    if is_valid_ph is False and is_valid_api is False:
        print("   ✅ ТЕСТ 1 ПРОЙДЕН: Скрипт отловил и заглушку, и битый токен от Cloudflare!")
    else:
        print("   ❌ ТЕСТ 1 ПРОВАЛЕН!")
        return False

    # -------------------------------------------------------------
    # ТЕСТ 2: Проверка Live Health-Check на несуществующем домене
    # -------------------------------------------------------------
    print("\n[ТЕСТ 2] Проверка Live Health-Check на фейковом домене...")
    fake_url = "https://non-existent-test-domain-9988776655.pages.dev"
    healthy, health_msg = verify_live_url(fake_url, max_retries=2, delay_between=1)
    print(f"   Результат health-check: healthy = {healthy}, msg = '{health_msg}'")
    
    if not healthy:
        print("   ✅ ТЕСТ 2 ПРОЙДЕН: Скрипт НЕ поверил фейковой ссылке и вернул ошибку!")
    else:
        print("   ❌ ТЕСТ 2 ПРОВАЛЕН: Скрипт посчитал фейковый сайт живым!")
        return False

    # -------------------------------------------------------------
    # ТЕСТ 3: Проверка боевого токена из deploy_accounts.json
    # -------------------------------------------------------------
    print("\n[ТЕСТ 3] Проверка боевого токена Cloudflare через официальный API...")
    if not os.path.exists(ACCOUNTS_DB_PATH):
        print("   ❌ Файл deploy_accounts.json не найден!")
        return False
        
    with open(ACCOUNTS_DB_PATH, 'r', encoding='utf-8') as f:
        accounts = json.load(f).get("accounts", [])
        
    cf_acc = next((a for a in accounts if a.get("type") == "cloudflare"), None)
    if not cf_acc:
        print("   ❌ В deploy_accounts.json нет аккаунта типа cloudflare!")
        return False
        
    real_token = cf_acc["token"]
    real_acc_id = cf_acc["account_id"]
    
    is_valid_real, msg_real = verify_cloudflare_token(real_token, real_acc_id)
    print(f"   Статус токена: is_valid = {is_valid_real}, ответ API = '{msg_real}'")
    
    if is_valid_real:
        print("   ✅ ТЕСТ 3 ПРОЙДЕН: Боевой токен Cloudflare активен и имеет доступ к Pages!")
    else:
        print(f"   ❌ ТЕСТ 3 ПРОВАЛЕН: Ошибка токена: {msg_real}")
        return False

    # -------------------------------------------------------------
    # ТЕСТ 4: Реальный боевой деплой тестовой страницы
    # -------------------------------------------------------------
    print("\n[ТЕСТ 4] Боевой деплой тестового HTML с проверкой отдачи HTTP 200...")
    test_dir = tempfile.mkdtemp(prefix="cf_test_site_")
    test_project_name = "test-cf-verification-probe"
    
    try:
        html_content = """<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Cloudflare Verification Probe</title></head>
<body><h1>Verified Pinterest Bridge Deployed via Cloudflare Pages</h1></body>
</html>"""
        with open(os.path.join(test_dir, "index.html"), "w", encoding="utf-8") as f:
            f.write(html_content)
            
        success, final_url = deploy_to_cloudflare(test_dir, real_token, real_acc_id, test_project_name)
        print(f"   Результат деплоя: success = {success}, url = {final_url}")
        
        if success and final_url.startswith("https://"):
            print(f"\n🎉🎉🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ УСПЕШНО!")
            print(f"🌐 Реальный задеплоенный сайт проверен и доступен по ссылке:\n{final_url}\n")
            return True
        else:
            print(f"   ❌ ТЕСТ 4 ПРОВАЛЕН: {final_url}")
            return False
    finally:
        shutil.rmtree(test_dir, ignore_errors=True)

if __name__ == "__main__":
    success = run_suite()
    sys.exit(0 if success else 1)
