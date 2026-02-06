
'use client';

import Script from 'next/script';
import { useEffect } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';

export function PusherBeamsLoader() {
    const { user } = useAuth();

    useEffect(() => {
        // @ts-ignore
        const PusherPushNotifications = window.PusherPushNotifications;

        if (PusherPushNotifications && user) {
            const beamsClient = new PusherPushNotifications.Client({
                instanceId: 'b1cbaf22-5db3-47aa-9889-a1f08e40ac43',
            });

            beamsClient.start()
                .then(() => beamsClient.addDeviceInterest('hello'))
                .then(() => beamsClient.addDeviceInterest(`user-${user.id}`))
                .then(() => console.log('Successfully registered and subscribed to user interest!'))
                .catch((err: any) => console.warn('Pusher Beams registration failed (likely dev env):', err));
        }
    }, [user]);

    return (
        <Script
            src="https://js.pusher.com/beams/2.1.0/push-notifications-cdn.js"
            strategy="lazyOnload"
        />
    );
}
