import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getCurrentUser, isAdmin } from '@/lib/supabase/helpers'

// DELETE - Admin delete any review
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Check if user is admin
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userIsAdmin = await isAdmin(user.id)
    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }
    
    const supabaseAdmin = createAdminClient()
    
    // First, check if the review exists and determine which table it's in
    const [schoolReview, programReview] = await Promise.all([
      supabaseAdmin
        .from('school_reviews')
        .select('id')
        .eq('id', id)
        .single(),
      supabaseAdmin
        .from('program_reviews')
        .select('id')
        .eq('id', id)
        .single()
    ])
    
    let tableName: string
    if (schoolReview.data && !schoolReview.error) {
      tableName = 'school_reviews'
    } else if (programReview.data && !programReview.error) {
      tableName = 'program_reviews'
    } else {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }
    
    // Delete the review
    const { error } = await supabaseAdmin
      .from(tableName)
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting review:', error)
      return NextResponse.json({ 
        error: 'Failed to delete review', 
        details: error.message 
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      message: 'Review deleted successfully',
      reviewId: id,
      tableName 
    })
  } catch (error) {
    console.error('Error in DELETE /api/admin/reviews/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
