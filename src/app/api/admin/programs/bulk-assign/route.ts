import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/helpers'
import { BulkAssignmentData, BulkAssignmentResult } from '@/lib/types/schema-enhancements'

// POST /api/admin/programs/bulk-assign - Bulk assign categories and careers to programs
export async function POST(request: NextRequest) {
  try {
    const supabase = await createAdminClient()
    const body: BulkAssignmentData = await request.json()

    // Validate input
    if (!body.programIds || body.programIds.length === 0) {
      return NextResponse.json(
        { error: 'Program IDs are required' },
        { status: 400 }
      )
    }

    if (!body.categoryIds || body.categoryIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one category must be selected' },
        { status: 400 }
      )
    }

    const result: BulkAssignmentResult = {
      success: false,
      updatedCount: 0,
      errors: []
    }

    try {
      console.log('Bulk assignment request:', {
        programIds: body.programIds,
        categoryIds: body.categoryIds,
        careerPaths: body.careerPaths,
        primaryCategoryId: body.primaryCategoryId
      })
      
      // Start a transaction-like operation
      const { data: programs, error: programsError } = await supabase
        .from('programs')
        .select('id')
        .in('id', body.programIds)

      if (programsError) {
        throw new Error('Failed to validate programs')
      }

      if (!programs || programs.length !== body.programIds.length) {
        throw new Error('Some programs not found')
      }

      // Clear existing category mappings for selected programs
      const { error: deleteError } = await supabase
        .from('program_category_mapping')
        .delete()
        .in('program_id', body.programIds)

      if (deleteError) {
        throw new Error('Failed to clear existing category mappings')
      }

      // Insert new category mappings
      const categoryMappings = body.programIds.flatMap(programId =>
        body.categoryIds.map(categoryId => ({
          program_id: programId,
          category_id: categoryId,
          is_primary: categoryId === body.primaryCategoryId
        }))
      )

      const { error: mappingError } = await supabase
        .from('program_category_mapping')
        .insert(categoryMappings)

      if (mappingError) {
        throw new Error('Failed to create category mappings')
      }

      // Handle career paths if provided
      console.log('Processing career paths:', body.careerPaths)
      if (body.careerPaths && body.careerPaths.length > 0) {
        // Clear existing career mappings for selected programs
        const { error: deleteCareerError } = await supabase
          .from('program_career_mapping')
          .delete()
          .in('program_id', body.programIds)

        if (deleteCareerError) {
          throw new Error('Failed to clear existing career mappings')
        }

        // Get or create careers for the provided career paths
        const careerIds: string[] = []
        
        for (const careerPath of body.careerPaths) {
          // Check if career exists
          let { data: existingCareer } = await supabase
            .from('careers')
            .select('id')
            .eq('name', careerPath)
            .single()

          if (!existingCareer) {
            // Create new career
            const { data: newCareer, error: createError } = await supabase
              .from('careers')
              .insert([{
                name: careerPath,
                abbreviation: careerPath.substring(0, 10).toUpperCase(),
                description: `Custom career path: ${careerPath}`,
                career_type: 'Software' // Default type
              }])
              .select('id')
              .single()

            if (createError) {
              console.error('Failed to create career:', careerPath, createError)
              result.errors.push(`Failed to create career: ${careerPath}`)
              continue
            }

            existingCareer = newCareer
          }

          careerIds.push(existingCareer.id)
        }

        // Create career mappings
        if (careerIds.length > 0) {
          const careerMappings = body.programIds.flatMap(programId =>
            careerIds.map(careerId => ({
              program_id: programId,
              career_id: careerId,
              is_custom: true
            }))
          )

          const { error: careerMappingError } = await supabase
            .from('program_career_mapping')
            .insert(careerMappings)

          if (careerMappingError) {
            throw new Error('Failed to create career mappings')
          }
        }
      }

      // Update programs table with category_ids array (optional field)
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString()
      }
      
      // Only add category_ids if the field exists
      if (body.categoryIds && body.categoryIds.length > 0) {
        updateData.category_ids = body.categoryIds
      }
      
      if (body.primaryCategoryId) {
        updateData.primary_category_id = body.primaryCategoryId
      }

      console.log('Updating programs with data:', updateData)
      
      const { error: updateError } = await supabase
        .from('programs')
        .update(updateData)
        .in('id', body.programIds)

      if (updateError) {
        console.warn('Failed to update programs table with category_ids:', updateError)
        console.warn('This is likely because the category_ids field does not exist in the programs table')
        // Don't throw error here as the main operation (mappings) was successful
        result.errors.push(`Warning: Failed to update programs table: ${updateError.message}`)
      } else {
        console.log('Successfully updated programs table')
      }

      result.success = true
      result.updatedCount = body.programIds.length
      
      if (result.errors.length > 0) {
        result.message = `Successfully assigned categories to ${result.updatedCount} programs (with warnings)`
      } else {
        result.message = `Successfully assigned categories to ${result.updatedCount} programs`
      }

    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : 'Unknown error')
      console.error('Bulk assignment error:', error)
    }

    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json(
        { 
          success: false,
          message: result.errors.join(', '),
          errors: result.errors
        }, 
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Bulk assign API error:', error)
    return NextResponse.json(
      { 
        success: false,
        updatedCount: 0,
        errors: ['Internal server error'],
        message: 'Failed to process bulk assignment'
      },
      { status: 500 }
    )
  }
}
