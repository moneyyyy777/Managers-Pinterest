import time
import os
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import (
    TimeoutException,
    NoSuchElementException,
    ElementClickInterceptedException,
)
from selenium.webdriver import ActionChains


def _safe_get(driver, url, timeout=30):
    """Безопасный переход по URL с обработкой таймаута"""
    if "safe_get" in globals() and globals()["safe_get"] is not _safe_get:
        try:
            globals()["safe_get"](driver, url, timeout)
            return
        except Exception:
            pass
    try:
        driver.set_page_load_timeout(timeout)
        driver.get(url)
    except TimeoutException:
        print(f"Таймаут загрузки страницы {url}, продолжаем...")
    except Exception as e:
        print(f"Ошибка при загрузке {url}: {e}")
        driver.get(url)


def _write_to_file_one_value(path, value):
    """Запись одного значения в файл"""
    if "write_to_file_one_value" in globals() and globals()["write_to_file_one_value"] is not _write_to_file_one_value:
        try:
            globals()["write_to_file_one_value"](path, value)
            return
        except Exception:
            pass
    try:
        if path:
            with open(path, "w", encoding="utf-8") as f:
                f.write(str(value) + "\n")
    except Exception as e:
        print(f"Не удалось записать в {path}: {e}")


def _move_first_line_to_end(file_path):
    """Перемещение первой строки в конец файла"""
    if "move_first_line_to_end" in globals() and globals()["move_first_line_to_end"] is not _move_first_line_to_end:
        try:
            globals()["move_first_line_to_end"](file_path)
            return
        except Exception:
            pass
    try:
        target_path = file_path
        if not os.path.exists(target_path):
            alt_path = file_path.replace("\\", os.sep)
            if os.path.exists(alt_path):
                target_path = alt_path

        if os.path.exists(target_path):
            with open(target_path, "r+", encoding="utf-8") as file:
                lines = file.readlines()
                if not lines:
                    return
                first_line = lines.pop(0)
                lines.append(first_line)
                file.seek(0)
                file.writelines(lines)
                file.truncate()
            print(f"Сменили сервер в файле {target_path}")
    except Exception as e:
        print(f"Не удалось перенести строку в {file_path}: {e}")


def _handle_special_offers(driver, timeout=10):
    """
    Проверка и закрытие всплывающих окон спецпредложений (TrialModal и DiscountModal).
    В VeePN кнопка закрытия (крестик trial-modal__close) монтируется в DOM
    только через 3 секунды после открытия окна (в коде расширения стоит setTimeout 3000ms).
    Данная функция ожидает появления кнопки и нажимает её.
    """
    try:
        offers = driver.find_elements(By.CSS_SELECTOR, ".trial-modal, .discount-modal")
        if offers and any(o.is_displayed() for o in offers):
            print("Обнаружено окно спецпредложения/пробного периода (TrialModal / DiscountModal).")
            print("Ожидаем появления крестика закрытия (задержка в расширении ~3 сек)...")
            try:
                close_btn = WebDriverWait(driver, timeout).until(
                    EC.element_to_be_clickable(
                        (By.CSS_SELECTOR, "button.trial-modal__close, button.discount-modal__close")
                    )
                )
                time.sleep(0.5)
                try:
                    close_btn.click()
                except Exception:
                    driver.execute_script("arguments[0].click();", close_btn)
                print("Успешно закрыли спецпредложение (кликнут trial-modal__close)")
                time.sleep(1)
                return True
            except Exception as e:
                print(f"Крестик закрытия спецпредложения не кликнулся стандартно ({e}), пробуем через JS...")
                try:
                    clicked = driver.execute_script("""
                        const btn = document.querySelector('button.trial-modal__close, button.discount-modal__close');
                        if (btn) {
                            btn.click();
                            return true;
                        }
                        return false;
                    """)
                    if clicked:
                        print("Закрыли спецпредложение через JS fallback")
                        time.sleep(1)
                        return True
                except Exception:
                    pass
    except Exception as e:
        print(f"Ошибка в _handle_special_offers: {e}")
    return False


