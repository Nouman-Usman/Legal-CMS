'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/contexts/auth-context';
import { supabase } from '@/lib/supabase/client';

interface EventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    event?: any;
    mode?: 'create' | 'edit';
}

export function EventModal({ isOpen, onClose, onSuccess, event, mode = 'create' }: EventModalProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [cases, setCases] = useState<any[]>([]);
    const [loadingCases, setLoadingCases] = useState(false);

    const [formData, setFormData] = useState({
        caseId: '',
        type: 'hearing',
        title: '',
        date: '',
        time: '09:00',
        location: '',
        description: '',
        priority: 'medium'
    });

    // Load cases for the chamber
    useEffect(() => {
        if (isOpen && user?.chamber_id) {
            loadCases();
        }
    }, [isOpen, user?.chamber_id]);

    // Populate form if editing
    useEffect(() => {
        if (event && mode === 'edit') {
            const eventDate = new Date(event.date);
            const dateStr = eventDate.toISOString().split('T')[0];
            const timeStr = eventDate.toISOString().split('T')[1].substring(0, 5);

            setFormData({
                caseId: event.caseId || '',
                type: event.type,
                title: event.title?.replace(`${event.type === 'hearing' ? 'Hearing' : 'Task'}: `, '') || '',
                date: dateStr,
                time: timeStr,
                location: event.type === 'hearing' ? event.description?.split(' - ')[0] || '' : '',
                description: event.description || '',
                priority: event.priority || 'medium'
            });
        } else {
            setFormData({
                caseId: '',
                type: 'hearing',
                title: '',
                date: new Date().toISOString().split('T')[0],
                time: '09:00',
                location: '',
                description: '',
                priority: 'medium'
            });
        }
        setError(null);
    }, [event, mode, isOpen]);

    const loadCases = async () => {
        if (!user?.chamber_id) return;
        setLoadingCases(true);
        try {
            const { data, error: err } = await supabase
                .from('cases')
                .select('id, title, case_number')
                .eq('chamber_id', user.chamber_id)
                .order('created_at', { ascending: false });

            if (err) throw err;
            setCases(data || []);
        } catch (err: any) {
            setError('Failed to load cases');
        } finally {
            setLoadingCases(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (!formData.caseId) {
                setError('Please select a case');
                setLoading(false);
                return;
            }

            if (!formData.title) {
                setError('Please enter an event title');
                setLoading(false);
                return;
            }

            if (!formData.date) {
                setError('Please select a date');
                setLoading(false);
                return;
            }

            const endpoint = mode === 'create' ? '/api/calendar/create' : '/api/calendar/update';
            const body: any = {
                ...formData,
                caseNumber: cases.find(c => c.id === formData.caseId)?.case_number
            };

            if (mode === 'edit' && event?.id) {
                body.id = event.id;
            }

            const response = await fetch(endpoint, {
                method: mode === 'create' ? 'POST' : 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save event');
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] dark:bg-slate-900 dark:border-slate-800">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black">
                        {mode === 'create' ? 'Schedule New Event' : 'Edit Event'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-lg">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                        </div>
                    )}

                    {/* Event Type */}
                    <div className="space-y-2">
                        <Label htmlFor="type" className="font-bold text-sm">Event Type</Label>
                        <select
                            id="type"
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        >
                            <option value="hearing">Court Hearing</option>
                            <option value="task">Case Task</option>
                        </select>
                    </div>

                    {/* Case Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="caseId" className="font-bold text-sm">Case</Label>
                        <select
                            id="caseId"
                            value={formData.caseId}
                            onChange={(e) => setFormData({ ...formData, caseId: e.target.value })}
                            disabled={loadingCases}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-50"
                        >
                            <option value="">Select a case...</option>
                            {cases.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.case_number} - {c.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Title */}
                    <div className="space-y-2">
                        <Label htmlFor="title" className="font-bold text-sm">
                            {formData.type === 'hearing' ? 'Hearing Title' : 'Task Title'}
                        </Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder={formData.type === 'hearing' ? 'e.g., Trial Hearing' : 'e.g., Submit evidence'}
                            className="dark:bg-slate-800 dark:border-slate-700"
                        />
                    </div>

                    {/* Date and Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="date" className="font-bold text-sm">Date</Label>
                            <Input
                                id="date"
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="dark:bg-slate-800 dark:border-slate-700"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="time" className="font-bold text-sm">Time</Label>
                            <Input
                                id="time"
                                type="time"
                                value={formData.time}
                                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                className="dark:bg-slate-800 dark:border-slate-700"
                            />
                        </div>
                    </div>

                    {/* Location (for hearings) */}
                    {formData.type === 'hearing' && (
                        <div className="space-y-2">
                            <Label htmlFor="location" className="font-bold text-sm">Court / Location</Label>
                            <Input
                                id="location"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                placeholder="e.g., High Court, Room 101"
                                className="dark:bg-slate-800 dark:border-slate-700"
                            />
                        </div>
                    )}

                    {/* Priority (for tasks) */}
                    {formData.type === 'task' && (
                        <div className="space-y-2">
                            <Label htmlFor="priority" className="font-bold text-sm">Priority</Label>
                            <select
                                id="priority"
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="critical">Critical</option>
                            </select>
                        </div>
                    )}

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description" className="font-bold text-sm">
                            {formData.type === 'hearing' ? 'Judge / Additional Info' : 'Description'}
                        </Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder={formData.type === 'hearing' ? 'e.g., Judge: John Smith' : 'Add details...'}
                            className="dark:bg-slate-800 dark:border-slate-700 resize-none"
                            rows={3}
                        />
                    </div>

                    <DialogFooter className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={loading}
                            className="dark:border-slate-700 dark:hover:bg-slate-800"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                mode === 'create' ? 'Schedule Event' : 'Update Event'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
