import path from 'node:path';
import { writeTextFile, writeJsonFile } from '../utils/fileUtils.js';

function csvEscape(value) {
  const str = String(value ?? '');
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export function toCsv(rankedCandidates) {
  const headers = [
    'Name',
    'Email',
    'Overall Score',
    'Skills Score',
    'Experience Score',
    'Missing Requirements',
    'Recommendation',
  ];
  const rows = rankedCandidates.map((c) => [
    c.name,
    c.email || '',
    c.overallScore,
    c.skillMatchScore,
    c.experienceMatchScore,
    (c.missingSkills || []).join('; '),
    c.status,
  ]);

  return [headers, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n');
}

function skillGapAnalysis(rankedCandidates) {
  const gapCounts = new Map();
  for (const c of rankedCandidates) {
    for (const skill of c.missingSkills || []) {
      gapCounts.set(skill, (gapCounts.get(skill) || 0) + 1);
    }
  }
  return [...gapCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([skill, count]) => `- **${skill}** — missing in ${count} candidate(s)`);
}

export function toMarkdown(rankedCandidates, jobDescription, summary) {
  const lines = [
    `# TalentFlow Screening Report`,
    '',
    `**Role:** ${jobDescription.title}`,
    `**Generated:** ${new Date().toISOString()}`,
    '',
    '## Executive Summary',
    '',
    `TalentFlow screened **${summary.total}** candidates against this role. ` +
      `**${summary.Shortlisted}** were shortlisted, **${summary.Review}** need manual review, and ` +
      `**${summary.Rejected}** were rejected. The average match score was **${summary.averageScore}%**.`,
    '',
    '## Candidate Ranking',
    '',
    '| Candidate | Score | Skills | Experience | Status |',
    '|---|---|---|---|---|',
    ...rankedCandidates.map(
      (c) =>
        `| ${c.name} | ${c.overallScore}% | ${c.skillMatchScore}% | ${c.experienceMatchScore}% | ${c.status} |`
    ),
    '',
    '## Skill Gap Analysis',
    '',
    ...(skillGapAnalysis(rankedCandidates).length
      ? skillGapAnalysis(rankedCandidates)
      : ['No significant recurring skill gaps detected.']),
    '',
    '## Hiring Recommendation',
    '',
    summary.Shortlisted > 0
      ? `Proceed to interviews with the ${summary.Shortlisted} shortlisted candidate(s). ` +
        `Consider the "Review" bucket only if the shortlist doesn't convert.`
      : `No candidates met the shortlist threshold — consider widening sourcing or revisiting the job requirements.`,
    '',
  ];

  return lines.join('\n');
}

export async function writeReports(rankedCandidates, jobDescription, summary, outputDir) {
  const files = {
    json: path.join(outputDir, 'report.json'),
    csv: path.join(outputDir, 'report.csv'),
    markdown: path.join(outputDir, 'report.md'),
  };

  await writeJsonFile(files.json, {
    jobDescription: jobDescription.title,
    summary,
    candidates: rankedCandidates,
  });
  await writeTextFile(files.csv, toCsv(rankedCandidates));
  await writeTextFile(files.markdown, toMarkdown(rankedCandidates, jobDescription, summary));

  return files;
}
