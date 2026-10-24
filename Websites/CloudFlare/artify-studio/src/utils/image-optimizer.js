export const optimizeImageUrl = (url) => {
    if (!url) return "";
    
    // 1. Уменьшаем размер Pinterest картинок (1200x/originals -> 564x)
    if (url.includes('i.pinimg.com')) {
        return url.replace(/\/(1200x|originals)\//, '/564x/');
    }
    
    // 2. Сжимаем тяжелые картинки Creative Fabrica через глобальный бесплатный CDN Cloudflare (wsrv.nl)
    // w=600, WebP, качество 80% (сжатие на ~75% без потери качества)
    if (url.includes('cdn.creativefabrica.com') || url.includes('creativefabrica.com')) {
        return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=600&output=webp&q=80`;
    }
    
    return url;
};
