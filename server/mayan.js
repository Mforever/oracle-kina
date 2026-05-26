const fs = require("fs");
const path = require("path");

function calculateMayanSign(birthDate) {
  // Принимаем ДД.ММ.ГГГГ
  const parts = birthDate.split(".");
  if (parts.length !== 3) return 1;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);

  if (isNaN(day) || isNaN(month) || isNaN(year)) return 1;

  // Юлианский день
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;

  const julianDay =
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045;

  // Начало календаря майя: 13 августа 3114 г. до н.э. по юлианскому календарю
  const mayanStartJulian = -1137143;

  const diffDays = julianDay - mayanStartJulian;
  const kin = ((diffDays % 260) + 260) % 260;
  return kin === 0 ? 260 : kin;
}

function getZodiacSign(date) {
  const parts = date.split(".");
  if (parts.length !== 3) return "Рыбы";

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);

  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return "Овен";
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return "Телец";
  if ((month === 5 && day >= 21) || (month === 6 && day <= 21))
    return "Близнецы";
  if ((month === 6 && day >= 22) || (month === 7 && day <= 22)) return "Рак";
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return "Лев";
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return "Дева";
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return "Весы";
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21))
    return "Скорпион";
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21))
    return "Стрелец";
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19))
    return "Козерог";
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18))
    return "Водолей";
  return "Рыбы";
}

function getMayanData(date) {
  try {
    const mayaPath = path.join(__dirname, "..", "scripts", "maya_260_v2.json");
    if (!fs.existsSync(mayaPath)) return null;
    const mayaData = JSON.parse(fs.readFileSync(mayaPath, "utf-8"));
    const kin = calculateMayanSign(date);
    return mayaData.find((item) => item.id === kin) || null;
  } catch (e) {
    return null;
  }
}

function getZodiacData(date) {
  try {
    const zodiacPath = path.join(
      __dirname,
      "..",
      "scripts",
      "zodiac_combos_260_v2.json",
    );
    if (!fs.existsSync(zodiacPath)) return null;
    const zodiacData = JSON.parse(fs.readFileSync(zodiacPath, "utf-8"));
    const zodiacSign = getZodiacSign(date);
    const parts = date.split(".");
    const birthYear = parseInt(parts[2], 10);
    const animals = [
      "Крыса",
      "Бык",
      "Тигр",
      "Кролик",
      "Дракон",
      "Змея",
      "Лошадь",
      "Коза",
      "Обезьяна",
      "Петух",
      "Собака",
      "Свинья",
    ];
    const animal = animals[(birthYear - 4) % 12];
    return (
      zodiacData.find(
        (item) =>
          item.title.includes(animal) && item.title.includes(zodiacSign),
      ) || null
    );
  } catch (e) {
    return null;
  }
}

module.exports = {
  calculateMayanSign,
  getZodiacSign,
  getMayanData,
  getZodiacData,
};
