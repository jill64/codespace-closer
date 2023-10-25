import { octoflare } from 'octoflare'
import { Octokit } from 'octoflare/octokit'

export default octoflare<{
  GITHUB_UAT: string
}>(async ({ env, payload }) => {
  if (!('ref_type' in payload && payload.ref_type === 'branch')) {
    return new Response('No branch deleted event.', {
      status: 200
    })
  }

  const octokit = new Octokit({
    auth: env.GITHUB_UAT
  })

  const { repository, ref } = payload

  const {
    data: { codespaces }
  } = await octokit.rest.codespaces.listForAuthenticatedUser()

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

  const message = `${matchList.length} codespaces closed successful.`

  return new Response(message, {
    status: 200
  })
})
