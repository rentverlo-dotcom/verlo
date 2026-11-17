export const QA_BRANCH = 'qa/verlo-e2e'

export function isQaEnvironment(): boolean {
  return process.env.VERCEL_GIT_COMMIT_REF === QA_BRANCH
}

export function externalOperationsAllowed(): boolean {
  return !isQaEnvironment()
}
