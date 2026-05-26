const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

// ===== НАСТРОЙКИ =====
const IMAGES_DIR = path.join(__dirname, "..", "images");
const OUTPUT_FILE = path.join(__dirname, "images_map.json");

// Создаём папку для изображений
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// ===== КАТЕГОРИИ ДЛЯ ПАРСИНГА =====
const QUERIES = [
  { id: "hero-mask", query: "mayan gold mask artifact", type: "photo" },
  { id: "calendar", query: "mayan calendar stone glyphs", type: "photo" },
  { id: "pyramid", query: "chichen itza pyramid sunset", type: "photo" },
  { id: "obsidian", query: "obsidian crystal dark", type: "photo" },
  { id: "frieze", query: "mayan frieze glyphs horizontal", type: "photo" },
  { id: "jaguar", query: "jaguar face glowing eyes", type: "photo" },
  { id: "gemstone", query: "gemstone dark background", type: "photo" },
  { id: "textile", query: "mayan textile gold pattern", type: "photo" },
  { id: "moon-pyramid", query: "full moon pyramid silhouette", type: "photo" },
  { id: "shield", query: "mayan shield geometric", type: "photo" },
  { id: "codex", query: "mayan codex ancient manuscript", type: "photo" },
  { id: "temple", query: "mayan temple sunset wide", type: "photo" },
];

// ===== ПАРСИНГ ИЗОБРАЖЕНИЙ ИЗ ОТКРЫТЫХ ИСТОЧНИКОВ =====
async function searchImages(query) {
  console.log(`🔍 Поиск: ${query}`);

  // Используем Unsplash (бесплатно, без API ключа для ознакомительных целей)
  const url = `https://unsplash.com/s/photos/${encodeURIComponent(query)}`;

  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ImageCollector/1.0)",
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const images = [];

    // Собираем URL изображений
    $('img[src*="images.unsplash.com"]').each((i, el) => {
      const src = $(el).attr("src");
      if (src && images.length < 5) {
        // Получаем версию среднего размера
        const mediumSrc = src
          .replace(/w=\d+/, "w=600")
          .replace(/h=\d+/, "h=400")
          .replace(/fit=crop/, "fit=crop&q=80");
        images.push(mediumSrc);
      }
    });

    return images;
  } catch (err) {
    console.error(`  ⚠️ Ошибка поиска: ${err.message}`);
    return [];
  }
}

// ===== СОХРАНЕНИЕ ИЗОБРАЖЕНИЙ =====
async function downloadImage(url, filepath) {
  try {
    const response = await axios.get(url, {
      responseType: "stream",
      timeout: 15000,
    });

    const writer = fs.createWriteStream(filepath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });
  } catch (err) {
    console.error(`  ❌ Ошибка загрузки: ${err.message}`);
    throw err;
  }
}

// ===== ГЛАВНАЯ ФУНКЦИЯ =====
async function main() {
  console.log("🖼️  Запуск парсера изображений\n");

  const imageMap = {};
  let downloadedCount = 0;

  for (const item of QUERIES) {
    console.log(`\n📸 Категория: ${item.id}`);

    const images = await searchImages(item.query);

    if (images.length > 0) {
      imageMap[item.id] = {
        description: item.query,
        url: images[0],
        localPath: `images/${item.id}.jpg`,
        alternatives: images.slice(1, 3),
      };

      // Скачиваем первое изображение
      const filepath = path.join(IMAGES_DIR, `${item.id}.jpg`);
      try {
        await downloadImage(images[0], filepath);
        console.log(`  ✅ Скачано: ${item.id}.jpg`);
        downloadedCount++;
      } catch (err) {
        console.log(`  ⚠️ Не удалось скачать, сохраняю ссылку`);
      }

      // Задержка чтобы не нагружать сервер
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } else {
      console.log(`  ❌ Изображений не найдено`);
      imageMap[item.id] = {
        description: item.query,
        url: null,
        localPath: null,
        note: "Требуется ручной подбор",
      };
    }
  }

  // Сохраняем карту изображений
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(imageMap, null, 2));
  console.log(`\n📁 Карта сохранена: ${OUTPUT_FILE}`);
  console.log(`✅ Скачано изображений: ${downloadedCount}/${QUERIES.length}`);

  // Список для ручного подбора
  const missing = Object.entries(imageMap)
    .filter(([_, v]) => !v.url)
    .map(([id, v]) => ({ id, description: v.description }));

  if (missing.length > 0) {
    console.log("\n⚠️  Требуется ручной подбор:");
    missing.forEach((item) => {
      console.log(`  - ${item.id}: ${item.description}`);
    });
  }
}

main();
