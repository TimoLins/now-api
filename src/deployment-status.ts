import sleep from 'sleep-promise'
import ms from 'ms'
import { fetch, API_DEPLOYMENTS } from "./utils"
import { isDone, isReady, isFailed } from "./utils/ready-state"

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
  while (true) {
    if (!allBuildsCompleted) {
      const buildsData = await fetch(`${API_DEPLOYMENTS}/${deployment.id}/builds${teamId ? `?teamId=${teamId}` : ''}`, token)
      const { builds = [] } = await buildsData.json()

      for (const build of builds) {
        const prevState = buildsState[build.id]

        if (!prevState || prevState.readyState !== build.readyState) {
          yield { type: 'build-state-changed', payload: build }
        }

        if (build.readyState.includes('ERROR')) {
          return yield { type: 'error', payload: build }
        }

        buildsState[build.id] = build
      }

      const readyBuilds = builds.filter((b: DeploymentBuild) => isDone(b))

      if (readyBuilds.length === builds.length) {
        allBuildsCompleted = true
        yield { type: 'all-builds-completed', payload: readyBuilds }
      }
    } else {
      // Deployment polling
      const deploymentData = await fetch(`${API_DEPLOYMENTS}/${deployment.id}${teamId ? `?teamId=${teamId}` : ''}`, token)
      const deploymentUpdate = await deploymentData.json()

      if (isReady(deploymentUpdate)) {
        return yield { type: 'ready', payload: deploymentUpdate }
      }

      if (isFailed(deploymentUpdate)) {
        return yield { type: 'error', payload: deploymentUpdate }
      }
    }

    await sleep(ms('1.5s'))
  }
}
