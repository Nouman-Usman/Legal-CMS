'use client';

import React, { useState } from 'react';
import { ProtectedRoute } from '@/lib/components/protected-route';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Calendar, User, AlertCircle, Phone, Mail, Download, MessageSquare, Clock } from 'lucide-react';

interface CaseDetail {
  id: number;
  title: string;
  caseNumber: string;
  status: 'active' | 'closed' | 'pending' | 'on_hold';
  type: string;
  priority: string;
  filingDate: string;
  description: string;
  nextHearing?: string;
  expectedClosure?: string;
  lawyerName: string;
  lawyerEmail: string;
  documents: Array<{ name: string; date: string; size: string }>;
  updates: Array<{ title: string; date: string; content: string }>;
}

const mockCases: CaseDetail[] = [
  {
    id: 1,
    title: 'Smith vs. Johnson - Property Dispute',
    caseNumber: 'CASE-001',
    status: 'active',
    type: 'Civil Law',
    priority: 'High',
    filingDate: '2025-06-15',
    description: 'Property boundary dispute between two adjacent properties. The case involves surveying records and historical ownership documentation.',
    nextHearing: '2026-02-15',
    expectedClosure: '2026-06-30',
    lawyerName: 'David Martinez',
    lawyerEmail: 'david.martinez@apnawaqeel.com',
    documents: [
      { name: 'Property Deed.pdf', date: '2025-06-15', size: '2.4 MB' },
      { name: 'Survey Report.pdf', date: '2025-08-20', size: '1.8 MB' },
      { name: 'Court Filing.pdf', date: '2025-09-01', size: '512 KB' },
    ],
    updates: [
      { title: 'Court Hearing Scheduled', date: '2026-02-03', content: 'Next hearing has been scheduled for February 15, 2026 at 10:00 AM' },
      { title: 'Document Submission', date: '2026-01-20', content: 'All required documents have been submitted to the court' },
    ],
  },
  {
    id: 2,
    title: 'Chen Settlement Agreement',
    caseNumber: 'CASE-002',
    status: 'pending',
    type: 'Settlement',
    priority: 'Medium',
    filingDate: '2025-11-10',
    description: 'Settlement negotiations for business dispute. Currently in mediation phase.',
    nextHearing: '2026-02-20',
    lawyerName: 'Sarah Chen',
    lawyerEmail: 'sarah.chen@apnawaqeel.com',
    documents: [
      { name: 'Settlement Proposal.pdf', date: '2025-11-15', size: '892 KB' },
      { name: 'Financial Documents.pdf', date: '2025-12-01', size: '3.2 MB' },
    ],
    updates: [
      { title: 'Mediation Session Completed', date: '2026-01-15', content: 'First mediation session completed successfully' },
    ],
  },
];

