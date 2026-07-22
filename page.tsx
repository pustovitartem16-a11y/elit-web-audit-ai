"use client";

import type { CSSProperties, FormEvent } from "react";
import { useMemo, useState } from "react";

type CheckStatus = "pass" | "warn" | "fail" | "unknown";
type SourceStatus = "ok" | "unavailable" | "not_configured";
type TabId = "overview" | "onpage" | "sources";
type Strategy = "mobile" | "desktop";

type AuditCheck = {
  id: string;
  label: string;
  value: string;
  status: CheckStatus;
  recommendation?: string;
};

type AuditSource = {
  name: string;
  status: SourceStatus;
  message: string;
};

type AuditFinding = {
  level: string;
  title: string;
  detail: string;
};

type AuditResponse = {
  ok: boolean;
  message?: string;
  url?: string;
  strategy?: Strategy;
  fetchedAt?: string;
  score?: number | null;
  scoreBasis?: string;
  sources?: AuditSource[];
  findings?: AuditFinding[];
  onPage?: {
    requestedUrl: string;
    finalUrl: string;
    domain: string;
    responseMs: number;
    statusCode: number;
    title: string;
    description: string;
    h1: string;
    headingCounts: { h1: number; h2: number; h3: number };
    images: { total: number; missingAlt: number };
    canonical: string;
    robotsMeta: string;
    sizeBytes: number;
    score: number | null;
    checks: AuditCheck[];
  } | null;
  pageSpeed?: {
    strategy: Strategy;
    performance: number | null;
    seo: number | null;
    accessibility: number | null;
    bestPractices: number | null;
    metrics: {
      firstContentfulPaint: string | null;
      largestContentfulPaint: string | null;
      totalBlockingTime: string | null;
      cumulativeLayoutShift: string | null;
      speedIndex: string | null;
    };
  } | null;
  serpstat?: {
    se: string;
    domain: string;
    visibility: number | null;
    keywords: number | null;
    traffic: number | null;
    visibilityDynamic: number | null;
    keywordsDynamic: number | null;
    trafficDynamic: number | null;
    prevDate: string | null;
  } | null;
};

const sourceCards = [
  {
    title: "On-page crawl",
    text: "Наш сервер відкриває сторінку й читає тільки факти з HTML: статус, title, description, H1, canonical, alt, robots і sitemap.",
  },
  {
    title: "PageSpeed Insights",
    text: "Google Lighthouse-метрики по швидкості, SEO, accessibility і best practices. Для стабільної роботи краще додати API-ключ.",
  },
  {
    title: "Serpstat API",
    text: "Після додавання токена можна показувати видимість, ключові фрази, оцінний трафік і динаміку домену з бази g_ua.",
  },
];

const productSteps = [
  "URL запускає реальний crawl без доступу до адмінки.",
  "PageSpeed і SEO API підтягуються сервером, ключі не видно в браузері.",
  "Звіт показує тільки отримані факти або чесний статус джерела.",
  "Контактна форма відкриває повний аудит від команди Elit-Web.",
];

function normalizeInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "https://elit-web.ua/ua/";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function formatNumber(value: number | null | undefined) {
  if (typeof value !== "number") return "немає даних";
  return new Intl.NumberFormat("uk-UA").format(value);
}

