
import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function POST(req: NextRequest) {
    try {
        const { accessToken, events } = await req.json();

        if (!accessToken) {
            return NextResponse.json({ error: 'Access token required' }, { status: 400 });
        }

        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: accessToken });

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        const calendarId = 'primary'; // Use primary calendar

        const results = [];
        const errors = [];

        for (const event of events) {
            try {
                // Check if event already exists (by custom property)
                const existingEvents = await calendar.events.list({
                    calendarId,
                    timeMin: new Date(event.date).toISOString(),
                    timeMax: new Date(new Date(event.date).getTime() + 24 * 60 * 60 * 1000).toISOString(),
                    singleEvents: true,
                    privateExtendedProperty: [`apnaWaqeelEventId=${event.id}`]
                });

                if (existingEvents.data.items && existingEvents.data.items.length > 0) {
                    // Update existing event
                    const existingEvent = existingEvents.data.items[0];
                    await calendar.events.update({
                        calendarId,
                        eventId: existingEvent.id!,
                        requestBody: {
                            summary: event.title,
                            description: event.description,
                            start: { dateTime: new Date(event.date).toISOString() },
                            end: { dateTime: new Date(new Date(event.date).getTime() + 60 * 60 * 1000).toISOString() }, // Assume 1 hour default
                            extendedProperties: {
                                private: {
                                    apnaWaqeelEventId: event.id,
                                    type: event.type
                                }
                            }
                        }
                    });
                    results.push({ id: event.id, status: 'updated' });
                } else {
                    // Create new event
                    await calendar.events.insert({
                        calendarId,
                        requestBody: {
                            summary: event.title,
                            description: event.description,
                            start: { dateTime: new Date(event.date).toISOString() },
                            end: { dateTime: new Date(new Date(event.date).getTime() + 60 * 60 * 1000).toISOString() }, // Assume 1 hour default
                            extendedProperties: {
                                private: {
                                    apnaWaqeelEventId: event.id,
                                    type: event.type
                                }
                            }
                        }
                    });
                    results.push({ id: event.id, status: 'created' });
                }
            } catch (err: any) {
                console.error(`Error syncing event ${event.id}:`, err);
                errors.push({ id: event.id, error: err.message });
            }
        }

        return NextResponse.json({ success: true, results, errors });
    } catch (error: any) {
        console.error('Error in google calendar sync:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