def _dismiss_modals(driver):
    """Закрытие любых всплывающих модальных окон расширения (Rate us, Download app, Promo, Info)"""
    close_selectors = [
        "button.trial-modal__close",
        "button.discount-modal__close",
        "button.location-switching-modal__close",
        "button.location-switching-modal__button",
        "button.download-app-modal__close",
        "button.rate-us-initial-modal__close",
        "button.rate-us-retention-modal__close",
        "button.rate-us-retention-modal__skip",
        "button.trustpilot-modal__close",
        "button.exit-offer-modal__close",
        "button.habitual-free-modal__close",
        "button.discount-modal__close",
        "button.out-of-slots-modal__close-btn",
        "button.modal__close",
        "button[aria-label='close']",
    ]
    for sel in close_selectors:
        try:
            elements = driver.find_elements(By.CSS_SELECTOR, sel)
            for el in elements:
                if el.is_displayed():
                    try:
                        el.click()
                        time.sleep(0.3)
                    except Exception:
                        driver.execute_script("arguments[0].click();", el)
        except Exception:
            pass


def _pass_onboarding_and_terms(driver):
    """Прохождение экранов соглашения (Terms of Use) и онбординга VeePN 5.0.3"""
    # 1. Ждем исчезновения SplashScreen
    try:
        WebDriverWait(driver, 10).until_not(
            EC.presence_of_element_located((By.CSS_SELECTOR, ".splash-screen"))
        )
    except Exception:
        pass

    time.sleep(1)

    # 2. Обработка Terms of Use (Соглашение)
    try:
        terms_views = driver.find_elements(By.CSS_SELECTOR, ".terms-of-use-view")
        if terms_views:
            print("Обнаружен экран Terms of Use (соглашение)")
            try:
                checkbox = WebDriverWait(driver, 5).until(
                    EC.element_to_be_clickable((By.CSS_SELECTOR, "label.terms-of-use-view__checkbox, label[for='privacy'], .terms-of-use-view__checkbox"))
                )
                checkbox.click()
            except Exception:
                driver.execute_script("""
                    const cb = document.querySelector('#privacy');
                    if (cb && !cb.checked) { cb.click(); }
                    const label = document.querySelector('label[for="privacy"], .terms-of-use-view__checkbox');
                    if (label) { label.click(); }
                """)
            time.sleep(0.5)

            accept_btn = WebDriverWait(driver, 5).until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, "button.terms-of-use-view__accept, .terms-of-use-view button[type='submit']"))
            )
            accept_btn.click()
            print("Приняли условия Terms of Use")
            time.sleep(2)
    except Exception as e:
        print(f"Экран Terms of Use не требовал действий: {e}")

    # 3. Обработка Onboarding шагов (FreeStep -> PremiumStep -> PricingStep или LocationsStep skip)
    for _ in range(10):
        # Проверяем и закрываем модалки или спецпредложения
        _handle_special_offers(driver, timeout=4)
        _dismiss_modals(driver)

        # Если уже попали на главный экран
        if driver.find_elements(By.CSS_SELECTOR, ".main-view"):
            break

        # Вариант OnboardingLocationsView: кнопка 'Пропустить'
        skip_btns = driver.find_elements(By.CSS_SELECTOR, "button.locations-step__skip")
        if skip_btns and skip_btns[0].is_displayed():
            try:
                skip_btns[0].click()
                print("Пропустили онбординг через locations-step__skip")
                time.sleep(1)
                continue
            except Exception:
                pass

        # Шаг 1: FreeStep
        free_btns = driver.find_elements(By.CSS_SELECTOR, "button.free-step__btn")
        if free_btns and free_btns[0].is_displayed():
            try:
                free_btns[0].click()
                print("Онбординг: кликнули 'Продолжить' на шаге FreeStep")
                time.sleep(1)
                continue
            except Exception:
                pass

        # Шаг 2: PremiumStep
        prem_btns = driver.find_elements(By.CSS_SELECTOR, "button.premium-step__btn")
        if prem_btns and prem_btns[0].is_displayed():
            try:
                prem_btns[0].click()
                print("Онбординг: кликнули 'Продолжить' на шаге PremiumStep")
                time.sleep(1)
                continue
            except Exception:
                pass

        # Шаг 3: PricingStep — выбираем бесплатное продолжение
        pricing_free_btns = driver.find_elements(By.CSS_SELECTOR, "button.pricing-step__action--free, .pricing-step__section--free button")
        if pricing_free_btns and pricing_free_btns[0].is_displayed():
            try:
                pricing_free_btns[0].click()
                print("Онбординг: кликнули 'Продолжить бесплатно' на шаге PricingStep")
                time.sleep(1)
                # Сразу после клика часто открывается TrialModal с 3-секундной задержкой кнопки закрытия
                _handle_special_offers(driver, timeout=8)
                continue
            except Exception:
                pass

        time.sleep(1)


