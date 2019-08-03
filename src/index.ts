import buildCreateDeployment from './create-deployment'

export const createDeployment = buildCreateDeployment(1)
export const createLegacyDeployment = buildCreateDeployment(2)
export * from './errors'
