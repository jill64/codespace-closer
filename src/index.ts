import { octoflare } from 'octoflare'
import { Octokit } from 'octoflare/octokit'

export default octoflare<{
  GITHUB_UAT: string
}>(async ({ env, payload }) => {
  if (!('ref_type' in payload && payload.ref_type === 'branch')) {
    return new Response('No Branch Deleted Event', {
      status: 200
    })
  }

  const octokit = new Octokit({
    auth: env.GITHUB_UAT
  })

  const { repository, ref } = payload

  const isOrg = repository.owner.type === 'Organization'

  const {
    data: { codespaces }
  } = await (isOrg
    ? octokit.rest.codespaces.listInOrganization({
        org: repository.owner.login
      })
    : octokit.rest.codespaces.listForAuthenticatedUser())

  const matchList = codespaces.filter(
    (space) =>
      space.repository.full_name === repository.full_name &&
      space.git_status.ref === ref
  )

  const result = matchList.map((space) =>
    octokit.rest.codespaces.deleteForAuthenticatedUser({
      codespace_name: space.name
    })
  )

  await Promise.all(result)

  return new Response(`${matchList.length} codespaces closed successful`, {
    status: 200
  })
})
