import Elysia from "elysia";

const docsHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Ground Codes API</title>
    <style>
      :root {
        color-scheme: dark;
        --bg: #071013;
        --panel: #0e1a1f;
        --line: #243840;
        --text: #f2f7f8;
        --muted: #a8bbbf;
        --accent: #4fd1b3;
        --code: #d7fbe8;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: radial-gradient(circle at top left, rgba(79, 209, 179, 0.16), transparent 34rem), var(--bg);
        color: var(--text);
        line-height: 1.55;
      }
      main { max-width: 1040px; margin: 0 auto; padding: 56px 20px 72px; }
      header { margin-bottom: 36px; }
      h1 { margin: 0 0 12px; font-size: clamp(2rem, 5vw, 4.4rem); line-height: 1; letter-spacing: 0; }
      h2 { margin: 0 0 14px; font-size: 1.05rem; }
      p { margin: 0; color: var(--muted); max-width: 760px; }
      a { color: var(--accent); text-decoration: none; }
      a:hover { text-decoration: underline; }
      .actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 24px; }
      .actions a {
        display: inline-flex;
        align-items: center;
        min-height: 40px;
        border: 1px solid var(--line);
        border-radius: 6px;
        padding: 8px 12px;
        background: rgba(14, 26, 31, 0.78);
        color: var(--text);
      }
      .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
      section {
        border: 1px solid var(--line);
        border-radius: 8px;
        background: rgba(14, 26, 31, 0.82);
        padding: 18px;
      }
      code, pre {
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        color: var(--code);
      }
      pre {
        overflow-x: auto;
        border: 1px solid rgba(79, 209, 179, 0.18);
        border-radius: 6px;
        background: #050b0d;
        padding: 14px;
        margin: 12px 0 0;
        font-size: 0.84rem;
      }
      ul { margin: 8px 0 0; padding-left: 20px; color: var(--muted); }
      li + li { margin-top: 6px; }
      .full { grid-column: 1 / -1; }
      @media (max-width: 760px) {
        main { padding-top: 34px; }
        .grid { grid-template-columns: 1fr; }
      }
    </style>
  </head>
  <body>
    <main>
      <header>
        <h1>Ground Codes API</h1>
        <p>Encode coordinates into human-readable share codes, decode them back to coordinates, and search regions or codes through stable versioned endpoints.</p>
        <div class="actions">
          <a href="/openapi/">OpenAPI Reference</a>
          <a href="/openapi/json">OpenAPI JSON</a>
          <a href="/metrics">Metrics</a>
          <a href="/readyz">Readiness</a>
        </div>
      </header>
      <div class="grid">
        <section>
          <h2>Base URL</h2>
          <p>Production clients should call <code>https://api.ground.codes</code> and keep all new integrations on <code>/v1/*</code>.</p>
        </section>
        <section>
          <h2>Languages</h2>
          <p>Ground Codes supports <code>english</code>, <code>korean</code>, <code>chinese</code>, <code>japanese</code>, <code>spanish</code>, <code>french</code>, <code>german</code>, <code>portuguese</code>, <code>indonesian</code>, <code>thai</code>, <code>vietnamese</code>, <code>hindi</code>, <code>arabic</code>, and <code>russian</code> for codebooks and localized region labels.</p>
        </section>
        <section>
          <h2>Share URL Rules</h2>
          <p>Earth URLs stay code-only. Moon and Mars use explicit body prefixes so links remain readable without adding query parameters or percent-encoded labels.</p>
          <ul>
            <li>Earth: <code>https://ground.codes/Seoul-word-word</code></li>
            <li>Moon: <code>https://ground.codes/moon/Mare Tranquillitatis-word-word</code></li>
            <li>Mars: <code>https://ground.codes/mars/Olympus Mons-word-word</code></li>
          </ul>
        </section>
        <section class="full">
          <h2>Body Constraints</h2>
          <p>Earth defaults to the code-only share path and can combine Ground Code region search with map place search in the web client. Non-Earth bodies must be selected explicitly.</p>
          <ul>
            <li>Earth supports <code>body:"earth"</code>, regionLevel <code>2</code> or <code>3</code>, and no share URL prefix.</li>
            <li>Moon supports regionLevel 2 and the <code>/moon/</code> share URL prefix.</li>
            <li>Mars supports regionLevel 2 and 3 and the <code>/mars/</code> share URL prefix.</li>
          </ul>
        </section>
        <section class="full">
          <h2>Copy-ready Examples</h2>
          <p>These examples are safe to run as-is from a terminal. Use encode for new links, search for user-entered text, and decode when validating a shared code.</p>
        </section>
        <section class="full">
          <h2>Encode</h2>
          <p>POST <code>/v1/encode</code> with latitude, longitude, language, body, and optional precision controls.</p>
          <pre><code>curl -X POST https://api.ground.codes/v1/encode \\
  -H "Content-Type: application/json" \\
  -d '{"lat":37.566,"lng":126.978,"language":"english","body":"earth","regionLevel":2}'</code></pre>
        </section>
        <section class="full">
          <h2>Search</h2>
          <p>Search accepts encoded ground codes, partial region names, and common aliases such as <code>nyc</code>. Pass <code>biasLat</code> and <code>biasLng</code> from the current map center to rank ambiguous names nearby.</p>
          <pre><code>curl -X POST https://api.ground.codes/v1/search \\
  -H "Content-Type: application/json" \\
  -d '{"query":"Springfield","language":"english","body":"earth","maxResults":5,"biasLat":42.1,"biasLng":-72.6}'</code></pre>
        </section>
        <section class="full">
          <h2>Decode</h2>
          <p>Decode validates a Ground Code and returns its approximate center coordinate for the requested body and language.</p>
          <pre><code>curl -X POST https://api.ground.codes/v1/decode \\
  -H "Content-Type: application/json" \\
  -d '{"code":"Seoul-Alder","language":"english","body":"earth","regionLevel":2}'</code></pre>
        </section>
        <section>
          <h2>Operational Endpoints</h2>
          <ul>
            <li><code>/healthz</code> liveness</li>
            <li><code>/readyz</code> deployment readiness</li>
            <li><code>/metrics</code> request counts and latency</li>
          </ul>
          <pre><code>curl https://api.ground.codes/metrics</code></pre>
        </section>
        <section>
          <h2>Status Code Reference</h2>
          <p>Client and server errors return a structured <code>{"error":{"code","message","details"}}</code> payload.</p>
          <ul>
            <li><strong>HTTP Status</strong> <code>400</code>: invalid or undecodable client input</li>
            <li><strong>HTTP Status</strong> <code>404</code>: missing region info or unsupported route</li>
            <li><strong>HTTP Status</strong> <code>429</code>: rate limit exceeded</li>
          </ul>
        </section>
      </div>
    </main>
  </body>
</html>`;

const serveDocs = ({ set }: { set: { headers: Record<string, string> } }) => {
    set.headers["cache-control"] = "public, max-age=300";
    set.headers["content-type"] = "text/html; charset=utf-8";
    return docsHtml;
};

export const docsEndpoint = new Elysia()
  .get(
    "/",
    serveDocs,
    {
      detail: {
        hide: true,
      },
    },
  )
  .get(
    "/docs",
    serveDocs,
  {
    detail: {
      hide: true,
    },
  },
);
