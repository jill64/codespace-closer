import { octoflare } from 'octoflare'
import { Octokit } from 'octoflare/octokit'

export default octoflare<{
  GITHUB_UAT: string
}>(async ({ env, payload }) => {
  if (!('pull_request' in payload)) {
    return new Response('No PullRequest Event', {
      status: 200
    })
  }

  if (payload.action !== 'closed') {
    return new Response('No PR Closed Event', {
      status: 200
    })
  }

  const octokit = new Octokit({
    auth: env.GITHUB_UAT
  })

  const { repository, pull_request } = payload

  const isOrg = repository.owner.type === 'Organization'

  const {
    data: { codespaces }
  } = await (isOrg
    ? octokit.rest.codespaces.listInOrganization()
    : octokit.rest.codespaces.listForAuthenticatedUser())

  const matchList = codespaces.filter(
    (space) =>
      space.repository.full_name === repository.full_name &&
      space.git_status.ref === pull_request.head.ref
  )

  await Promise.all(
    matchList.map((space) =>
      octokit.rest.codespaces.deleteForAuthenticatedUser({
        codespace_name: space.name
      })
    )
  )

  return new Response(`${matchList.length} codespaces closed successful`, {
    status: 200
  })
})
