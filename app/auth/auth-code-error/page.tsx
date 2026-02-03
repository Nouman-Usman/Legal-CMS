import Link from 'next/link'
import { Card, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function AuthCodeError() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-destructive">Authentication Error</CardTitle>
                    <CardDescription>
                        We detected an issue with your authentication code. This can happen if:
                        <ul className="list-disc pl-4 mt-2 mb-2">
                            <li>The link you clicked has expired (they are valid for a short time only).</li>
                            <li>The link has already been used.</li>
                            <li>You are using an old link.</li>
                        </ul>
                        Please try signing in or resetting your password again to generate a new link.
                    </CardDescription>
                </CardHeader>
                <CardFooter className="flex justify-between gap-4">
                    <Button variant="outline" asChild>
                        <Link href="/auth/login">Back to Login</Link>
                    </Button>
                    <Button asChild>
                        <Link href="/auth/forgot-password">Reset Password</Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
