'use client';

import React, { useState } from 'react';
import { ProtectedRoute } from '@/lib/components/protected-route';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Calendar, AlertCircle, Plus, Filter, ListTodo, CheckSquare2, Clock, Trash2, Edit2 } from 'lucide-react';

interface Task {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
  caseId?: string;
  caseName?: string;
  assignedTo: string;
}

export default function LawyerTasksPage() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [view, setView] = useState<'list' | 'board'>('list');

  const tasks: Task[] = [
    {
      id: 1,
      title: 'Review document submission for Smith case',
      description: 'Review and approve the latest legal documents',
      status: 'in_progress',
      priority: 'high',
      dueDate: '2026-02-05',
      caseId: 'CASE-001',
      caseName: 'Smith vs. Johnson',
      assignedTo: 'You',
    },
    {
      id: 2,
      title: 'Prepare for client call',
      description: 'Gather all case information and prepare talking points',
      status: 'pending',
      priority: 'high',
      dueDate: '2026-02-04',
      caseId: 'CASE-002',
      caseName: 'Chen Settlement',
      assignedTo: 'You',
    },
    {
      id: 3,
      title: 'File motion with court',
      description: 'Submit the motion for continuance before deadline',
      status: 'pending',
      priority: 'high',
      dueDate: '2026-02-03',
      caseId: 'CASE-001',
      caseName: 'Smith vs. Johnson',
      assignedTo: 'You',
    },
    {
      id: 4,
      title: 'Schedule witness interview',
      description: 'Coordinate with witness and schedule interview session',
      status: 'pending',
      priority: 'medium',
      dueDate: '2026-02-10',
      caseId: 'CASE-003',
      caseName: 'Corporate Dispute',
      assignedTo: 'You',
    },
    {
      id: 5,
      title: 'Review opposing counsel brief',
      description: 'Analyze and respond to opposing counsel arguments',
      status: 'in_progress',
      priority: 'medium',
      dueDate: '2026-02-08',
      caseId: 'CASE-002',
      caseName: 'Chen Settlement',
      assignedTo: 'You',
    },
    {
      id: 6,
      title: 'Update case status in system',
      description: 'Record latest case developments and status updates',
      status: 'completed',
      priority: 'low',
      dueDate: '2026-02-02',
      caseId: 'CASE-001',
      caseName: 'Smith vs. Johnson',
      assignedTo: 'You',
    },
  ];

  const filteredTasks = filter === 'all' 
    ? tasks 
    : tasks.filter(task => task.status === filter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'in_progress':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
      case 'pending':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800';
      case 'medium':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800';
      case 'low':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800';
      default:
        return '';
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && dueDate;
  };

  const getTaskStats = () => ({
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    pending: tasks.filter(t => t.status === 'pending').length,
  });

  const stats = getTaskStats();

  return (
    <ProtectedRoute requiredRole="lawyer">
      <div className="p-8 bg-gradient-to-b from-slate-50 to-slate-50/50 dark:from-slate-950 dark:to-slate-950/50 min-h-screen">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Tasks</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2">Manage your daily tasks and deadlines</p>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Task
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Total Tasks</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">In Progress</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.inProgress}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Pending</p>
                  <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{stats.pending}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Completed</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.completed}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filter and View Toggle */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                onClick={() => setFilter('all')}
                className={filter === 'all' ? 'bg-blue-600 hover:bg-blue-700' : 'border-slate-300 dark:border-slate-700'}
              >
                All Tasks
              </Button>
              <Button
                variant={filter === 'pending' ? 'default' : 'outline'}
                onClick={() => setFilter('pending')}
                className={filter === 'pending' ? 'bg-blue-600 hover:bg-blue-700' : 'border-slate-300 dark:border-slate-700'}
              >
                Pending
              </Button>
              <Button
                variant={filter === 'in_progress' ? 'default' : 'outline'}
                onClick={() => setFilter('in_progress')}
                className={filter === 'in_progress' ? 'bg-blue-600 hover:bg-blue-700' : 'border-slate-300 dark:border-slate-700'}
              >
                In Progress
              </Button>
              <Button
                variant={filter === 'completed' ? 'default' : 'outline'}
                onClick={() => setFilter('completed')}
                className={filter === 'completed' ? 'bg-blue-600 hover:bg-blue-700' : 'border-slate-300 dark:border-slate-700'}
              >
                Completed
              </Button>
            </div>
          </div>

          {/* Tasks List */}
          <div className="space-y-3">
            {filteredTasks.length === 0 ? (
              <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <CardContent className="pt-12 pb-12 text-center">
                  <ListTodo className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-600 dark:text-slate-400 font-medium">No tasks found</p>
                </CardContent>
              </Card>
            ) : (
              filteredTasks.map((task) => (
                <Card 
                  key={task.id} 
                  className={`border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-md transition-shadow overflow-hidden ${
                    isOverdue(task.dueDate) && task.status !== 'completed' ? 'border-l-4 border-l-red-500' : ''
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Checkbox */}
                      <button className="mt-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                        {task.status === 'completed' ? (
                          <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                        ) : (
                          <Circle className="w-6 h-6" />
                        )}
                      </button>

                      {/* Task Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className={`font-semibold text-base ${
                            task.status === 'completed' 
                              ? 'text-slate-500 dark:text-slate-400 line-through' 
                              : 'text-slate-900 dark:text-white'
                          }`}>
                            {task.title}
                          </h3>
                          <div className="flex gap-2 flex-shrink-0">
                            <Badge variant="outline" className={`text-xs font-semibold ${getPriorityColor(task.priority)}`}>
                              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                            </Badge>
                            <Badge className={`text-xs font-semibold ${getStatusColor(task.status)}`}>
                              {task.status === 'in_progress' ? 'In Progress' : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                            </Badge>
                          </div>
                        </div>

                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{task.description}</p>

                        {/* Task Meta */}
                        <div className="flex items-center gap-4 flex-wrap">
                          {task.caseName && (
                            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                              <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-300 font-medium">
                                {task.caseName}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                            <Calendar className="w-4 h-4" />
                            <span className={isOverdue(task.dueDate) && task.status !== 'completed' ? 'text-red-600 dark:text-red-400 font-semibold' : ''}>
                              {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                            {isOverdue(task.dueDate) && task.status !== 'completed' && (
                              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 ml-1" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 flex-shrink-0 ml-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
