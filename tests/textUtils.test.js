import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  extractEmail,
  extractPhone,
  extractName,
  extractSection,
  splitList,
  stripMarkdown,
  tokenize,
} from '../src/utils/textUtils.js';

describe('extractEmail', () => {
  test('finds a valid email address in free text', () => {
    assert.equal(extractEmail('Contact: jane.doe@example.com for details'), 'jane.doe@example.com');
  });

  test('returns null when no email is present', () => {
    assert.equal(extractEmail('No contact info here'), null);
  });
});

describe('extractPhone', () => {
  test('finds a phone number with country code', () => {
    assert.equal(extractPhone('Call me at +91 98765 43210 anytime'), '+91 98765 43210');
  });

  test('ignores short numeric sequences', () => {
    assert.equal(extractPhone('Room 42, floor 3'), null);
  });
});

describe('extractName', () => {
  test('picks the first plausible name-like line', () => {
    const text = 'Jane Doe\njane@example.com\n+1 555 000 1111\n\nSkills: JS';
    assert.equal(extractName(text), 'Jane Doe');
  });
});

describe('extractSection', () => {
  test('extracts a comma-separated skills line after a heading', () => {
    const text = 'Profile\n\nSkills:\nNode.js, PostgreSQL, Docker\n\nEducation:\nB.Tech';
    const section = extractSection(text, ['skills']);
    assert.match(section, /Node\.js/);
    assert.doesNotMatch(section, /B\.Tech/);
  });

  test('extracts an inline "Heading: value" line', () => {
    const text = 'Experience: 5 years\n';
    const section = extractSection(text, ['experience']);
    assert.equal(section, '5 years');
  });
});

describe('splitList', () => {
  test('splits and trims a comma-separated string', () => {
    assert.deepEqual(splitList('Node.js, PostgreSQL,  Docker'), ['Node.js', 'PostgreSQL', 'Docker']);
  });

  test('de-duplicates repeated entries', () => {
    assert.deepEqual(splitList('Git, Git, Docker'), ['Git', 'Docker']);
  });

  test('returns an empty array for empty input', () => {
    assert.deepEqual(splitList(''), []);
  });
});

describe('stripMarkdown', () => {
  test('removes headings, bold/italic markers, and links', () => {
    const md = '# Title\n\n**Bold** and _italic_ and [link](https://example.com)';
    const plain = stripMarkdown(md);
    assert.doesNotMatch(plain, /[#*_]/);
    assert.match(plain, /link/);
  });
});

describe('tokenize', () => {
  test('lowercases and extracts word-like tokens', () => {
    const tokens = tokenize('Node.js and PostgreSQL are great!');
    assert.ok(tokens.includes('node.js') || tokens.includes('node'));
    assert.ok(tokens.includes('postgresql'));
  });
});
