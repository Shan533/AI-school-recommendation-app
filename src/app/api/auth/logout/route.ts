import { logoutAction } from '@/lib/auth-actions'

export async function POST() {
  await logoutAction()
}