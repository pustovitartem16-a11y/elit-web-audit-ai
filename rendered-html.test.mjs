import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const templateRoot = new URL("../", import.meta.url);
const previewRoot = new URL("../app/_sites-preview/", import.meta.url);

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Elit-Web audit landing page", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(
    html,
    /<title>Elit-Web Audit AI - реальний SEO-аудит сайту<\/title>/i,
  );
  assert.match(html, /Elit-Web Audit AI/);
  assert.match(html, /SEO checker з реальними джерелами/);
  assert.match(html, /PageSpeed Insights/);
  assert.match(html, /Serpstat API/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|SkeletonPreview/);
});

test("keeps real-data integration files and project metadata", async () => {
  const [page, layout, route, packageJson, envExample] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/audit/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../.env.example", import.meta.url), "utf8"),
  ]);

  assert.match(page, /Elit-Web Audit AI/);
  assert.match(page, /fetch\("\/api\/audit"/);
  assert.match(layout, /openGraph/);
  assert.match(route, /PageSpeed Insights/);
  assert.match(route, /SerpstatDomainProcedure\.getDomainsInfo/);
  assert.match(envExample, /PAGESPEED_API_KEY/);
  assert.match(envExample, /SERPSTAT_API_TOKEN/);
  assert.doesNotMatch(page, /scoreFor|boost|demo-shop/);
  assert.doesNotMatch(layout, /Starter Project|codex-preview|Geist/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);

  await access(new URL("../public/og.svg", import.meta.url));
  await access(new URL("../public/favicon.svg", import.meta.url));
  await assert.rejects(access(previewRoot));
  await assert.rejects(access(new URL("public/_sites-preview", templateRoot)));
});
