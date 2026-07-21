/**
 * TalentFlow CLI — public library entry point.
 *
 * Most users will interact with TalentFlow through the `talentflow` binary,
 * but every command is implemented as a plain, importable module so the
 * toolkit can also be embedded inside other Node.js programs or scripts.
 */
export { parseResumes } from './src/commands/parse.js';
export { screenCandidates } from './src/commands/screen.js';
export { generateInterviews } from './src/commands/interview.js';
export { generateReports } from './src/commands/reports.js';
export { generateEmails } from './src/commands/emails.js';
export { runDoctor } from './src/commands/doctor.js';
export { loadConfig } from './src/config/config.js';
export { createProvider } from './src/ai/providerFactory.js';
