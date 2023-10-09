import { octoflare } from 'octoflare'

export default octoflare<{
  JILL64_UAT: string
}>(async ({ env, app, payload }) => {
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

  const { repository, pull_request } = payload

  const {
    data: { codespaces }
  } = await app.octokit.rest.codespaces.listForAuthenticatedUser({
    headers: {
      authorization: `token ${env.JILL64_UAT}`
    }
  })

  const matchList = codespaces.filter(
    (space) =>
      space.repository.full_name === repository.full_name &&
      space.git_status.ref === pull_request.head.ref
  )

  await Promise.all(
    matchList.map((space) =>
      app.octokit.rest.codespaces.deleteForAuthenticatedUser({
        codespace_name: space.name,
        headers: {
          authorization: `token ${env.JILL64_UAT}`
        }
      })
    )
  )

  return new Response(null, {
    status: 204
  })
})
