import chalk from 'chalk';

/**
 * A tiny, dependency-free-ish logger so every command prints in a
 * consistent voice. Kept deliberately simple — no transports, no log
 * levels config file, just clear CLI-friendly output.
 */
export const logger = {
  info(message) {
    console.log(chalk.cyan('ℹ'), message);
  },
  success(message) {
    console.log(chalk.green('✔'), message);
  },
  warn(message) {
    console.log(chalk.yellow('⚠'), message);
  },
  error(message) {
    console.error(chalk.red('✖'), message);
  },
  step(message) {
    console.log(chalk.magenta('→'), message);
  },
  title(message) {
    console.log('\n' + chalk.bold.whiteBright(message));
  },
  dim(message) {
    console.log(chalk.dim(message));
  },
  blank() {
    console.log('');
  },
};
