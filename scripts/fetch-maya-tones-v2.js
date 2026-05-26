const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

// ========== КОНФИГУРАЦИЯ ==========
const USE_AI = true; // Включить AI-перефразирование
const AI_TEMPERATURE = 0.85; // Креативность (0.7 — строго, 1.0 — творчески)
const DELAY_BETWEEN_REQUESTS = 400; // Задержка между запросами (мс)
const MAX_RETRIES = 3; // Максимум попыток на один знак
const OUTPUT_FILE = "maya_260_v2.json";

// ========== ДАННЫЕ ==========
const SEALS = [
  { en: "Imix", ru: "Имиш", emoji: "🐊", element: "Вода", direction: "Восток" },
  { en: "Ik", ru: "Ик", emoji: "💨", element: "Воздух", direction: "Север" },
  {
    en: "Akbal",
    ru: "Акбаль",
    emoji: "🌙",
    element: "Тьма",
    direction: "Запад",
  },
  { en: "Kan", ru: "Кан", emoji: "🌽", element: "Земля", direction: "Юг" },
  {
    en: "Chicchan",
    ru: "Чикчан",
    emoji: "🐍",
    element: "Огонь",
    direction: "Восток",
  },
  {
    en: "Cimi",
    ru: "Кими",
    emoji: "💀",
    element: "Смерть",
    direction: "Север",
  },
  {
    en: "Manik",
    ru: "Маник",
    emoji: "🦌",
    element: "Земля",
    direction: "Запад",
  },
  { en: "Lamat", ru: "Ламат", emoji: "⭐", element: "Звёзды", direction: "Юг" },
  {
    en: "Muluc",
    ru: "Мулук",
    emoji: "💧",
    element: "Вода",
    direction: "Восток",
  },
  { en: "Oc", ru: "Ок", emoji: "🐕", element: "Земля", direction: "Север" },
  {
    en: "Chuen",
    ru: "Чуэн",
    emoji: "🐒",
    element: "Воздух",
    direction: "Запад",
  },
  { en: "Eb", ru: "Эб", emoji: "🪜", element: "Земля", direction: "Юг" },
  { en: "Ben", ru: "Бен", emoji: "🌿", element: "Огонь", direction: "Восток" },
  { en: "Ix", ru: "Иш", emoji: "🐆", element: "Земля", direction: "Север" },
  { en: "Men", ru: "Мен", emoji: "🦅", element: "Воздух", direction: "Запад" },
  { en: "Cib", ru: "Киб", emoji: "🦉", element: "Земля", direction: "Юг" },
  {
    en: "Caban",
    ru: "Кабан",
    emoji: "🌍",
    element: "Земля",
    direction: "Восток",
  },
  {
    en: "Etznab",
    ru: "Эцнаб",
    emoji: "🗡️",
    element: "Металл",
    direction: "Север",
  },
  {
    en: "Cauac",
    ru: "Кауак",
    emoji: "⛈️",
    element: "Буря",
    direction: "Запад",
  },
  { en: "Ahau", ru: "Ахау", emoji: "☀️", element: "Свет", direction: "Юг" },
];

const TONES = [
  { en: "Magnetic", ru: "Магнитный", num: 1, quality: "Притяжение" },
  { en: "Lunar", ru: "Лунный", num: 2, quality: "Полярность" },
  { en: "Electric", ru: "Электрический", num: 3, quality: "Активация" },
  { en: "Self-Existing", ru: "Самосущный", num: 4, quality: "Форма" },
  { en: "Overtone", ru: "Обертонный", num: 5, quality: "Сияние" },
  { en: "Rhythmic", ru: "Ритмический", num: 6, quality: "Баланс" },
  { en: "Resonant", ru: "Резонансный", num: 7, quality: "Настройка" },
  { en: "Galactic", ru: "Галактический", num: 8, quality: "Целостность" },
  { en: "Solar", ru: "Солнечный", num: 9, quality: "Намерение" },
  { en: "Planetary", ru: "Планетарный", num: 10, quality: "Проявление" },
  { en: "Spectral", ru: "Спектральный", num: 11, quality: "Освобождение" },
  { en: "Crystal", ru: "Кристаллический", num: 12, quality: "Сотрудничество" },
  { en: "Cosmic", ru: "Космический", num: 13, quality: "Трансцендентность" },
];

