// resizeEmbedBlock_v4.js
// v4: у Google Sites обнаружен лимит роста за ОДИН mousedown-жест
// (~5 шагов ≈ 220px), дальше block перестаёт реагировать на move,
// хотя кнопка мыши всё ещё зажата. Решение: тянуть короткими
// burst-циклами — drag N шагов → отпустить → заново найти ручку по
// её НОВОЙ позиции → снова drag N шагов, и так пока не дойдём до цели.
//
// Второе исправление: widgetHandle больше не ищется через клик в
// фиксированную точку на каждой попытке (после роста блока и скроллов
// эта точка перестаёт попадать на виджет). Handle держится один живой
// на весь процесс, координаты для скролла/ручки каждый burst берутся
// из его актуального boundingBox().

export async function resizeEmbedBlock(page, targetHeightPx, opts = {}) {
    const {
        selectPoint,
        stepPx = 40,
        burstSteps = 5,              // шагов за один mousedown-жест до отпускания
        stepDelayMs = 60,
        scrollBeforeBurstPx = 350,
        maxBursts = 200,             // safety-потолок общего числа burst-циклов
        minProgressPerBurstPx = 10,  // если burst дал меньше — считаем застоем
        stuckBurstsLimit = 3,        // столько подряд "застойных" burst — стоп
        heightTolerancePx = 15,
    } = opts;

    console.log(`\n📐 Растягиваю embed-блок до ~${targetHeightPx}px (burst-режим)...`);

    const viewport = page.viewportSize() || { width: 1280, height: 800 };
    const clickX = selectPoint?.x ?? viewport.width / 2;
    const clickY = selectPoint?.y ?? viewport.height / 2;

    // Выделяем виджет один раз
    await page.mouse.click(clickX, clickY);
    await page.waitForTimeout(600);

    let widgetHandle = await getWidgetElementHandle(page, clickX, clickY);
    if (!widgetHandle) {
        console.error('❌ Не удалось найти виджет для растягивания.');
        return false;
    }

    let stuckBursts = 0;

    for (let burst = 1; burst <= maxBursts; burst++) {
        // Проверяем, жив ли handle; если DOM перестроился — пробуем
        // перезахватить виджет по последней известной позиции
        let box = await widgetHandle.boundingBox().catch(() => null);
        if (!box) {
            console.warn('⚠️ ElementHandle "протух", пробую перезахватить виджет...');
            await page.mouse.click(clickX, clickY);
            await page.waitForTimeout(500);
            widgetHandle = await getWidgetElementHandle(page, clickX, clickY);
            box = widgetHandle ? await widgetHandle.boundingBox().catch(() => null) : null;
            if (!box) {
                console.error('❌ Виджет не найден повторно, прекращаю.');
                return false;
            }
        }

        if (box.height >= targetHeightPx - heightTolerancePx) {
            console.log(`✅ Целевая высота достигнута: ${Math.round(box.height)}px.`);
            return true;
        }

        // Скроллим под курсором, чтобы у ручки было место двигаться вниз
        await page.mouse.move(box.x + box.width / 2, box.y + 10);
        await page.mouse.wheel(0, scrollBeforeBurstPx);
        await page.waitForTimeout(300);

        box = await widgetHandle.boundingBox().catch(() => box);

        // Ищем ручку заново — её позиция сместилась после роста блока и скролла
        const handle = await findBottomHandleViaJS(page, box);
        const startX = handle ? handle.x : box.x + box.width / 2;
        const startY = handle ? handle.y : box.y + box.height - 2;

        const heightBefore = box.height;

        // Один короткий жест: down → burstSteps move → up
        await page.mouse.move(startX, startY, { steps: 5 });
        await page.waitForTimeout(150);
        await page.mouse.down();
        await page.waitForTimeout(150);

        let currentY = startY;
        const vp = page.viewportSize() || { width: 1280, height: 800 };

        for (let s = 0; s < burstSteps; s++) {
            currentY += stepPx;
            if (currentY > vp.height - 100) {
                await page.mouse.move(startX, vp.height - 80, { steps: 3 });
                await page.mouse.wheel(0, stepPx * 2);
                currentY = vp.height - 80;
            } else {
                await page.mouse.move(startX, currentY, { steps: 3 });
            }
            await page.waitForTimeout(stepDelayMs);
        }

        await page.waitForTimeout(200);
        await page.mouse.up();
        await page.waitForTimeout(500);

        const afterBox = await widgetHandle.boundingBox().catch(() => null);
        const heightAfter = afterBox ? afterBox.height : heightBefore;
        const progress = heightAfter - heightBefore;

        console.log(`   [burst ${burst}] ${Math.round(heightBefore)}px → ${Math.round(heightAfter)}px (прирост ${Math.round(progress)}px)`);

        if (heightAfter >= targetHeightPx - heightTolerancePx) {
            console.log(`✅ Целевая высота достигнута: ${Math.round(heightAfter)}px.`);
            return true;
        }

        if (progress < minProgressPerBurstPx) {
            stuckBursts++;
            console.warn(`⚠️ Burst без ощутимого прогресса (${stuckBursts}/${stuckBurstsLimit})`);
            if (stuckBursts >= stuckBurstsLimit) {
                console.warn(`⚠️ ${stuckBurstsLimit} застойных burst подряд — останавливаюсь на ${Math.round(heightAfter)}px.`);
                try {
                    await page.screenshot({ path: '/mnt/user-data/outputs/resize_stuck.png' });
                } catch {}
                return false;
            }
        } else {
            stuckBursts = 0;
        }
    }

    console.warn(`⚠️ Достигнут предел в ${maxBursts} burst-циклов.`);
    return false;
}

