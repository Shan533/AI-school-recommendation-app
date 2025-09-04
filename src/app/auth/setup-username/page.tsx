// Server Component wrapper for setup username page
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

import SetupUsernameClient from './SetupUsernameClient'

export default function SetupUsernamePage() {
  return <SetupUsernameClient />
}