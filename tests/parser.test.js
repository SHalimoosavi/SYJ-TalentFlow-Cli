import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { parseResumeFile, isPdfResume } from '../src/parser/resumeParser.js';
import { parseJobDescription } from '../src/parser/jdParser.js';

async function withTempDir(fn) {
  const dir = await mkdtemp(path.join(tmpdir(), 'talentflow-test-'));
  try {
    return await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

describe('parseResumeFile', () => {
  test('extracts name, email, phone, and skills from a plain-text resume', async () => {
    await withTempDir(async (dir) => {
      const filePath = path.join(dir, 'jane-doe.txt');
      await writeFile(
        filePath,
        [
          'Jane Doe',
          'jane.doe@example.com',
          '+1 555 000 1111',
          '',
          'Skills:',
          'Node.js, PostgreSQL, Docker',
          '',
          'Experience:',
          '5 years as a backend engineer.',
        ].join('\n')
      );

      const parsed = await parseResumeFile(filePath);
      assert.equal(parsed.name, 'Jane Doe');
      assert.equal(parsed.email, 'jane.doe@example.com');
      assert.ok(parsed.phone);
      assert.ok(parsed.skills.includes('Node.js'));
      assert.equal(parsed.experience.years, 5);
    });
  });

  test('rejects PDF resumes with a clear, actionable error', async () => {
    await withTempDir(async (dir) => {
      const filePath = path.join(dir, 'resume.pdf');
      await writeFile(filePath, 'fake pdf bytes');
      assert.ok(isPdfResume(filePath));
      await assert.rejects(() => parseResumeFile(filePath), /PDF/i);
    });
  });
});

describe('parseJobDescription', () => {
  test('extracts skills and minimum years of experience', async () => {
    await withTempDir(async (dir) => {
      const filePath = path.join(dir, 'jd.txt');
      await writeFile(
        filePath,
        [
          'Senior Backend Engineer',
          '',
          'Requirements: 5+ years of experience.',
          '',
          'Skills:',
          'Node.js, PostgreSQL, Docker',
          '',
          'Responsibilities include owning core services.',
        ].join('\n')
      );

      const jd = await parseJobDescription(filePath);
      assert.equal(jd.minYearsExperience, 5);
      assert.ok(jd.skills.includes('Node.js'));
      assert.ok(!jd.skills.some((s) => /responsibilities/i.test(s)));
    });
  });
});
