const {releaseVersion, releaseChangelog} = require("nx/release")

async function run() {
  const {workspaceVersion, projectsVersionData} = await releaseVersion({})

  await releaseChangelog({
    version: workspaceVersion,
    versionData: projectsVersionData,
  })
}

run()
