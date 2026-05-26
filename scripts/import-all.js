const fs = require("fs");
const path = require("path");

console.log("📦 Проверяю JSON-файлы...\n");

// Проверяем файл майя
const mayaPath = path.join(__dirname, "maya_260_v2.json");
if (!fs.existsSync(mayaPath)) {
  console.error("❌ Файл не найден:", mayaPath);
  console.log("💡 Убедись, что файл существует и находится в папке scripts/");
  process.exit(1);
}

const mayaData = JSON.parse(fs.readFileSync(mayaPath, "utf-8"));
console.log(`✅ Знаки майя: ${mayaData.length} записей`);

// Проверяем файл зодиаков
const zodiacPath = path.join(__dirname, "zodiac_combos_260_v2.json");
if (!fs.existsSync(zodiacPath)) {
  console.error("❌ Файл не найден:", zodiacPath);
  console.log("💡 Убедись, что файл существует и находится в папке scripts/");
  process.exit(1);
}

const zodiacData = JSON.parse(fs.readFileSync(zodiacPath, "utf-8"));
console.log(`✅ Зодиакальные комбинации: ${zodiacData.length} записей`);

// Проверяем качество
console.log("\n📊 Проверка качества данных:\n");

// Проверка майя
let mayaIssues = 0;
mayaData.forEach((item, i) => {
  const problems = [];

  if (!item.id) problems.push("нет id");
  if (!item.name_ru) problems.push("нет name_ru");
  if (!item.short_text || item.short_text.length < 50)
    problems.push("short_text слишком короткий");
  if (!item.full_text || item.full_text.length < 200)
    problems.push("full_text слишком короткий");

  if (problems.length > 0) {
    console.log(`⚠️ Знак майя #${item.id || i + 1}: ${problems.join(", ")}`);
    mayaIssues++;
  }
});

if (mayaIssues === 0) {
  console.log("✅ Все 260 знаков майя в порядке");
} else {
  console.log(`⚠️ Найдено ${mayaIssues} проблем(ы)`);
}

// Проверка зодиаков
let zodiacIssues = 0;
zodiacData.forEach((item, i) => {
  const problems = [];

  if (!item.id) problems.push("нет id");
  if (!item.title) problems.push("нет title");
  if (!item.short_text || item.short_text.length < 30)
    problems.push("short_text слишком короткий");
  if (!item.full_text || item.full_text.length < 100)
    problems.push("full_text слишком короткий");

  if (problems.length > 0) {
    console.log(`⚠️ Комбинация #${item.id || i + 1}: ${problems.join(", ")}`);
    zodiacIssues++;
  }
});

if (zodiacIssues === 0) {
  console.log("✅ Все 260 комбинаций в порядке");
} else {
  console.log(`⚠️ Найдено ${zodiacIssues} проблем(ы)`);
}

// Показываем примеры
console.log("\n📝 Примеры данных:\n");

if (mayaData.length > 0) {
  const sample = mayaData[0];
  console.log("--- Знак майя (пример) ---");
  console.log(`ID: ${sample.id}`);
  console.log(`Название: ${sample.name_ru}`);
  console.log(`Оригинал: ${sample.name_original}`);
  console.log(`Глиф: ${sample.glyph_emoji}`);
  console.log(
    `Short (${sample.short_text.length} симв): ${sample.short_text.substring(0, 100)}...`,
  );
  console.log(
    `Full (${sample.full_text.length} симв): ${sample.full_text.substring(0, 100)}...`,
  );
}

if (zodiacData.length > 0) {
  const sample = zodiacData[0];
  console.log("\n--- Зодиак (пример) ---");
  console.log(`ID: ${sample.id}`);
  console.log(`Заголовок: ${sample.title}`);
  console.log(
    `Short (${sample.short_text.length} симв): ${sample.short_text.substring(0, 100)}...`,
  );
  console.log(
    `Full (${sample.full_text.length} симв): ${sample.full_text.substring(0, 100)}...`,
  );
}

// Проверка, что сервер сможет найти данные
console.log("\n🔍 Проверка поиска по API:\n");

// Имитируем запрос знака майя
const testKin = 1;
const foundMaya = mayaData.find((item) => item.id === testKin);
console.log(
  `Поиск Кин ${testKin}: ${foundMaya ? "✅ Найден" : "❌ Не найден"}`,
);

// Имитируем поиск зодиака
const testAnimal = "Крыса";
const testSign = "Овен";
const foundZodiac = zodiacData.find(
  (item) => item.title.includes(testAnimal) && item.title.includes(testSign),
);
console.log(
  `Поиск ${testAnimal}-${testSign}: ${foundZodiac ? "✅ Найден" : "❌ Не найден"}`,
);

// Статистика уникальности
const uniqueMayaIds = new Set(mayaData.map((item) => item.id));
const uniqueZodiacIds = new Set(zodiacData.map((item) => item.id));

console.log("\n📊 Статистика:");
console.log(`Уникальных знаков майя: ${uniqueMayaIds.size}/260`);
console.log(`Уникальных комбинаций: ${uniqueZodiacIds.size}/260`);

console.log("\n" + "═".repeat(50));
console.log("✅ ПРОВЕРКА ЗАВЕРШЕНА");
console.log("═".repeat(50));
console.log("\n💡 Данные готовы к использованию.");
console.log("   Сервер читает их напрямую из JSON-файлов.");
console.log("   MySQL не требуется для работы.");
