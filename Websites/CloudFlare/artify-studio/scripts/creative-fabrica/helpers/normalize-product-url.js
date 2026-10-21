/**
 * Normalizes Creative Fabrica product URLs.
 *
 * Removes:
 * - /ref/{id}
 * - ?campaign=
 * - utm parameters
 * - extra query params
 * - trailing slashes
 *
 * Always returns:
 * https://www.creativefabrica.com/product/product-slug/
 */

export function normalizeProductUrl(inputUrl) {

    try {

        const url = new URL(inputUrl.trim());

        // remove query params
        url.search = "";

        // split pathname
        const parts = url.pathname.split("/").filter(Boolean);

        // expected:
        // product
        // smart-bubble
        // ref
        // 8122976

        const clean = [];

        for (let i = 0; i < parts.length; i++) {

            if (parts[i] === "ref") break;

            clean.push(parts[i]);

        }

        url.pathname = "/" + clean.join("/") + "/";

        return url.toString();

    }

    catch {

        return null;

    }

}