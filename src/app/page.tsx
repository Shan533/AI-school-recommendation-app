import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/supabase/helpers'

export default async function Home() {
  const user = await getCurrentUser()
  const isAdmin = user
    ? await import('@/lib/supabase/helpers').then(m => m.isAdmin(user.id))
    : false
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100">

      {/* Hero */}
      <section className="container mx-auto px-6 py-[clamp(2rem,8vh,6rem)] text-center">
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
      </section>

      {/* Features */}
      <section className="container mx-auto px-6 mb-[clamp(2rem,6vh,4rem)] grid grid-cols-1 md:grid-cols-3 gap-[clamp(1rem,3vh,2rem)]">
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
      </section>

      {/* Quick Stats */}
      <section className="container mx-auto px-6 pb-[clamp(2rem,6vh,4rem)]">
        <div className="bg-white rounded-lg shadow-lg p-[clamp(1.5rem,3vh,2rem)]">
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
      </section>
    </div>
  )
}