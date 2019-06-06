export const isReady = ({ readyState }: Deployment | DeploymentBuild): boolean => readyState === 'READY';
export const isFailed = ({ readyState }: Deployment | DeploymentBuild): boolean => readyState.endsWith('_ERROR') || readyState === 'ERROR';
export const isDone = (buildOrDeployment: Deployment | DeploymentBuild): boolean => isReady(buildOrDeployment) || isFailed(buildOrDeployment);