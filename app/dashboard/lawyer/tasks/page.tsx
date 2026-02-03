'use client';

import React, { useState } from 'react';
import { ProtectedRoute } from '@/lib/components/protected-route';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  CheckCircle2,
  Circle,
  Calendar,
  AlertCircle,
  Plus,
  Filter,
  ListTodo,
  Clock,
  Trash2,
  Edit2,
  Search,
  ChevronRight,
  MoreVertical,
  Flag,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Task {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
  caseId?: string;
  caseName?: string;
}

export default function LawyerTasksPage() {
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const tasks: Task[] = [
    {
      id: 1,
      title: 'Review document submission for Smith case',
      description: 'Review and approve the latest legal documents for the upcoming filing.',
      status: 'in_progress',
      priority: 'high',
      dueDate: '2026-02-05',
      caseId: 'CASE-001',
      caseName: 'Smith vs. Johnson',
    },
    {
      id: 2,
      title: 'Prepare for client call',
      description: 'Gather all case information and prepare talking points for the afternoon brief.',
      status: 'pending',
      priority: 'high',
      dueDate: '2026-02-04',
      caseId: 'CASE-002',
      caseName: 'Chen Settlement',
    },
    {
      id: 3,
      title: 'File motion with court',
      description: 'Submit the motion for continuance before the 5 PM deadline.',
      status: 'pending',
      priority: 'high',
      dueDate: '2026-02-03',
      caseId: 'CASE-001',
      caseName: 'Smith vs. Johnson',
    },
    {
      id: 4,
      title: 'Schedule witness interview',
      description: 'Coordinate with the expert witness and schedule a virtual prep session.',
      status: 'pending',
      priority: 'medium',
      dueDate: '2026-02-10',
      caseId: 'CASE-003',
      caseName: 'Corporate Dispute',
    },
    {
      id: 5,
      title: 'Review opposing counsel brief',
      description: 'Analyze and respond to opposing counsel arguments regarding jurisdiction.',
      status: 'in_progress',
      priority: 'medium',
      dueDate: '2026-02-08',
      caseId: 'CASE-002',
      caseName: 'Chen Settlement',
    },
    {
      id: 6,
      title: 'Update case status in system',
      description: 'Record latest case developments and status updates for the client portal.',
      status: 'completed',
      priority: 'low',
      dueDate: '2026-02-02',
      caseId: 'CASE-001',
      caseName: 'Smith vs. Johnson',
    },
  ];

  const filteredTasks = tasks.filter(t =>
    (activeFilter === 'all' || t.status === activeFilter) &&
    (t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.caseName?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getPriorityInfo = (priority: string) => {
    switch (priority) {
      case 'high': return { color: 'bg-rose-500', label: 'Urgent' };
      case 'medium': return { color: 'bg-amber-500', label: 'Medium' };
      case 'low': return { color: 'bg-blue-500', label: 'Normal' };
      default: return { color: 'bg-slate-500', label: 'Normal' };
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && dueDate;
  };

  return (
    <ProtectedRoute requiredRole="lawyer">
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 p-8 pb-12">
        <div className="max-w-6xl mx-auto space-y-10">

          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-1">
              <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white uppercase leading-none italic">
                Tactical <span className="text-blue-600">Workboard</span>
              </h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium uppercase tracking-widest text-[10px]">Execute with precision & speed</p>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl h-12 px-8 border-none shadow-xl shadow-blue-500/20 gap-2 uppercase tracking-tighter text-xs transition-all hover:scale-105">
              <Plus className="w-4 h-4" />
              Assign New Action
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

            {/* Left Column: Filter & Search */}
            <div className="lg:col-span-1 space-y-6">

              {/* Search Pane */}
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 pl-12 pr-4 rounded-2xl bg-white dark:bg-slate-900 border-none shadow-sm font-bold text-sm"
                />
              </div>

              {/* Filter List */}
              <Card className="border-none shadow-sm dark:bg-slate-900 rounded-[32px] overflow-hidden">
                <CardHeader className="pb-3 pt-6 px-6">
                  <CardTitle className="text-xs font-black uppercase text-slate-400 tracking-widest leading-none">Status Layers</CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-6 space-y-1">
                  {[
                    { id: 'all', label: 'All Operations', count: tasks.length },
                    { id: 'pending', label: 'Pending Queue', count: tasks.filter(t => t.status === 'pending').length },
                    { id: 'in_progress', label: 'In Progress', count: tasks.filter(t => t.status === 'in_progress').length },
                    { id: 'completed', label: 'Archived / Done', count: tasks.filter(t => t.status === 'completed').length },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setActiveFilter(f.id as any)}
                      className={cn(
                        "w-full px-4 py-3 rounded-xl transition-all font-black text-xs uppercase tracking-tighter flex items-center justify-between group",
                        activeFilter === f.id
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-500/10"
                          : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                      )}
                    >
                      <span>{f.label}</span>
                      <span className={cn(
                        "px-2 py-0.5 rounded-lg text-[10px]",
                        activeFilter === f.id ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                      )}>{f.count}</span>
                    </button>
                  ))}
                </CardContent>
              </Card>

              {/* Deadline Radar */}
              <div className="p-8 rounded-[32px] bg-slate-900 text-white space-y-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-10 rotate-12 group-hover:scale-110 transition-transform">
                  <Clock className="w-24 h-24" />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase italic tracking-tighter leading-none">Operation Clock</h3>
                  <p className="text-slate-400 text-xs font-medium mt-1 uppercase tracking-widest leading-none">Next 48 Hours</p>
                </div>
                <div className="space-y-4 relative z-10">
                  {tasks.filter(t => isOverdue(t.dueDate) && t.status !== 'completed').slice(0, 2).map(t => (
                    <div key={t.id} className="p-3 rounded-2xl bg-white/5 border border-white/10">
                      <p className="text-[10px] font-black uppercase text-rose-400 tracking-widest">Crucial Overdue</p>
                      <p className="text-xs font-bold truncate mt-1">{t.title}</p>
                    </div>
                  ))}
                  <Button variant="ghost" className="w-full justify-start p-0 text-blue-400 hover:text-blue-300 font-black text-[10px] uppercase tracking-widest bg-transparent border-none">
                    Check Full Radar <ArrowRight className="w-3 h-3 ml-2" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Main Content: Tasks Loop */}
            <div className="lg:col-span-3 space-y-6">

              <div className="flex items-center justify-between px-4">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Active Objectives: <span className="text-slate-900 dark:text-white">{filteredTasks.length}</span></p>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="rounded-xl font-bold gap-2 text-slate-500">
                    <Filter className="w-4 h-4" /> Views
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {filteredTasks.map((task) => {
                  const pInfo = getPriorityInfo(task.priority);
                  const isLate = isOverdue(task.dueDate) && task.status !== 'completed';

                  return (
                    <Card
                      key={task.id}
                      className={cn(
                        "border-none shadow-sm dark:bg-slate-900 rounded-[32px] overflow-hidden group hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300",
                        isLate ? "ring-2 ring-rose-500/20" : ""
                      )}
                    >
                      <CardContent className="p-8">
                        <div className="flex items-start gap-6">
                          {/* Left Action: Completion and Priority */}
                          <div className="flex flex-col items-center gap-2 pt-1.5 shrink-0">
                            <button className="w-8 h-8 rounded-full border-2 border-slate-200 dark:border-slate-800 flex items-center justify-center hover:border-blue-500 transition-all">
                              {task.status === 'completed' ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                              ) : (
                                <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-800 group-hover:bg-blue-500 transition-colors" />
                              )}
                            </button>
                            <div className={cn("w-1 flex-1 rounded-full", pInfo.color)} />
                          </div>

                          {/* Center: Info */}
                          <div className="flex-1 space-y-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="space-y-1">
                                <h3 className={cn(
                                  "text-lg font-black tracking-tight",
                                  task.status === 'completed' ? "text-slate-400 line-through" : "text-slate-900 dark:text-white"
                                )}>
                                  {task.title}
                                </h3>
                                <p className="text-sm font-medium text-slate-500 line-clamp-2">{task.description}</p>
                              </div>
                              <div className="flex flex-wrap gap-2 shrink-0">
                                <Badge className={cn("rounded-lg px-2 py-0 border-none font-black text-[9px] uppercase tracking-widest", pInfo.color)}>
                                  {pInfo.label}
                                </Badge>
                                {task.caseName && (
                                  <Badge variant="outline" className="rounded-lg px-2 py-0 border-slate-200 dark:border-slate-800 font-black text-[9px] uppercase tracking-widest text-slate-400">
                                    {task.caseName}
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-slate-100 dark:border-slate-800/50">
                              <div className="flex items-center gap-2">
                                <Calendar className={cn("w-3.5 h-3.5", isLate ? "text-rose-500" : "text-slate-400")} />
                                <span className={cn(
                                  "text-[10px] font-black uppercase tracking-widest",
                                  isLate ? "text-rose-600" : "text-slate-500"
                                )}>
                                  Deadline: {new Date(task.dueDate).toLocaleDateString()}
                                </span>
                              </div>
                              {isLate && (
                                <div className="flex items-center gap-1 text-rose-600">
                                  <AlertCircle className="w-3 h-3" />
                                  <span className="text-[10px] font-black uppercase tracking-widest">Overdue</span>
                                </div>
                              )}

                              <div className="flex items-center gap-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="sm" className="h-8 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-900 border-none">
                                  <Edit2 className="w-3.5 h-3.5 mr-2" /> Modify
                                </Button>
                                <button className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Productivity Stats Footer */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8">
                <div className="p-8 rounded-[32px] bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-6">
                  <div className="w-16 h-16 rounded-[24px] bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center">
                    <Flag className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Efficiency Rating</p>
                    <p className="text-4xl font-black italic">84%</p>
                  </div>
                </div>
                <div className="p-8 rounded-[32px] bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-6">
                  <div className="w-16 h-16 rounded-[24px] bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resolved Actions</p>
                    <p className="text-4xl font-black italic">1,240</p>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </ProtectedRoute>
  );
}
