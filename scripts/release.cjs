const {releaseVersion, releaseChangelog} = require("nx/release")
const {execSync} = require("node:child_process");

async function run() {
  const branchRaw = execSync('git rev-parse --abbrev-ref HEAD')
  const branch = branchRaw.toString().trim()

  if (branch !== 'main') {
    console.error('Not on main branch, aborting release')
    return
  }

  const {workspaceVersion, projectsVersionData} = await releaseVersion({})

  await releaseChangelog({
    version: workspaceVersion,
    versionData: projectsVersionData,
  })
}

run()
