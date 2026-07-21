import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { scoreSkills, scoreExperience, scoreWeighted } from '../src/scoring/weightedScorer.js';
import { scoreKeywords } from '../src/scoring/keywordScorer.js';
import { rankCandidates, classify, summarize } from '../src/scoring/rankingEngine.js';

const jobDescription = {
  title: 'Backend Engineer',
  skills: ['Node.js', 'PostgreSQL', 'Docker'],
  minYearsExperience: 4,
  keywords: ['node.js', 'postgresql', 'docker', 'api'],
  rawText: 'Backend Engineer role requiring Node.js, PostgreSQL, Docker and API design.',
};

function makeResume(overrides = {}) {
  return {
    id: 'candidate-1',
    name: 'Test Candidate',
    skills: ['Node.js', 'PostgreSQL'],
    experience: { years: 5, raw: '5 years of experience' },
    keywords: ['node.js', 'postgresql', 'api'],
    rawText: 'Experienced with Node.js, PostgreSQL and API design.',
    ...overrides,
  };
}

describe('scoreSkills', () => {
  test('scores 100 when all required skills match', () => {
    const resume = makeResume({ skills: ['Node.js', 'PostgreSQL', 'Docker'] });
    const result = scoreSkills(resume, jobDescription);
    assert.equal(result.score, 100);
    assert.deepEqual(result.missingSkills, []);
  });

  test('identifies missing skills', () => {
    const resume = makeResume({ skills: ['Node.js'], rawText: 'Experienced with Node.js.' });
    const result = scoreSkills(resume, jobDescription);
    assert.ok(result.missingSkills.includes('postgresql'));
    assert.ok(result.missingSkills.includes('docker'));
  });

  test('returns 100 when the JD lists no required skills', () => {
    const resume = makeResume();
    const result = scoreSkills(resume, { ...jobDescription, skills: [] });
    assert.equal(result.score, 100);
  });
});

describe('scoreExperience', () => {
  test('caps score at 100 even with more experience than required', () => {
    const resume = makeResume({ experience: { years: 20, raw: '' } });
    const result = scoreExperience(resume, jobDescription);
    assert.equal(result.score, 100);
  });

  test('scores proportionally when under the requirement', () => {
    const resume = makeResume({ experience: { years: 2, raw: '' } });
    const result = scoreExperience(resume, jobDescription);
    assert.equal(result.score, 50);
  });

  test('returns 100 when the JD specifies no minimum years', () => {
    const resume = makeResume();
    const result = scoreExperience(resume, { ...jobDescription, minYearsExperience: null });
    assert.equal(result.score, 100);
  });
});

describe('scoreKeywords', () => {
  test('computes overlap ratio between resume and JD keywords', () => {
    const resume = makeResume({ keywords: ['node.js', 'postgresql'] });
    const result = scoreKeywords(resume, jobDescription);
    assert.equal(result.total, 4);
    assert.equal(result.matched.length, 2);
    assert.equal(result.score, 50);
  });
});

describe('scoreWeighted', () => {
  test('combines skills, experience, and keyword scores using configured weights', () => {
    const resume = makeResume({
      skills: ['Node.js', 'PostgreSQL', 'Docker'],
      experience: { years: 4, raw: '' },
    });
    const weights = { skillsWeight: 0.5, experienceWeight: 0.3, keywordWeight: 0.2 };
    const result = scoreWeighted(resume, jobDescription, weights);
    assert.ok(result.overall > 0 && result.overall <= 100);
    assert.equal(result.skills.score, 100);
  });
});

describe('rankingEngine', () => {
  const thresholds = { shortlistThreshold: 75, reviewThreshold: 50 };

  test('classify() returns the correct bucket for each score', () => {
    assert.equal(classify(90, thresholds), 'Shortlisted');
    assert.equal(classify(60, thresholds), 'Review');
    assert.equal(classify(20, thresholds), 'Rejected');
  });

  test('rankCandidates() sorts by score descending and assigns status', () => {
    const candidates = [
      { name: 'A', overallScore: 40 },
      { name: 'B', overallScore: 90 },
      { name: 'C', overallScore: 60 },
    ];
    const ranked = rankCandidates(candidates, thresholds);
    assert.deepEqual(
      ranked.map((c) => c.name),
      ['B', 'C', 'A']
    );
    assert.equal(ranked[0].status, 'Shortlisted');
    assert.equal(ranked[1].status, 'Review');
    assert.equal(ranked[2].status, 'Rejected');
  });

  test('summarize() aggregates counts and average score', () => {
    const ranked = rankCandidates(
      [
        { name: 'A', overallScore: 80 },
        { name: 'B', overallScore: 20 },
      ],
      thresholds
    );
    const summary = summarize(ranked);
    assert.equal(summary.total, 2);
    assert.equal(summary.Shortlisted, 1);
    assert.equal(summary.Rejected, 1);
    assert.equal(summary.averageScore, 50);
  });
});
