import { Command } from 'commander';
import chalk from 'chalk';
import { getGitDiff } from '../src/git.js'; // Import getGitDiff
import { analyzeDiff } from '../src/llm.js'; // Import analyzeDiff

const program = new Command();

program
  .name('prbuddy')
  .description('AI-powered GitHub PR reviewer CLI')
  .version('0.1.0');

program
  .command('analyse')
  .option('--base <branch>', 'Base branch to compare', 'main')
  .option('--head <branch>', 'Feature branch to analyze', 'HEAD')
  .option('--roast', 'Enable roast mode for fun feedback', false)
  .action(async (options) => {
    try {
      console.log(chalk.blue(`📥 Getting git diff between ${options.base} and ${options.head}...`));
      const diff = await getGitDiff(options.base, options.head);
      console.log(chalk.yellow('🤖 Sending diff to Groq...'));

      const review = await analyzeDiff(diff, options.roast);
      console.log(chalk.green('\n📝 PR Feedback:\n'));
      console.log(review);
    } catch (error) {
      console.error(chalk.red('❌ An error occurred:'), error.message);
    }
  });

program.parse();
