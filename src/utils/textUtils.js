const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_RE = /(\+?\d[\d\s.\-()]{7,}\d)/;

/** Strips Markdown syntax down to readable plain text for parsing/scoring. */
export function stripMarkdown(text) {
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)]\([^)]*\)/g, '$1')
    .replace(/[#>*_~-]{1,3}/g, ' ')
    .replace(/\|/g, ' ')
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ');
}

export function normalizeWhitespace(text) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line, idx, arr) => !(line === '' && arr[idx - 1] === ''))
    .join('\n')
    .trim();
}

export function extractEmail(text) {
  const match = text.match(EMAIL_RE);
  return match ? match[0] : null;
}

export function extractPhone(text) {
  const match = text.match(PHONE_RE);
  if (!match) return null;
  const digits = match[0].replace(/[^\d+]/g, '');
  return digits.length >= 8 ? match[0].trim() : null;
}

export function extractName(text) {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  for (const line of lines.slice(0, 5)) {
    if (EMAIL_RE.test(line) || PHONE_RE.test(line)) continue;
    if (line.length > 3 && line.length < 60 && /^[A-Za-z][A-Za-z.\s'-]+$/.test(line)) {
      return line.replace(/\s+/g, ' ').trim();
    }
  }
  return lines[0]?.slice(0, 60) || 'Unknown Candidate';
}

/**
 * Extracts a bulleted/comma-separated block that follows a section
 * heading such as "Skills", "Education", etc. Works across plain-text
 * and lightly-formatted Markdown resumes.
 */
export function extractSection(text, headings) {
  const lines = text.split('\n');
  const headingPattern = new RegExp(`^(${headings.join('|')})\\s*:?\\s*$`, 'i');
  const inlineHeadingPattern = new RegExp(`^(${headings.join('|')})\\s*:\\s*(.+)$`, 'i');

  let capturing = false;
  const collected = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();

    const inlineMatch = line.match(inlineHeadingPattern);
    if (inlineMatch) {
      collected.push(inlineMatch[2]);
      continue;
    }

    if (headingPattern.test(line)) {
      capturing = true;
      continue;
    }

    if (capturing) {
      if (line === '') {
        if (collected.length > 0) capturing = false;
        continue;
      }
      const looksLikeNewSection =
        line.length > 0 &&
        line.length < 40 &&
        /^[A-Z][A-Za-z\s/&]+$/.test(line) &&
        !line.includes(',') &&
        !/^[-*•]/.test(lines[i]);
      if (looksLikeNewSection && !inlineHeadingPattern.test(line)) {
        capturing = false;
        continue;
      }
      collected.push(line.replace(/^[-*•]\s*/, ''));
    }
  }

  return collected.join('\n').trim();
}

/** Splits a free-text skills block into a clean, de-duplicated array. */
export function splitList(text) {
  if (!text) return [];
  return [
    ...new Set(
      text
        .split(/[,•\n|]/)
        .map((s) => s.replace(/^[-*\s]+/, '').trim())
        .filter((s) => s.length > 1 && s.length < 60)
    ),
  ];
}

export function tokenize(text) {
  return text.toLowerCase().match(/[a-z0-9+#.]{2,}/g) || [];
}

export function truncate(text, maxLength = 4000) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}\n…[truncated]`;
}
