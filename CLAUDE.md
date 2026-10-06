# Sea Radar

Локальное учебное веб-приложение: карта пролива Дувр и суда на ней. Запускается на ноутбуке преподавателя, наружу не открывается.
Задание заказчика — `docs/tasks/PROJECT_BRIEF.md`. Текущий спринт — `docs/tasks/SPRINT-01.md`. Читай их из репозитория, а не по пересказу.

## Стек

- Node.js 24, npm
- TypeScript 6.x, режим `strict`
- Next.js 16 (App Router) + React 19
- Leaflet 1.9.x — библиотека карт, подключается **только на клиенте**
- Слой карты: OpenStreetMap Standard, атрибуция «© OpenStreetMap contributors»

Других библиотек не добавлять без явного согласования.

## Команды

```
npm run dev      # разработка, http://localhost:3000
npm run build    # production-сборка; на ней ловится обращение Leaflet к window
npm start        # запуск собранного приложения
```

## Границы текущей недели

Делаем только карту района и демонстрационные суда с карточкой.

Не добавлять:
- кнопку загрузки настоящих данных и место под неё;
- обращения к AISStream и любым внешним источникам данных;
- серверные маршруты и API;
- тесты и тестовые раннеры;
- папки и пустые модули «на будущее».

## Секреты

Ключ доступа к источнику данных не должен попасть в исходный код, в вывод на экран и в передаваемые заказчику файлы.
Не читать `.env*` и не выводить их содержимое. Не печатать значения переменных окружения. Если для работы нужен секрет — сказать об этом, а не искать его в файлах.

## Данные

Ноль и «нет данных» — разные вещи. Скорость `0` — это стоящее судно и показывается как `0 уз`; неизвестное значение показывается как «Нет данных».
Название судна приходит от экипажа и может содержать что угодно. Показывать его как текст, никогда не как HTML.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