// ---------------------------------------------------------------------

async function getWidgetElementHandle(page, x, y) {
    const jsHandle = await page.evaluateHandle(({ px, py }) => {
        let el = document.elementFromPoint(px, py);
        let best = null;

        for (let depth = 0; el && depth < 10; depth++) {
            const rect = el.getBoundingClientRect();
            if (rect.width > 100 && rect.height > 30 && rect.height < 2000) {
                best = el;
                if (rect.width > 200) break;
            }
            el = el.parentElement;
        }

        return best;
    }, { px: x, py: y });

    return jsHandle.asElement();
}

async function findBottomHandleViaJS(page, widgetBox) {
    return page.evaluate(({ box }) => {
        const targetX = box.x + box.width / 2;
        const targetY = box.y + box.height;

        const all = Array.from(document.querySelectorAll('div, span'));
        let bestEl = null;
        let bestDist = Infinity;

        for (const el of all) {
            const rect = el.getBoundingClientRect();
            if (rect.width <= 0 || rect.width > 22 || rect.height <= 0 || rect.height > 22) continue;

            const cursor = window.getComputedStyle(el).cursor || '';
            const cx = rect.x + rect.width / 2;
            const cy = rect.y + rect.height / 2;
            const dist = Math.hypot(cx - targetX, cy - targetY);

            if (/resize/.test(cursor) && dist < 60) {
                if (dist < bestDist) {
                    bestDist = dist;
                    bestEl = { x: cx, y: cy };
                }
            }
        }

        if (!bestEl) {
            for (const el of all) {
                const rect = el.getBoundingClientRect();
                if (rect.width <= 0 || rect.width > 22 || rect.height <= 0 || rect.height > 22) continue;
                const cx = rect.x + rect.width / 2;
                const cy = rect.y + rect.height / 2;
                if (Math.abs(cy - targetY) < 12 && Math.abs(cx - targetX) < box.width / 2 + 15) {
                    const dist = Math.hypot(cx - targetX, cy - targetY);
                    if (dist < bestDist) {
                        bestDist = dist;
                        bestEl = { x: cx, y: cy };
                    }
                }
            }
        }

        return bestEl;
    }, { box: widgetBox });
}