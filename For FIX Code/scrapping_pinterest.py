def get_two_photos(driver, temp_email):
    avatar_path = None
    background_path = None
    photos_dir = os.path.abspath(os.path.join(os.getcwd(), "Photos"))
    os.makedirs(photos_dir, exist_ok=True)

    checked_imgs = set()
    max_attempts = 30  # 60 слишком много, если за 30 не нашли — значит страница пустая

    MIN_AVATAR_SIZE = 400

    # Очистка email для безопасного имени файла
    clean_email = "".join([c for c in temp_email if c.isalnum() or c in ('@', '.', '_')]).rstrip()

    for attempt in range(max_attempts):
        print(f"Попытка {attempt + 1}/{max_attempts}")

        # 1. Более точный селектор: берем только картинки, которые похожи на контент (Пины)
        # Исключаем мелкие иконки и элементы интерфейса
        img_elements = driver.find_elements(By.CSS_SELECTOR, "img[src*='pinimg.com']")

        new_found_on_this_scroll = False

        for img_elem in img_elements:
            if avatar_path and background_path:
                return avatar_path, background_path

            try:
                img_url = img_elem.get_attribute("src")
            except:
                continue

            # 2. ПРЕД-ФИЛЬТРАЦИЯ (Убыстряет в разы)
            # Если в URL есть признаки очень мелких картинок — скипаем сразу без загрузки
            if not img_url or any(
                    x in img_url for x in ['/75x75/', '/60x60/', '/170x170/', '/resource/']) or img_url in checked_imgs:
                continue

            checked_imgs.add(img_url)

            # 3. УМНАЯ ЗАМЕНА РАЗМЕРА
            # /originals/ часто выдает 404, а /736x/ — это качественный стандарт (HD)
            # Сначала пробуем 736x, если нужно очень большое - потом originals
            large_url = re.sub(r'/\d+x/', '/736x/', img_url)

            try:
                content = download_via_selenium(driver, large_url)
                if not content or len(content) < 5000:  # Если меньше 5КБ - это явно не картинка
                    continue

                img = Image.open(BytesIO(content))
                width, height = img.size
                aspect_ratio = width / height
            except Exception:
                # Если 736x не сработал, не спамим ошибками, просто идем к следующей картинке
                continue

            # --- Логика подбора АВАТАРА (Квадратное) ---
            if not avatar_path and 0.8 <= aspect_ratio <= 1.2:
                if width >= MIN_AVATAR_SIZE:
                    avatar_path = os.path.join(photos_dir, f"{clean_email}_avatar.jpg")
                    with open(avatar_path, "wb") as f:
                        f.write(content)
                    print(f"✅ Аватар сохранен: {width}x{height}")
                    new_found_on_this_scroll = True

            # --- Логика подбора ФОНА (Горизонтальное) ---
            elif not background_path and aspect_ratio > 1.2:
                if width >= 700:
                    background_path = os.path.join(photos_dir, f"{clean_email}_background.jpg")
                    with open(background_path, "wb") as f:
                        f.write(content)
                    print(f"✅ Фон сохранен: {width}x{height}")
                    new_found_on_this_scroll = True

        # Если на текущем экране ничего нового не нашли - скроллим
        if not (avatar_path and background_path):
            driver.execute_script("window.scrollBy(0, 800);")
            time.sleep(1)

    # Заглушки, если не нашли
    if not avatar_path: avatar_path = "no_avatar"
    if not background_path: background_path = "no_background"

    return avatar_path, background_path


