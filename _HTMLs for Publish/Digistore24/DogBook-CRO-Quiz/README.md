# 🐶 DogBook CRO & Multi-Offer Dynamic Quiz (Pre-Lander)

Этот модуль разработан для кратного увеличения EPC и LTV с Pinterest-трафика в нише **Dogs** (Digistore24 + Amazon Associates).

---

## 📁 Содержимое папки

1. **`index.html`** — Автономный Single-File HTML лендинг:
   - 0 внешних зависимостей (все стили и SVG-иконки инлайновые).
   - Скорость загрузки < 0.4 сек, FCP 0ms, CLS = 0.
   - 100% Mobile-first оптимизация под Pinterest In-App Browser.
   - 3-вопросный Micro-Quiz (динамический роутер: Potty / Apartment / Training).
   - Психологическая микро-анимация (1.2s анализ профиля собаки для фиксации ценности).
   - Динамический вывод релевантного оффера Digistore24 + сопутствующих физических товаров Amazon.
   - Exit-Intent Popup (десктопный mouseleave + мобильный перехват кнопки «Назад» через history pushState).
   - Готов к деплою на Vercel, Cloudflare Pages, Netlify или хостинг любого регистратора.

2. **`dogs.astro`** — Нативный Astro/Cloudflare компонент:
   - Если вы захотите подключить этот лендинг к вашему Astro-проекту (например, `artify-studio`), просто поместите этот файл в `src/pages/dogs/index.astro`.

---

## ⚙️ Настройка партнерских ссылок (CONFIG)

В начале `<script>` в файле `index.html` (или `dogs.astro`) расположен блок конфигурации:

```javascript
const CONFIG = {
  AFFILIATE_ID: 'YOUR_AFFILIATE_ID', // Замените на ваш логин/ID в Digistore24
  AMAZON_TAG: 'YOUR_AMAZON_TAG-20',   // Замените на ваш Amazon Associates Tracking ID

  DIGISTORE_OFFERS: {
    potty: 'https://www.digistore24.com/redir/DOGBOOK7_ID/AFFILIATE_ID?subid=potty',
    apartment: 'https://www.digistore24.com/redir/DOGBOOK7_ID/AFFILIATE_ID?subid=apartment',
    training: 'https://www.digistore24.com/redir/DOGBOOK7_ID/AFFILIATE_ID?subid=training',
    default: 'https://www.digistore24.com/redir/DOGBOOK7_ID/AFFILIATE_ID?subid=quiz'
  }
};
```
