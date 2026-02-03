import { NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/dashboard'

    if (code) {
        const cookieStore = await cookies()

        // We'll collect cookies here because we can't write to cookieStore directly (it's readonly)
        // and we can't create the response yet because we don't know if we'll redirect to success or error.
        const cookiesToSet: { name: string, value: string, options: any }[] = []

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSetArgs) {
                        // Capture cookies to be set later
                        cookiesToSetArgs.forEach((arg) => {
                            cookiesToSet.push(arg)
                        })
                    },
                },
            }
        )

        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
            const isLocalEnv = process.env.NODE_ENV === 'development'

            let response: NextResponse;

            if (isLocalEnv) {
                // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
                response = NextResponse.redirect(`${origin}${next}`)
            } else if (forwardedHost) {
                response = NextResponse.redirect(`https://${forwardedHost}${next}`)
            } else {
                response = NextResponse.redirect(`${origin}${next}`)
            }

            // Apply captured cookies to the response (CRITICAL)
            cookiesToSet.forEach(({ name, value, options }) =>
                response.cookies.set(name, value, options)
            )

            return response
        } else {
            console.error('Auth Callback Error:', {
                message: error.message,
                name: error.name,
                status: error.status
            });
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
