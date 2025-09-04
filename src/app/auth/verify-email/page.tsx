// Server Component wrapper for verify email page
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

import VerifyEmailClient from './VerifyEmailClient'

export default function VerifyEmailPage() {
  return <VerifyEmailClient />
}