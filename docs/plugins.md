# Plugins

TalentFlow CLI's core resume parser only reads `.txt` and `.md` files. This is
a deliberate design choice, not an oversight: PDF-parsing libraries tend to be
heavy, sometimes require native builds, and are a common source of breakage
on constrained environments like Android/Termux.

Instead, PDF (and other format) support is designed as an **optional
plugin** rather than a core dependency.

## Why plugins instead of a core dependency

- Keeps the default install small and fast (`npm install` with zero native
  deps).
- Guarantees `talentflow` always works out of the box on Windows, Linux,
  macOS, and Termux.
- Lets you choose the PDF engine that fits your environment — a full
  `pdf-parse`-style library on desktop, or a lighter OCR-based approach
  elsewhere — without TalentFlow forcing one choice on everyone.

## How the plugin boundary works today

`src/parser/resumeParser.js` exports `isPdfResume(filePath)` and throws a
clear, actionable error when a `.pdf` file reaches the core parser:

```js
export function isPdfResume(filePath) {
  return path.extname(filePath).toLowerCase() === '.pdf';
}
```

## Building a PDF plugin (recommended pattern)

A plugin is just a Node.js module that exports a function matching the same
shape as `parseResumeFile()`:

```js
// plugins/pdf-plugin.js
export async function parsePdfResume(filePath) {
  // 1. Extract raw text from the PDF using your library of choice
  // 2. Return an object shaped like the core parser's output:
  return {
    id: '...',
    sourceFile: filePath,
    name: '...',
    email: '...',
    phone: '...',
    skills: [],
    experience: { raw: '...', years: 0 },
    education: '...',
    certifications: [],
    projects: [],
    keywords: [],
    rawText: '...',
    parsedAt: new Date().toISOString(),
  };
}
```

Until a first-party plugin loader ships, the simplest way to use one today is
to pre-convert PDFs to `.txt` before running `talentflow parse` / `talentflow
screen`, or to import your plugin function directly in a small wrapper script
that calls `parseResumeDirectory()` with a custom file list.

## Roadmap

A formal plugin loader (`talentflow plugin add <package>`) is tracked on the
[project roadmap](../README.md#roadmap). Contributions are welcome — see
[CONTRIBUTING.md](../CONTRIBUTING.md).
