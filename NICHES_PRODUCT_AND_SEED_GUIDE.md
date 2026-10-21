# Artify Studio — товары, фильтрация и seed tags по нишам

**Связанная карта URL:** `NICHES_ANALYSIS_V3.md`  
**Назначение:** использовать этот файл вместе с промптом Gemini перед созданием папок, `Seed Tags.txt` и экспортом в PinInspector.

## Общие правила для всех ниш

- Добавлять только digital products, которые соответствуют URL, целевому покупателю и сценарию применения страницы.
- Seed tag — короткий англоязычный поисковый запрос из 2–5 слов. Он должен описывать товар или точный сценарий товара, а не быть просто красивой эстетикой.
- Не добавлять в seed tags: `free`, названия чужих магазинов, нерелевантные бренды, одиночные имена персонажей, слишком общие запросы (`cute design`, `aesthetic art`) и запросы на физический товар без цифрового asset intent.
- Формировать 3–6 независимых intent-папок только при различии выдачи Pinterest или покупательского сценария. Эстетические варианты одного и того же товара оставлять в одной папке.
- Перед записью seed tag обязан пройти фильтр: **товар → ниша → сценарий → визуальная выдача**. Если хотя бы один пункт не проходит, тег исключается.

---

## 🎄 Сезонные и праздничные ниши

### 1. Christmas Bundles — `/christmas-bundles`
* **Добавлять:** готовые Christmas bundles с несколькими согласованными asset types: SVG, PNG, clipart, sublimation designs, fonts, digital paper и шаблоны.
* **Seed-направления:** `christmas svg bundle`, `holiday clipart bundle`, `christmas design bundle`, `xmas craft bundle`.
* **Фильтровать:** оставить только готовые наборы; исключить одиночные файлы, generic winter assets и наборы без Christmas-темы.

### 2. Christmas Tumbler Wraps — `/tumbler-wraps/christmas`
* **Добавлять:** PNG sublimation wraps, 20 oz skinny tumbler wraps, straight/tapered templates и Christmas tumbler bundles.
* **Seed-направления:** `christmas tumbler wrap`, `20 oz christmas tumbler`, `holiday sublimation wrap`, `skinny tumbler christmas png`.
* **Фильтровать:** исключить SVG для кружек, обычные mug designs, bottle labels и tumbler products без Christmas-сюжета.

### 3. Retro Christmas Cliparts — `/cliparts/retro-christmas`
* **Добавлять:** PNG clipart sets с винтажными Santa, ornaments, trees, candy, reindeer и 50s/60s/70s Christmas визуалом.
* **Seed-направления:** `retro christmas clipart`, `vintage santa png`, `groovy christmas clipart`, `mid century christmas png`.
* **Фильтровать:** исключить современные minimal SVG, обычный Christmas clipart без retro/vintage признака и физические открытки.

### 4. Cricut Holiday Fonts — `/fonts/christmas-cricut`
* **Добавлять:** OTF/TTF Christmas fonts, craft-friendly fonts, weld-friendly scripts и праздничные font bundles.
* **Seed-направления:** `christmas font cricut`, `holiday script font`, `weld friendly christmas font`, `festive lettering font`.
* **Фильтровать:** исключить clipart, готовые SVG designs и шрифты без праздничной либо Cricut/craft связи.

### 5. Ugly Sweater SVGs — `/svg/ugly-sweater`
* **Добавлять:** cut files для sweater, shirt и family party designs: SVG, PNG, DXF, EPS в одном дизайне или наборе.
* **Seed-направления:** `ugly sweater svg`, `funny christmas sweater svg`, `holiday shirt cut file`, `christmas sweater design`.
* **Фильтровать:** исключить реальные свитера, knitting patterns, generic Christmas SVG без sweater/shirt intent.

### 6. Sarcastic / Funny Christmas SVGs — `/svg/funny-christmas`
* **Добавлять:** ироничные Christmas SVG/PNG для shirts, mugs, party signs и gift projects.
* **Seed-направления:** `funny christmas svg`, `sarcastic christmas shirt`, `anti christmas svg`, `christmas dad joke svg`.
* **Фильтровать:** исключить детские нейтральные Christmas designs, physical shirts и юмор без Christmas-контекста.

