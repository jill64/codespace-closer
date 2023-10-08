import { octoflare } from 'octoflare'

export default octoflare(async ({ app, payload }) => {
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
    data: { id: installation_id }
  } = await app.octokit.rest.apps.getUserInstallation({
    username: pull_request.user.login
  })

  const octokit = await app.getInstallationOctokit(installation_id)

  const {
    data: { codespaces }
  } = await octokit.rest.codespaces.listForAuthenticatedUser()

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

  await octokit.rest.apps.revokeInstallationAccessToken()

  return new Response(null, {
    status: 204
  })
})
