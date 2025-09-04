// Server Component wrapper for reset password page
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

import ResetPasswordClient from '@/app/auth/reset-password/ResetPasswordClient'

export default function ResetPasswordPage() {
  return <ResetPasswordClient />
}