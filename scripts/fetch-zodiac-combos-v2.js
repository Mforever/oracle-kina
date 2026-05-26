const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

// ========== КОНФИГУРАЦИЯ ==========
const USE_AI = true;
const AI_TEMPERATURE = 0.85;
const DELAY_BETWEEN = 300;
const OUTPUT_FILE = "zodiac_combos_260_v2.json";

// ========== ДАННЫЕ ==========
const ZODIAC = [
  {
    name: "Овен",
    dates: "21.03–19.04",
    emoji: "♈",
    element: "Огонь",
    planet: "Марс",
  },
  {
    name: "Телец",
    dates: "20.04–20.05",
    emoji: "♉",
    element: "Земля",
    planet: "Венера",
  },
  {
    name: "Близнецы",
    dates: "21.05–21.06",
    emoji: "♊",
    element: "Воздух",
    planet: "Меркурий",
  },
  {
    name: "Рак",
    dates: "22.06–22.07",
    emoji: "♋",
    element: "Вода",
    planet: "Луна",
  },
  {
    name: "Лев",
    dates: "23.07–22.08",
    emoji: "♌",
    element: "Огонь",
    planet: "Солнце",
  },
  {
    name: "Дева",
    dates: "23.08–22.09",
    emoji: "♍",
    element: "Земля",
    planet: "Меркурий",
  },
  {
    name: "Весы",
    dates: "23.09–22.10",
    emoji: "♎",
    element: "Воздух",
    planet: "Венера",
  },
  {
    name: "Скорпион",
    dates: "23.10–21.11",
    emoji: "♏",
    element: "Вода",
    planet: "Плутон",
  },
  {
    name: "Стрелец",
    dates: "22.11–21.12",
    emoji: "♐",
    element: "Огонь",
    planet: "Юпитер",
  },
  {
    name: "Козерог",
    dates: "22.12–19.01",
    emoji: "♑",
    element: "Земля",
    planet: "Сатурн",
  },
  {
    name: "Водолей",
    dates: "20.01–18.02",
    emoji: "♒",
    element: "Воздух",
    planet: "Уран",
  },
  {
    name: "Рыбы",
    dates: "19.02–20.03",
    emoji: "♓",
    element: "Вода",
    planet: "Нептун",
  },
];

const ANIMALS = [
  {
    name: "Крыса",
    traits: "хитрость и обаяние",
    color: "серый",
    totem: "крылатая мышь",
  },
  {
    name: "Бык",
    traits: "надёжность и терпение",
    color: "коричневый",
    totem: "золотой телец",
  },
  {
    name: "Тигр",
    traits: "смелость и непредсказуемость",
    color: "оранжевый",
    totem: "огненный тигр",
  },
  {
    name: "Кролик",
    traits: "мягкость и дипломатичность",
    color: "белый",
    totem: "лунный заяц",
  },
  {
    name: "Дракон",
    traits: "яркость и амбициозность",
    color: "золотой",
    totem: "нефритовый дракон",
  },
  {
    name: "Змея",
    traits: "мудрость и загадочность",
    color: "изумрудный",
    totem: "серебряный змей",
  },
  {
    name: "Лошадь",
    traits: "энергия и свободолюбие",
    color: "красный",
    totem: "ветер-конь",
  },
  {
    name: "Коза",
    traits: "творчество и чувствительность",
    color: "розовый",
    totem: "горный козёл",
  },
  {
    name: "Обезьяна",
    traits: "остроумие и изобретательность",
    color: "жёлтый",
    totem: "солнечная обезьяна",
  },
  {
    name: "Петух",
    traits: "организованность и проницательность",
    color: "пурпурный",
    totem: "феникс",
  },
  {
    name: "Собака",
    traits: "преданность и справедливость",
    color: "синий",
    totem: "небесный пёс",
  },
  {
    name: "Свинья",
    traits: "щедрость и благородство",
    color: "бирюзовый",
    totem: "кабан-воин",
  },
];

const ELEMENTS = ["Огонь", "Земля", "Воздух", "Вода", "Металл", "Дерево"];

