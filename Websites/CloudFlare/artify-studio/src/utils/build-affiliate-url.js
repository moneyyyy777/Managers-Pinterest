// src/utils/build-affiliate-url.js

/**
 * Генерирует партнерскую ссылку с глубокой аналитикой: artifystudio-[category]-[campaign]
 * @param {string} canonicalOrSlug - Ссылка товара
 * @param {string} campaign - Название подборки (например "bubble-fonts")
 * @param {string} category - Категория (например "fonts", "procreate", "svg")
 * @param {string} refId - Ваш ID партнера
 */
export function buildAffiliateUrl(canonicalOrSlug, campaign = "", category = "", refId = "8122976") {
    if (!canonicalOrSlug) return "";

    let baseUrl = canonicalOrSlug.trim();

    if (!baseUrl.startsWith("http")) {
        baseUrl = `https://www.creativefabrica.com/product/${baseUrl}/`;
    }

    baseUrl = baseUrl.split("?")[0];
    baseUrl = baseUrl.replace(/\/ref\/\d+\/?$/i, "");
    if (!baseUrl.endsWith("/")) {
        baseUrl += "/";
    }

    let affiliateUrl = `${baseUrl}ref/${refId}/`;

    // Формируем полный тэг кампании
    let fullCampaign = "";
    if (category && campaign) {
        fullCampaign = `${category}-${campaign}`;
    } else {
        fullCampaign = campaign || category;
    }

    if (fullCampaign) {
        let cleanCampaign = fullCampaign.trim();
        
        // Приклеиваем префикс artifystudio-
        if (!cleanCampaign.toLowerCase().startsWith("artifystudio-")) {
            cleanCampaign = `artifystudio-${cleanCampaign}`;
        }

        affiliateUrl += `?campaign=${encodeURIComponent(cleanCampaign)}`;
    }

    return affiliateUrl;
}