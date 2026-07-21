import { Command } from 'commander';
import prompts from 'prompts';
import { readPackageVersion } from '../config/config.js';
import { parseResumes } from '../commands/parse.js';
import { screenCandidates } from '../commands/screen.js';
import { generateInterviews } from '../commands/interview.js';
import { generateReports } from '../commands/reports.js';
import { generateEmails } from '../commands/emails.js';
import { runConfigCommand } from '../commands/config.js';
import { runDoctor } from '../commands/doctor.js';
import { EMAIL_TYPES, TONES } from '../templates/emailTemplates.js';
import { printBanner } from './dashboard.js';
import { logger } from '../utils/logger.js';

export async function runCli(argv) {
  const program = new Command();

  program
    .name('talentflow')
    .description('AI-powered recruitment automation toolkit for the command line.')
    .version(readPackageVersion(), '-v, --version');

  program
    .command('parse')
    .description('Parse resumes in a folder into normalized JSON')
    .option('--resumes <dir>', 'Folder containing resumes')
    .option('--output <dir>', 'Output directory')
    .action(async (opts) => {
      await parseResumes({ resumesDir: opts.resumes, outputDir: opts.output });
    });

  program
    .command('screen')
    .description('Parse, score, and rank candidates against a job description')
    .requiredOption('--jd <path>', 'Path to the job description file')
    .option('--resumes <dir>', 'Folder containing resumes')
    .option('--output <dir>', 'Output directory')
    .option('--no-ai', 'Disable AI semantic scoring (keyword/weighted scoring only)')
    .action(async (opts) => {
      await screenCandidates({
        jdPath: opts.jd,
        resumesDir: opts.resumes,
        outputDir: opts.output,
        useAi: opts.ai,
      });
    });

  program
    .command('interview')
    .description('Generate interview kits for shortlisted candidates')
    .requiredOption('--jd <path>', 'Path to the job description file')
    .option('--candidates <path>', 'Path to a candidates.json file')
    .option('--output <dir>', 'Output directory')
    .option('--no-ai', 'Disable AI question generation (uses fallback question bank)')
    .action(async (opts) => {
      await generateInterviews({
        jdPath: opts.jd,
        candidatesPath: opts.candidates,
        outputDir: opts.output,
        useAi: opts.ai,
      });
    });

  program
    .command('reports')
    .description('Regenerate Markdown/JSON/CSV reports from screened candidates')
    .requiredOption('--jd <path>', 'Path to the job description file')
    .option('--candidates <path>', 'Path to a candidates.json file')
    .option('--output <dir>', 'Output directory')
    .action(async (opts) => {
      await generateReports({ jdPath: opts.jd, candidatesPath: opts.candidates, outputDir: opts.output });
    });

  program
    .command('emails')
    .description('Generate recruiter emails for screened candidates')
    .option('--jd <path>', 'Path to the job description file (adds role context)')
    .option('--candidates <path>', 'Path to a candidates.json file')
    .option('--output <dir>', 'Output directory')
    .option('--type <type>', `Email type (${EMAIL_TYPES.join(', ')})`, 'interview-invitation')
    .option('--tone <tone>', `Tone (${TONES.join(', ')})`, 'formal')
    .option('--status <status>', 'Filter by status: Shortlisted, Review, or Rejected')
    .option('--company <name>', 'Company name to use in the email')
    .option('--no-ai', 'Disable AI email drafting (uses fallback templates)')
    .action(async (opts) => {
      await generateEmails({
        jdPath: opts.jd,
        candidatesPath: opts.candidates,
        outputDir: opts.output,
        type: opts.type,
        tone: opts.tone,
        status: opts.status,
        companyName: opts.company,
        useAi: opts.ai,
      });
    });

  program
    .command('config')
    .description('Show or initialize TalentFlow configuration (.env)')
    .option('--init', 'Interactively create/update your .env file')
    .action(async (opts) => {
      await runConfigCommand({ init: Boolean(opts.init) });
    });

  program
    .command('doctor')
    .description('Check your environment and configuration for common issues')
    .action(async () => {
      await runDoctor();
    });

  // No subcommand? Fall into interactive mode.
  const args = argv.slice(2);
  if (args.length === 0) {
    await runInteractiveMode();
    return;
  }

  await program.parseAsync(argv);
}

async function runInteractiveMode() {
  printBanner();
  logger.blank();

  const { action } = await prompts({
    type: 'select',
    name: 'action',
    message: 'What would you like to do?',
    choices: [
      { title: 'Screen candidates (parse + score + rank + report)', value: 'screen' },
      { title: 'Parse resumes only', value: 'parse' },
      { title: 'Generate interview kits', value: 'interview' },
      { title: 'Generate recruiter emails', value: 'emails' },
      { title: 'Regenerate reports', value: 'reports' },
      { title: 'View configuration', value: 'config' },
      { title: 'Run environment doctor', value: 'doctor' },
      { title: 'Exit', value: 'exit' },
    ],
  });

  if (!action || action === 'exit') {
    logger.dim('Goodbye!');
    return;
  }

  if (action === 'doctor') return runDoctor();
  if (action === 'config') return runConfigCommand();

  if (action === 'parse') {
    const answers = await prompts({
      type: 'text',
      name: 'resumesDir',
      message: 'Resumes folder',
      initial: 'resumes',
    });
    return parseResumes({ resumesDir: answers.resumesDir });
  }

  if (action === 'screen') {
    const answers = await prompts([
      { type: 'text', name: 'jdPath', message: 'Job description file path', initial: 'jobs/job.txt' },
      { type: 'text', name: 'resumesDir', message: 'Resumes folder', initial: 'resumes' },
      { type: 'confirm', name: 'useAi', message: 'Use AI semantic scoring?', initial: true },
    ]);
    if (!answers.jdPath) return;
    return screenCandidates({ jdPath: answers.jdPath, resumesDir: answers.resumesDir, useAi: answers.useAi });
  }

  if (action === 'interview') {
    const answers = await prompts({
      type: 'text',
      name: 'jdPath',
      message: 'Job description file path',
      initial: 'jobs/job.txt',
    });
    if (!answers.jdPath) return;
    return generateInterviews({ jdPath: answers.jdPath });
  }

  if (action === 'reports') {
    const answers = await prompts({
      type: 'text',
      name: 'jdPath',
      message: 'Job description file path',
      initial: 'jobs/job.txt',
    });
    if (!answers.jdPath) return;
    return generateReports({ jdPath: answers.jdPath });
  }

  if (action === 'emails') {
    const answers = await prompts([
      {
        type: 'select',
        name: 'type',
        message: 'Email type',
        choices: EMAIL_TYPES.map((t) => ({ title: t, value: t })),
      },
      { type: 'select', name: 'tone', message: 'Tone', choices: TONES.map((t) => ({ title: t, value: t })) },
      { type: 'text', name: 'company', message: 'Company name', initial: '' },
    ]);
    return generateEmails({ type: answers.type, tone: answers.tone, companyName: answers.company });
  }
}