def _select_location(driver, vpn_location):
    """Выбор локации сервера в VeePN"""
    target = vpn_location.strip() if vpn_location else "Amsterdam"
    target_clean = target.lower().replace("-", " ").replace("_", " ")

    # Карта для сопоставления страны и региона
    expected_country = None
    expected_region = None
    search_query = target

    if "virginia" in target_clean:
        expected_country = "United States"
        expected_region = "Virginia"
        search_query = "Virginia"
    elif "oregon" in target_clean:
        expected_country = "United States"
        expected_region = "Oregon"
        search_query = "Oregon"
    elif "amsterdam" in target_clean:
        expected_country = "Netherlands"
        expected_region = "Amsterdam"
        search_query = "Amsterdam"
    elif "london" in target_clean:
        expected_country = "United Kingdom"
        expected_region = "London"
        search_query = "London"
    elif "paris" in target_clean:
        expected_country = "France"
        expected_region = "Paris"
        search_query = "Paris"
    elif "peterburg" in target_clean or "petersburg" in target_clean or "moscow" in target_clean or "russia" in target_clean:
        # В бесплатном VeePN сервер в РФ называется Saint Petersburg (Russian Federation)
        expected_country = "Russian"
        expected_region = "Saint Petersburg"
        search_query = "Russia"
    elif "singapore" in target_clean:
        expected_country = "Singapore"
        expected_region = "Singapore"
        search_query = "Singapore"

    # Проверяем текущую выбранную локацию на главном экране
    try:
        loc_btn = driver.find_element(By.CSS_SELECTOR, "button.connect-region__location")
        current_text = loc_btn.text.lower()
        if "amsterdam" in target_clean and ("amsterdam" in current_text or "netherlands" in current_text or "optimal" in current_text):
            print(f"Локация {target} уже выбрана (или Optimal)")
            return
        elif ("peterburg" in target_clean or "petersburg" in target_clean or "moscow" in target_clean or "russia" in target_clean) and ("petersburg" in current_text or "peterburg" in current_text or "russia" in current_text or "russian" in current_text):
            print(f"Локация {target} (Saint Petersburg) уже выбрана")
            return
        elif expected_region and expected_region.lower() in current_text:
            print(f"Локация {expected_region} уже выбрана")
            return
    except Exception:
        pass

    # Открываем список серверов
    print(f"Открываем список серверов для выбора: {target}")
    try:
        loc_btn = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, "button.connect-region__location"))
        )
        loc_btn.click()
    except Exception:
        loc_elem = driver.find_element(By.CSS_SELECTOR, "button.connect-region__location")
        driver.execute_script("arguments[0].click();", loc_elem)

    time.sleep(1)

    # Ждем открытия LocationsView
    WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, ".locations-view"))
    )

    selected = False

    # Стратегия 1: Поиск в открытом списке
    try:
        # 1.1 Если регион уже отображается (например, Saint Petersburg или раскрытый штат)
        if expected_region:
            reg_elems = driver.find_elements(
                By.XPATH,
                f"//div[contains(@class, 'location-region-item')][.//h4[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '{expected_region.lower()}')]]"
            )
            for r in reg_elems:
                if r.is_displayed():
                    r.click()
                    selected = True
                    print(f"Выбран регион: {expected_region}")
                    break

        # 1.2 Если страна составная (например, США), раскрываем её
        if not selected and expected_country:
            multi_countries = driver.find_elements(
                By.XPATH,
                f"//div[contains(@class, 'multi-region-location')][.//h3[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '{expected_country.lower()}')]]"
            )
            if multi_countries:
                header = multi_countries[0].find_element(By.CSS_SELECTOR, ".multi-region-location__country")
                header.click()
                time.sleep(0.5)
                if expected_region:
                    regs = multi_countries[0].find_elements(
                        By.XPATH,
                        f".//div[contains(@class, 'location-region-item')][.//h4[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '{expected_region.lower()}')]]"
                    )
                    if regs:
                        regs[0].click()
                        selected = True
                        print(f"Раскрыли страну {expected_country} и выбрали {expected_region}")

        # 1.3 Поиск среди simple-location (Амстердам, Лондон, Париж, Санкт-Петербург)
        if not selected:
            candidates = [c for c in [expected_region, expected_country, "Saint Petersburg", "Russian", target] if c]
            for c in candidates:
                c_clean = c.lower().replace("-", " ")
                simple_locs = driver.find_elements(
                    By.XPATH,
                    f"//div[contains(@class, 'simple-location')][.//h3[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '{c_clean}')]]"
                )
                if simple_locs:
                    simple_locs[0].click()
                    selected = True
                    print(f"Выбрана локация: {c}")
                    break
    except Exception as e:
        print(f"Поиск в списке дал исключение: {e}")

    # Стратегия 2: Если не удалось найти в открытом списке — используем строку поиска
    if not selected:
        print(f"Используем поиск в расширении по ключевому слову '{search_query}'...")
        try:
            search_btn = WebDriverWait(driver, 5).until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, "button.locations-view__search-btn"))
            )
            search_btn.click()
            time.sleep(0.5)

            search_input = WebDriverWait(driver, 5).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "input.search-input__input"))
            )
            search_input.clear()
            search_input.send_keys(search_query)
            time.sleep(1)

            # Проверяем результат мульти-региона
            multi_res = driver.find_elements(By.CSS_SELECTOR, ".multi-region-location")
            if multi_res:
                hdr = multi_res[0].find_element(By.CSS_SELECTOR, ".multi-region-location__country")
                hdr.click()
                time.sleep(0.5)
                regs = multi_res[0].find_elements(By.CSS_SELECTOR, ".location-region-item")
                if regs:
                    chosen = regs[0]
                    for r in regs:
                        if expected_region and expected_region.lower() in r.text.lower():
                            chosen = r
                            break
                    chosen.click()
                    selected = True
                    print(f"Выбрано из результатов поиска: {chosen.text}")

            if not selected:
                simple_res = driver.find_elements(By.CSS_SELECTOR, ".simple-location")
                if simple_res:
                    simple_res[0].click()
                    selected = True
                    print(f"Выбрано из результатов поиска: {simple_res[0].text}")
        except Exception as e:
            print(f"Ошибка при использовании поисковой строки: {e}")

    # Закрываем модальное окно переключения, если появилось
    time.sleep(0.5)
    _dismiss_modals(driver)


