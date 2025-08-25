import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/supabase/helpers'

export default async function Home() {
  const user = await getCurrentUser()
  const isAdmin = user ? await import('@/lib/supabase/helpers').then(m => m.isAdmin(user.id)) : false
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">

      {/* Hero Section */}
      <div className="container mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Find Your Perfect
            <span className="text-blue-600 block">Academic Program</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Discover universities and programs worldwide with our AI-powered recommendation system. 
            Get personalized suggestions based on your interests and academic background.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/schools">Explore Schools</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/programs">Browse Programs</Link>
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 font-bold">🏫</span>
                </div>
                Comprehensive Database
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Browse through thousands of schools and programs from universities worldwide, 
                with detailed information about each institution.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 font-bold">⭐</span>
                </div>
                User Reviews & Ratings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Read authentic reviews from students and alumni. Share your own experiences 
                to help future students make informed decisions.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-purple-600 font-bold">🤖</span>
                </div>
                AI-Powered Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Get personalized program recommendations based on your preferences, 
                academic background, and career goals with our intelligent matching system.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-2xl font-bold text-center mb-8">Platform Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">1000+</div>
              <div className="text-gray-600">Universities</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">5000+</div>
              <div className="text-gray-600">Programs</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600 mb-2">50+</div>
              <div className="text-gray-600">Countries</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600 mb-2">24/7</div>
              <div className="text-gray-600">AI Support</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-16">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">
            <p className="text-gray-400">
              © 2024 AI School Recommend App. Built with Next.js and Supabase.
            </p>
            <div className="mt-4">
              {isAdmin && (
                <Button asChild variant="ghost" size="sm">
                  <Link href="/admin/dashboard">Admin</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}