function formatBytes(value: number | null | undefined) {
  if (typeof value !== "number") return "немає даних";
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} КБ`;
  return `${(value / 1024 / 1024).toFixed(2)} МБ`;
}

function sourceLabel(status: SourceStatus) {
  if (status === "ok") return "отримано";
  if (status === "not_configured") return "потрібен токен";
  return "недоступно";
}

function checkLabel(status: CheckStatus) {
  if (status === "pass") return "OK";
  if (status === "warn") return "Увага";
  if (status === "fail") return "Проблема";
  return "Н/Д";
}

function checkClass(status: CheckStatus | SourceStatus) {
  return `status status-${status}`;
}

function scoreStyle(score: number | null | undefined) {
  const value = typeof score === "number" ? score : 0;
  return { "--score": `${value * 3.6}deg` } as CSSProperties;
}

export default function Home() {
  const [url, setUrl] = useState("https://elit-web.ua/ua/");
  const [strategy, setStrategy] = useState<Strategy>("mobile");
  const [tab, setTab] = useState<TabId>("overview");
  const [audit, setAudit] = useState<AuditResponse | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );
  const [error, setError] = useState("");

  const criticalCount = useMemo(
    () => audit?.findings?.filter((item) => item.level === "Критично").length ?? 0,
    [audit],
  );
  const warningCount = useMemo(
    () => audit?.findings?.filter((item) => item.level !== "Критично").length ?? 0,
    [audit],
  );
  const connectedSources =
    audit?.sources?.filter((source) => source.status === "ok").length ?? 0;
  const displayScore = typeof audit?.score === "number" ? audit.score : null;
  const pageSpeedUnavailable = audit?.sources?.find(
    (source) => source.name === "PageSpeed Insights" && source.status !== "ok",
  );

  async function runAudit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setError("");
    setTab("overview");

    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: normalizeInput(url), strategy }),
      });
      const payload = (await response.json()) as AuditResponse;

      if (!response.ok || !payload.ok) {
        throw new Error(payload.message ?? "Не вдалося отримати аудит.");
      }

      setAudit(payload);
      setStatus("done");
    } catch (nextError) {
      setStatus("error");
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Не вдалося отримати аудит.",
      );
    }
  }

  return (
    <main>
      <section className="hero" id="top">
        <nav className="nav" aria-label="Головна навігація">
          <a className="brand" href="#top" aria-label="Elit-Web Site Audit">
            <span className="brand-mark">EW</span>
            <span>Elit-Web Audit AI</span>
          </a>
          <div className="nav-links">
            <a href="#sources">Джерела</a>
            <a href="#workflow">Логіка</a>
            <a href="#lead">Заявка</a>
          </div>
          <a className="btn btn-dark" href="#lead">
            Повний аудит
          </a>
        </nav>

        <div className="hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">SEO checker з реальними джерелами</p>
            <h1>
              AI-аудит сайту
              <span> у стилі Elit-Web</span>
            </h1>
            <p className="hero-text">
              Перша версія продукту для GitHub-тесту: вводимо URL, сервер
              перевіряє сторінку, підтягує PageSpeed Insights і готує місце для
              Serpstat API без вигаданих цифр.
            </p>

            <form className="audit-form" onSubmit={runAudit}>
              <label htmlFor="site-url">URL сайту</label>
              <div className="form-row">
                <input
                  id="site-url"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  inputMode="url"
                  placeholder="https://example.com"
                />
                <button className="btn btn-primary" disabled={status === "loading"}>
                  {status === "loading" ? "Перевіряємо" : "Перевірити"}
                </button>
              </div>
            </form>

            <div className="strategy-switch" aria-label="Стратегія PageSpeed">
              <button
                className={strategy === "mobile" ? "active" : ""}
                onClick={() => setStrategy("mobile")}
                type="button"
              >
                Mobile
              </button>
              <button
                className={strategy === "desktop" ? "active" : ""}
                onClick={() => setStrategy("desktop")}
                type="button"
              >
                Desktop
              </button>
            </div>

            <div className="trust-row" aria-label="Принципи продукту">
              <span>без демо-цифр</span>
              <span>серверні API-ключі</span>
              <span>GitHub-ready</span>
            </div>
          </div>

          <aside className="audit-console" aria-live="polite">
            <div className="console-head">
              <div>
                <p className="console-kicker">Live report</p>
                <h2>
                  {audit?.onPage?.domain ??
                    (status === "loading" ? "Аналіз триває" : "Дані ще не знято")}
                </h2>
              </div>
              <div
                className={`score-ring ${displayScore === null ? "score-empty" : ""}`}
                style={scoreStyle(displayScore)}
                aria-label={
                  displayScore === null
                    ? "Оцінка ще не розрахована"
                    : `Оцінка ${displayScore} зі 100`
                }
              >
                <strong>{displayScore ?? "—"}</strong>
                <span>/100</span>
              </div>
            </div>

            <div className="scan-status">
              <span className={status === "loading" ? "pulse" : ""} />
              <p>
                {status === "idle" && "Введіть URL, щоб отримати реальні дані."}
                {status === "loading" &&
                  "Знімаємо HTML, robots/sitemap і зовнішні джерела."}
                {status === "done" && audit?.scoreBasis}
                {status === "error" && error}
              </p>
            </div>

            <div className="metrics">
              <div>
                <span>Джерела</span>
                <strong>
                  {connectedSources}/{audit?.sources?.length ?? 3}
                </strong>
              </div>
              <div>
                <span>Критичні</span>
                <strong>{status === "done" ? criticalCount : "—"}</strong>
              </div>
              <div>
                <span>Попередження</span>
                <strong>{status === "done" ? warningCount : "—"}</strong>
              </div>
            </div>

            {pageSpeedUnavailable && (
              <div className="source-note">
                <strong>PageSpeed:</strong> {pageSpeedUnavailable.message}
              </div>
            )}

            <div className="tabs" role="tablist" aria-label="Розділи звіту">
              <button
                className={tab === "overview" ? "active" : ""}
                onClick={() => setTab("overview")}
                role="tab"
                type="button"
              >
                Огляд
              </button>
              <button
                className={tab === "onpage" ? "active" : ""}
                onClick={() => setTab("onpage")}
                role="tab"
                type="button"
              >
                On-page
              </button>
              <button
                className={tab === "sources" ? "active" : ""}
                onClick={() => setTab("sources")}
                role="tab"
                type="button"
              >
                Джерела
              </button>
            </div>

            {tab === "overview" && (
              <div className="findings-list">
                {audit?.findings?.length ? (
                  audit.findings.map((finding) => (
                    <article className="finding" key={`${finding.level}-${finding.title}`}>
                      <span>{finding.level}</span>
                      <div>
                        <h3>{finding.title}</h3>
                        <p>{finding.detail}</p>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="empty-state">
                    {status === "done"
                      ? "За доступними перевірками явних проблем не знайдено."
                      : "Після перевірки тут з'являться тільки фактичні знахідки."}
                  </div>
                )}
              </div>
            )}

            {tab === "onpage" && (
              <div className="check-list">
                {audit?.onPage?.checks?.length ? (
                  audit.onPage.checks.map((check) => (
                    <article className="check-row" key={check.id}>
                      <div>
                        <h3>{check.label}</h3>
                        <p>{check.value}</p>
                      </div>
                      <span className={checkClass(check.status)}>
                        {checkLabel(check.status)}
                      </span>
                    </article>
                  ))
                ) : (
                  <div className="empty-state">On-page дані ще не отримані.</div>
                )}
              </div>
            )}

            {tab === "sources" && (
              <div className="source-list">
                {(audit?.sources ?? []).map((source) => (
                  <article className="source-row" key={source.name}>
                    <div>
                      <h3>{source.name}</h3>
                      <p>{source.message}</p>
                    </div>
                    <span className={checkClass(source.status)}>
                      {sourceLabel(source.status)}
                    </span>
                  </article>
                ))}
                {!audit?.sources?.length && (
                  <div className="empty-state">
                    Джерела з'являться після першого запиту.
                  </div>
                )}
              </div>
            )}
          </aside>
        </div>
      </section>

      <section className="data-band" id="sources">
        <div className="section-heading">
          <p className="eyebrow">Реальні джерела</p>
          <h2>Ніяких вигаданих метрик у звіті</h2>
          <p>
            Якщо API не відповідає або не налаштований токен, інтерфейс прямо
            показує це користувачу. Це важливо для довіри до продукту.
          </p>
        </div>
        <div className="source-card-grid">
          {sourceCards.map((card) => (
            <article className="source-card" key={card.title}>
              <h3>{card.title}</h3>
              <p>{card.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="snapshot-band">
        <div className="snapshot-panel">
          <div>
            <span>HTTP</span>
            <strong>{audit?.onPage?.statusCode ?? "—"}</strong>
          </div>
          <div>
            <span>Відповідь</span>
            <strong>
              {audit?.onPage?.responseMs ? `${audit.onPage.responseMs} мс` : "—"}
            </strong>
          </div>
          <div>
            <span>HTML</span>
            <strong>{formatBytes(audit?.onPage?.sizeBytes)}</strong>
          </div>
          <div>
            <span>Title</span>
            <strong>{audit?.onPage?.title ? `${audit.onPage.title.length}` : "—"}</strong>
          </div>
        </div>
        <div className="snapshot-copy">
          <p className="eyebrow">Перший MVP</p>
          <h2>GitHub як сховище коду, API як основа реального продукту</h2>
          <p>
            Для GitHub Pages одного статичного HTML буде мало, бо API-ключі не
            можна світити в браузері. Поточна архітектура підходить для
            GitHub-репозиторію з подальшим запуском на Vercel, Cloudflare або
            іншому серверному хостингу.
          </p>
        </div>
      </section>

      <section className="workflow-band" id="workflow">
        <div className="workflow-copy">
          <p className="eyebrow">Логіка продукту</p>
          <h2>Експрес-звіт як перший крок до заявки</h2>
          <p>
            Користувач бачить фактичний зріз, розуміє проблему й залишає контакт
            уже після отриманої користі.
          </p>
        </div>
        <div className="workflow-list">
          {productSteps.map((step, index) => (
            <article key={step}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <p>{step}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="serpstat-band">
        <div>
          <p className="eyebrow">Serpstat ready</p>
          <h2>Підключимо доменні SEO-дані, коли буде токен</h2>
          <p>
            Розширення Serpstat працює в браузері, а для продукту потрібен API.
            У коді вже є місце для SERPSTAT_API_TOKEN, щоб не передавати ключ у
            фронтенд.
          </p>
        </div>
        <div className="serpstat-panel">
          <div>
            <span>Видимість</span>
            <strong>{formatNumber(audit?.serpstat?.visibility)}</strong>
          </div>
          <div>
            <span>Ключові фрази</span>
            <strong>{formatNumber(audit?.serpstat?.keywords)}</strong>
          </div>
          <div>
            <span>Оцінний трафік</span>
            <strong>{formatNumber(audit?.serpstat?.traffic)}</strong>
          </div>
          <div>
            <span>База</span>
            <strong>{audit?.serpstat?.se ?? "g_ua"}</strong>
          </div>
        </div>
      </section>

      <section className="lead-band" id="lead">
        <div>
          <p className="eyebrow">Повний аудит Elit-Web</p>
          <h2>Звіт має вести до консультації, а не до глухого кута</h2>
          <p>
            Після експрес-перевірки можна відкрити форму для детального аудиту:
            технічні помилки, SEO-структура, швидкість, конкуренти й план робіт.
          </p>
        </div>
        <form className="lead-form">
          <label>
            URL сайту
            <input defaultValue={audit?.onPage?.finalUrl ?? url} />
          </label>
          <label>
            Ім'я
            <input placeholder="Ваше ім'я" />
          </label>
          <label>
            Телефон або email
            <input placeholder="+38 або email" />
          </label>
          <button className="btn btn-primary" type="button">
            Отримати консультацію
          </button>
        </form>
      </section>
    </main>
  );
}
