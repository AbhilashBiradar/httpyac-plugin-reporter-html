# httpyac-plugin-reporter-html

A zero-dependency [httpYac](https://httpyac.github.io/) plugin that intercepts every HTTP request/response in a test run and generates a single, standalone HTML report file — no external CSS/JS, works offline and in CI/CD environments.

## Preview

![Report overview](https://raw.githubusercontent.com/AbhilashBiradar/httpyac-plugin-reporter-html/main/docs/screenshot-full.png)

![Expanded card with test assertions](https://raw.githubusercontent.com/AbhilashBiradar/httpyac-plugin-reporter-html/main/docs/screenshot-expanded.png)

---

## Features

- **Summary hero** — total requests, passed, failed, and total duration at a glance
- **Per-request cards** — color-coded by HTTP status (2xx green, 4xx orange, 5xx red)
- **Collapsible panels** — request headers, response headers, and pretty-printed JSON response body
- **Test assertion badges** — pass/fail status for every `@assert` / test block inside a region
- **Client-side filter & search** — filter by status class or failed tests, search by URL or region name
- **Single file output** — all CSS and JS is inlined; share the file anywhere

---

## Requirements

- Node.js >= 18
- httpYac >= 6.0.0

---

## Installation

### Global (recommended for CLI use)

```bash
npm install -g httpyac-plugin-reporter-html
```

httpYac **automatically discovers** any globally installed package whose name matches `httpyac-plugin-*` — no extra config needed.

### Project-local

```bash
npm install --save-dev httpyac-plugin-reporter-html
```

httpYac scans your `package.json` `dependencies` and `devDependencies` for packages matching `httpyac-plugin-*` and loads them automatically. No registration in config is required.

---

## Usage

Run your `.http` files as normal:

```bash
httpyac send **/*.http
```

When the run finishes, `report.html` is written to the project root. Open it in any browser:

```bash
open report.html          # macOS
xdg-open report.html      # Linux
start report.html         # Windows
```

---

## Configuration

You can configure the plugin in `.httpyac.config.js` at the project root:

```js
module.exports = {
  htmlReporter: {
    title: 'My API Test Report',
    outputFile: 'report.html',
  },
};
```

| Option | Type | Default | Description |
|---|---|---|---|
| `title` | `string` | `"httpYac HTML Report"` | Title displayed in the report header |
| `outputFile` | `string` | `"report.html"` | Output file name/path relative to workspace root |

---

## Report Overview

```
┌──────────────────────────────────────────────────────┐
│  httpYac HTML Report          Generated 2025-07-27   │
├──────────┬──────────┬──────────┬─────────────────────┤
│  12 Total│  10 Pass │  2 Fail  │  3.45s Duration      │
├──────────┴──────────┴──────────┴─────────────────────┤
│  🔍 Search…  [All] [2xx] [4xx] [5xx] [Failed Tests]   │
├──────────────────────────────────────────────────────┤
│  GET  /api/users                            200  42ms  │
│  ├─ Request Headers                                   │
│  ├─ Response Headers                                  │
│  └─ Response Body                                     │
│  POST /api/auth                             401  12ms  │
│  ...                                                  │
└──────────────────────────────────────────────────────┘
```

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Commit your changes
4. Open a pull request

Bug reports and feature requests are welcome via [GitHub Issues](https://github.com/AbhilashBiradar/httpyac-plugin-reporter-html/issues).

---

## License

MIT © [Abhilash Biradar](https://github.com/AbhilashBiradar)
