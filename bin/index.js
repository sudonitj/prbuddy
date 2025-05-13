import { Command } from "commander";
import chalk from "chalk";
import { getGitDiff } from "../src/git.js"; // Import getGitDiff
import { analyzeDiff } from "../src/llm.js"; // Import analyzeDiff

const program = new Command();

program
  .name("prbuddy")
  .description("AI-powered GitHub PR reviewer CLI")
  .version("0.1.0");

program
  .command("analyse")
  .option("--base <branch>", "Base branch to compare", "main")
  .option("--head <branch>", "Feature branch to analyze", "HEAD")
  .option("--roast", "Enable roast mode for fun feedback", false)
  .action(async (options) => {
    try {
      console.log(chalk.blue("Getting git diff..."));
      const diff = await getGitDiff(options.base, options.head);

      if (!diff || diff.trim().length === 0) {
        console.log(chalk.yellow("No differences found between branches."));
        return;
      }

      const diffSizeKB = Math.round(diff.length / 1024);
      console.log(chalk.blue(`Got diff (${diffSizeKB}KB). Analyzing...`));

      const analysis = await analyzeDiff(diff, options.roast);
      console.log("\n" + chalk.green("Analysis Result:"));
      console.log(analysis);
    } catch (error) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

program.parse();
