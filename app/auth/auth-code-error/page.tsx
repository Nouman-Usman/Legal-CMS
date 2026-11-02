import Link from 'next/link';
import { AuthHeading } from '@/components/auth/auth-ui';

export default function AuthCodeError() {
    return (
        <>
            <AuthHeading lines={['Link', 'expired.']} intro="We couldn't verify your authentication link. This can happen if:" />
            <ul className="l-auth__list">
                <li>The link has expired (links are valid for a short time only).</li>
                <li>The link has already been used.</li>
                <li>You opened an older link.</li>
            </ul>
            <p className="l-body">Sign in or reset your password again to get a new link.</p>
            <div className="l-auth__actions">
                <Link href="/auth/login" className="l-btn l-btn--outline">
                    Back to login
                </Link>
                <Link href="/auth/forgot-password" className="l-btn l-btn--primary">
                    Reset password
                </Link>
            </div>
        </>
    );
}
