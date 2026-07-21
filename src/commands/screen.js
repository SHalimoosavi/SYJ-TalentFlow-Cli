import path from 'node:path';
import { loadConfig } from '../config/config.js';
import { resolveProvider } from '../ai/resolveProvider.js';
import { parseResumeDirectory } from '../parser/resumeParser.js';
import { parseJobDescription } from '../parser/jdParser.js';
import { scoreWeighted } from '../scoring/weightedScorer.js';
import { scoreSemantic } from '../scoring/semanticScorer.js';
import { rankCandidates, summarize } from '../scoring/rankingEngine.js';
import { writeReports } from '../reports/reportGenerator.js';
import { ensureDir, pathExists, writeJsonFile } from '../utils/fileUtils.js';
import { logger } from '../utils/logger.js';
import { printBanner, printStats, printRankingTable } from '../cli/dashboard.js';

/**
 * `talentflow screen` — the primary end-to-end pipeline: parse resumes,
 * parse the JD, score every candidate (keyword + weighted + optional AI
 * semantic layer), rank them, and write reports.
 */
export async function screenCandidates({ jdPath, resumesDir, outputDir, useAi, silent } = {}) {
  const config = loadConfig();
  const resolvedResumesDir = resumesDir || config.paths.resumes;
  const resolvedOutputDir = outputDir || config.paths.output;
  const shouldUseAi = useAi ?? config.useAi;

  if (!jdPath) throw new Error('A job description path is required (--jd <path>).');
  if (!(await pathExists(jdPath))) throw new Error(`Job description not found: ${jdPath}`);
  if (!(await pathExists(resolvedResumesDir))) {
    throw new Error(`Resumes directory not found: ${resolvedResumesDir}`);
  }

  await ensureDir(resolvedOutputDir);

  if (!silent) printBanner();

  logger.step('Parsing job description...');
  const jobDescription = await parseJobDescription(jdPath);
  logger.success(`Job description parsed: "${jobDescription.title}"`);

  logger.step(`Parsing resumes in ${resolvedResumesDir}...`);
  const resumes = await parseResumeDirectory(resolvedResumesDir, {
    onFile: ({ file, ok, error }) => {
      if (!ok) logger.warn(`Skipped ${path.basename(file)}: ${error.message}`);
    },
  });
  logger.success(`Parsed ${resumes.length} resume(s).`);

  const provider = resolveProvider(config, shouldUseAi, 'Semantic scoring');
  if (provider) logger.info(`AI provider: ${provider.name} (${config.model})`);

  logger.step('Scoring candidates...');
  const scored = [];
  for (const resume of resumes) {
    const weighted = scoreWeighted(resume, jobDescription, config.scoring);

    let semantic = null;
    if (provider) {
      try {
        semantic = await scoreSemantic(resume, jobDescription, provider);
      } catch (error) {
        logger.warn(`Semantic scoring failed for ${resume.name}: ${error.message}`);
      }
    }

    scored.push(mergeScores(resume, weighted, semantic));
  }

  const ranked = rankCandidates(scored, config.scoring);
  const summary = summarize(ranked);

  await writeJsonFile(path.join(resolvedOutputDir, 'candidates.json'), ranked);
  const reportFiles = await writeReports(ranked, jobDescription, summary, resolvedOutputDir);

  if (!silent) {
    printRankingTable(ranked);
    printStats({
      'Candidates Parsed': summary.total,
      Shortlisted: summary.Shortlisted,
      Review: summary.Review,
      Rejected: summary.Rejected,
      'Average Match': `${summary.averageScore}%`,
    });
    logger.info(`Reports written to ${resolvedOutputDir}`);
  }

  return { ranked, summary, jobDescription, reportFiles };
}

function mergeScores(resume, weighted, semantic) {
  const overallScore = semantic
    ? Math.round((semantic.overallScore + weighted.overall) / 2)
    : weighted.overall;
  const skillMatchScore = semantic ? semantic.skillMatchScore : weighted.skills.score;
  const experienceMatchScore = semantic ? semantic.experienceMatchScore : weighted.experience.score;
  const missingSkills = semantic?.missingSkills?.length
    ? semantic.missingSkills
    : weighted.skills.missingSkills;

  return {
    id: resume.id,
    name: resume.name,
    email: resume.email,
    phone: resume.phone,
    sourceFile: resume.sourceFile,
    skills: resume.skills,
    projects: resume.projects,
    experience: resume.experience,
    overallScore,
    skillMatchScore,
    experienceMatchScore,
    keywordScore: weighted.keywords.score,
    missingSkills,
    strengths: semantic?.strengths || weighted.skills.matchedSkills,
    weaknesses: semantic?.weaknesses || [],
    recruiterSummary:
      semantic?.recruiterSummary ||
      `${resume.name} matches ${weighted.skills.score}% of required skills and ${weighted.experience.score}% of the experience bar (keyword-based scoring; AI provider not used).`,
    aiScored: Boolean(semantic),
  };
}