const TAROT = [
  { card: "Маг", advice: "используйте все свои таланты" },
  { card: "Верховная Жрица", advice: "доверяйте подсознанию" },
  { card: "Императрица", advice: "созидайте и заботьтесь" },
  { card: "Император", advice: "стройте структуру" },
  { card: "Иерофант", advice: "ищите наставника" },
  { card: "Влюблённые", advice: "делайте выбор сердцем" },
  { card: "Колесница", advice: "держите курс, несмотря ни на что" },
  { card: "Сила", advice: "укротите внутреннего зверя" },
  { card: "Отшельник", advice: "найдите время для тишины" },
  { card: "Колесо Фортуны", advice: "примите перемены с благодарностью" },
  { card: "Справедливость", advice: "будьте честны с собой и другими" },
  { card: "Повешенный", advice: "посмотрите на ситуацию иначе" },
  { card: "Смерть", advice: "отпустите то, что отжило" },
  { card: "Умеренность", advice: "ищите золотую середину" },
  { card: "Дьявол", advice: "освободитесь от зависимостей" },
  { card: "Башня", advice: "разрушьте иллюзии" },
  { card: "Звезда", advice: "верьте в чудо" },
  { card: "Луна", advice: "исследуйте свои тени" },
  { card: "Солнце", advice: "сияйте ярче, не прячьтесь" },
  { card: "Суд", advice: "примите своё истинное призвание" },
  { card: "Мир", advice: "завершите цикл и начните новый" },
];

const STONES_BY_SIGN = {
  Овен: "рубин",
  Телец: "изумруд",
  Близнецы: "агат",
  Рак: "лунный камень",
  Лев: "янтарь",
  Дева: "яшма",
  Весы: "опал",
  Скорпион: "топаз",
  Стрелец: "бирюза",
  Козерог: "гранат",
  Водолей: "аметист",
  Рыбы: "аквамарин",
};

// ========== AI-ФУНКЦИЯ ==========
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

// ========== ГЕНЕРАЦИЯ ==========
function generateAnimalZodiac(animal, sign, id) {
  const powerMonth = getMonth(id);
  const dangerMonth = getMonth(id + 6);
  const stone = STONES_BY_SIGN[sign.name] || "кварц";
  const lifeArea = getLifeArea(id);

  // Склонение месяцев
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

  // Делаем первую букву заглавной
  const traits = animal.traits.charAt(0).toUpperCase() + animal.traits.slice(1);

  const shortText =
    `Вы — ${animal.name}-${sign.name} ${sign.emoji}. ` +
    `${traits} — ваша визитная карточка. ` +
    `Деньги приходят через ${getMoneyChannel(sign.name)}. ` +
    `Ваш девиз: «${getMotto(animal.name)}».`;

  const fullText =
    `Вы — ${animal.name}-${sign.name} ${sign.emoji}. Сочетание ` +
    `${animal.traits} и стихии ${sign.element} делает вас уникальным. ` +
    `Ваша планета-покровитель: ${sign.planet}.\n\n` +
    `В 2026 году вас ждёт прорыв в сфере ${lifeArea}. ` +
    `Самый удачный месяц — ${powerMonth}. В этот период смело ` +
    `начинайте новые проекты и заключайте сделки.\n\n` +
    `Будьте осторожны в ${monthPrepositional[dangerMonth] || dangerMonth} — ` +
    `возможны финансовые потери и недопонимание с партнёрами.\n\n` +
    `Ваш тотем: ${animal.totem}. Цвет силы: ${animal.color}. ` +
    `Камень-талисман: ${stone}. Совет года: ${getAdvice(id)}`;

  return { shortText, fullText };
}

function generateElementZodiac(element, sign, id) {
  const stone = STONES_BY_SIGN[sign.name] || "кварц";
  const lifeArea = getLifeArea(id);

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

  const powerMonth = getMonth(id);
  const dangerMonth = getMonth(id + 3);

  const shortText =
    `Стихия ${element} усиливает ваш знак ${sign.name} ${sign.emoji}. ` +
    `Вы — человек, который чувствует мир через призму ${element.toLowerCase()}. ` +
    `В 2026 году ждите важное известие в первой половине года.`;

  const fullText =
    `Вы — ${element} ${sign.name} ${sign.emoji}. Это редкое сочетание даёт ` +
    `вам силу ${element.toLowerCase()} и харизму ${sign.name}.\n\n` +
    `В 2026 году ваша задача — научиться использовать эту двойственность ` +
    `для достижения целей в сфере ${lifeArea}. ` +
    `Месяц силы — ${powerMonth}. Избегайте конфликтов в ${monthPrepositional[dangerMonth] || dangerMonth}.\n\n` +
    `Тотем: дух ${element.toLowerCase()}. Камень: ${stone}. ` +
    `Совет: ${getAdvice(id)}.`;

  return { shortText, fullText };
}

