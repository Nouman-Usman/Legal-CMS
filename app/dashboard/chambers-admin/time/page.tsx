'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { createTimeEntry, getChamberTimeEntries, getTimeEntries, deleteTimeEntry } from '@/lib/supabase/time';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Calendar, Clock, DollarSign } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase/client';

export default function TimeTrackingPage() {
    const { user, userRole } = useAuth();
    const [entries, setEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [openNew, setOpenNew] = useState(false);
    const [cases, setCases] = useState<any[]>([]);

    // New entry form
    const [newEntry, setNewEntry] = useState({
        case_id: '',
        description: '',
        minutes: 60,
        billable: true,
    });

    const fetchEntries = async () => {
        if (!user) return;
        setLoading(true);

        let result;
        if (userRole === 'chamber_admin' && user.chamber_id) {
            result = await getChamberTimeEntries(user.chamber_id);
        } else {
            result = await getTimeEntries(user.id, user.chamber_id || '');
        }

        if (result.entries) {
            setEntries(result.entries);
        }
        setLoading(false);
    };

    const fetchCases = async () => {
        if (!user?.chamber_id) return;
        const { data } = await supabase
            .from('cases')
            .select('id, title, case_number')
            .eq('chamber_id', user.chamber_id)
            .eq('status', 'open');
        if (data) setCases(data);
    };

    useEffect(() => {
        fetchEntries();
        fetchCases();
    }, [user]);

    const handleSubmit = async () => {
        if (!user) return;
        await createTimeEntry({
            user_id: user.id,
            ...newEntry,
            rate: undefined // let trigger handle it
        });
        setOpenNew(false);
        fetchEntries();
        setNewEntry({ case_id: '', description: '', minutes: 60, billable: true });
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this time entry?')) {
            await deleteTimeEntry(id);
            fetchEntries();
        }
    };

    // Stats
    const totalHours = entries.reduce((acc, curr) => acc + curr.minutes, 0) / 60;
    const billableHours = entries.filter(e => e.billable).reduce((acc, curr) => acc + curr.minutes, 0) / 60;
    const totalValue = entries.reduce((acc, curr) => acc + ((curr.minutes / 60) * (curr.rate || 0)), 0);

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Time Tracking</h1>
                    <p className="text-muted-foreground">Manage billable hours and timesheets</p>
                </div>
                <Dialog open={openNew} onOpenChange={setOpenNew}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" /> Add Manual Entry
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Time Entry</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div>
                                <label className="text-sm font-medium">Case</label>
                                <select
                                    className="w-full border rounded p-2 bg-background"
                                    value={newEntry.case_id}
                                    onChange={e => setNewEntry({ ...newEntry, case_id: e.target.value })}
                                >
                                    <option value="">No Case (General)</option>
                                    {cases.map(c => (
                                        <option key={c.id} value={c.id}>{c.case_number} - {c.title}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Description</label>
                                <Textarea
                                    value={newEntry.description}
                                    onChange={e => setNewEntry({ ...newEntry, description: e.target.value })}
                                    placeholder="Reviewing documents..."
                                />
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="text-sm font-medium">Duration (Minutes)</label>
                                    <Input
                                        type="number"
                                        value={newEntry.minutes}
                                        onChange={e => setNewEntry({ ...newEntry, minutes: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="flex items-center pt-6">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={newEntry.billable}
                                            onChange={e => setNewEntry({ ...newEntry, billable: e.target.checked })}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-sm">Billable</span>
                                    </label>
                                </div>
                            </div>
                            <Button onClick={handleSubmit} className="w-full">Save Entry</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Hours Logged</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-blue-500" />
                            <span className="text-2xl font-bold">{totalHours.toFixed(1)} hrs</span>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Billable Hours</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-green-500" />
                            <span className="text-2xl font-bold">{billableHours.toFixed(1)} hrs</span>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Estimated Value</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-amber-500" />
                            <span className="text-2xl font-bold">
                                {new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' }).format(totalValue)}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Entries Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Time Entries</CardTitle>
                    <CardDescription>Recent activity across the chamber</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Case</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Duration</TableHead>
                                <TableHead>Rate</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {entries.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No time entries found</TableCell>
                                </TableRow>
                            ) : (
                                entries.map(entry => (
                                    <TableRow key={entry.id}>
                                        <TableCell>{new Date(entry.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{entry.user?.full_name || 'Me'}</span>
                                                <span className="text-xs text-muted-foreground">{entry.user?.email || ''}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {entry.case ? (
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{entry.case.title}</span>
                                                    <span className="text-xs text-muted-foreground">#{entry.case.case_number}</span>
                                                </div>
                                            ) : (
                                                <Badge variant="outline">General</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="max-w-xs truncate">{entry.description}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">
                                                {Math.floor(entry.minutes / 60)}h {entry.minutes % 60}m
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{entry.rate}/hr</TableCell>
                                        <TableCell className="font-medium">
                                            {new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' }).format((entry.minutes / 60) * entry.rate)}
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(entry.id)}>
                                                <Trash2 className="w-4 h-4 text-destructive" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
