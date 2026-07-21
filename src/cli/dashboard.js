import chalk from 'chalk';
import Table from 'cli-table3';
import { readPackageVersion } from '../config/config.js';

const LINE = '━'.repeat(44);

/** Prints the TalentFlow banner shown at the top of every command run. */
export function printBanner() {
  const version = readPackageVersion();
  console.log(chalk.hex('#818CF8')(LINE));
  console.log('');
  console.log(chalk.bold.hex('#F59E0B')(`  TalentFlow CLI `) + chalk.dim(`v${version}`));
  console.log(chalk.white('  AI Recruitment Automation Toolkit'));
  console.log('');
  console.log(chalk.hex('#818CF8')(LINE));
}

/** Renders a labelled stat block, e.g. the post-screen summary. */
export function printStats(stats) {
  console.log('');
  for (const [label, value] of Object.entries(stats)) {
    const paddedLabel = label.padEnd(22, ' ');
    console.log(`  ${chalk.dim(paddedLabel)}${chalk.bold.white(value)}`);
  }
  console.log('');
  console.log(chalk.hex('#818CF8')(LINE));
  console.log('');
}

export function statusBadge(status) {
  switch (status) {
    case 'Shortlisted':
      return chalk.bgGreen.black(' SHORTLISTED ');
    case 'Review':
      return chalk.bgYellow.black('   REVIEW    ');
    case 'Rejected':
      return chalk.bgRed.white('  REJECTED   ');
    default:
      return chalk.bgGray.white(` ${status.toUpperCase()} `);
  }
}

/** Renders a horizontal progress bar (used for scores 0-100). */
export function progressBar(value, width = 20) {
  const pct = Math.max(0, Math.min(100, value));
  const filled = Math.round((pct / 100) * width);
  const bar = '█'.repeat(filled) + '░'.repeat(width - filled);
  const color = pct >= 75 ? chalk.green : pct >= 50 ? chalk.yellow : chalk.red;
  return `${color(bar)} ${chalk.bold(`${pct}%`)}`;
}

/** Renders the ranked candidate table shown after `talentflow screen`. */
export function printRankingTable(rankedCandidates) {
  const table = new Table({
    head: [
      chalk.hex('#F59E0B')('Candidate'),
      chalk.hex('#F59E0B')('Score'),
      chalk.hex('#F59E0B')('Status'),
      chalk.hex('#F59E0B')('Missing Skills'),
    ],
    colWidths: [26, 26, 16, 34],
    wordWrap: true,
    style: { head: [], border: ['grey'] },
  });

  for (const candidate of rankedCandidates) {
    table.push([
      candidate.name,
      progressBar(candidate.overallScore),
      statusBadge(candidate.status),
      candidate.missingSkills?.slice(0, 4).join(', ') || chalk.dim('—'),
    ]);
  }

  console.log(table.toString());
}

export function printKeyValueTable(rows) {
  const table = new Table({ style: { border: ['grey'] } });
  for (const [key, value] of rows) {
    table.push({ [chalk.dim(key)]: value });
  }
  console.log(table.toString());
}
