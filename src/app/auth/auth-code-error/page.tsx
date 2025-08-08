import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center text-red-600">
            Authentication Error
          </CardTitle>
          <CardDescription className="text-center">
            There was an error signing you in. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
            <p>This could happen if:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>The authentication link has expired</li>
              <li>The link has already been used</li>
              <li>There was a network error</li>
            </ul>
          </div>
          <div className="flex gap-2">
            <Button asChild className="flex-1">
              <Link href="/login">Try Login Again</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="/register">Sign Up</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}