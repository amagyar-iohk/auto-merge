const gh = require('@actions/github');
const core = require('@actions/core');

async function run() {
    const token =  process.env.GITHUB_TOKEN

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
        console.info("Updating pull request:", pr.name)
        
        try {
            let result = await github.rest.pulls.updateBranch({
                ...context.repo,
                expected_head_sha: pr.head.sha,
                pull_number: pr.number,
            });

            console.log(result)

            // if (result.status == 202) {
            //     await github.rest.issues.createComment({
            //         ...context.repo,
            //         issue_number: pr.number,
            //         body: 'Merge success'
            //     });
            // } else {
            //     await github.rest.issues.createComment({
            //         ...context.repo,
            //         issue_number: pr.number,
            //         body: 'Merge failed'
            //     });
            // }

        } catch (err) {
            core.info(err);
        }
    }
    // until here
}

run();