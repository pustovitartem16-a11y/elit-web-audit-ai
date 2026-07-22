# Elit-Web Audit AI

MVP сторінки для швидкого SEO-аудиту сайту в стилі Elit-Web.

Принцип продукту: показувати тільки реальні дані. Якщо джерело не відповідає
або не налаштований токен, інтерфейс показує статус джерела замість демо-цифр.

## Що вже працює

- серверний on-page crawl: HTTP-статус, фінальний URL, title, description, H1,
  canonical, meta robots, alt у зображень, JSON-LD, Open Graph, robots.txt,
  sitemap.xml і розмір HTML;
- PageSpeed Insights API: Lighthouse-оцінки та Core Web Vitals, коли Google API
  доступний;
- Serpstat API-ready інтеграція: доменна видимість, ключові фрази й трафік
  з'являться після додавання `SERPSTAT_API_TOKEN`;
- UI не підставляє вигадані числа.

## Локальний запуск

```bash
npm install
npm run dev
```

## Перевірка

```bash
npm test
```

## Змінні середовища

Скопіюйте `.env.example` у `.env` для локального тесту.

```bash
PAGESPEED_API_KEY=
SERPSTAT_API_TOKEN=
SERPSTAT_SE=g_ua
```

`PAGESPEED_API_KEY` не обов'язковий, але без нього Google може швидко віддати
quota/rate-limit. `SERPSTAT_API_TOKEN` потрібен для доменних SEO-метрик.

## GitHub-тест

Код можна зберігати в GitHub-репозиторії, але для реальних API потрібен
серверний хостинг, де env-змінні не видно в браузері: Vercel, Cloudflare Pages,
Cloudflare Workers/Sites або інший Node/Edge runtime.

GitHub Pages як статичний хостинг не підходить для повної версії з Serpstat і
PageSpeed API-ключами, бо ключі не можна безпечно тримати на фронтенді.
