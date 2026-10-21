// scripts/creative-fabrica/helpers/build-affiliate-url.js

/**
 * Генерирует правильную партнерскую ссылку для Creative Fabrica
 * @param {string} slug - слаг товара (например, 'smart-bubble')
 * @param {string} campaign - метка кампании (например, 'luxury-fonts')
 * @param {string} refId - твой ID партнера
 * @returns {string} - готовая ссылка
 */
export function buildAffiliateUrl(slug, campaign = "", refId = "8122976") {
    if (!slug) return "";

    // Базовая партнерская ссылка
    let url = `https://www.creativefabrica.com/product/${slug}/ref/${refId}/`;

    // Если передана кампания, добавляем её
    if (campaign) {
        // Очищаем название кампании для URL (убираем пробелы, спецсимволы)
        const cleanCampaign = encodeURIComponent(campaign.trim());
        url += `?campaign=${cleanCampaign}`;
    }

    return url;
}