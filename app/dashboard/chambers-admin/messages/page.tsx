'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ProtectedRoute } from '@/lib/components/protected-route';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    MessageSquare,
    Search,
    Shield,
    Zap,
    Eye,
    ArrowRight,
    Users,
    Lock,
    Calendar,
    Clock,
    ChevronRight,
    ArrowDown,
    Activity,
    BarChart2,
    TrendingUp,
    LayoutDashboard,
    Filter,
    MoreVertical,
    CheckCheck,
    AlertCircle,
    Info
} from 'lucide-react';
import { useAuth } from '@/lib/contexts/auth-context';
import { supabase } from '@/lib/supabase/client';
import {
    getChamberConversations,
    getChamberThreadMessages
} from '@/lib/supabase/messages';
import { subscribeToChannel } from '@/lib/realtime';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function ChamberAdminMessagesPage() {
    const { user } = useAuth();
    const [conversations, setConversations] = useState<any[]>([]);
    const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [threadReads, setThreadReads] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [showScrollButton, setShowScrollButton] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Initial Load
    const fetchConversations = async () => {
        if (!user) return;
        const { conversations: data, error } = await getChamberConversations(user.id);
        if (!error) {
            setConversations(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchConversations();
    }, [user]);

    // Thread List Realtime
    useEffect(() => {
        if (!user) return;
        const channel = supabase
            .channel('chamber_threads_updates_v2')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'message_threads' }, () => {
                fetchConversations();
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [user]);

    // Message & Seen Status Load
    useEffect(() => {
        if (!selectedThreadId) return;

        const loadMessages = async () => {
            const { messages: data, reads, error } = await getChamberThreadMessages(selectedThreadId);
            if (!error) {
                setMessages((data || []).reverse());
                setThreadReads(reads || []);
            }
        };

        loadMessages();

        const { unsubscribe } = subscribeToChannel(
            `thread-${selectedThreadId}-v2`,
            'message',
            (payload) => {
                setMessages((prev) => {
                    if (prev.some(m => m.id === payload.id)) return prev;
                    return [...prev, payload];
                });
            }
        );

        const readsChannel = supabase
            .channel(`reads-${selectedThreadId}-v2`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'thread_reads', filter: `thread_id=eq.${selectedThreadId}` },
                (payload) => {
                    const newData = payload.new as any;
                    setThreadReads(prev => {
                        const index = prev.findIndex(r => r.user_id === newData.user_id);
                        if (index >= 0) {
                            const updated = [...prev];
                            updated[index] = newData;
                            return updated;
                        }
                        return [...prev, newData];
                    });
                }
            )
            .subscribe();

        return () => {
            unsubscribe();
            supabase.removeChannel(readsChannel);
        };
    }, [selectedThreadId]);

    // Auto-scroll logic
    useEffect(() => {
        if (!showScrollButton) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const container = e.currentTarget;
        const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 150;
        setShowScrollButton(!isAtBottom);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const activeChat = useMemo(() => conversations.find(c => c.id === selectedThreadId), [conversations, selectedThreadId]);

    const insights = useMemo(() => {
        if (!messages.length || !activeChat?.lawyer) return null;

        let totalResponseTime = 0;
        let responseCount = 0;
        let lawyerMessages = 0;
        let clientMessages = 0;

        for (let i = 1; i < messages.length; i++) {
            const current = messages[i];
            const prev = messages[i - 1];

            if (current.sender_id === activeChat.lawyer.id) {
                lawyerMessages++;
                if (prev.sender_id !== activeChat.lawyer.id) {
                    const diff = new Date(current.created_at).getTime() - new Date(prev.created_at).getTime();
                    totalResponseTime += diff;
                    responseCount++;
                }
            } else {
                clientMessages++;
            }
        }

        const avgResponseMs = responseCount > 0 ? totalResponseTime / responseCount : 0;
        const avgResponseMinutes = Math.round(avgResponseMs / (1000 * 60));

        const responseScore = Math.max(0, 100 - (avgResponseMinutes / 14.4));
        const engagementScore = (lawyerMessages + clientMessages > 0) ? (lawyerMessages / (lawyerMessages + clientMessages)) * 100 : 0;
        const proficiency = Math.round((responseScore * 0.7) + (engagementScore * 0.3));

        return {
            proficiency,
            avgResponse: avgResponseMinutes > 60
                ? `${Math.floor(avgResponseMinutes / 60)}h ${avgResponseMinutes % 60}m`
                : `${avgResponseMinutes}m`,
            engagement: Math.round(engagementScore),
            volume: lawyerMessages
        };
    }, [messages, activeChat]);

    const filteredConversations = useMemo(() => {
        return conversations.filter(c => {
            const search = searchQuery.toLowerCase();
            return (
                c.client?.full_name?.toLowerCase().includes(search) ||
                c.lawyer?.full_name?.toLowerCase().includes(search) ||
                c.subject?.toLowerCase().includes(search)
            );
        });
    }, [conversations, searchQuery]);

    return (
        <ProtectedRoute requiredRole="chamber_admin">
            <div className="flex flex-col h-screen w-full bg-[#f8fafc] dark:bg-[#020617] overflow-hidden font-sans antialiased text-slate-900 dark:text-slate-100">

                {/* 1. Global Command Bar */}
                <header className="h-20 shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl px-8 flex items-center justify-between z-30">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black italic tracking-tighter uppercase leading-none">Oversight.<span className="text-blue-600 italic">HUB</span></h1>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Institutional Intelligence Terminal</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-8">
                        <div className="hidden md:flex items-center gap-6">
                            <div className="text-right">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Global Nodes</p>
                                <p className="text-xl font-black italic mt-0.5">{conversations.length}</p>
                            </div>
                            <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />
                            <div className="text-right">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">System Status</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <p className="text-xs font-black uppercase tracking-tighter text-emerald-600">Sync Active</p>
                                </div>
                            </div>
                        </div>
                        <Button variant="outline" className="h-10 px-4 rounded-xl border-slate-200 dark:border-slate-700 font-bold text-xs uppercase tracking-widest">
                            <LayoutDashboard className="w-4 h-4 mr-2" />
                            Console
                        </Button>
                    </div>
                </header>

                <main className="flex-1 flex overflow-hidden p-6 gap-6 min-h-0">

                    {/* 2. Intelligence Sidebar */}
                    <aside className="w-96 flex flex-col gap-4 shrink-0 overflow-hidden">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Find node / client / counsel..."
                                className="h-14 pl-12 pr-4 rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm focus:ring-blue-500/20 font-bold text-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                            {loading ? (
                                Array(6).fill(0).map((_, i) => (
                                    <div key={i} className="h-28 rounded-3xl bg-white/40 dark:bg-white/5 animate-pulse border border-slate-100 dark:border-slate-800" />
                                ))
                            ) : filteredConversations.map((conv) => {
                                const isSelected = selectedThreadId === conv.id;
                                return (
                                    <button
                                        key={conv.id}
                                        onClick={() => setSelectedThreadId(conv.id)}
                                        className={cn(
                                            "w-full text-left p-6 rounded-[2rem] transition-all relative overflow-hidden group",
                                            isSelected
                                                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl scale-[1.02] z-10"
                                                : "bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 hover:border-blue-500/50 hover:bg-white dark:hover:bg-slate-900"
                                        )}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <Badge variant="secondary" className={cn("text-[8px] font-black px-2 h-5 rounded-lg border-none uppercase tracking-widest", isSelected ? "bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900" : "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400")}>
                                                {conv.subject ? 'Case Thread' : 'Direct Stream'}
                                            </Badge>
                                            <span className="text-[10px] font-bold opacity-40 uppercase">{new Date(conv.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                                        </div>
                                        <h3 className="text-lg font-black tracking-tight leading-tight uppercase italic group-hover:text-blue-500 transition-colors">
                                            {conv.client?.full_name || 'Anonymous Client'}
                                        </h3>
                                        <div className="mt-2 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                                            <p className={cn("text-[10px] font-bold uppercase tracking-widest opacity-60", isSelected ? "text-slate-300 dark:text-slate-700" : "text-slate-400")}>
                                                Counsel: {conv.lawyer?.full_name?.split(' ')[0] || 'Unassigned'}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </aside>

                    {/* 3. Tactical Oversight Interface */}
                    <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl relative overflow-hidden min-w-0">
                        {selectedThreadId && activeChat ? (
                            <>
                                {/* Interface Header / Action Bar */}
                                <div className="h-24 px-10 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-900/20 backdrop-blur-md sticky top-0 z-20">
                                    <div className="flex items-center gap-5">
                                        <div className="flex -space-x-3">
                                            <div className="w-12 h-12 rounded-full ring-4 ring-white dark:ring-slate-900 bg-blue-100 dark:bg-blue-900 flex items-center justify-center font-black text-blue-600 dark:text-blue-400 shadow-md">
                                                {activeChat.client?.full_name?.[0]}
                                            </div>
                                            <div className="w-12 h-12 rounded-full ring-4 ring-white dark:ring-slate-900 bg-slate-900 dark:bg-white flex items-center justify-center font-black text-white dark:text-slate-900 shadow-md">
                                                {activeChat.lawyer?.full_name?.[0]}
                                            </div>
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black italic tracking-tighter uppercase">{activeChat.client?.full_name} <span className="mx-2 text-slate-300 font-light">/</span> {activeChat.lawyer?.full_name}</h2>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-none text-[8px] font-black px-2 h-4 italic uppercase tracking-widest">Security Link Operational</Badge>
                                                <div className="w-1 h-1 rounded-full bg-slate-300" />
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: {selectedThreadId.substring(0, 8)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {insights && (
                                        <div className="hidden xl:flex items-center gap-6 p-3 px-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                                            <div className="flex flex-col items-center">
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Proficiency</span>
                                                <div className="flex items-center gap-1.5 text-blue-600 font-black text-lg italic tracking-tighter">
                                                    <Activity className="w-3.5 h-3.5" />
                                                    {insights.proficiency}%
                                                </div>
                                            </div>
                                            <div className="w-px h-8 bg-slate-100 dark:bg-slate-700" />
                                            <div className="flex flex-col items-center">
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Response</span>
                                                <div className="flex items-center gap-1.5 font-black text-lg italic tracking-tighter">
                                                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                    {insights.avgResponse}
                                                </div>
                                            </div>
                                            <div className="w-px h-8 bg-slate-100 dark:bg-slate-700" />
                                            <div className="flex flex-col items-center">
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Engagement</span>
                                                <div className="flex items-center gap-1.5 text-emerald-600 font-black text-lg italic tracking-tighter">
                                                    <TrendingUp className="w-3.5 h-3.5" />
                                                    {insights.engagement}%
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Message Scroll Engine */}
                                <div className="relative flex-1 min-h-0">
                                    <div
                                        ref={scrollContainerRef}
                                        onScroll={handleScroll}
                                        className="absolute inset-0 overflow-y-auto custom-scrollbar p-10 space-y-8 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px]"
                                    >
                                        <div className="flex flex-col gap-8 pb-10">
                                            {messages.map((msg, i) => {
                                                const sender = activeChat.participants?.find((p: any) => p.id === msg.sender_id);
                                                const isLawyer = sender?.role === 'lawyer';

                                                const otherId = activeChat.participant_ids.find((id: string) => id !== msg.sender_id);
                                                const otherRead = threadReads.find(r => r.user_id === otherId);
                                                const isSeen = otherRead && new Date(otherRead.last_read_at) >= new Date(msg.created_at);

                                                return (
                                                    <div key={msg.id} className={cn("flex flex-col group max-w-[85%]", isLawyer ? "ml-auto items-end text-right" : "items-start text-left")}>
                                                        <div className="flex items-center gap-2 mb-2 px-2">
                                                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 italic">
                                                                {sender?.full_name} <span className="mx-1 text-slate-200">|</span> {sender?.role}
                                                            </span>
                                                        </div>

                                                        <div className={cn(
                                                            "p-6 px-8 rounded-[2.5rem] shadow-sm relative group-hover:shadow-xl transition-all duration-300",
                                                            isLawyer
                                                                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-tr-none"
                                                                : "bg-white dark:bg-slate-800 text-slate-900 white dark:text-white border border-slate-100 dark:border-slate-700 rounded-tl-none"
                                                        )}>
                                                            <p className="font-medium leading-relaxed italic text-sm md:text-base">{msg.content}</p>
                                                        </div>

                                                        <div className="flex items-center gap-3 mt-2 px-2">
                                                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                            {isSeen && (
                                                                <div className="flex items-center gap-1 text-blue-500">
                                                                    <CheckCheck className="w-3 h-3" />
                                                                    <span className="text-[8px] font-black uppercase tracking-widest italic leading-none">Seen by {activeChat.participants?.find((p: any) => p.id === otherId)?.full_name.split(' ')[0]}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            <div ref={messagesEndRef} />
                                        </div>
                                    </div>

                                    {/* Jump-to-Bottom Command */}
                                    {showScrollButton && (
                                        <button
                                            onClick={scrollToBottom}
                                            className="absolute bottom-8 right-8 z-50 w-12 h-12 rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-600/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-all animate-in fade-in zoom-in duration-300"
                                        >
                                            <ArrowDown className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>

                                {/* Oversite Security Deck */}
                                <footer className="h-16 px-10 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-6 shrink-0 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-md">
                                    <div className="flex items-center gap-3">
                                        <Shield className="w-4 h-4 text-blue-600" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic">Institutional Oversight Engine 2.1.0-Tactical</span>
                                    </div>
                                    <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-2" />
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic leading-none">Compliance monitoring fully initialized.</p>
                                    </div>
                                </footer>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-12">
                                <div className="relative">
                                    <div className="w-48 h-48 rounded-[4rem] bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center relative overflow-hidden group">
                                        <Lock className="w-16 h-16 text-slate-200 dark:text-slate-700 transition-transform group-hover:scale-110 duration-500" />
                                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
                                    </div>
                                </div>
                                <div className="space-y-4 max-w-sm">
                                    <h3 className="text-4xl font-black italic tracking-tighter uppercase leading-tight">Encryption <span className="text-blue-600 italic">Barrier</span></h3>
                                    <p className="text-slate-400 font-medium italic text-sm leading-relaxed px-6">Select a communication node from the stream to establish global oversight and tactical intelligence analysis.</p>
                                </div>
                                <Button className="h-14 px-10 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase tracking-widest text-xs hover:bg-blue-600 dark:hover:bg-blue-500 dark:hover:text-white transition-all shadow-xl shadow-slate-900/20 dark:shadow-white/5">
                                    Establish Link
                                </Button>
                            </div>
                        )}
                    </div>

                </main>

                <style jsx global>{`
                    .custom-scrollbar::-webkit-scrollbar {
                        width: 10px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: rgba(148, 163, 184, 0.1);
                        border-radius: 20px;
                        border: 3px solid transparent;
                        background-clip: padding-box;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: rgba(148, 163, 184, 0.3);
                        background-clip: padding-box;
                    }
                    .dark .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: rgba(255, 255, 255, 0.05);
                    }
                    .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: rgba(255, 255, 255, 0.1);
                    }
                `}</style>
            </div>
        </ProtectedRoute>
    );
}
