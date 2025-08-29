import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

// PUT - Update a program review
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get request body
    const body = await request.json()
    const { rating, comment } = body
    
    // Validate input
    if (!rating || rating < 0.5 || rating > 5.0) {
      return NextResponse.json({ error: 'Invalid rating' }, { status: 400 })
    }
    
    // Check if the review belongs to the current user
    const { data: existingReview, error: checkError } = await supabase
      .from('program_reviews')
      .select('user_id')
      .eq('id', id)
      .single()
    
    if (checkError || !existingReview) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }
    
    if (existingReview.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // Update the review
    const { data, error } = await supabase
      .from('program_reviews')
      .update({
        rating,
        comment: comment || ''
      })
      .eq('id', id)
      .select()
    
    if (error) {
      console.error('Error updating program review:', error)
      return NextResponse.json({ 
        error: 'Failed to update review', 
        details: error.message,
        code: error.code 
      }, { status: 500 })
    }
    
    return NextResponse.json({ data: data[0] })
  } catch (error) {
    console.error('Error in PUT /api/reviews/program/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete a program review
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check if the review belongs to the current user
    const { data: existingReview, error: checkError } = await supabase
      .from('program_reviews')
      .select('user_id')
      .eq('id', id)
      .single()
    
    if (checkError || !existingReview) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }
    
    if (existingReview.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // Delete the review
    const { error } = await supabase
      .from('program_reviews')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting program review:', error)
      return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 })
    }
    
    return NextResponse.json({ message: 'Review deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/reviews/program/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
