#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
📥 Unified Git Pull: Managers Pinterest & Artify Studio
Безопасно сохраняет локальную работу менеджера (товары, теги) и подтягивает обновления с GitHub:
1. Websites/CloudFlare/artify-studio <- https://github.com/moneyyyy777/artify-studio.git
2. Managers Pinterest (корень)      <- https://github.com/moneyyyy777/Managers-Pinterest.git
"""

import os
import sys
import shutil
import subprocess
from datetime import datetime

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

def pull_artify():
    log("Шаг 1/2: Обновление Artify Studio...", "🎨")
    if not os.path.isdir(ARTIFY_DIR):
        print("   ⚠️ Папка artify-studio не найдена, пропускаем.")
        return True, "Папка artify-studio не найдена."

    ensure_artify_git()

    git_cmd_base = "git"
    if os.path.isdir(ARTIFY_GIT_DIR):
        git_cmd_base = f'git --git-dir="{ARTIFY_GIT_DIR}" --work-tree="{ARTIFY_DIR}"'

    # 1. Проверяем локальные изменения менеджера
    ok, stdout, _ = run(f'{git_cmd_base} status --porcelain', cwd=ARTIFY_DIR)
    if stdout.strip():
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M")
        print("   📝 Сохраняем локальные товары менеджера в локальный коммит...")
        run(f'{git_cmd_base} add -A', cwd=ARTIFY_DIR)
        run(f'{git_cmd_base} commit -m "sync: auto-save manager products before pull ({now_str})"', cwd=ARTIFY_DIR)

    # 2. Подтягиваем обновления с GitHub
    print("   📥 Подтягиваем обновления кода с GitHub (artify-studio)...")
    ok, out, err = run(f'{git_cmd_base} pull --no-edit origin main', cwd=ARTIFY_DIR)
    combined = (out + "\n" + err).strip()

    if ok:
        print("   ✅ Репозиторий artify-studio успешно обновлен!")
        return True, combined or "Already up to date."
    else:
        # Если возник конфликт при слиянии
        if "conflict" in combined.lower():
            print(f"   ⚠️ Обнаружен конфликт при слиянии: {combined}")
        else:
            print(f"   ℹ️ Статус pull artify-studio: {combined}")
        return ok, combined

def pull_managers_pinterest():
    log("Шаг 2/2: Обновление общего репозитория Managers Pinterest...", "📁")

    # 1. Проверяем локальные изменения менеджера
    ok, stdout, _ = run('git status --porcelain', cwd=ROOT_DIR)
    if stdout.strip():
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M")
        print("   📝 Сохраняем локальные изменения студии в локальный коммит...")
        run('git add -A', cwd=ROOT_DIR)
        run(f'git commit -m "sync: auto-save manager studio work before pull ({now_str})"', cwd=ROOT_DIR)

    # 2. Подтягиваем обновления
    print("   📥 Подтягиваем обновления студии с GitHub (Managers-Pinterest)...")
    ok, out, err = run('git pull --no-edit origin main', cwd=ROOT_DIR)
    combined = (out + "\n" + err).strip()

    if ok:
        print("   ✅ Репозиторий Managers Pinterest успешно обновлен!")
        return True, combined or "Already up to date."
    else:
        print(f"   ℹ️ Статус pull Managers Pinterest: {combined}")
        return ok, combined

def main():
    print("\n" + "="*60)
    print("  📥 ЕДИНОЕ ОБНОВЛЕНИЕ: Managers Pinterest + Artify Studio")
    print(f"  ⏰ Время: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*60)

    artify_ok, artify_out = pull_artify()
    mgr_ok, mgr_out = pull_managers_pinterest()

    print("\n" + "="*60)
    if artify_ok and mgr_ok:
        print("🎉 ВСЁ ГОТОВО! Свежий код подтянут, все локальные товары сохранены!")
    else:
        print("⚠️ Часть обновлений завершилась с предупреждениями. Проверьте вывод выше.")
    print("="*60 + "\n")

    return 0 if (artify_ok and mgr_ok) else 1

if __name__ == "__main__":
    sys.exit(main())
