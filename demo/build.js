/* eslint-disable no-console */
const shell = require('shelljs');
const parseGitUrl = require('git-url-parse');

/** Config for github */
const defaultConfig = {
    gitUsername: 'GH Pages Bot',
    gitEmail: 'gh-bot@alfabank.ru',
    commitMessage: 'Deploy Storybook to GitHub Pages',
    gitRemote: 'origin',
    targetBranch: 'gh-pages'
};
/** dir for merged storybook file */
const ghMergeDir = 'storybook-demo';
/** Temporary dir for builded file */
let tempOutputDir;
/** Custom option for shell.exec */
const execOptions = {
    silent: true
};
/** Last commit hash from git */
const getLastCommitHash = shell.exec('git rev-parse HEAD', execOptions);
/** Current git branch */
const sourceBranch = shell.exec('git rev-parse --abbrev-ref HEAD', execOptions).stdout.trim();
/** Git remote url */
const gitUrl = shell.exec(
    `git config --get remote.${defaultConfig.gitRemote}.url`,
    execOptions
).stdout.trim();
const parsedGitUrl = parseGitUrl(gitUrl);

if (getLastCommitHash.stdout) {
    tempOutputDir = getLastCommitHash.stdout;
} else {
    throw new Error(
        `Exec code(${getLastCommitHash.code}) on executing: git rev-parse HEAD\n
        ${getLastCommitHash.stderr}`
    );
}

console.log('Publish storybook demo for github');
console.log('=> Build storybook');
shell.exec(`build-storybook -o ${tempOutputDir}`);

// Prepare temporary gh-pages dir
console.log('=> Prepare temporary dir');
shell.rm('-rf', `./${ghMergeDir}`);
shell.mkdir(ghMergeDir);

// Go to the temporary directory and create a *new* Git repo
shell.cd(ghMergeDir);
shell.exec('git init', execOptions);

// Inside this git repo we'll pretend to be a new user
shell.exec(`git config user.name ${defaultConfig.gitUsername}`, execOptions);
shell.exec(`git config user.email ${defaultConfig.gitEmail}`, execOptions);

// Disable GPG signing
shell.exec('git config commit.gpgsign false', execOptions);

// // Pull gh-page file
console.log('=> Pull storybook file');
shell.exec(`git pull -f -q ${gitUrl} ${defaultConfig.targetBranch}`, execOptions);

// Merge builded storybook
console.log('=> Merge builded storybook');
shell.cd('../');
if (sourceBranch === 'master') {
    shell.cp('-rf', `./${tempOutputDir}`, `./${ghMergeDir}/master`);
} else {
    shell.cp('-rf', `./${tempOutputDir}`, `./${ghMergeDir}`);
}
shell.cd(ghMergeDir);

// The first and only commit to this new Git repo contains all the
// files present with the commit message "Deploy to GitHub Pages".
console.log(`=> Commit changes with message: ${defaultConfig.commitMessage}`);
shell.exec('git add .', execOptions);
shell.exec(`git commit -m "${defaultConfig.commitMessage}"`, execOptions);

// Push changes to gh-pages
console.log(`=> Push changes to ${defaultConfig.targetBranch}`);
shell.exec(`git push -q -f ${gitUrl} master:${defaultConfig.targetBranch}`);

// Cleanup temporary file
shell.cd('..');
shell.rm('-rf', ghMergeDir);
shell.rm('-rf', tempOutputDir);
if (sourceBranch === 'master') {
    console.log(`=> Storybook deployed to: https://${parsedGitUrl.owner}.github.io/${parsedGitUrl.name}/master/`);
} else {
    console.log(`=> Storybook deployed to: https://${parsedGitUrl.owner}.github.io/${parsedGitUrl.name}/${tempOutputDir}/`);
}