// ========== БАЗА ЗНАНИЙ ==========
const STONES = {
  Имиш: "аквамарин",
  Ик: "горный хрусталь",
  Акбаль: "аметист",
  Кан: "янтарь",
  Чикчан: "сердолик",
  Кими: "обсидиан",
  Маник: "нефрит",
  Ламат: "топаз",
  Мулук: "лунный камень",
  Ок: "тигровый глаз",
  Чуэн: "агат",
  Эб: "цитрин",
  Бен: "малахит",
  Иш: "чёрный опал",
  Мен: "лазурит",
  Киб: "содалит",
  Кабан: "яшма",
  Эцнаб: "гематит",
  Кауак: "бирюза",
  Ахау: "алмаз",
};

const COLORS_BY_TONE = {
  Магнитный: "белый",
  Лунный: "серебристый",
  Электрический: "голубой",
  Самосущный: "золотой",
  Обертонный: "оранжевый",
  Ритмический: "зелёный",
  Резонансный: "розовый",
  Галактический: "фиолетовый",
  Солнечный: "жёлтый",
  Планетарный: "бирюзовый",
  Спектральный: "красный",
  Кристаллический: "прозрачный",
  Космический: "индиго",
};

const TOTEM_MEANINGS = {
  Имиш: "первобытного океана и интуиции",
  Ик: "ветра и коммуникации",
  Акбаль: "ночи и подсознания",
  Кан: "семени и роста",
  Чикчан: "змеи и трансформации",
  Кими: "смерти и перерождения",
  Маник: "оленя и исцеления",
  Ламат: "звезды и гармонии",
  Мулук: "воды и эмоций",
  Ок: "собаки и преданности",
  Чуэн: "обезьяны и творчества",
  Эб: "лестницы и пути",
  Бен: "тростника и гибкости",
  Иш: "ягуара и магии",
  Мен: "орла и видения",
  Киб: "совы и мудрости",
  Кабан: "земли и стабильности",
  Эцнаб: "зеркала и истины",
  Кауак: "бури и очищения",
  Ахау: "солнца и просветления",
};

const ADVISES = [
  "Доверяйте своей интуиции — она острее логики.",
  "Не бойтесь начинать новое, даже если страшно.",
  "Инвестируйте в отношения — они принесут дивиденды.",
  'Учитесь говорить "нет" — это сэкономит вам годы.',
  "Ваше здоровье — ваш главный актив, берегите его.",
  "Рискните тем, что давно откладывали. Время пришло.",
  "Окружите себя людьми, которые верят в вас.",
  "Путешествие в этом году изменит вашу судьбу.",
  "Записывайте идеи — лучшая придёт во сне.",
  "Не экономьте на образовании — оно окупится стократно.",
  "Будьте щедры — вселенная вернёт вам вдвойне.",
  "Держите эмоции под контролем, особенно в апреле.",
  "Создайте финансовую подушку до сентября — пригодится.",
  "Медитируйте чаще — ответы уже внутри вас.",
  "Не бойтесь просить помощи — это проявление силы.",
  "Ваши сны сейчас вещие — записывайте их.",
  "Обратите внимание на знаки вокруг — вселенная говорит с вами.",
  "Простите старые обиды — они блокируют денежный поток.",
  "Начните день с благодарности — и мир ответит взаимностью.",
  "Ваше слово имеет силу — говорите осознанно.",
];

// ========== ФУНКЦИИ ==========

/**
 * Вызывает Python-скрипт для перефразирования
 */