def vpn_activate_veepn_new(driver, vpn_language, vpn_location, vpn_attempts, path_to_attempts):
    """
    Активация и подключение VPN VeePN (версия 5.0.3+).
    Корректно обрабатывает окно приветствия, экраны Terms of Use, Онбординг,
    TrialModal (с задержкой появления крестика закрытия 3 сек),
    выбор нужной локации (Virginia, Amsterdam, London, Paris, Saint-Peterburg, etc.)
    и включение VPN с верификацией статуса подключения.
    """
    try:
        # 1. Закрываем лишние вкладки (например, авто-открывающийся Welcome таб расширения)
        try:
            if len(driver.window_handles) > 1:
                current_handle = driver.current_window_handle
                for handle in driver.window_handles:
                    if handle != current_handle:
                        driver.switch_to.window(handle)
                        url = driver.current_url.lower()
                        if "welcome" in url or "chrome-extension" in url:
                            print(f"Закрываем фоновую вкладку расширения: {driver.current_url}")
                            driver.close()
                driver.switch_to.window(current_handle)
        except Exception as e:
            print(f"Проверка вкладок: {e}")

        time.sleep(1)

        # 2. Переходим на страницу попапа расширения VeePN
        extension_url = "chrome-extension://majdfhpaihoncoakbjgbdhglocklcgno/src/popup/popup.html"
        print("Переходим на страницу popup.html расширения VeePN...")
        _safe_get(driver, extension_url, timeout=30)
        time.sleep(1)

        # 3. Проходим Terms of Use и онбординг, если они отображаются
        _pass_onboarding_and_terms(driver)

        # 4. Проверяем спецпредложения (TrialModal/DiscountModal), если они все еще открыты
        _handle_special_offers(driver, timeout=8)
        _dismiss_modals(driver)

        # 5. Ожидаем появления главного экрана
        # Если модалка TrialModal все еще на экране, еще раз закрываем
        for _ in range(4):
            if driver.find_elements(By.CSS_SELECTOR, ".main-view"):
                break
            _handle_special_offers(driver, timeout=5)
            _dismiss_modals(driver)
            time.sleep(1)

        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, ".main-view, button.connect-button"))
        )
        time.sleep(1)
        _dismiss_modals(driver)

        # 6. Выбор локации сервера (если отличается от Amsterdam / Optimal)
        if vpn_location:
            print(f"Выбор сервера VPN: {vpn_location} (vpn_language: {vpn_language})")
            _select_location(driver, vpn_location)

        # Ожидаем возврат на главный экран
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, ".main-view, button.connect-button"))
        )
        time.sleep(1)
        _dismiss_modals(driver)

        # 7. Нажатие кнопки подключения VPN
        connect_btn = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "button.connect-button"))
        )
        btn_class = connect_btn.get_attribute("class") or ""

        if "connect-button--connected" not in btn_class:
            try:
                connect_btn = WebDriverWait(driver, 5).until(
                    EC.element_to_be_clickable((By.CSS_SELECTOR, "button.connect-button"))
                )
                connect_btn.click()
                print("Кликнули кнопку включения VPN")
            except Exception:
                driver.execute_script("arguments[0].click();", connect_btn)
                print("Кликнули кнопку включения через JS")
        else:
            print("VPN уже в состоянии connected")

        # 8. Проверка статуса VPN с ожиданием класса 'connect-button--connected'
        print("Ожидаем подтверждения подключения VPN...")
        connected = False
        for attempt in range(15):
            _dismiss_modals(driver)
            try:
                vpn_button = driver.find_element(By.CSS_SELECTOR, "button.connect-button")
                button_class = vpn_button.get_attribute("class") or ""

                if "connect-button--connected" in button_class:
                    _write_to_file_one_value(path_to_attempts, 0)
                    print(f"VPN успешно подключен! Класс кнопки: {button_class}")
                    connected = True
                    return  # Успешный выход
                elif "connect-button--connecting" in button_class:
                    print(f"Попытка {attempt + 1}: соединение устанавливается...")
                else:
                    print(f"Попытка {attempt + 1}: статус {button_class}")
            except Exception as e:
                print(f"Попытка {attempt + 1}: ожидание кнопки ({e})")

            time.sleep(2)

        if not connected:
            raise Exception("VPN не перешел в состояние connect-button--connected за отведенное время.")

    except Exception as e:
        print(f"Ошибка в vpn_activate: {e}")
        vpn_attempts += 1
        _write_to_file_one_value(path_to_attempts, vpn_attempts)

        if vpn_attempts == 5:
            loc_file = os.path.join("..", "Pinterest", "veepn_location_list.txt")
            _move_first_line_to_end(loc_file)
            _write_to_file_one_value(path_to_attempts, 0)

        raise
