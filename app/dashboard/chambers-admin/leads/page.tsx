'use client';

import React, { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/lib/components/protected-route';
import { useAuth } from '@/lib/contexts/auth-context';
import { getLeads, updateLeadStatus, deleteLead, type Lead } from '@/lib/supabase/leads';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Filter, Phone, Mail, MoreHorizontal, Loader2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CreateLeadDialog } from '@/components/domain/leads/create-lead-dialog';

export default function LeadsPage() {
    const { user } = useAuth();
    const [leads, setLeads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchLeads = async () => {
        if (!user?.chamber_id) return;
        setLoading(true);
        const { leads: data, error } = await getLeads(user.chamber_id);
        if (!error && data) {
            setLeads(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchLeads();
    }, [user]);

    const handleStatusUpdate = async (id: string, status: Lead['status']) => {
        // Optimistic update
        setLeads(leads.map(l => l.id === id ? { ...l, status } : l));
        await updateLeadStatus(id, status);
    };

    const statusColors = {
        new: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
        contacted: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
        consultation: 'bg-purple-100 text-purple-800 hover:bg-purple-100',
        converted: 'bg-green-100 text-green-800 hover:bg-green-100',
        lost: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
    };

    const filteredLeads = leads.filter(lead =>
        lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <ProtectedRoute requiredRole="chamber_admin">
            <div className="p-8 space-y-8">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Leads & Intake</h1>
                        <p className="text-muted-foreground">Manage potential clients and inquiries</p>
                    </div>
                    <CreateLeadDialog onSuccess={fetchLeads} />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Leads</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{leads.length}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">New Inquiries</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">
                                {leads.filter(l => l.status === 'new').length}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">In Pipeline</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">
                                {leads.filter(l => ['contacted', 'consultation'].includes(l.status)).length}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Converted</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {leads.filter(l => l.status === 'converted').length}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Action Bar */}
                <div className="flex gap-4 items-center">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search leads..."
                            className="pl-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button variant="outline">
                        <Filter className="w-4 h-4 mr-2" />
                        Filter
                    </Button>
                </div>

                {/* Table */}
                <Card>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Source</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        <div className="flex justify-center">
                                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredLeads.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        No leads found. Add one to get started.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredLeads.map((lead) => (
                                    <TableRow key={lead.id}>
                                        <TableCell className="font-medium">
                                            <div>{lead.name}</div>
                                            {lead.notes && (
                                                <div className="text-xs text-muted-foreground truncate max-w-[200px]">{lead.notes}</div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className={statusColors[lead.status as keyof typeof statusColors]}>
                                                {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1 text-sm">
                                                {lead.phone && (
                                                    <div className="flex items-center gap-1 text-muted-foreground">
                                                        <Phone className="w-3 h-3" /> {lead.phone}
                                                    </div>
                                                )}
                                                {lead.email && (
                                                    <div className="flex items-center gap-1 text-muted-foreground">
                                                        <Mail className="w-3 h-3" /> {lead.email}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>{lead.source || '-'}</TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {new Date(lead.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => handleStatusUpdate(lead.id, 'consultation')}>
                                                        Mark Consultation
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleStatusUpdate(lead.id, 'converted')}>
                                                        Convert to Client
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="text-destructive">
                                                        Delete Lead
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </Card>
            </div>
        </ProtectedRoute>
    );
}
