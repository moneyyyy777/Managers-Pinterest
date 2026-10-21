// scripts/creative-fabrica/selectors.js

export const SELECTORS = {
    title: "h1",
    
    // Короткое описание для SEO
    description: 'meta[name="description"]',
    
    // ПОЛНОЕ оригинальное описание товара со страницы
    fullDescription: '.product-description, #product-description, [data-testid="product-description"]',
    
    image: 'meta[property="og:image"]',
    canonical: 'link[rel="canonical"]',
    ogTitle: 'meta[property="og:title"]',
    ogDescription: 'meta[property="og:description"]',
    
    // Строгий селектор: только настоящие хлебные крошки, а не всё меню
    breadcrumbs: '.breadcrumbs a, .breadcrumb a, [aria-label="breadcrumb"] a',
    
    // Ищем картинки именно в контейнере галереи
    gallery: '.product-slider img, .product-gallery img, .swiper-wrapper img',
    
    // Ссылка на дизайнера
    author: 'a[href*="/designer/"]',

    // Лайки / Избранное (Added to favorites)
    favorites: '#favorite-count, .favorite-count-text [id*="favorite"], .favorite-count',

    // Теги дизайнера
    designerTags: '.c-tags a, a[href*="creativefabrica.com/tag/"]'
};