function generateTarotZodiac(cardData, sign, id) {
  const stone = STONES_BY_SIGN[sign.name] || "кварц";
  const lifeArea = getLifeArea(id);
  const powerMonth = getMonth(id);

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
    `Ваш аркан Таро — «${cardData.card}». Он раскрывает скрытые грани ` +
    `вашего знака ${sign.name} ${sign.emoji}. В 2026 году судьба приготовила ` +
    `вам встречу, которая изменит всё.`;

  const fullText =
    `Вы — ${sign.name}, и ваш аркан — «${cardData.card}». Это сочетание ` +
    `говорит о том, что вы находитесь на важном этапе пути.\n\n` +
    `В 2026 году вас ждёт судьбоносное решение в ${monthPrepositional[powerMonth] || powerMonth}. ` +
    `Карта советует: ${cardData.advice}.\n\n` +
    `Ваш камень-талисман: ${stone}. Прислушайтесь к посланию карты — ` +
    `оно укажет верный путь в сфере ${lifeArea}.`;

  return { shortText, fullText };
}

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
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
  return months[Math.abs(Math.floor(seed)) % 12];
}

function getLifeArea(seed) {
  const areas = [
    "карьеры",
    "отношений",
    "финансов",
    "творчества",
    "здоровья",
    "образования",
    "путешествий",
    "недвижимости",
  ];
  return areas[Math.abs(Math.floor(seed)) % areas.length];
}

function getMoneyChannel(signName) {
  const channels = {
    Овен: "риск и предпринимательство",
    Телец: "стабильные инвестиции",
    Близнецы: "информацию и связи",
    Рак: "недвижимость и семью",
    Лев: "публичность и творчество",
    Дева: "аналитику и детали",
    Весы: "партнёрство и красоту",
    Скорпион: "трансформации и тайны",
    Стрелец: "путешествия и обучение",
    Козерог: "карьеру и статус",
    Водолей: "инновации и сообщества",
    Рыбы: "интуицию и творчество",
  };
  return channels[signName] || "ваши таланты";
}

function getMotto(animalName) {
  const mottos = {
    Крыса: "Умный в гору не пойдёт",
    Бык: "Терпение и труд всё перетрут",
    Тигр: "Лучше сгореть, чем тлеть",
    Кролик: "Мягко стелет, да жёстко спать",
    Дракон: "Быть, а не казаться",
    Змея: "Меньше слов — больше дела",
    Лошадь: "Движение — жизнь",
    Коза: "Красота спасёт мир",
    Обезьяна: "Смекалка города берёт",
    Петух: "Порядок — душа всего",
    Собака: "Верность — высшая добродетель",
    Свинья: "Щедрость возвращается сторицей",
  };
  return mottos[animalName] || "Вперёд к мечте!";
}

function getAdvice(seed) {
  const advices = [
    "Инвестируйте в себя — это лучший актив.",
    "Окружите себя позитивными людьми.",
    "Не бойтесь просить о помощи.",
    "Доверяйте своей интуиции.",
    "Будьте терпеливы — всему своё время.",
    "Действуйте, а не размышляйте бесконечно.",
    "Отпустите прошлое — оно вас не определяет.",
    "Рискуйте разумно — fortune favours the bold.",
    "Учитесь новому каждый день.",
    "Любите себя — это основа всего.",
    "Будьте благодарны за то, что имеете.",
    "Слушайте своё тело — оно знает ответы.",
    "Создавайте, а не потребляйте.",
    "Путешествуйте — это расширяет сознание.",
    "Медитируйте — тишина лечит.",
    "Говорите «да» новым возможностям.",
    "Планируйте, но оставайтесь гибкими.",
    "Будьте щедры — вселенная вернёт вдвойне.",
    "Не сравнивайте себя с другими.",
    "Следуйте за своей страстью.",
  ];
  return advices[Math.abs(Math.floor(seed)) % advices.length];
}

