const gh = require('@actions/github');
const core = require('@actions/core');
const { execSync } = require('child_process');

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
        console.info("Check pull request number [" + `${pr.number}` + "]")
        console.info("  -", "title:", pr.title)
        console.info("  -", "url:", pr.html_url)
        try {
            let changes = await github.rest.repos.compareCommits({
                ...context.repo,
                base: pr.head.ref,
                head: pr.base.ref
            });


            // after merging main to PR the comparison becomes 'behind'
            // if (changes.data.status == 'behind') {
            //     console.info("  -", "comparison to main:", "no changes detected")
            //     console.info()
            //     continue
            // }

            // console.info("  -", "comparison to main:", "changes detected")

            // merge main to pull request
            let a = execSync('git log').toString()
            console.log(a)
            // comment on pull request
            // let commentMessage = updateResult.status == 202 ? "Merge success" : "Merge failed"
            // let commentResult = await github.rest.issues.createComment({
            //     ...context.repo,
            //     issue_number: pr.number,
            //     body: commentMessage
            // });
            // console.info("  - comment created", commentResult.status == 201 ? "successfully" : "unsuccessfully")
            // console.info()
        } catch (err) {
            core.error(err);
        }
    }
    // until here
}

run();