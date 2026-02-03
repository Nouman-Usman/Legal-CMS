# Session Management Configuration

## Overview
The application now includes robust session management to keep users logged in across browser sessions and devices.

## Features Implemented

### 1. Persistent Session Storage
- **Location**: `lib/supabase/client.ts`
- Sessions are stored in `localStorage` for persistence across browser restarts
- Sessions sync automatically across multiple browser tabs
- PKCE flow for enhanced security

### 2. Automatic Token Refresh
- **Location**: `lib/contexts/auth-context.tsx`
- Tokens are automatically refreshed every 5 minutes
- Proactive refresh when token expires in less than 10 minutes
- Prevents session interruptions during active use

### 3. Server-Side Session Validation
- **Location**: `middleware.ts` & `lib/supabase/middleware.ts`
- Every protected route validates session on the server
- Automatic redirect to login if session is invalid
- Prevents access to auth pages when already logged in

### 4. Session Utilities
- **Location**: `lib/supabase/session.ts`
- Debug utilities to check session status
- Manual session refresh capability
- Session information logging

## Supabase Dashboard Settings (Recommended)

To optimize session management, configure these settings in your Supabase Dashboard:

1. **Go to**: Authentication → Settings → JWT Expiry
   - **JWT Expiry**: `3600` seconds (1 hour)
   - **Refresh Token Rotation**: Enabled
   - **Reuse Interval**: `10` seconds

2. **Go to**: Authentication → Settings → Security
   - **Enable Email Confirmations**: Based on your preference
   - **Secure Email Change**: Enabled (recommended)
   - **Session Timeout**: Not applicable (handled by JWT expiry)

## How It Works

### Login Flow
1. User enters credentials
2. Supabase creates access token (expires in 1 hour) and refresh token (long-lived)
3. Tokens stored in `localStorage`
4. Hard navigation to `/dashboard` ensures cookies are set properly

### Session Persistence
1. Browser reads `localStorage` on page load
2. If valid token exists, user is auto-logged in
3. If token expired but refresh token valid, session is automatically renewed
4. Every 5 minutes, app checks if token needs refresh

### Token Refresh
1. Access tokens expire after 1 hour
2. App monitors expiry and refreshes proactively (10 min before expiry)
3. Refresh happens automatically without user interaction
4. If refresh fails (e.g., refresh token revoked), user is logged out

### Multi-Tab Sync
1. Session changes detected across tabs using `localStorage` events
2. Login in one tab = auto-login in all tabs
3. Logout in one tab = auto-logout in all tabs

## Testing Session Management

### Test 1: Browser Restart
1. Log in to the application
2. Close the browser completely
3. Open browser and navigate to the app
4. **Expected**: User remains logged in

### Test 2: Extended Session
1. Log in to the application
2. Leave browser idle for 2+ hours
3. Return and interact with the app
4. **Expected**: Session refreshes automatically, no re-login required

### Test 3: Multi-Tab Sync
1. Open app in Tab A, log in
2. Open app in Tab B (new tab)
3. **Expected**: Tab B shows logged-in state immediately
4. Log out in Tab A
5. **Expected**: Tab B logs out automatically

## Debugging Sessions

Use the browser console to check session status:

\`\`\`javascript
// Import the utility (in a development environment)
import { getSessionInfo } from '@/lib/supabase/session';

// Check current session
const info = await getSessionInfo();
console.log(info);
\`\`\`

Expected output:
\`\`\`json
{
  "status": "Active",
  "user": "user@example.com",
  "expiresAt": "2026-02-02 16:30:00",
  "expiresIn": "45 minutes",
  "accessToken": "✓ Present",
  "refreshToken": "✓ Present"
}
\`\`\`

## Session Lifetime

- **Access Token**: 1 hour (configurable in Supabase)
- **Refresh Token**: 30 days by default (configurable in Supabase)
- **Proactive Refresh**: Triggers 10 minutes before expiry
- **Check Interval**: Every 5 minutes

## Security Considerations

1. **PKCE Flow**: Protects against authorization code interception
2. **httpOnly Cookies**: Used in middleware for server-side auth (more secure than localStorage alone)
3. **Token Rotation**: Refresh tokens are rotated on each use
4. **Automatic Cleanup**: Expired sessions are automatically removed
5. **Cross-Tab Logout**: Prevents orphaned sessions

## Troubleshooting

### Issue: User logged out unexpectedly
**Possible Causes**:
- Refresh token expired (>30 days inactive)
- User changed password (invalidates all sessions)
- Admin revoked session in Supabase dashboard

**Solution**: User needs to log in again

### Issue: Session not persisting across restarts
**Possible Causes**:
- Browser in "Private/Incognito" mode
- Browser settings blocking localStorage
- Extensions blocking storage

**Solution**: Use normal browser mode, check browser settings

### Issue: Infinite redirect loop
**Possible Causes**:
- Middleware and client auth state out of sync
- Cookie issues between server/client

**Solution**: Clear browser cache and cookies, then log in again

## Future Enhancements

1. **Remember Me Option**: Extended refresh token lifetime for opted-in users
2. **Session History**: Log of all active sessions with device info
3. **Remote Logout**: Ability to revoke sessions from other devices
4. **2FA Integration**: Additional security layer
5. **Session Warnings**: Notify users before session expires
