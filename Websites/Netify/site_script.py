import re
import os


def process_google_sites(input_filename, main_output_filename):

    with open(input_filename, "r", encoding="utf-8") as f:
        content = f.read()


    print("=" * 60)
    print("Размер HTML:", len(content))


    # берем только tbody таблицы
    tbodies = re.findall(
        r'<tbody[^>]*class="mdc-data-table__content"[^>]*>(.*?)</tbody>',
        content,
        re.S
    )


    print("Найдено tbody:", len(tbodies))

    items = []

    total_rows = 0
    url_ok = 0
    views_ok = 0
    dog_ok = 0


    for index, tbody in enumerate(tbodies, start=1):

        rows = re.findall(
            r'<tr\b[^>]*>.*?</tr>',
            tbody,
            re.S
        )

        print(
            f"Tbody {index}: {len(rows)} строк"
        )


        total_rows += len(rows)



        for row in rows:


            # ------------------------
            # URL
            # ------------------------

            url_match = re.search(
                r'projected-content-container[^>]*>\s*([^<]+)',
                row,
                re.S
            )


            if not url_match:
                continue

            url_ok += 1

            path = url_match.group(1).strip()



            # ------------------------
            # Views
            # ------------------------

            views_match = re.search(
                r'cdk-column-DEFAULT-screenPageViews[^>]*>.*?</td>',
                row,
                re.S
            )


            if not views_match:
                continue

            views_ok += 1

            views_block = views_match.group(0)



            number = re.search(
                r'>\s*([0-9]+)\s*<span',
                views_block
            )


            if not number:
                continue



            views = int(
                number.group(1)
            )



            full_url = (
                "https://sites.google.com"
                + path
            )



            if "dog" not in full_url.lower():
                continue

            # dog_ok += 1

            items.append(
                (
                    full_url,
                    views
                )
            )



    print()
    print("=" * 60)

    print("Всего строк:", total_rows)

    print("URL найдено:", url_ok)
    print("Просмотры найдены:", views_ok)
    print("Прошли dog:", dog_ok)

    print(
        "Найдено сайтов:",
        len(items)
    )


    # ------------------------
    # Удаляем дубли
    # ------------------------

    unique = {}


    for url, views in items:

        if url not in unique:
            unique[url] = views

        else:
            unique[url] = max(
                unique[url],
                views
            )


    items = list(unique.items())


    print(
        "Уникальных:",
        len(items)
    )



    # ------------------------
    # Общий файл
    # ------------------------

    folder = os.path.dirname(main_output_filename)

    if folder:
        os.makedirs(
            folder,
            exist_ok=True
        )


    with open(
        main_output_filename,
        "w",
        encoding="utf-8"
    ) as f:


        for url, views in items:

            f.write(
                f"{url},{views}\n"
            )



    # ------------------------
    # Балансировка
    # ------------------------

    items.sort(
        key=lambda x:x[1],
        reverse=True
    )



    groups = [
        {"sum":0,"items":[]},
        {"sum":0,"items":[]},
        {"sum":0,"items":[]},
        {"sum":0,"items":[]},
    ]



    for item in items:


        group = min(
            groups,
            key=lambda x:x["sum"]
        )


        group["items"].append(item)

        group["sum"] += item[1]



    print()
    print("=" * 60)
    print("Группы")
    print("=" * 60)



    for i, group in enumerate(groups,1):


        with open(
            f"results_part_{i}.txt",
            "w",
            encoding="utf-8"
        ) as f1, open(
            f"results_part_{i}_views.txt",
            "w",
            encoding="utf-8"
        ) as f2:



            for url, views in group["items"]:

                f1.write(
                    url+"\n"
                )

                f2.write(
                    f"{url},{views}\n"
                )



        print(
            f"part_{i}: "
            f"{len(group['items'])} сайтов | "
            f"{group['sum']} просмотров"
        )



if __name__ == "__main__":

    process_google_sites(
        "element.txt",
        "result_dogbook/results_element.txt"
    )