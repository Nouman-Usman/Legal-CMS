'use client';

import Script from 'next/script';
import { useEffect } from 'react';

export function PusherBeamsLoader() {
    return (
        <Script
            src="https://js.pusher.com/beams/2.1.0/push-notifications-cdn.js"
            strategy="lazyOnload"
            onLoad={() => {
                // @ts-ignore
                const PusherPushNotifications = window.PusherPushNotifications;

                if (PusherPushNotifications) {
                    const beamsClient = new PusherPushNotifications.Client({
                        instanceId: 'b1cbaf22-5db3-47aa-9889-a1f08e40ac43',
                    });

                    beamsClient.start()
                        .then(() => beamsClient.addDeviceInterest('hello'))
                        .then(() => console.log('Successfully registered and subscribed!'))
                        .catch(console.error);
                }
            }}
        />
    );
}
