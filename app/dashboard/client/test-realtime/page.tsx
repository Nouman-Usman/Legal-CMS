'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function RealtimeTestPage() {
    const { user } = useAuth();
    const [status, setStatus] = useState<string>('Initializing');
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!user) return;

        // 1. Subscribe to 'notifications' table changes (INSERT only for this test)
        const channel = supabase
            .channel('realtime-test')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'notifications',
                    // Filter for current user to test RLS
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    console.log('Realtime Event Received:', payload);
                    setEvents((prev) => [payload, ...prev]);
                    toast.success('New Realtime Event Received!');
                }
            )
            .subscribe((status) => {
                console.log('Subscription status:', status);
                setStatus(status);
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const sendTestNotification = async () => {
        if (!user) return;
        setLoading(true);

        try {
            const { data, error } = await supabase
                .from('notifications')
                .insert({
                    user_id: user.id,
                    title: 'Test Notification',
                    message: `Realtime test at ${new Date().toLocaleTimeString()}`,
                    type: 'info',
                    data: { test: true }
                })
                .select()
                .single();

            if (error) throw error;
            console.log('Notification sent:', data);
        } catch (error: any) {
            console.error('Error sending notification:', error);
            toast.error('Failed to send notification: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const clearEvents = () => setEvents([]);

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Supabase Realtime Test</h1>
                <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${status === 'SUBSCRIBED' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                    <span className="text-sm font-medium uppercase">{status}</span>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Controls */}
                <Card>
                    <CardHeader>
                        <CardTitle>Controls</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Click the button below to insert a row into the <code>notifications</code> table.
                            If Realtime and RLS are working, it should appear in the events log immediately.
                        </p>
                        <div className="flex gap-2">
                            <Button onClick={sendTestNotification} disabled={loading || !user || status !== 'SUBSCRIBED'}>
                                {loading ? 'Sending...' : 'Trigger Test Event'}
                            </Button>
                            <Button variant="outline" onClick={clearEvents}>
                                Clear Log
                            </Button>
                        </div>
                        {!user && <p className="text-red-500 text-sm">Please sign in to test.</p>}
                    </CardContent>
                </Card>

                {/* Event Log */}
                <Card>
                    <CardHeader>
                        <CardTitle>
                            Live Events ({events.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[400px] overflow-auto rounded-md border p-4 bg-muted/50 font-mono text-xs">
                            {events.length === 0 ? (
                                <div className="text-center text-muted-foreground py-8">
                                    Waiting for events...
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {events.map((event, i) => (
                                        <div key={i} className="bg-background p-3 rounded border shadow-sm">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-bold text-blue-500">{event.eventType}</span>
                                                <span className="text-muted-foreground">{new Date().toLocaleTimeString()}</span>
                                            </div>
                                            <pre className="overflow-x-auto">
                                                {JSON.stringify(event.new || event.old, null, 2)}
                                            </pre>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
