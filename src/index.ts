import { octoflare } from 'octoflare'
import { Octokit } from 'octoflare/octokit'

export default octoflare<{
  JILL64_UAT: string
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
    auth: env.JILL64_UAT
  })

  const { repository, pull_request } = payload

  try {
    const {
      data: { codespaces }
    } = await octokit.rest.codespaces.listForAuthenticatedUser()

    console.log('codespaces', codespaces)

    const matchList = codespaces.filter(
      (space) =>
        space.repository.full_name === repository.full_name &&
        space.git_status.ref === pull_request.head.ref
    )

    console.log('matchList', matchList)

    await Promise.all(
      matchList.map((space) =>
        octokit.rest.codespaces.deleteForAuthenticatedUser({
          codespace_name: space.name
        })
      )
    )

    return new Response(null, {
      status: 204
    })
  } catch (error) {
    console.error(error)
    return new Response(
      error instanceof Error ? error?.message : String(error),
      {
        status: 500
      }
    )
  }
})