export default function ClientCasesPage() {
  const [selectedCase, setSelectedCase] = useState<CaseDetail>(mockCases[0]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800';
      case 'closed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800';
      case 'pending':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800';
      case 'on_hold':
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700';
      default:
        return 'bg-slate-100 dark:bg-slate-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'text-red-600 dark:text-red-400';
      case 'Medium':
        return 'text-amber-600 dark:text-amber-400';
      case 'Low':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-slate-600 dark:text-slate-400';
    }
  };

  return (
    <ProtectedRoute requiredRole="client">
      <div className="p-8 bg-gradient-to-b from-slate-50 to-slate-50/50 dark:from-slate-950 dark:to-slate-950/50 min-h-screen">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white">My Cases</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">Detailed view and updates on your legal matters</p>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cases Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-8 space-y-3">
                <h3 className="font-semibold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm">
                    {mockCases.length}
                  </span>
                  Your Cases
                </h3>
                <div className="space-y-2">
                  {mockCases.map((caseItem) => (
                    <button
                      key={caseItem.id}
                      onClick={() => setSelectedCase(caseItem)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 border ${
                        selectedCase.id === caseItem.id
                          ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <p className="font-semibold text-sm text-slate-900 dark:text-white">{caseItem.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Case #{caseItem.caseNumber}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <Badge className={`text-xs ${getStatusColor(caseItem.status)}`}>
                          {caseItem.status.charAt(0).toUpperCase() + caseItem.status.slice(1)}
                        </Badge>
                        <span className={`text-xs font-semibold ${getPriorityColor(caseItem.priority)}`}>
                          {caseItem.priority}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Case Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Case Header */}
              <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-50/50 dark:from-slate-800 dark:to-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <CardTitle className="text-3xl text-slate-900 dark:text-white">{selectedCase.title}</CardTitle>
                      <CardDescription className="text-slate-600 dark:text-slate-400 mt-2">Case #{selectedCase.caseNumber}</CardDescription>
                    </div>
                    <Badge className={`px-4 py-2 text-xs font-bold whitespace-nowrap ${getStatusColor(selectedCase.status)}`}>
                      {selectedCase.status.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Type</p>
                      <p className="text-base font-semibold text-slate-900 dark:text-white">{selectedCase.type}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Priority</p>
                      <p className={`text-base font-semibold ${getPriorityColor(selectedCase.priority)}`}>{selectedCase.priority}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Filing Date</p>
                      <p className="text-base font-semibold text-slate-900 dark:text-white">
                        {new Date(selectedCase.filingDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Your Lawyer</p>
                      <p className="text-base font-semibold text-slate-900 dark:text-white">{selectedCase.lawyerName}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Lawyer Contact Card */}
              <Card className="border-slate-200 dark:border-slate-800 bg-gradient-to-br from-blue-50 to-blue-50/50 dark:from-blue-950/20 dark:to-blue-950/10 border-l-4 border-l-blue-500">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      Your Assigned Lawyer
                    </h3>
                    <div className="space-y-2 ml-6">
                      <p className="text-base font-semibold text-slate-900 dark:text-white">{selectedCase.lawyerName}</p>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        <a href={`mailto:${selectedCase.lawyerEmail}`} className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
                          {selectedCase.lawyerEmail}
                        </a>
                      </div>
                      <Button className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2" size="sm">
                        <MessageSquare className="w-4 h-4" />
                        Send Message
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tabs */}
              <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <TabsTrigger value="overview" className="text-xs font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800">Overview</TabsTrigger>
                  <TabsTrigger value="documents" className="text-xs font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800">Documents ({selectedCase.documents.length})</TabsTrigger>
                  <TabsTrigger value="updates" className="text-xs font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800">Updates ({selectedCase.updates.length})</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4">
                  <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <CardHeader>
                      <CardTitle className="text-slate-900 dark:text-white">Case Description</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{selectedCase.description}</p>

                      {selectedCase.nextHearing && (
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg">
                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide flex items-center gap-2 mb-2">
                            <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            Next Hearing
                          </p>
                          <p className="text-lg font-semibold text-slate-900 dark:text-white">
                            {new Date(selectedCase.nextHearing).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          </p>
                        </div>
                      )}

                      {selectedCase.expectedClosure && (
                        <div className="p-4 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide flex items-center gap-2 mb-2">
                            <Clock className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                            Expected Closure
                          </p>
                          <p className="text-lg font-semibold text-slate-900 dark:text-white">
                            {new Date(selectedCase.expectedClosure).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Documents Tab */}
                <TabsContent value="documents">
                  <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <CardHeader>
                      <CardTitle className="text-slate-900 dark:text-white">Case Documents</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedCase.documents.length === 0 ? (
                        <p className="text-slate-500 dark:text-slate-400 py-8 text-center">No documents available</p>
                      ) : (
                        <div className="space-y-2">
                          {selectedCase.documents.map((doc, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-3 p-4 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200 group"
                            >
                              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 group-hover:scale-110 transition-transform" />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-slate-900 dark:text-white truncate">{doc.name}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {new Date(doc.date).toLocaleDateString()} • {doc.size}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 flex-shrink-0"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Updates Tab */}
                <TabsContent value="updates">
                  <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <CardHeader>
                      <CardTitle className="text-slate-900 dark:text-white">Case Updates</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedCase.updates.length === 0 ? (
                        <p className="text-slate-500 dark:text-slate-400 py-8 text-center">No updates yet</p>
                      ) : (
                        <div className="space-y-4">
                          {selectedCase.updates.map((update, idx) => (
                            <div
                              key={idx}
                              className="p-4 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                            >
                              <div className="flex items-start gap-3 mb-2">
                                <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 mt-2 flex-shrink-0" />
                                <div className="flex-1">
                                  <p className="font-semibold text-slate-900 dark:text-white">{update.title}</p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    {new Date(update.date).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <p className="text-sm text-slate-700 dark:text-slate-300 ml-5">{update.content}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
