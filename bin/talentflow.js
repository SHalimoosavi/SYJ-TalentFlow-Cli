#!/usr/bin/env node
import { runCli } from '../src/cli/index.js';

runCli(process.argv).catch((error) => {
  // Top-level safety net: no unhandled rejection should ever crash silently.
  console.error('\n✖ TalentFlow CLI encountered a fatal error:\n');
  console.error(error?.stack || error);
  process.exitCode = 1;
});
