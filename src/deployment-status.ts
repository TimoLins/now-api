import { fetch, API_DEPLOYMENTS } from "./utils"
import { isDone } from "./utils/ready-state"

interface DeploymentStatus {
  type: string;
  payload: Deployment | DeploymentBuild[];
}

/* eslint-disable */
export default async function* checkDeploymentStatus(deployment: Deployment, token: string, teamId?: string): AsyncIterableIterator<DeploymentStatus> {
  let deploymentState = deployment
  let allBuildsCompleted = false
  const buildsState: { [key: string]: DeploymentBuild } = {}

  // If the deployment is ready, we don't want any of this to run
  if (isDone(deploymentState)) {
    return
  }

  // Build polling
  while (!allBuildsCompleted) {
    const buildsData = await fetch(`${API_DEPLOYMENTS}/${deployment.id}/builds${teamId ? `?teamId=${teamId}` : ''}`, token)
    const { builds = [] } = await buildsData.json()

    for (const build of builds) {
      const prevState = buildsState[build.id]

      if (!prevState || prevState.readyState !== build.readyState) {
        yield { type: 'build-state-changed', payload: build }
      }

      buildsState[build.id] = build
    }

    const readyBuilds = builds.filter((b: DeploymentBuild) => isDone(b))

    if (readyBuilds.length === builds.length) {
      allBuildsCompleted = true
      yield { type: 'all-builds-completed', payload: readyBuilds }
    }
  }

  // Deployment polling
  const deploymentData = await fetch(`${API_DEPLOYMENTS}/${deployment.id}${teamId ? `?teamId=${teamId}` : ''}`, token)
  const deploymentUpdate = await deploymentData.json()

  // Fire deployment state change listeners if needed
  if (deploymentUpdate.readyState !== deploymentState.readyState) {
    if (isDone(deploymentUpdate)) {
      return yield { type: 'ready', payload: deploymentUpdate }
    }
  } else {
    deploymentState = deploymentUpdate

    yield { type: 'deployment-state-changed', payload: deploymentUpdate }
  }
}
