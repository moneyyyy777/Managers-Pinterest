export const optimizeImageUrl = (url) => {
    if (!url) return "";
    
    // 1. Уменьшаем размер Pinterest картинок (1200x/originals -> 564x)
    if (url.includes('i.pinimg.com')) {
        return url.replace(/\/(1200x|originals)\//, '/564x/');
    }
    
    // 2. Сжимаем тяжелые картинки Creative Fabrica через Cloudinary
    if (url.includes('creativefabrica.com')) {
        // f_auto = автоматический выбор формата (WebP/AVIF)
        // q_auto = автоматическое сжатие без видимой потери качества
        // w_600 = ширина 600px
        return `https://res.cloudinary.com/j4lrb8nv/image/fetch/f_auto,q_auto,w_600/${url}`;
    }
    
    return url;
};
