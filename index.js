const gh = require('@actions/github');
const core = require('@actions/core');
const colors = require('colors')

async function run() {
    const token = process.env.GITHUB_TOKEN

    // mock script
    const github = gh.getOctokit(token)
    const context = {
        repo: {
            owner: 'amagyar-iohk',
            repo: 'auto-merge'
        }
    }

    // copy from below to paste in yml file
    const { data: pullRequests } = await github.rest.pulls.list({
        base: 'main',
        sort: 'updated',
        state: 'open',
        ...context.repo
    })
    const labeledPullRequests = pullRequests.filter(pr => pr.labels.filter(label => label.name == 'autoupdate').length > 0)

    for (let pr of labeledPullRequests) {
        console.info("Check pull request number [".blue + `${pr.number}`.yellow + "]".blue)
        console.info("  -", "title:".blue, pr.title)
        console.info("  -", "url:".blue, pr.html_url)
        try {
            let changes = await github.rest.repos.compareCommits({
                ...context.repo,
                base: pr.head.ref,
                head: pr.base.ref,
                // mediaType: {
                //     format: "diff"
                // }
            });


            // after merging main to PR the comparison becomes 'behind'
            if (changes.data.status == 'behind') {
                console.info("  -", "comparison to main:".blue, "no changes detected".green)
                console.info()
                continue
            }

            console.info("  -", "comparison to main:".blue, "changes detected".red)

            // merge main to pull request
            let updateResult = await github.rest.pulls.updateBranch({
                ...context.repo,
                expected_head_sha: pr.head.sha,
                pull_number: pr.number,
            });

            // comment on pull request
            let commentMessage = updateResult.status == 202 ? "Merge success" : "Merge failed"
            let commentResult = await github.rest.issues.createComment({
                ...context.repo,
                issue_number: pr.number,
                body: commentMessage
            });
            console.info("  - comment created", commentResult.status == 201 ? "successfully" : "unsuccessfully")
            console.info()
        } catch (err) {
            core.error(err);
        }
    }
    // until here
}

run();