### 7. Fall SVGs — `/svg/fall`
* **Добавлять:** осенние cut files для shirts, signs, kitchen decor и seasonal crafts: pumpkins, leaves, cozy quotes, harvest.
* **Seed-направления:** `fall svg`, `autumn cut file`, `pumpkin shirt svg`, `cozy fall svg`.
* **Фильтровать:** исключить Thanksgiving-specific файлы, Halloween-only designs и физический декор.

### 8. Thanksgiving SVGs — `/svg/thanksgiving`
* **Добавлять:** Thanksgiving cut files для family shirts, tablescape, signs и gratitude projects.
* **Seed-направления:** `thanksgiving svg`, `turkey cut file`, `thankful shirt svg`, `thanksgiving cricut design`.
* **Фильтровать:** исключить широкий fall content без Thanksgiving, cooking recipes и printable menus без SVG intent.

### 9. Winter Procreate Brushes — `/procreate-brushes/winter`
* **Добавлять:** Procreate brush sets для snow, frost, ice, winter foliage, fur, texture и seasonal lettering.
* **Seed-направления:** `winter procreate brushes`, `snow procreate brush`, `frost texture brush`, `ice brush procreate`.
* **Фильтровать:** исключить Photoshop brushes, clipart, готовые winter illustrations и кисти без Procreate-совместимости.

### 10. Pink Coquette Christmas Cliparts — `/cliparts/christmas-pink-coquette`
* **Добавлять:** PNG clipart с pink Santa, bows, coquette ornaments, feminine gifts и girly Christmas imagery.
* **Seed-направления:** `pink christmas clipart`, `coquette christmas png`, `christmas bow clipart`, `girly christmas clipart`.
* **Фильтровать:** исключить neutral/vintage Christmas без pink/coquette признака, SVG cut files и physical stickers.

---

## 🌲 Evergreen-ниши

### 11. Wedding SVGs — `/svg/wedding`
* **Добавлять:** wedding SVG, DXF, EPS и PNG для signs, cups, shirts, cake toppers и Cricut décor.
* **Seed-направления:** `wedding svg`, `wedding sign svg`, `bride shirt svg`, `wedding cricut cut file`.
* **Фильтровать:** исключить wedding fonts, invitation templates, photos и generic love designs.

### 12. Wedding Fonts — `/fonts/wedding`
* **Добавлять:** wedding calligraphy, serif, script и elegant font families для invitations, menus и signage.
* **Seed-направления:** `wedding font`, `wedding script font`, `elegant invitation font`, `bridal calligraphy font`.
* **Фильтровать:** исключить wedding SVG, clipart, editable invitation templates и non-wedding generic fonts.

### 13. Wedding Cliparts — `/cliparts/wedding`
* **Добавлять:** wedding PNG sets: florals, rings, cakes, champagne, couples, stationery graphics.
* **Seed-направления:** `wedding clipart`, `wedding floral png`, `bridal clipart set`, `wedding invitation clipart`.
* **Фильтровать:** исключить SVG cut files, font files и finished printable invitation templates.

### 14. Wildflower Cliparts — `/cliparts/wildflower`
* **Добавлять:** isolated PNG wildflower sets, meadow florals, bouquets и botanical elements.
* **Seed-направления:** `wildflower clipart`, `wildflower png`, `meadow flower clipart`, `wildflower watercolor png`.
* **Фильтровать:** исключить tropical/botanical leaf-only graphics, seamless patterns и finished wedding invitations.

### 15. Botanical Cliparts — `/cliparts/botanical`
* **Добавлять:** botanical PNG elements: leaves, herbs, stems, antique illustrations и foliage collections.
* **Seed-направления:** `botanical clipart`, `botanical png`, `vintage botanical clipart`, `leaf clipart set`.
* **Фильтровать:** исключить wildflower-only sets, tropical florals, patterns и plant care printables.

### 16. Cottagecore Floral Cliparts — `/cliparts/cottagecore-floral`
* **Добавлять:** soft garden florals, cottage blooms, mushrooms, herbs и vintage garden PNG sets.
* **Seed-направления:** `cottagecore floral clipart`, `cottage garden png`, `vintage garden clipart`, `romantic flower png`.
* **Фильтровать:** исключить generic botanical graphics, dark witchy assets и floral seamless patterns.

