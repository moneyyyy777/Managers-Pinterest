#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🚀 Unified Git Push: Managers Pinterest & Artify Studio
Синхронизирует и пушит изменения сразу в ДВА репозитория:
1. Websites/CloudFlare/artify-studio -> https://github.com/moneyyyy777/artify-studio.git
2. Managers Pinterest (корень)      -> https://github.com/moneyyyy777/Managers-Pinterest.git
"""

import os
import sys
import shutil
import subprocess
from datetime import datetime

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass


ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
ARTIFY_DIR = os.path.join(ROOT_DIR, "Websites", "CloudFlare", "artify-studio")
ARTIFY_GIT_DIR = os.path.join(ARTIFY_DIR, ".git_subrepo_backup")

def log(msg, emoji="ℹ️"):
    print(f"\n{emoji} {msg}")

def run(cmd, cwd=ROOT_DIR):
    res = subprocess.run(cmd, shell=True, cwd=cwd, text=True, capture_output=True)
    return res.returncode == 0, res.stdout.strip(), res.stderr.strip()

def ensure_artify_git():
    if os.path.isdir(ARTIFY_DIR) and not os.path.isdir(ARTIFY_GIT_DIR):
        print("   📦 Первоначальная привязка Git для Artify Studio...")
        temp_dir = os.path.join(ROOT_DIR, "_temp_artify_git")
        try:
            ok, _, err = run(f'git clone --no-checkout https://github.com/moneyyyy777/artify-studio.git "{temp_dir}"')
            git_src = os.path.join(temp_dir, ".git")
            if os.path.isdir(git_src):
                if os.path.exists(ARTIFY_GIT_DIR):
                    shutil.rmtree(ARTIFY_GIT_DIR, ignore_errors=True)
                os.rename(git_src, ARTIFY_GIT_DIR)
                print("   ✅ Git для Artify Studio настроен автоматически!")
        except Exception as e:
            print(f"   ⚠️ Предупреждение настройки Artify Git: {e}")
        finally:
            if os.path.exists(temp_dir):
                shutil.rmtree(temp_dir, ignore_errors=True)

def sync_artify(commit_msg):
    log("Шаг 1/2: Синхронизация вложенного репозитория Artify Studio...", "🎨")
    if not os.path.isdir(ARTIFY_DIR):
        print("   ⚠️ Папка artify-studio не найдена, пропускаем.")
        return True

    ensure_artify_git()

    git_cmd_base = "git"
    if os.path.isdir(ARTIFY_GIT_DIR):
        git_cmd_base = f'git --git-dir="{ARTIFY_GIT_DIR}" --work-tree="{ARTIFY_DIR}"'

    # 1. Проверяем статус изменений
    ok, stdout, _ = run(f'{git_cmd_base} status --porcelain', cwd=ARTIFY_DIR)
    has_changes = bool(stdout.strip())

    # 2. Если есть локальные изменения — сначала фиксируем их
    if has_changes:
        print(f"   📝 Фиксируем локальные изменения в artify-studio...")
        run(f'{git_cmd_base} add -A', cwd=ARTIFY_DIR)
        run(f'{git_cmd_base} commit -m "{commit_msg}"', cwd=ARTIFY_DIR)

    # 3. Подтягиваем обновления от менеджера (pull --rebase)
    print("   📥 Подтягиваем обновления с GitHub (artify-studio)...")
    ok, out, err = run(f'{git_cmd_base} pull --rebase --autostash origin main', cwd=ARTIFY_DIR)
    if not ok and "up to date" not in (err + out).lower():
        print(f"   ℹ️ Статус pull artify-studio: {err or out}")

    # 4. Проверяем, нужно ли пушить (есть ли незапушенные коммиты)
    ok, ahead, _ = run(f'{git_cmd_base} rev-list origin/main..HEAD --count', cwd=ARTIFY_DIR)
    needs_push = has_changes or (ok and ahead.isdigit() and int(ahead) > 0)

    if needs_push:
        print("   🚀 Отправляем на GitHub (moneyyyy777/artify-studio)...")
        ok, out, err = run(f'{git_cmd_base} push origin main', cwd=ARTIFY_DIR)
        if ok:
            print("   ✅ Репозиторий artify-studio успешно обновлен на GitHub!")
            return True
        else:
            print(f"   ❌ Ошибка при отправке artify-studio: {err or out}")
            return False
    else:
        print("   ✨ В artify-studio нет новых изменений, репозиторий уже актуален.")
        return True

def sync_managers_pinterest(commit_msg):
    log("Шаг 2/2: Синхронизация общего репозитория Managers Pinterest...", "📁")

    # 1. Проверяем статус
    ok, stdout, _ = run('git status --porcelain', cwd=ROOT_DIR)
    has_changes = bool(stdout.strip())

    # 2. Если есть локальные изменения — сначала фиксируем их
    if has_changes:
        print(f"   📝 Фиксируем локальные изменения в Managers-Pinterest...")
        run('git add -A', cwd=ROOT_DIR)
        run(f'git commit -m "{commit_msg}"', cwd=ROOT_DIR)

    # 3. Подтягиваем обновления (если ветка уже существует на remote)
    ok, remotes, _ = run('git ls-remote origin refs/heads/main', cwd=ROOT_DIR)
    if ok and remotes:
        print("   📥 Подтягиваем обновления с GitHub (Managers-Pinterest)...")
        run('git pull --rebase --autostash origin main', cwd=ROOT_DIR)

    # 4. Пушим
    print("   🚀 Отправляем на GitHub (moneyyyy777/Managers-Pinterest)...")
    ok, out, err = run('git push -u origin main', cwd=ROOT_DIR)
    if ok:
        print("   ✅ Репозиторий Managers Pinterest успешно обновлен на GitHub!")
        return True
    else:
        # Проверяем, не заблокирован ли пуш защитой секретов
        if "GH013" in err or "GITHUB PUSH PROTECTION" in err:
            print("\n" + "="*70)
            print("🛑 ВНИМАНИЕ: GitHub заблокировал отправку Managers-Pinterest из-за секретов!")
            print("Чтобы разрешить пуш для вашего ПРИВАТНОГО репозитория:")
            print("1. Откройте в браузере:")
            print("   https://github.com/moneyyyy777/Managers-Pinterest/settings/security_analysis")
            print("2. В разделе 'Push protection' нажмите 'Disable' (Отключить).")
            print("3. Запустите этот скрипт ещё раз — и всё мгновенно зальётся!")
            print("="*70 + "\n")
        else:
            print(f"   ❌ Ошибка при отправке Managers Pinterest: {err or out}")
        return False

def main():
    # Сообщение коммита (из аргументов или авто-дата)
    if len(sys.argv) > 1 and sys.argv[1].strip():
        commit_msg = " ".join(sys.argv[1:]).strip()
    else:
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M")
        commit_msg = f"sync: auto update studio & artify ({now_str})"

    print("\n" + "="*60)
    print("  🚀 ЕДИНЫЙ ПУШ: Managers Pinterest + Artify Studio")
    print(f"  💬 Коммит: \"{commit_msg}\"")
    print("="*60)

    artify_ok = sync_artify(commit_msg)
    mgr_ok = sync_managers_pinterest(commit_msg)

    print("\n" + "="*60)
    if artify_ok and mgr_ok:
        print("🎉 ВСЁ ГОТОВО! Оба репозитория успешно синхронизированы на GitHub!")
    elif artify_ok:
        print("⚠️ Artify Studio обновлен успешно! Для Managers Pinterest требуется отключить Push protection.")
    else:
        print("⚠️ Часть операций завершилась с ошибками. Проверьте вывод выше.")
    print("="*60 + "\n")

if __name__ == "__main__":
    main()
