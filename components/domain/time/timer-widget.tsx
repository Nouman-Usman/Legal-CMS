'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Plus, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createTimeEntry } from '@/lib/supabase/time';
import { useAuth } from '@/lib/contexts/auth-context';
import { supabase } from '@/lib/supabase/client';

export function TimerWidget() {
    const { user } = useAuth();
    const [isRunning, setIsRunning] = useState(false);
    const [seconds, setSeconds] = useState(0);
    const [description, setDescription] = useState('');
    const [caseId, setCaseId] = useState<string>('');
    const [cases, setCases] = useState<any[]>([]);
    const [isMinimized, setIsMinimized] = useState(false);

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Load cases for selection
    useEffect(() => {
        if (!user?.chamber_id) return;

        const fetchCases = async () => {
            const { data } = await supabase
                .from('cases')
                .select('id, title, case_number')
                .eq('chamber_id', user.chamber_id)
                .eq('status', 'open')
                .order('updated_at', { ascending: false });

            if (data) setCases(data);
        };

        fetchCases();
    }, [user]);

    // Load timer state from localStorage
    useEffect(() => {
        const savedStart = localStorage.getItem('timer_start');
        const savedDesc = localStorage.getItem('timer_desc');
        const savedCase = localStorage.getItem('timer_case');

        if (savedStart) {
            const startTime = parseInt(savedStart);
            const now = Date.now();
            const elapsed = Math.floor((now - startTime) / 1000);
            setSeconds(elapsed);
            setIsRunning(true);
        }

        if (savedDesc) setDescription(savedDesc);
        if (savedCase) setCaseId(savedCase);
    }, []);

    // Timer tick
    useEffect(() => {
        if (isRunning) {
            timerRef.current = setInterval(() => {
                setSeconds((prev) => prev + 1);
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isRunning]);

    const toggleTimer = () => {
        if (!isRunning) {
            // Start
            const now = Date.now() - (seconds * 1000);
            localStorage.setItem('timer_start', now.toString());
            setIsRunning(true);
        } else {
            // Pause (logic could be more complex for true pause vs stop)
            // For simplicity, we just keep running or stop in this MVP
            // But pause would require tracking 'accumulated' vs 'current session'
            // Simplification: We assume Pause = Stop counting but don't reset
            localStorage.removeItem('timer_start'); // Remove persist on pause to avoid jump on resume
            setIsRunning(false);
        }
    };

    const handleSave = async () => {
        if (seconds < 60) return; // Minimum 1 minute
        if (!user) return;

        try {
            const minutes = Math.ceil(seconds / 60);

            await createTimeEntry({
                user_id: user.id,
                case_id: caseId || undefined,
                description: description || 'No description',
                minutes: minutes,
                billable: true,
                // rate: will be calc by trigger
            });

            // Reset
            setSeconds(0);
            setIsRunning(false);
            setDescription('');
            setCaseId('');
            localStorage.removeItem('timer_start');
            localStorage.removeItem('timer_desc');
            localStorage.removeItem('timer_case');
        } catch (err) {
            console.error('Failed to save time entry', err);
        }
    };

    const handleReset = () => {
        setSeconds(0);
        setIsRunning(false);
        localStorage.removeItem('timer_start');
    };

    // Format time HH:MM:SS
    const formatTime = (totalSeconds: number) => {
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // Persist inputs
    const handleDescChange = (val: string) => {
        setDescription(val);
        localStorage.setItem('timer_desc', val);
    };

    const handleCaseChange = (val: string) => {
        setCaseId(val);
        localStorage.setItem('timer_case', val);
    };

    if (!user) return null;

    return (
        <Card className={`fixed bottom-4 right-4 z-50 p-4 shadow-xl transition-all duration-300 w-80 bg-background border-primary/20 ${isMinimized ? 'w-auto' : ''}`}>
            {isMinimized ? (
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsMinimized(false)}>
                    <div className={`w-3 h-3 rounded-full ${isRunning ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`} />
                    <span className="font-mono font-bold">{formatTime(seconds)}</span>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b">
                        <h3 className="font-semibold text-sm">Time Tracker</h3>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setIsMinimized(true)}>-</Button>
                    </div>

                    <div className="text-center py-2">
                        <span className="font-mono text-4xl font-bold tracking-wider">{formatTime(seconds)}</span>
                    </div>

                    <div className="space-y-2">
                        <Input
                            placeholder="What are you working on?"
                            className="h-8 text-sm"
                            value={description}
                            onChange={(e) => handleDescChange(e.target.value)}
                        />

                        <select
                            className="w-full h-8 text-sm border rounded px-2 bg-background"
                            value={caseId}
                            onChange={(e) => handleCaseChange(e.target.value)}
                        >
                            <option value="">Select Case (Optional)</option>
                            {cases.map(c => (
                                <option key={c.id} value={c.id}>{c.case_number} - {c.title}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex justify-between gap-2 pt-2">
                        {isRunning ? (
                            <Button variant="outline" size="sm" className="flex-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 border-amber-500/50" onClick={toggleTimer}>
                                <Pause className="w-4 h-4 mr-2" /> Pause
                            </Button>
                        ) : (
                            <Button size="sm" className="flex-1" onClick={toggleTimer}>
                                <Play className="w-4 h-4 mr-2" /> Start
                            </Button>
                        )}

                        {seconds > 0 && !isRunning && (
                            <Button variant="default" size="sm" className="flex-1 bg-green-600 hover:bg-green-700" onClick={handleSave}>
                                <Save className="w-4 h-4 mr-2" /> Log
                            </Button>
                        )}

                        {seconds > 0 && !isRunning && (
                            <Button variant="destructive" size="icon" className="h-9 w-9" onClick={handleReset}>
                                <Square className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </Card>
    );
}
