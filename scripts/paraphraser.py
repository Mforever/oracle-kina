#!/usr/bin/env python3
"""
Сервис перефразирования текстов для Windows/Linux.
Использует ruT5-base — русскую модель text2text.
"""

import sys
import os
import warnings
warnings.filterwarnings('ignore')

# Фикс кодировки для Windows
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

from transformers import pipeline

# Загружаем модель один раз при старте
print("⏳ Загружаю модель перефразирования...", file=sys.stderr, flush=True)

MODEL_NAME = "cointegrated/rut5-base-paraphraser"

try:
    paraphraser = pipeline(
        "text2text-generation",
        model=MODEL_NAME,
        tokenizer=MODEL_NAME,
        device=-1  # CPU (для GPU поставь 0)
    )
    print("✅ Модель загружена", file=sys.stderr, flush=True)
except Exception as e:
    print(f"❌ Ошибка: {e}", file=sys.stderr, flush=True)
    print("⚠️ Использую заглушку — текст вернётся без изменений", file=sys.stderr, flush=True)
    
    # Заглушка если модель не загрузилась
    def paraphraser(text, **kwargs):
        return [{'generated_text': text}]


def paraphrase(text, mode="full", temperature=0.85):
    """Перефразирует текст."""
    if not text or len(text) < 10:
        return text
    
    if mode == "short":
        prompt = f"Перефразируй кратко, ярко и интригующе: {text}"
        max_len = min(len(text) + 50, 350)
    else:
        prompt = f"Перефразируй подробно, с деталями и конкретикой: {text}"
        max_len = min(len(text) + 200, 1200)
    
    try:
        result = paraphraser(
            prompt,
            max_length=max_len,
            min_length=int(max_len * 0.5),
            temperature=temperature,
            do_sample=True,
            top_p=0.92,
            num_return_sequences=1,
            repetition_penalty=1.2,
            no_repeat_ngram_size=3
        )
        
        paraphrased = result[0]['generated_text']
        
        # Убираем префикс промпта
        prefixes = [
            "Перефразируй кратко, ярко и интригующе: ",
            "Перефразируй подробно, с деталями и конкретикой: "
        ]
        for prefix in prefixes:
            if paraphrased.startswith(prefix):
                paraphrased = paraphrased[len(prefix):]
        
        return paraphrased.strip()
    
    except Exception as e:
        print(f"⚠️ Ошибка перефразирования: {e}", file=sys.stderr, flush=True)
        return text


if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "full"
    temperature = float(sys.argv[2]) if len(sys.argv) > 2 else 0.85
    
    # Читаем текст
    if len(sys.argv) > 3:
        text = " ".join(sys.argv[3:])
    else:
        text = sys.stdin.read().strip()
    
    if not text:
        print("❌ Нет текста", file=sys.stderr, flush=True)
        sys.exit(1)
    
    result = paraphrase(text, mode, temperature)
    print(result, flush=True)