import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()

    // Verify the user is authenticated
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll() {},
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const bucket = (formData.get('bucket') as string) || 'chamber-assets'
    const path = formData.get('path') as string

    if (!file || !path) {
      return NextResponse.json({ error: 'File and path are required' }, { status: 400 })
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File must be less than 5MB' }, { status: 400 })
    }

    // Use service role to bypass storage RLS
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Ensure bucket exists
    const { data: buckets } = await serviceSupabase.storage.listBuckets()
    const bucketExists = buckets?.some(b => b.name === bucket)

    if (!bucketExists) {
      const { error: createBucketError } = await serviceSupabase.storage.createBucket(bucket, {
        public: true,
        fileSizeLimit: 5 * 1024 * 1024,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml'],
      })
      if (createBucketError) {
        console.error('Error creating bucket:', createBucketError)
        return NextResponse.json({ error: 'Failed to create storage bucket' }, { status: 500 })
      }
    }

    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload the file
    const { error: uploadError, data: uploadData } = await serviceSupabase.storage
      .from(bucket)
      .upload(path, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: true,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    // Get public URL
    const { data: publicData } = serviceSupabase.storage
      .from(bucket)
      .getPublicUrl(path)

    return NextResponse.json({
      url: publicData?.publicUrl || null,
      path: uploadData?.path || path,
    })
  } catch (err: any) {
    console.error('Upload API error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