def scrapping_pinterest_new(driver, scrapping_tags, scrape_Data, parsing_language, temp_email,
                            description_profile, count_account, description_board):  # Передаем scrape_Data как аргумент
    try:
        print(f"scrapping_tags работаем в scrapping_pinterest_new: {scrapping_tags}")
        time.sleep(5)
        for attempt in range(20):
            try:
                try:
                    search_button = WebDriverWait(driver, 1).until(
                        EC.element_to_be_clickable((By.CSS_SELECTOR, "button[aria-label='Значок поиска']"))
                    )
                    search_button.click()
                    success = True
                    break
                except:
                    cookie_button = WebDriverWait(driver, 1).until(
                        EC.element_to_be_clickable((By.CSS_SELECTOR,
                                                    'div[class="KuF kVc adn obZ S9z ncU BG7"]'))
                    )
                    cookie_button.click()
                    success = True
                    break
            except:
                try:
                    cookie_button = WebDriverWait(driver, 1).until(
                        EC.element_to_be_clickable((By.XPATH,
                                                    '/html/body/div[1]/div[1]/div/div[1]/div[2]/div/div/div/div/div/div/div/div/div[4]/button/div'))
                    )
                    cookie_button.click()
                    success = True
                    break
                except:
                    time.sleep(1)

        tmp_file_attempt = 0
        used_tags = []  # сюда собираем реально использованные теги

        for tag in scrapping_tags:
            print(f"tag: {tag}")
            # used_tags.append(tag)  # добавляем текущий тег

            # --- Проверяем, не превысит ли новый тег лимит описания ---
            temp_desc = ", ".join(used_tags + [tag])
            if len(temp_desc) > 500:
                print("⚠️ Добавление следующего тега превысит 500 символов — останавливаемся.")
                break
            else:
                used_tags.append(tag)  # добавляем только если не превысили
                print(f"Добавлен тег: {tag} (текущая длина описания: {len(temp_desc)})")

            try:
                search_input = WebDriverWait(driver, 30).until(
                    EC.element_to_be_clickable((By.CSS_SELECTOR, f"input[aria-describedby='searchBoxAccessibleText']"))
                )
            except:
                print("Не нашлм поисковик")

            search_input.send_keys(Keys.CONTROL + "a")
            search_input.send_keys(Keys.DELETE)
            search_input.click()
            time.sleep(1)
            search_input.send_keys(tag)
            time.sleep(1)
            search_input.send_keys(Keys.ENTER)
            time.sleep(1)

            # --- Проверяем, есть ли элемент "Ваши пины" ---
            try:
                your_pins_element = WebDriverWait(driver, 5).until(
                    EC.element_to_be_clickable((By.XPATH, "//span[contains(text(), 'Ваши пины')]"))
                )
                your_pins_element.click()
                print("✅ Найден и нажат элемент 'Ваши пины'.")
                time.sleep(1)

                # --- После этого ищем кнопку "Все пины" ---
                try:
                    all_pins_button = WebDriverWait(driver, 5).until(
                        EC.element_to_be_clickable((By.XPATH, "//div[contains(text(), 'Все пины')]/ancestor::button"))
                    )
                    print("✅ Найдена кнопка 'Все пины'.")
                    all_pins_button.click()
                    print("✅ Нажата кнопка 'Все пины'.")
                    time.sleep(1)
                except:
                    print("⚠️ Кнопка 'Все пины' не найдена — возможно, она уже выбрана.")
            except:
                print("⚠️ Элемент 'Ваши пины' не найден — пропускаем шаг.")

            if tmp_file_attempt == 0:
                # --- ЭТАП 7: Скраппинг данных и подбор фото---
                start_time = time.time()
                temp_file1, temp_file2 = get_two_photos(driver, temp_email)
                log_step_time("7.1 Get Two Photos", time.time() - start_time, temp_email)

                tmp_file_attempt += 1
                driver.refresh()
                time.sleep(5)

            scrolls = 0
            max_data = 3000
            links_list = []
            count = len(scrape_Data)
            count_of_pin = 0
            previous_lengths = []

            while True:
                # Если элемента нет, продолжаем скроллить
                scroll_down(driver)
                time.sleep(0.3)
                scrolls += 1

                try:
                    # Проверяем, появился ли нужный элемент (логотип Pinterest или другой целевой элемент)
                    # target_element = WebDriverWait(driver, 0.1).until(
                    #     EC.presence_of_element_located((By.XPATH, "//svg[contains(@aria-label, 'Логотип Pinterest')]")
                    #                                    ))
                    target_element = WebDriverWait(driver, 0.1).until(
                        EC.element_to_be_clickable((By.CSS_SELECTOR, "svg[aria-label='Логотип Pinterest']"))
                    )
                    print("Элемент найден! Останавливаем скроллинг.")
                    break  # Если элемент найден, прерываем цикл
                except:
                    scrolls += 0

                publication = WebDriverWait(driver, 10).until(
                    EC.element_to_be_clickable((By.TAG_NAME, 'a'))
                )
                for pin in driver.find_elements(By.TAG_NAME, 'a'):
                    try:
                        link = pin.get_attribute("href")
                        pre_title = pin.get_attribute("aria-label")
                        title = None
                        if pre_title and pre_title.strip():
                            match = re.search(r'«(.*?)»', pre_title)
                            title = match.group(1) if match else pre_title
                        img_element = pin.find_element(By.CSS_SELECTOR, "img")
                        description = img_element.get_attribute("alt")

                        if parsing_language != "RUS" and description:
                            description = re.sub(r'[А-Яа-яЁё]', '', description).strip()
                            description = re.sub(r'^:\s+', '', description)
                            if re.fullmatch(r'[:\s]*', description):
                                description = ""

                        if parsing_language == "RUS" and description:
                            unwanted_phrases = ["Пин содержит: ", "Пин содержит это изображение: ",
                                                "Пин содержит это изображение:", "Пин содержит:"]
                            for phrase in unwanted_phrases:
                                description = description.replace(phrase, "").strip()
                            if re.fullmatch(r'[:\s]*', description):
                                description = ""

                        # if not title:
                        #     print(f"[DEBUG] У пина нет title. pre_title={pre_title}, link={link} для данного пина - {image_url}")
                        #     flag = 1

                        if link and link not in links_list and (title or "").strip():
                            all_image_url = img_element.get_attribute("srcset")
                            image_url = re.split(r',\s*', all_image_url)[-1][:-3] if all_image_url else re.sub(
                                r'(?<=https://i\.pinimg\.com/)\d+(?=x/)', '736', img_element.get_attribute("src"))

                            print(f'image_url: {image_url}')
                            print(f'title: {title}')
                            print(f'description: {description}')
                            title_with_tag = f"{tag} | {title or ''}".strip()

                            if len(title_with_tag) > 50:
                                words = title_with_tag.split()
                                while len(" ".join(words)) > 50 and len(words) > 1:
                                    words.pop()
                                title_with_tag = " ".join(words).rstrip('|').strip()

                            print(f'title_with_tag: {title_with_tag}')

                            # 3 случайных числа (от 1 до 100)
                            nums_3 = random.randint(100, 999)

                            # 2 случайных числа (от 1 до 100)
                            nums_2 = random.randint(10, 99)

                            # 1 случайное число (от 1 до 100)
                            num_1 = random.randint(1, 9)

                            # description_with_tag = description + " | " + tag + " " + str(nums_3) + "." + str(nums_2) + "." + str(num_1) + "." + count_account
                            # print(f'description_with_tag: {description_with_tag}')

                            # Формируем хвост, который всегда должен остаться
                            tail = f"| {tag} {nums_3}.{nums_2}.{num_1}.{count_account}"

                            # Сколько максимум символов можно оставить для описания
                            max_length = 498 - len(tail) - 1  # -1 на пробел между описанием и хвостом

                            # Если описание длинное — обрезаем его
                            trimmed_description = description
                            if len(description) > max_length:
                                words = description.split()
                                while len(" ".join(words)) > max_length and len(words) > 1:
                                    words.pop()
                                trimmed_description = " ".join(words)

                            # Склеиваем всё обратно
                            description_with_tag = f"{trimmed_description} {tail}".strip()

                            scrape_Data[count] = {
                                "image_url": image_url,
                                "title": title_with_tag,
                                "description": description_with_tag
                            }

                            count += 1
                            count_of_pin += 1
                            links_list.append(link)

                    except (NoSuchElementException, StaleElementReferenceException):
                        continue

                print(f"len(scrape_Data): {len(scrape_Data)}")

                # Проверяем замер прироста данных
                previous_lengths.append(len(scrape_Data))
                if len(previous_lengths) > 15:
                    previous_lengths.pop(0)
                if len(set(previous_lengths)) == 1 and len(previous_lengths) == 15:
                    print("Количество записей не изменяется 15 итераций подряд, останавливаемся.")
                    break

                # Если собрано уже больше max_data
                if len(scrape_Data) >= max_data:
                    print("Достигнуто 3000+ пинов — останавливаем сбор.")
                    break

            # 🔸 Условие выхода №1 — если уже собрано достаточно
            if len(scrape_Data) >= max_data:
                print(f"Собрано более {max_data} пинов — выходим.")
                break
            else:
                print(f"len(scrape_Data): {len(scrape_Data)}")

        # --- после цикла ---
        if len(scrape_Data) < 250:
            print("Прерываем эти теги")
            return False, None, None, ""

        # обновляем описание доски из реально использованных тегов
        description_board = ", ".join(used_tags)
        print(f"✅ Итоговое описание доски (длина {len(description_board)}): {description_board}")

        return scrape_Data, temp_file1, temp_file2, description_board  # Возвращаем полные данные

    except Exception as e:
        print("Закрыли и выдали ошибку в parsing_pinterest")
        print(f"Тип ошибки: {type(e).__name__}")
        print(f"Текст ошибки: {e}")
        print("Полный traceback:")
        traceback.print_exc()
        driver.quit()
        raise

