#!/usr/bin/env bash
# ==============================================================================
# 📊 Creative Fabrica Analytics & Tools — Интерактивный Центр Управления
# ==============================================================================

# Перейти в каталог утилиты
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

# Цвета для терминала
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m' # No Color

while true; do
  clear
  echo -e "${CYAN}================================================================================${NC}"
  echo -e "${BOLD}${CYAN}      📊 CREATIVE FABRICA ANALYTICS — ИНТЕРАКТИВНЫЙ ЦЕНТР УПРАВЛЕНИЯ${NC}"
  echo -e "${CYAN}================================================================================${NC}"

  # Быстрый вывод статуса базы
  node -e "
    try {
      const fs = require('fs');
      const dbPath = 'data/reports/master-database.json';
      if (fs.existsSync(dbPath)) {
        const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        const refCount = Object.keys(db.referrals || {}).length;
        const visitCount = (db.visits || []).length;
        const updated = db.lastUpdated ? new Date(db.lastUpdated).toLocaleString('ru-RU') : 'Нет данных';
        console.log('\x1b[32m  ✔ База данных активна:\x1b[0m ' + refCount + ' рефералов, ' + visitCount + ' визитов | Обновлено: ' + updated);
      } else {
        console.log('\x1b[33m  ⚠ База данных еще не создана. Запустите сбор.\x1b[0m');
      }
    } catch(e) {}
  "

  echo -e "${CYAN}--------------------------------------------------------------------------------${NC}"
  echo -e " ${BOLD}ЧТО ВЫ ХОТИТЕ СДЕЛАТЬ? ВЫБЕРИТЕ ЦИФРУ:${NC}"
  echo -e ""
  echo -e "  ${GREEN}${BOLD}[1] ⚡ БЫСТРОЕ ОБНОВЛЕНИЕ${NC} (Собрать только новые данные за сегодня/вчера)"
  echo -e "      ${YELLOW}↳ Сканирует страницы вперед (до 100 стр) и ОСТАНАВЛИВАЕТСЯ сам,${NC}"
  echo -e "      ${YELLOW}  как только видит ранее сохраненные строки. Не делает лишней работы.${NC}"
  echo -e ""
  echo -e "  ${CYAN}${BOLD}[2] 🔍 ПРИНУДИТЕЛЬНАЯ ПРОВЕРКА N СТРАНИЦ${NC} (Выбрать: 10, 20, 50, 100 страниц)"
  echo -e "      ${YELLOW}↳ Принудительно сканирует выбранное число страниц со стр. 1 без ранней${NC}"
  echo -e "      ${YELLOW}  остановки, сверяет каждую строку с базой и дописывает/обновляет данные.${NC}"
  echo -e ""
  echo -e "  ${PURPLE}${BOLD}[3] 🔄 ГЛУБОКАЯ РЕВИЗИЯ ВСЕЙ ИСТОРИИ${NC} (Перепроверить всё со стр. 1 до самого конца)"
  echo -e "      ${YELLOW}↳ Полный проход по всем страницам сайта с самого начала: находит упущенные${NC}"
  echo -e "      ${YELLOW}  записи, обновляет переходы (\$0.00 ➔ \$9.40) и дописывает их в базу.${NC}"
  echo -e ""
  echo -e "  ${BLUE}${BOLD}[4] 📈 АНАЛИЗ И АУДИТ ПОТЕРЬ${NC} (Без запуска браузера, мгновенно)"
  echo -e "      ${YELLOW}↳ Сверяет синие галочки в Visits с Referrals, находит потерянные${NC}"
  echo -e "      ${YELLOW}  конверсии (\$0.00) и генерирует тикет в поддержку (missing-referrals-ticket.txt).${NC}"
  echo -e ""
  echo -e "  ${GREEN}${BOLD}[5] 🚀 ОБНОВИТЬ + ОТПРАВИТЬ В GITHUB (Sync)${NC}"
  echo -e "      ${YELLOW}↳ Быстрое обновление свежих данных + аналитика + git commit & push.${NC}"
  echo -e ""
  echo -e "  ${BOLD}[6] 🔑 АВТОРИЗАЦИЯ В АККАУНТЕ${NC} (Login)"
  echo -e "      ${YELLOW}↳ Открыть видимый браузер для ручного входа (если вылетит сессия).${NC}"
  echo -e ""
  echo -e "  ${BOLD}[7] 🛡️ ПРОВЕРКА АНТИДЕТЕКТА${NC} (Stealth Verify)"
  echo -e "      ${YELLOW}↳ Тест фингерпринта и скрытия автоматизации Playwright.${NC}"
  echo -e ""
  echo -e "  ${RED}${BOLD}[0] ❌ ВЫХОД${NC}"
  echo -e "${CYAN}================================================================================${NC}"
  echo -ne "  ${BOLD}Введите номер действия [1-7] или 0 для выхода: ${NC}"
  read -r choice

  case "$choice" in
    1)
      echo -e "\n${GREEN}🚀 Запуск быстрого инкрементального обновления...${NC}\n"
      npm run update
      echo -e "\n${GREEN}✔ Обновление завершено!${NC}"
      read -rp "Нажмите [ENTER], чтобы вернуться в меню..."
      ;;
    2)
      echo -e "\n${CYAN}🔍 Сколько страниц принудительно проверить со стр. 1?${NC}"
      echo -ne "   Введите число страниц (например: 10, 20, 50, 100) [по умолчанию: 20]: "
      read -r user_pages
      user_pages="${user_pages:-20}"
      echo -e "\n${CYAN}🚀 Запуск принудительной проверки $user_pages страниц со стр. 1...${NC}\n"
      node src/cli.js --stats --pages "$user_pages" --restart
      echo -e "\n${CYAN}✔ Проверка $user_pages страниц завершена!${NC}"
      read -rp "Нажмите [ENTER], чтобы вернуться в меню..."
      ;;
    3)
      echo -e "\n${PURPLE}🔄 Запуск глубокой ревизии всей истории со стр. 1 до самого конца...${NC}"
      echo -e "${YELLOW}Это может занять некоторое время. Прогресс пишется в базу по каждой странице.${NC}\n"
      node src/cli.js --stats --pages all --restart
      echo -e "\n${PURPLE}✔ Глубокая ревизия всей истории завершена!${NC}"
      read -rp "Нажмите [ENTER], чтобы вернуться в меню..."
      ;;
    4)
      echo -e "\n${BLUE}📈 Запуск аналитического модуля и аудита расхождений...${NC}\n"
      node src/analyzer.js
      echo -e "\n${BLUE}✔ Анализ завершен! Результаты в data/reports/analytics-daily.json${NC}"
      read -rp "Нажмите [ENTER], чтобы вернуться в меню..."
      ;;
    5)
      echo -e "\n${GREEN}🚀 Запуск сбора и синхронизации с GitHub...${NC}\n"
      npm run sync
      echo -e "\n${GREEN}✔ Синхронизация завершена!${NC}"
      read -rp "Нажмите [ENTER], чтобы вернуться в меню..."
      ;;
    6)
      echo -e "\n${BOLD}🔑 Открытие окна авторизации Creative Fabrica...${NC}\n"
      npm run auth
      read -rp "Нажмите [ENTER], чтобы вернуться в меню..."
      ;;
    7)
      echo -e "\n${BOLD}🛡️ Запуск диагностики фингерпринта...${NC}\n"
      npm run verify-stealth
      read -rp "Нажмите [ENTER], чтобы вернуться в меню..."
      ;;
    0|q|Q)
      echo -e "\n${CYAN}До свидания!${NC}\n"
      exit 0
      ;;
    *)
      echo -e "\n${RED}Неверный ввод. Пожалуйста, введите цифру от 0 до 7.${NC}"
      sleep 1.5
      ;;
  esac
done
