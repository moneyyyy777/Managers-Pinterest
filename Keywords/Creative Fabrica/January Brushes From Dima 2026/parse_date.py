import time
from datetime import datetime, timedelta

def parse_beatstars_date(date_str):
    """
    Превращает строку даты BeatStars в объект datetime.date
    Примеры: 'Today', 'Yesterday', 'Tue, 3 Feb 2026'
    """
    now = datetime.now()
    date_str = date_str.strip()

    if "Today" in date_str:
        return now.date()

    if "Yesterday" in date_str:
        return (now - timedelta(days=1)).date()

    try:
        # Формат: Tue, 3 Feb 2026 -> %a, %d %b %Y
        # %a - сокращенный день недели, %b - сокращенный месяц
        return datetime.strptime(date_str, "%a, %d %b %Y").date()
    except ValueError:
        # Если формат немного отличается (например, нет года, если это текущий год)
        # Можно добавить дополнительные проверки, если BeatStars не пишет год для текущих сообщений
        return now.date()

def get_message_send_status(text, msg_date_text, reference_date_str):
    print(f"Начало get_message_send_status")
    """
    text: текст сообщения
    msg_date_text: текст из элемента даты (Today/Yesterday/...)
    reference_date_str: дата отсчета в формате "дд.мм.гггг"
    """
    print(f"Перед 1")
    # 1. Сначала проверка на пустое сообщение (сохраняем старую логику)
    if not text.strip():
        return 1
    print(f"Перед 2 шагом")
    try:
        # 2. Парсим дату сообщения
        message_date = parse_beatstars_date(msg_date_text)

        print(f"message_date: {message_date}")

        # 3. Парсим контрольную дату (параметр дд.мм.гггг)
        ref_date = datetime.strptime(reference_date_str, "%d.%m.%Y").date()

        print(f"ref_date: {ref_date}")

        # 4. Считаем разницу
        # Если контрольная дата минус дата сообщения >= 3 дня
        delta = ref_date - message_date

        print(f"delta_date: {delta}")

        if delta.days >= 3:
            return 100  # Сообщение старое (3 дня и более), можно слать срочное
        else:
            return 1000  # Сообщение свежее, нельзя

    except Exception as e:
        print(f"Ошибка парсинга дат: {e}")
        return 1000  # В случае ошибки лучше перестраховаться

element_text = 'Yoooo'

msg_date_text = "Sun, 18 Jan 2026"

beat_drops_data = "06.02.2026"

found_promotion_message = get_message_send_status(element_text, msg_date_text,
                                                  beat_drops_data)