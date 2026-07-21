import { promises as fs } from 'node:fs';
import path from 'node:path';

/** Text-based resume formats TalentFlow can read out of the box. */
export const SUPPORTED_RESUME_EXTENSIONS = new Set(['.txt', '.md', '.markdown']);

export async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

export async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Lists supported resume files inside a directory (non-recursive by
 * default, since recruiter resume dumps are typically flat folders).
 */
export async function listResumeFiles(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .filter((entry) => SUPPORTED_RESUME_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
    .map((entry) => path.join(dirPath, entry.name))
    .sort();
}

export async function readTextFile(filePath) {
  return fs.readFile(filePath, 'utf-8');
}

export async function writeTextFile(filePath, contents) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, contents, 'utf-8');
}

export async function writeJsonFile(filePath, data) {
  await writeTextFile(filePath, JSON.stringify(data, null, 2));
}

export async function readJsonFile(filePath) {
  const raw = await readTextFile(filePath);
  return JSON.parse(raw);
}

export function slugify(value) {
  return (
    String(value)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'candidate'
  );
}
