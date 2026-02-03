import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    // Helper to determine dashboard path
    const getDashboardPath = (user: any) => {
        const role = user.user_metadata?.role;
        switch (role) {
            case 'chamber_admin':
                return '/dashboard/chambers-admin';
            case 'lawyer':
                return '/dashboard/lawyer';
            case 'client':
                return '/dashboard/client';
            default:
                // Fallback if no role or unknown role
                return '/dashboard';
        }
    };

    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    // Create a supabase client to check the session
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // This will refresh the session if needed
    const { data: { user } } = await supabase.auth.getUser()

    // PROTECTED ROUTES LOGIC
    // 1. Dashboard protection
    if (request.nextUrl.pathname.startsWith('/dashboard')) {
        if (!user) {
            const loginUrl = request.nextUrl.clone()
            loginUrl.pathname = '/auth/login'
            loginUrl.searchParams.set('next', request.nextUrl.pathname)
            return NextResponse.redirect(loginUrl)
        }
    }

    // 2. Auth pages - DON'T redirect if user just logged in and is being sent here by error
    // Only redirect to dashboard if coming directly to auth pages
    if (request.nextUrl.pathname.startsWith('/auth/')) {
        // Don't redirect if there's a 'next' parameter (prevents loops)
        const hasNext = request.nextUrl.searchParams.has('next')
        if (user && !hasNext) {
            const dashboardUrl = request.nextUrl.clone()
            dashboardUrl.pathname = getDashboardPath(user)
            return NextResponse.redirect(dashboardUrl)
        }
    }



    // 3. Root redirect
    if (request.nextUrl.pathname === '/') {
        if (user) {
            const dashboardUrl = request.nextUrl.clone()
            dashboardUrl.pathname = getDashboardPath(user)
            return NextResponse.redirect(dashboardUrl)
        }
    }

    // 4. Redirect /dashboard to specific dashboard
    // If user lands exactly on /dashboard, redirect them to their specific dashboard
    if (request.nextUrl.pathname === '/dashboard') {
        if (user) {
            const targetPath = getDashboardPath(user);
            if (targetPath !== '/dashboard') {
                const dashboardUrl = request.nextUrl.clone()
                dashboardUrl.pathname = targetPath
                return NextResponse.redirect(dashboardUrl)
            }
        }
    }

    return response
}