function cleanText(text) {
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/&[a-z]+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ========== ГЛАВНЫЙ ПРОЦЕСС ==========
async function main() {
  console.log("🌎 Запуск генератора 260 комбинаций");
  console.log(`🔧 AI-перефразирование: ${USE_AI ? "ВКЛЮЧЕНО" : "выключено"}\n`);

  const results = [];
  let id = 1;

  // Блок 1: 144 комбинации животное + знак зодиака
  console.log("📦 Блок 1: Животное + Знак зодиака (144 шт)");
  for (const animal of ANIMALS) {
    for (const sign of ZODIAC) {
      const { shortText, fullText } = generateAnimalZodiac(animal, sign, id);

      // AI-улучшение
      let enhancedShort = shortText;
      let enhancedFull = fullText;

      if (USE_AI) {
        enhancedFull = await paraphraseWithAI(fullText, "full");
        enhancedShort = await paraphraseWithAI(shortText, "short");
        console.log(
          `  🤖 ${id}/260: ${animal.name}-${sign.name} — AI обработан`,
        );
      } else {
        console.log(`  📝 ${id}/260: ${animal.name}-${sign.name}`);
      }

      results.push({
        id,
        title: `${animal.name}-${sign.name} (${sign.dates})`,
        short_text: cleanText(enhancedShort),
        full_text: cleanText(enhancedFull),
      });

      id++;
      await sleep(DELAY_BETWEEN);
    }
  }

  // Блок 2: 72 комбинации стихия + знак зодиака
  console.log("\n📦 Блок 2: Стихия + Знак зодиака (72 шт)");
  let comboCount = 0;
  for (const element of ELEMENTS) {
    for (const sign of ZODIAC) {
      if (comboCount >= 72 || results.length >= 260) break;

      const { shortText, fullText } = generateElementZodiac(element, sign, id);

      let enhancedShort = shortText;
      let enhancedFull = fullText;

      if (USE_AI) {
        enhancedFull = await paraphraseWithAI(fullText, "full");
        enhancedShort = await paraphraseWithAI(shortText, "short");
        console.log(`  🤖 ${id}/260: ${element} ${sign.name} — AI обработан`);
      } else {
        console.log(`  📝 ${id}/260: ${element} ${sign.name}`);
      }

      results.push({
        id,
        title: `${element} ${sign.name} (${sign.dates})`,
        short_text: cleanText(enhancedShort),
        full_text: cleanText(enhancedFull),
      });

      id++;
      comboCount++;
      await sleep(DELAY_BETWEEN);
    }
    if (results.length >= 260) break;
  }

  // Блок 3: Оставшиеся — Таро + знак зодиака
  console.log(
    `\n📦 Блок 3: Таро + Знак зодиака (до ${260 - results.length} шт)`,
  );
  for (const tarot of TAROT) {
    for (const sign of ZODIAC) {
      if (results.length >= 260) break;

      const { shortText, fullText } = generateTarotZodiac(tarot, sign, id);

      let enhancedShort = shortText;
      let enhancedFull = fullText;

      if (USE_AI) {
        enhancedFull = await paraphraseWithAI(fullText, "full");
        enhancedShort = await paraphraseWithAI(shortText, "short");
        console.log(
          `  🤖 ${id}/260: ${tarot.card} — ${sign.name} — AI обработан`,
        );
      } else {
        console.log(`  📝 ${id}/260: ${tarot.card} — ${sign.name}`);
      }

      results.push({
        id,
        title: `${tarot.card} — ${sign.name} (${sign.dates})`,
        short_text: cleanText(enhancedShort),
        full_text: cleanText(enhancedFull),
      });

      id++;
      await sleep(DELAY_BETWEEN);
    }
    if (results.length >= 260) break;
  }

  // Сохраняем
  const finalResults = results.slice(0, 260);
  const outputPath = path.join(__dirname, OUTPUT_FILE);
  fs.writeFileSync(outputPath, JSON.stringify(finalResults, null, 2), "utf-8");

  console.log(`\n${"=".repeat(50)}`);
  console.log(`✅ ГОТОВО: ${finalResults.length} комбинаций`);
  console.log(`📁 Файл: ${outputPath}`);
  console.log(`${"=".repeat(50)}`);
}

main().catch((err) => {
  console.error("❌ Ошибка:", err.message);
  process.exit(1);
});