async function paraphraseWithAI(text, mode = "full") {
  if (!USE_AI) return text;

  // Определяем команду python для Windows/Linux
  const pythonCmd = process.platform === "win32" ? "python" : "python3";

  return new Promise((resolve) => {
    const python = spawn(
      pythonCmd,
      [
        path.join(__dirname, "paraphraser.py"),
        mode,
        AI_TEMPERATURE.toString(),
        text,
      ],
      {
        stdio: ["pipe", "pipe", "pipe"],
        encoding: "utf-8",
      },
    );

    let result = "";
    let error = "";

    python.stdout.on("data", (data) => {
      result += data.toString("utf-8");
    });

    python.stderr.on("data", (data) => {
      error += data.toString("utf-8");
      // Выводим ошибки в консоль для отладки
      if (data.toString().includes("❌") || data.toString().includes("Error")) {
        console.error(`  🐍 Python: ${data.toString().trim()}`);
      }
    });

    python.on("close", (code) => {
      const output = result.trim();
      if (code !== 0 || !output || output.length < 20) {
        console.warn(`  ⚠️ AI fallback (код ${code}), использую оригинал`);
        resolve(text);
      } else {
        resolve(output);
      }
    });

    python.on("error", (err) => {
      console.warn(
        `  ⚠️ Python не найден (${err.message}), использую оригинал`,
      );
      resolve(text);
    });
  });
}

/**
 * Парсит описание с публичных источников
 */
async function fetchFromSources(kinNumber, seal, tone) {
  const sources = [
    {
      name: "mayankin.com",
      url: `https://www.mayankin.com/kin/${kinNumber}`,
      selector: ".kin-description, .oracle-text, article p",
      weight: 2,
    },
    {
      name: "mayan-calendar.com",
      url: `https://www.mayan-calendar.com/description/${seal.en.toLowerCase()}`,
      selector: ".content p, .description",
      weight: 1,
    },
  ];

  let bestText = "";
  let bestScore = 0;

  for (const source of sources) {
    try {
      const response = await axios.get(source.url, {
        timeout: 5000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; MayanResearch/2.0; +http://maya.local)",
        },
      });

      const $ = cheerio.load(response.data);
      let text = $(source.selector).text().trim();

      // Чистим текст
      text = text
        .replace(/\s+/g, " ")
        .replace(/<[^>]*>/g, "")
        .replace(/&[a-z]+;/g, "")
        .trim();

      const score = text.length * source.weight;

      if (score > bestScore && text.length > 100) {
        bestText = text;
        bestScore = score;
        console.log(`  📥 ${source.name}: получил ${text.length} символов`);
      }
    } catch (e) {
      // Источник недоступен — пропускаем
      console.log(`  🌐 ${source.name}: недоступен`);
    }

    await sleep(DELAY_BETWEEN_REQUESTS);
  }

  return bestText;
}

/**
 * Генерирует качественный текст на основе шаблона с фактами
 */
function generateFromTemplate(kinNumber, seal, tone) {
  const powerMonth = getMonth(kinNumber);
  const dangerMonth = getMonth(kinNumber + 6);
  const stone = STONES[seal.ru] || "кварц";
  const color = COLORS_BY_TONE[tone.ru] || "синий";
  const totemMeaning = TOTEM_MEANINGS[seal.ru] || "древней силы";
  const advice = ADVISES[kinNumber % ADVISES.length];
  const lifeArea = getLifeArea(kinNumber);

  // Функция склонения месяцев
  const monthPrepositional = {
    январь: "январе",
    февраль: "феврале",
    март: "марте",
    апрель: "апреле",
    май: "мае",
    июнь: "июне",
    июль: "июле",
    август: "августе",
    сентябрь: "сентябре",
    октябрь: "октябре",
    ноябрь: "ноябре",
    декабрь: "декабре",
  };

  const shortText =
    `Вы — ${tone.ru} ${seal.ru} ${seal.emoji}. ` +
    `${tone.quality} — ваша суперсила. Вы чувствуете энергию ${totemMeaning} ` +
    `и умеете использовать её в нужный момент. В 2026 году вас ждёт ` +
    `прорыв в сфере ${lifeArea}. Ваш камень: ${stone}.`;

  const fullText =
    `Вы — ${tone.ru} ${seal.ru}, Кин ${kinNumber}.\n\n` +
    `Ваша стихия — ${seal.element}, а направление силы — ${seal.direction}. ` +
    `${tone.ru} тон наделяет вас качеством «${tone.quality}». ` +
    `Ваш тотем — ${seal.ru.toLowerCase()}, символ ${totemMeaning}.\n\n` +
    `В 2026 году вам откроется новый путь в сфере ${lifeArea}. ` +
    `Месяц наибольшей силы — ${powerMonth}. В этот период принимайте важные решения, ` +
    `заключайте сделки и начинайте проекты.\n\n` +
    `Будьте особенно внимательны в ${monthPrepositional[dangerMonth] || dangerMonth} — ` +
    `возможны финансовые колебания и недопонимание с близкими.\n\n` +
    `Ваш камень-талисман: ${stone}. Он усилит ваши природные способности ` +
    `и защитит от нежелательных влияний.\n` +
    `Цвет силы: ${color}. Носите его в одежде или аксессуарах в важные дни.\n\n` +
    `Совет года: ${advice}\n\n` +
    `Помните: вы — часть великого цикла Цолькин. ` +
    `Ваша задача — не бороться с течением, а осознанно двигаться в потоке. ${seal.emoji}`;

  return { shortText, fullText };
}