### 17. Tropical Floral Cliparts — `/cliparts/tropical-floral`
* **Добавлять:** hibiscus, palm leaves, monstera, tropical flowers и summer PNG clipart sets.
* **Seed-направления:** `tropical floral clipart`, `hibiscus png`, `palm leaf clipart`, `tropical flower png`.
* **Фильтровать:** исключить wildflowers, generic summer posters и tropical seamless patterns.

### 18. Cricut Monogram SVGs — `/svg/cricut-monograms`
* **Добавлять:** alphabet and monogram SVG sets, split monograms, frames и personalized cut files.
* **Seed-направления:** `monogram svg cricut`, `split monogram svg`, `floral monogram svg`, `alphabet cut file`.
* **Фильтровать:** исключить font files, generic initials without SVG/cut-file intent и finished embroidery products.

### 19. Tattoo Procreate Brushes — `/procreate-brushes/tattoo-stipple`
* **Добавлять:** Procreate brushes for stipple, dotwork, engraving, sketch, blackwork и tattoo texture.
* **Seed-направления:** `tattoo procreate brushes`, `stipple procreate brush`, `dotwork brush procreate`, `engraving procreate brush`.
* **Фильтровать:** исключить tattoo designs, tattoo stencils, Photoshop brushes и brushes без tattoo/dotwork intent.

### 20. Baby Shower Cliparts — `/cliparts/baby-shower`
* **Добавлять:** baby shower PNG clipart: animals, balloons, baby clothes, teddy bears, invitations elements.
* **Seed-направления:** `baby shower clipart`, `baby shower png`, `teddy bear baby clipart`, `safari baby shower png`.
* **Фильтровать:** исключить nursery-only décor, pregnancy announcements, SVG cut files и physical party supplies.

### 21. Baby Shower SVGs — `/svg/baby-shower`
* **Добавлять:** baby shower SVG/DXF/EPS для signs, shirts, favors и Cricut decorations.
* **Seed-направления:** `baby shower svg`, `baby shower cut file`, `baby shower cricut svg`, `baby shower sign svg`.
* **Фильтровать:** исключить PNG clipart, nursery décor, editable invitations и physical party goods.

### 22. Baby Shower Bundles — `/baby-shower-bundles`
* **Добавлять:** только готовые baby shower bundles с несколькими согласованными design assets.
* **Seed-направления:** `baby shower bundle`, `baby shower svg bundle`, `baby shower clipart bundle`.
* **Фильтровать:** не создавать страницу и не собирать seeds, пока нет достаточного пула именно bundle products; исключить одиночные assets.

### 23. Streetwear Mockups — `/mockups/streetwear`
* **Добавлять:** PSD/Canva-ready mockups of oversized tees, hoodies, urban apparel, flat lays и lifestyle streetwear scenes.
* **Seed-направления:** `streetwear mockup`, `oversized tshirt mockup`, `urban hoodie mockup`, `grunge shirt mockup`.
* **Фильтровать:** исключить fitness, baby, bridal и generic ecommerce apparel mockups без streetwear visual world.

### 24. Fitness Apparel Mockups — `/mockups/fitness-apparel`
* **Добавлять:** activewear mockups: leggings, sports bras, gym shirts, sets и sport lifestyle scenes.
* **Seed-направления:** `fitness apparel mockup`, `gym shirt mockup`, `activewear mockup`, `sports bra mockup`.
* **Фильтровать:** исключить streetwear, bridal, baby и обычные t-shirt mockups без fitness context.

### 25. Baby Apparel Mockups — `/mockups/baby-apparel`
* **Добавлять:** onesie, toddler shirt, baby bodysuit и mom-and-baby apparel mockups.
* **Seed-направления:** `baby onesie mockup`, `baby apparel mockup`, `toddler shirt mockup`, `baby bodysuit mockup`.
* **Фильтровать:** исключить baby shower clipart, nursery printables и adult apparel mockups.

### 26. Bridal Apparel Mockups — `/mockups/bridal-apparel`
* **Добавлять:** bridal tee, robe, sweatshirt, bachelorette и wedding party apparel mockups.
* **Seed-направления:** `bridal shirt mockup`, `bride robe mockup`, `bachelorette mockup`, `wedding apparel mockup`.
* **Фильтровать:** исключить wedding SVG, invitations, generic fashion mockups и fitness/streetwear scenes.

