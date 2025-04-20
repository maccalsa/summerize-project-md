# 📦 summarize-project-md

> 🧩 Easily generate a clean, readable Markdown summary of your project's file structure and source code — great for sharing context with teammates, code reviewers, or AI assistants.

---

## ✨ Features

- 📁 Renders a full tree-style folder structure
- 📄 Inlines small source files in syntax-highlighted Markdown code blocks
- 🚫 Skips large or excluded files but lists them clearly
- ⚙️ Configurable via CLI flags (`--include`, `--exclude`, `--ext`, etc.)
- 🪄 Output ready to paste into ChatGPT, docs, or PRs

---

## 🚀 Quick Start

```bash
npx @maccalsa/summarize-project-md
```

This will create a `project-summary.md` file in the current directory with a smart default setup.

---

## ⚙️ CLI Options

| Option         | Description                                                  | Default                                |
|----------------|--------------------------------------------------------------|----------------------------------------|
| `--include`    | Comma-separated list of folders to include                   | `.` (current directory)                |
| `--exclude`    | Comma-separated list of folders to exclude                   | `node_modules,.git,dist,build,.next`   |
| `--ext`        | Comma-separated list of file extensions to include           | `.ts,.tsx,.js,.jsx,.svelte,.md,.json`  |
| `--max-size`   | Max file size (KB) to inline the contents of a file          | `32`                                   |
| `--output`     | Output markdown file name                                    | `project-summary.md`                   |

---

## 🧪 Example Usage

```bash
npx @maccalsa/summarize-project-md \
  --include src,app \
  --exclude node_modules,.git,dist \
  --ext .ts,.svelte,.md \
  --max-size 48 \
  --output summary.md
```

---

## 📄 Output Example

```md
# Project Summary

## Folder Structure

**src**
- app/
  - layout.ts
  - page.svelte
- lib/
  - utils.ts
  - constants.ts
- routes/
  - index.svelte (skipped)

## Included Files

### src/app/page.svelte

```svelte
<script>
  export let name = "SnipVault";
</script>

<h1>Hello {name}!</h1>
```

...

## Excluded Files (by extension)

- src/assets/logo.png
- src/styles/global.css
```

---

## 🛠 Local Development

To develop locally:

```bash
git clone https://github.com/your-username/summarize-project-md.git
cd summarize-project-md
npm install
npm link
summarize-project --include src
```

---

## 🔐 Publishing as Public Scoped Package

If publishing under a scope like `@maccalsa`, make sure to run:

```bash
npm publish --access public
```

---

## 🧠 Why use this?

Perfect for:

- Sharing context with AI tools (like ChatGPT)
- Generating lightweight technical summaries
- Documenting small or modular codebases
- Writing clean project onboarding guides

---

## Publishing

To publish a new version, get a token from npm and run:

```bash
export NPM_TOKEN=<your-token>
npm run publish

remember to bounce the version number in package.json
```



## 📜 License

MIT © [Stuart MacCallum](https://github.com/maccalsa)

