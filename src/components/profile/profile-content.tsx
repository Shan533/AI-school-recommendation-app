'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StarRating } from '@/components/ui/star-rating'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import Link from 'next/link'
import ProfileActions from '@/components/profile/profile-actions'
import ChangeUsernameForm from '@/components/profile/change-username-form'
import UpdateEmailForm from '@/components/auth/update-email-form'
import { User } from '@supabase/supabase-js'

// Define proper types for the component props
interface Profile {
  id: string
  name: string | null
  is_admin: boolean | null
  created_at: string
  updated_at: string
}

interface ReviewStats {
  totalReviews: number
  totalSchoolReviews: number
  totalProgramReviews: number
  averageRating: number
}

interface ProfileContentProps {
  profile: Profile | null
  user: User
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schoolReviews: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  programReviews: any[]
  stats: ReviewStats
}

export default function ProfileContent({ profile, user, schoolReviews, programReviews, stats }: ProfileContentProps) {
  const [currentUsername, setCurrentUsername] = useState(profile?.name || 'User')

  const handleUsernameChange = (newUsername: string) => {
    setCurrentUsername(newUsername)
    // Optionally refresh the page to show updated data
    window.location.reload()
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Profile</h1>
        <Button asChild variant="outline">
          <Link href="/">Back to Home</Link>
        </Button>
      </div>

      {/* Profile Header */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-2xl">
                {profile?.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="mb-2">
                <ChangeUsernameForm 
                  currentUsername={currentUsername} 
                  onUsernameChange={handleUsernameChange}
                />
              </div>
              <ProfileActions userEmail={user.email || ''} />
              {profile?.is_admin && (
                <Badge className="mt-2">Administrator</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalReviews}</div>
              <div className="text-sm text-gray-600">Total Reviews</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.totalSchoolReviews}</div>
              <div className="text-sm text-gray-600">School Reviews</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.totalProgramReviews}</div>
              <div className="text-sm text-gray-600">Program Reviews</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '—'}
              </div>
              <div className="text-sm text-gray-600">Average Rating</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Email Section */}
      <Card className="mb-8" id="email-update-section">
        <CardHeader>
          <CardTitle>Email Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <UpdateEmailForm currentEmail={user.email || ''} />
        </CardContent>
      </Card>

      {/* Reviews Section */}
      <div className="space-y-8">
        {/* School Reviews */}
        <Card>
          <CardHeader>
            <CardTitle>My School Reviews ({schoolReviews.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {schoolReviews.length > 0 ? (
              <div className="space-y-4">
                {schoolReviews.map((review) => (
                  <div key={review.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-lg">
                          <Link 
                            href={`/schools/${review.schools?.id}`}
                            className="hover:text-blue-600 transition-colors"
                          >
                            {review.schools?.name}
                            {review.schools?.initial && ` (${review.schools.initial})`}
                          </Link>
                        </h4>
                        <div className="flex items-center gap-3 mt-1">
                          <StarRating rating={review.rating} readonly size="sm" />
                          <span className="text-sm text-gray-500">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/schools/${review.schools?.id}`}>
                          Edit
                        </Link>
                      </Button>
                    </div>
                    <p className="text-gray-700">{review.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">You haven&apos;t reviewed any schools yet.</p>
                <Button asChild>
                  <Link href="/schools">Browse Schools</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Program Reviews */}
        <Card>
          <CardHeader>
            <CardTitle>My Program Reviews ({programReviews.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {programReviews.length > 0 ? (
              <div className="space-y-4">
                {programReviews.map((review) => (
                  <div key={review.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-lg">
                          <Link 
                            href={`/programs/${review.programs?.id}`}
                            className="hover:text-blue-600 transition-colors"
                          >
                            {review.programs?.name}
                            {review.programs?.initial && ` (${review.programs.initial})`}
                          </Link>
                        </h4>
                        <p className="text-sm text-gray-600">
                          at {review.programs?.schools?.name}
                          {review.programs?.schools?.initial && ` (${review.programs.schools.initial})`}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <StarRating rating={review.rating} readonly size="sm" />
                          <span className="text-sm text-gray-500">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/programs/${review.programs?.id}`}>
                          Edit
                        </Link>
                      </Button>
                    </div>
                    <p className="text-gray-700">{review.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">You haven&apos;t reviewed any programs yet.</p>
                <Button asChild>
                  <Link href="/programs">Browse Programs</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button asChild>
              <Link href="/schools">Browse Schools</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/programs">Browse Programs</Link>
            </Button>
            {profile?.is_admin && (
              <Button asChild variant="secondary">
                <Link href="/admin/dashboard">Admin Dashboard</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
