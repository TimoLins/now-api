export const isReady = ({ readyState }: ZEITDeployment | DeploymentBuild): boolean => readyState === 'READY';
export const isFailed = ({ readyState }: ZEITDeployment | DeploymentBuild): boolean => readyState.endsWith('_ERROR') || readyState === 'ERROR';
export const isDone = (buildOrDeployment: ZEITDeployment | DeploymentBuild): boolean => isReady(buildOrDeployment) || isFailed(buildOrDeployment);