### 27. Fabric Seamless Patterns — `/patterns/fabric`
* **Добавлять:** seamless repeating patterns suitable for fabric printing, sewing и Spoonflower.
* **Seed-направления:** `fabric seamless pattern`, `sewing fabric pattern`, `spoonflower pattern`, `repeat pattern fabric`.
* **Фильтровать:** исключить packaging, digital paper, POD-only graphics и individual clipart elements.

### 28. Packaging Seamless Patterns — `/patterns/packaging`
* **Добавлять:** repeat patterns for wrapping paper, tissue paper, labels, bags и small-business packaging.
* **Seed-направления:** `packaging seamless pattern`, `tissue paper pattern`, `wrapping paper pattern`, `packaging repeat pattern`.
* **Фильтровать:** исключить fabric sewing patterns, scrapbook paper и POD all-over print designs.

### 29. POD Seamless Patterns — `/patterns/pod`
* **Добавлять:** repeat designs for all-over print apparel, accessories и print-on-demand products.
* **Seed-направления:** `pod seamless pattern`, `all over print pattern`, `apparel repeat pattern`, `print on demand pattern`.
* **Фильтровать:** исключить fabric-only, scrapbooking и packaging query intents.

### 30. Digital Paper Patterns — `/patterns/digital-paper`
* **Добавлять:** printable/digital scrapbook paper packs, repeating backgrounds и craft paper.
* **Seed-направления:** `digital paper pack`, `scrapbook paper printable`, `digital scrapbook paper`, `seamless digital paper`.
* **Фильтровать:** исключить physical scrapbook paper, fabric patterns, POD mockups и individual clipart.

### 31. Christian / Faith SVGs — `/svg/christian`
* **Добавлять:** Christian SVG/PNG/DXF for shirts, church events, décor и Bible verse crafts.
* **Seed-направления:** `christian svg`, `bible verse svg`, `faith shirt svg`, `church cricut svg`.
* **Фильтровать:** исключить physical apparel, generic inspirational quotes without Christian signal, fonts и clipart-only assets.

### 32. KDP Journals — `/kdp/journals`
* **Добавлять:** ready-to-upload journal interiors: lined, guided, gratitude, wellness, reading и reflection pages.
* **Seed-направления:** `kdp journal interior`, `lined journal interior`, `gratitude journal interior`, `guided journal pages`.
* **Фильтровать:** исключить covers, planner pages, logbooks, physical notebooks и generic journal prompts without interior/template intent.

### 33. KDP Planners — `/kdp/planners`
* **Добавлять:** dated/undated planner interiors: daily, weekly, monthly, academic, meal, fitness и productivity.
* **Seed-направления:** `kdp planner interior`, `daily planner pages`, `weekly planner interior`, `undated planner template`.
* **Фильтровать:** исключить journal-only pages, logbooks, planner covers and physical planners.

### 34. KDP Logbooks — `/kdp/logbooks`
* **Добавлять:** structured tracking interiors: vehicle, mileage, maintenance, medical, business, hobby и fitness logs.
* **Seed-направления:** `kdp logbook interior`, `mileage log book interior`, `tracker pages kdp`, `record book interior`.
* **Фильтровать:** исключить broad journals/planners, book covers, physical record books и requests not related to KDP interiors.

### 35. Y2K Cyber Fonts — `/fonts/y2k-cyber`
* **Добавлять:** cyber/Y2K OTF/TTF fonts for gaming, streaming, rave, tech и futuristic designs.
* **Seed-направления:** `y2k cyber font`, `cyberpunk font`, `techno y2k font`, `futuristic chrome font`.
* **Фильтровать:** исключить kawaii, grunge, pixel-only and generic sci-fi fonts without Y2K/cyber visual language.

### 36. Y2K Kawaii Fonts — `/fonts/y2k-kawaii`
* **Добавлять:** cute bubble, girly, pink and playful Y2K fonts for stickers and feminine branding.
* **Seed-направления:** `y2k kawaii font`, `bubble y2k font`, `pink cute font`, `bratz style font`.
* **Фильтровать:** исключить cyber, grunge, pixel fonts and generic children's fonts without Y2K taste.

