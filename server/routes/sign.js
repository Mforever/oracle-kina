const { getDB } = require("../db");
const { getMayanData, getZodiacData, getZodiacSign } = require("../mayan");

async function signRoute(req, res, date) {
  if (!date) {
    res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: "Укажи дату в формате YYYY-MM-DD" }));
    return;
  }

  try {
    const zodiacSign = getZodiacSign(date);
    const birthYear = new Date(date).getFullYear();
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

    let mayan = null;
    let combo = null;

    const connection = await getDB();

    if (connection) {
      try {
        const mayanKin = require("../mayan").calculateMayanSign(date);
        const [mayaRows] = await connection.execute(
          "SELECT * FROM maya_tones WHERE id = ?",
          [mayanKin],
        );
        mayan = mayaRows[0] || null;

        const [comboRows] = await connection.execute(
          "SELECT * FROM zodiac_combos WHERE title LIKE ? LIMIT 1",
          [`%${animal}%${zodiacSign}%`],
        );
        combo = comboRows[0] || null;
      } catch (e) {
        console.error("Ошибка MySQL:", e.message);
      }
    }

    if (!mayan) mayan = getMayanData(date);
    if (!combo) combo = getZodiacData(date);

    const response = {
      date,
      mayan: mayan
        ? {
            id: mayan.id,
            name_ru: mayan.name_ru,
            name_original: mayan.name_original,
            glyph_emoji: mayan.glyph_emoji,
            short_text: mayan.short_text,
            full_text: mayan.full_text,
          }
        : null,
      zodiac: {
        sign: zodiacSign,
        animal: animal,
        combo: combo
          ? {
              id: combo.id,
              title: combo.title,
              short_text: combo.short_text,
              full_text: combo.full_text,
            }
          : null,
      },
    };

    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(response));
  } catch (err) {
    console.error("❌ Ошибка sign:", err.message);
    res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: "Внутренняя ошибка" }));
  }
}

module.exports = { signRoute };