/**
 * Очищает и валидирует текст
 */
function cleanAndValidate(text, targetLength) {
  let cleaned = text
    .replace(/<[^>]*>/g, "")
    .replace(/&[a-z]+;/g, " ")
    .replace(/&hellip;/g, "...")
    .replace(/&mdash;/g, "—")
    .replace(/&laquo;/g, "«")
    .replace(/&raquo;/g, "»")
    .replace(/\s+/g, " ")
    .replace(/\n\s*\n/g, "\n\n")
    .trim();

  // Если текст всё ещё слишком короткий — не страшно, AI мог сжать
  if (cleaned.length < 50) {
    return null; // Сигнал, что нужен шаблон
  }

  return cleaned;
}

/**
 * Проверяет наличие ключевых элементов в тексте
 */
function validateContent(text, seal, tone) {
  const checks = {
    hasYear: text.includes("2026"),
    hasStone: STONES[seal.ru]
      ? text.toLowerCase().includes(STONES[seal.ru].toLowerCase())
      : true,
    hasColor: COLORS_BY_TONE[tone.ru]
      ? text.toLowerCase().includes(COLORS_BY_TONE[tone.ru].toLowerCase())
      : true,
    hasAddress: /вы|вас|ваш|вам/i.test(text),
    minLength: text.length >= 300,
  };

  const score = Object.values(checks).filter(Boolean).length;
  return { checks, score };
}

/**
 * Вспомогательные функции
 */
function getMonth(seed) {
  const months = [
    "январь",
    "февраль",
    "март",
    "апрель",
    "май",
    "июнь",
    "июль",
    "август",
    "сентябрь",
    "октябрь",
    "ноябрь",
    "декабрь",
  ];
  return months[seed % 12];
}

