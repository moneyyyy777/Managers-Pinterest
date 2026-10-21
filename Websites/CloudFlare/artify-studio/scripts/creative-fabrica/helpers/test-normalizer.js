import { normalizeProductUrl } from "./normalize-product-url.js";

const urls = [

"https://www.creativefabrica.com/product/smart-bubble/",

"https://www.creativefabrica.com/product/smart-bubble/ref/8122976/",

"https://www.creativefabrica.com/product/smart-bubble/ref/8122976/?campaign=BubbleFonts",

"https://www.creativefabrica.com/product/smart-bubble/?utm=test"

];

for (const url of urls) {

    console.log(normalizeProductUrl(url));

}