### 37. Y2K Grunge Fonts — `/fonts/y2k-grunge`
* **Добавлять:** distressed, emo, skater, punk and gothic Y2K font files.
* **Seed-направления:** `y2k grunge font`, `emo y2k font`, `skater font`, `distressed punk font`.
* **Фильтровать:** исключить kawaii, cyber, pixel and non-Y2K vintage grunge typography.

### 38. Y2K Pixel Fonts — `/fonts/y2k-pixel`
* **Добавлять:** pixel/bitmap fonts for retro internet, arcade, vaporwave and game UI design.
* **Seed-направления:** `y2k pixel font`, `retro pixel font`, `vaporwave pixel font`, `windows 98 font`.
* **Фильтровать:** исключить generic gaming assets, pixel clipart and fonts without pixel/bitmap letterforms.

---

## 🚀 Новые хитовые ниши

### 39. Western Cowgirl SVG — `/svg/western-cowgirl`
* **Добавлять:** western/cowgirl SVG, PNG, DXF и EPS для shirts, hats, tumblers и Cricut merch.
* **Seed-направления:** `western cowgirl svg`, `cowgirl shirt svg`, `rodeo cut file`, `western boots svg`.
* **Фильтровать:** исключить real western apparel, horse clipart without cut-file intent и generic country designs.

### 40. Cottagecore Garden Cliparts — `/cliparts/cottagecore-garden`
* **Добавлять:** PNG sets with cottage gardens, herbs, vegetables, flowers, insects, tools and whimsical garden scenes.
* **Seed-направления:** `cottagecore garden clipart`, `garden png clipart`, `vintage herb clipart`, `whimsical garden png`.
* **Фильтровать:** исключить floral-only clipart, witchy occult assets, gardening advice and seamless patterns.

### 41. Laser-Cut Bookmarks — `/laser-cut/bookmarks`
* **Добавлять:** SVG/DXF/EPS laser-cut bookmark files, layered and personalized bookmark templates.
* **Seed-направления:** `laser cut bookmark`, `bookmark svg laser`, `layered bookmark svg`, `dxf bookmark file`.
* **Фильтровать:** исключить printable bookmarks, bookish clipart, Cricut bookmarks without laser-cut intent and physical products.

### 42. Witchy / Occult Cliparts — `/cliparts/witchy-occult`
* **Добавлять:** PNG clipart with tarot, celestial, potion, moon, crystals, spells and vintage occult imagery.
* **Seed-направления:** `witchy clipart`, `occult png`, `tarot clipart`, `celestial witch png`.
* **Фильтровать:** исключить actual tarot readings, Halloween-only assets, witch SVG cut files and generic gothic graphics.

### 43. Teacher / Classroom SVG — `/svg/teacher-classroom`
* **Добавлять:** SVG/DXF/PNG for teacher shirts, classroom signs, school décor, grade-level and appreciation projects.
* **Seed-направления:** `teacher svg`, `classroom svg`, `teacher shirt svg`, `school cricut cut file`.
* **Фильтровать:** исключить printable worksheets, teacher clipart, education lesson plans and physical classroom products.

### 44. Retro Groovy Fonts — `/fonts/retro-groovy`
* **Добавлять:** 60s/70s psychedelic, disco, flower-power and funky OTF/TTF fonts.
* **Seed-направления:** `groovy font`, `retro 70s font`, `psychedelic font`, `disco font`.
* **Фильтровать:** исключить generic vintage fonts, Y2K fonts, clipart and poster templates without a font-file intent.

### 45. Book Lover Printables — `/printables/book-lover`
* **Добавлять:** reading journals, bookmarks, TBR trackers, book club sheets, reading challenge and printable literary décor.
* **Seed-направления:** `book lover printable`, `reading journal printable`, `tbr tracker printable`, `book club printable`.
* **Фильтровать:** исключить physical books, book recommendations, laser-cut files and generic planner pages without reader intent.

### 46. Handwritten Lettering Fonts — `/fonts/handwritten-lettering`
* **Добавлять:** handwritten OTF/TTF fonts: signature, casual script, marker, messy and elegant handwriting.
* **Seed-направления:** `handwritten font`, `signature font`, `casual script font`, `marker lettering font`.
* **Фильтровать:** исключить calligraphy tutorials, Procreate brushes, generic fonts without handwriting character and ready-made logos.