function getLifeArea(seed) {
  const areas = [
    "карьеры и профессионального роста",
    "личных отношений и семьи",
    "финансов и инвестиций",
    "творчества и самовыражения",
    "здоровья и благополучия",
    "духовного развития",
    "образования и новых навыков",
    "путешествий и расширения горизонтов",
    "недвижимости и дома",
    "социальных связей и нетворкинга",
  ];
  return areas[seed % areas.length];
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ========== ГЛАВНЫЙ ПРОЦЕСС ==========
async function main() {
  console.log("🌎 Запуск улучшенного парсера календаря майя");
  console.log(`🔧 AI-перефразирование: ${USE_AI ? "ВКЛЮЧЕНО" : "выключено"}`);
  console.log(`📝 Цель: 260 знаков Цолькин\n`);

  const results = [];
  let kinNumber = 0;

  for (const tone of TONES) {
    for (const seal of SEALS) {
      kinNumber++;

      console.log(
        `\n🔷 Кин ${kinNumber}/260: ${tone.ru} ${seal.ru} ${seal.emoji}`,
      );

      let shortText = "";
      let fullText = "";

      // Шаг 1: Пробуем спарсить с источников
      console.log(`  🔍 Ищу описания в источниках...`);
      const rawText = await fetchFromSources(kinNumber, seal, tone);

      if (rawText && rawText.length > 300) {
        // Шаг 2: Перефразируем через AI
        console.log(`  🤖 Перефразирую через AI...`);

        const aiFullText = await paraphraseWithAI(rawText, "full");
        const cleanedFull = cleanAndValidate(aiFullText);

        if (cleanedFull) {
          fullText = cleanedFull;
          shortText = await paraphraseWithAI(
            cleanedFull.substring(0, 250),
            "short",
          );
        }
      }

      // Шаг 3: Если не получилось — используем шаблон
      if (!fullText || fullText.length < 200) {
        console.log(`  📋 Использую шаблон с фактами...`);
        const template = generateFromTemplate(kinNumber, seal, tone);
        shortText = template.shortText;
        fullText = template.fullText;

        // Всё равно пробуем улучшить шаблон через AI
        if (USE_AI) {
          console.log(`  🤖 Улучшаю шаблон через AI...`);
          fullText = await paraphraseWithAI(fullText, "full");
          shortText = await paraphraseWithAI(shortText, "short");
        }
      }

      // Шаг 4: Финальная валидация
      const validation = validateContent(fullText, seal, tone);

      // Если не хватает ключевых элементов — добавляем
      if (validation.score < 4) {
        console.log(
          `  ⚠️ Добавляю недостающие элементы (оценка: ${validation.score}/5)`,
        );

        if (!validation.checks.hasStone && STONES[seal.ru]) {
          fullText += ` Ваш камень-талисман: ${STONES[seal.ru]}.`;
        }
        if (!validation.checks.hasColor && COLORS_BY_TONE[tone.ru]) {
          fullText += ` Цвет силы: ${COLORS_BY_TONE[tone.ru]}.`;
        }
        if (!validation.checks.hasYear) {
          fullText += ` В 2026 году вас ждут значительные перемены.`;
        }
      }

      // Шаг 5: Финальная очистка
      shortText = cleanAndValidate(shortText) || shortText;
      fullText = cleanAndValidate(fullText) || fullText;

      // Обрезаем до нужной длины
      if (shortText.length > 300) {
        shortText = shortText.substring(0, 297) + "...";
      }
      if (fullText.length > 1200) {
        fullText = fullText.substring(0, 1197) + "...";
      }

      // Сохраняем результат
      results.push({
        id: kinNumber,
        name_ru: `${tone.ru} ${seal.ru}`,
        name_original: `${tone.en} ${seal.en}`,
        glyph_emoji: seal.emoji,
        short_text: shortText,
        full_text: fullText,
        _meta: {
          quality_score: validation.score,
          source: validation.score >= 4 ? "ai_enhanced" : "template",
        },
      });

      console.log(
        `  ✅ Готово (short: ${shortText.length} симв, full: ${fullText.length} симв, качество: ${validation.score}/5)`,
      );

      // Задержка между знаками
      await sleep(DELAY_BETWEEN_REQUESTS);
    }
  }

  // Сохраняем результат
  const outputPath = path.join(__dirname, OUTPUT_FILE);
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), "utf-8");

  // Статистика
  const avgQuality =
    results.reduce((sum, r) => sum + r._meta.quality_score, 0) / results.length;
  const aiCount = results.filter(
    (r) => r._meta.source === "ai_enhanced",
  ).length;

  console.log(`\n${"=".repeat(50)}`);
  console.log(`✅ ПАРСИНГ ЗАВЕРШЁН`);
  console.log(`📊 Всего знаков: ${results.length}`);
  console.log(
    `🤖 AI-улучшено: ${aiCount} (${Math.round((aiCount / 260) * 100)}%)`,
  );
  console.log(`⭐ Среднее качество: ${avgQuality.toFixed(1)}/5`);
  console.log(`📁 Файл: ${outputPath}`);
  console.log(`${"=".repeat(50)}`);
}

// Запуск
main().catch((err) => {
  console.error("❌ Критическая ошибка:", err.message);
  process.exit(1);
});
