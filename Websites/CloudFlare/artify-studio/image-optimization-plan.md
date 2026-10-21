## Описание Проблемы и Цели
Сайт загружается очень медленно из-за того, что браузер скачивает слишком много огромных изображений одновременно (network congestion). 
Я выявил **две критические проблемы**, из-за которых это происходит:

1. **Баг с приоритетом загрузки (Eager Loading Bug):** Сейчас для *каждой* карточки товара (даже если она в самом низу страницы) главное изображение помечается как `loading="eager"` и `fetchpriority="high"`. Если на странице 50 товаров, браузер пытается скачать 50 тяжёлых картинок одновременно с высшим приоритетом. Это "забивает" интернет-канал, и пользователь долго видит пустой экран.
2. **Агрессивная загрузка скрытых фото из карусели:** В карточках товара в карусели находится по 5 фотографий. Браузер скачивает их все сразу, даже если они скрыты за пределами экрана. 50 товаров * 5 фото = 250 изображений скачивается моментально при загрузке страницы!

## Предлагаемые Изменения

Для решения этой проблемы мы внедрим архитектуру "Lazy-On-Demand" (Отложенная загрузка по запросу), которая сократит количество скачиваемых фото при загрузке страницы на **80-90%**.

### 1. Компонент `ProductCard.astro`
Мы изменим логику так, чтобы при загрузке скачивалось **только одно** первое фото товара. Остальные фото карусели будут загружаться только тогда, когда пользователь наведёт мышку на карточку (или свайпнет на мобильном).
Также добавим поддержку пропса `priority`, чтобы только первые 4 товара на странице грузились моментально.

#### [MODIFY] src/components/ProductCard.astro
```html
---
// Добавляем пропс priority
export interface Props {
	product: any;
	affiliateUrl: string;
	priority?: boolean;
}

const { product, affiliateUrl, priority = false } = Astro.props;
// ...
---
<!-- Логика рендера изображений в карусели -->
{images.map((imgUrl, index) => (
	<a href={affiliateUrl} ...>
		<img
			/* Для первого фото (index 0) используем переданный приоритет, для остальных - заглушку */
			src={index === 0 ? imgUrl : "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="}
			data-src={index !== 0 ? imgUrl : null}
			alt={`${product.title} - photo ${index + 1}`}
			loading={index === 0 ? (priority ? "eager" : "lazy") : "lazy"}
			decoding="async"
			fetchpriority={index === 0 ? (priority ? "high" : "auto") : "auto"}
			class="h-full w-full object-cover select-none lazy-gallery-img"
		/>
	</a>
))}
```

Внизу файла мы обновим скрипт карусели, добавив "прогрев" изображений при наведении:
```javascript
// Внутри функции initCarousels() добавляем слушатель наведения для карточки:
carousel.addEventListener('mouseenter', () => {
    const lazyImages = carousel.querySelectorAll('.lazy-gallery-img[data-src]');
    lazyImages.forEach(img => {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
    });
}, { once: true });
// То же самое для touchstart на мобилках
carousel.addEventListener('touchstart', () => { ... }, { once: true, passive: true });
```

### 2. Сетка товаров `src/pages/[category]/[collection].astro`
Передадим `priority={true}` только для первых 4-6 карточек, которые пользователь видит сразу при открытии страницы.

#### [MODIFY] src/pages/[category]/[collection].astro
```html
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {products.map((product, index) => (
        <ProductCard 
            product={product} 
            affiliateUrl={buildAffiliateUrl(product.canonical, collection, category)} 
            priority={index < 4} 
        />
    ))}
</div>
```

### 3. Компонент `CollectionCard.astro` и `src/pages/[category]/index.astro`
Повторим логику приоритетов для коллекций, чтобы обложки коллекций также грузились оптимально.

#### [MODIFY] src/components/CollectionCard.astro
Добавим пропс `priority?: boolean` и применим его к тегу `<img>`.

#### [MODIFY] src/pages/[category]/index.astro
Передадим `priority={index < 4}` в `CollectionCard` внутри цикла `.map()`.


## User Review Required
> [!IMPORTANT]
> Данный метод решает 90% проблемы медленной загрузки, так как браузер перестанет качать по 200 фотографий за раз, а скачает только первые 4 фото, затем остальные первые обложки товаров (lazy), и **только** при наведении мышки подгрузит остальные слайды карусели! 
> Мы отказываемся от платных сервисов (Cloudflare Image Resizing), так как это архитектурное решение даст колоссальный буст бесплатно. Ознакомьтесь с логикой и подтвердите её запуск!

## Verification Plan
1. Я соберу проект (`npm run build`), чтобы убедиться, что всё корректно.
2. Проверю через терминал, что в `ProductCard` корректно подставляются атрибуты `data-src`.
3. После применения вы сможете обновить страницу на Cloudflare и заметить, что LCP (появление первых картинок) ускорилось в несколько раз.
