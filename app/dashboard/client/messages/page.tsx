'use client';

import React, { useState } from 'react';
import { ProtectedRoute } from '@/lib/components/protected-route';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquare,
  Search,
  Phone,
  Video,
  Info,
  Send,
  Clock,
  ShieldCheck,
  MoreVertical,
  Paperclip,
  ChevronRight,
  Sparkles,
  Lock,
  Circle
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ClientMessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');

  const conversations = [
    {
      id: 1,
      name: 'David Martinez',
      title: 'Lead Counsel',
      lastMessage: 'I will have an update for you by Friday...',
      timestamp: '2 hours ago',
      unread: 1,
      status: 'online',
      avatar: 'DM',
      caseTitle: 'Smith vs. Johnson',
    },
    {
      id: 2,
      name: 'Sarah Chen',
      title: 'Associate Attorney',
      lastMessage: 'All documents have been filed successfully',
      timestamp: '1 day ago',
      unread: 0,
      status: 'offline',
      avatar: 'SC',
      caseTitle: 'Chen Settlement',
    },
  ];

  const messages = [
    { id: 1, sender: 'David Martinez', role: 'Lead Counsel', content: 'Hi, I wanted to provide you an update on your case', time: '10:30 AM', isOwn: false },
    { id: 2, sender: 'You', role: 'Client', content: 'Thank you! I was wondering about the next steps.', time: '10:35 AM', isOwn: true },
    { id: 3, sender: 'David Martinez', role: 'Lead Counsel', content: 'We are preparing for the hearing scheduled for February 15th. I will have an update for you by Friday with all the necessary documents.', time: '10:40 AM', isOwn: false },
  ];

  const selectedChat = conversations[selectedConversation || 0];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      setNewMessage('');
    }
  };

  return (
    <ProtectedRoute requiredRole="client">
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50">
        <div className="flex flex-col lg:flex-row h-screen overflow-hidden">

          {/* Sidebar: Conversations */}
          <aside className="w-full lg:w-[400px] flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shrink-0">
            <div className="p-8 pb-6 border-b border-slate-100 dark:border-slate-800 space-y-6">
              <div>
                <h1 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white uppercase leading-none italic">Communications</h1>
                <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-1">Direct Counsel Channel</p>
              </div>

              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <Input
                  placeholder="Search counsel..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 pl-12 pr-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold text-sm shadow-inner"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
              {conversations.map((conv, idx) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(idx)}
                  className={cn(
                    "w-full p-6 rounded-[32px] text-left transition-all relative overflow-hidden group border",
                    selectedConversation === idx
                      ? "bg-white dark:bg-slate-800 border-blue-200 dark:border-blue-900 shadow-2xl shadow-blue-500/10"
                      : "bg-slate-50/50 dark:bg-slate-800/20 border-transparent hover:bg-white dark:hover:bg-slate-800/40"
                  )}
                >
                  {selectedConversation === idx && <div className="absolute top-0 right-0 w-1.5 h-full bg-blue-600" />}
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-2xl bg-blue-600/10 text-blue-600 flex items-center justify-center text-xl font-black italic shadow-inner">
                        {conv.avatar}
                      </div>
                      {conv.status === 'online' && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-4 border-white dark:border-slate-800" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className={cn(
                          "font-black text-base leading-none uppercase italic tracking-tighter truncate",
                          selectedConversation === idx ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400"
                        )}>{conv.name}</h3>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{conv.timestamp}</span>
                      </div>
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">{conv.title}</p>
                      <p className="text-xs text-slate-500 font-medium truncate mt-3 pr-4">"{conv.lastMessage}"</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="p-8 bg-indigo-950 text-white shrink-0 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-12 h-12" />
              </div>
              <div className="relative z-10 space-y-1">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-indigo-400">Security Protocol</p>
                <p className="text-xl font-black italic uppercase italic">E2EE_ACTIVE</p>
              </div>
            </div>
          </aside>

          {/* Main Chat Interface */}
          <main className="flex-1 overflow-hidden flex flex-col bg-white dark:bg-slate-950 relative">
            {selectedChat ? (
              <>
                {/* Chat Header */}
                <header className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-950 z-10 shrink-0">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-3xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-2xl font-black italic text-blue-600 shadow-inner">
                      {selectedChat.avatar}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-3xl font-black italic tracking-tighter text-slate-900 dark:text-white leading-none uppercase">{selectedChat.name}</h2>
                        <Badge className="bg-emerald-500/10 text-emerald-600 font-black text-[9px] uppercase tracking-widest border border-emerald-500/20">Active Access</Badge>
                      </div>
                      <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest leading-none shrink-0 group">
                        Matter: <span className="text-blue-600 italic">{selectedChat.caseTitle}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="icon" variant="ghost" className="rounded-2xl w-12 h-12 bg-slate-50 dark:bg-slate-900 border-none hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                      <Phone className="w-5 h-5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="rounded-2xl w-12 h-12 bg-slate-50 dark:bg-slate-900 border-none hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                      <Video className="w-5 h-5" />
                    </Button>
                  </div>
                </header>

                {/* Messages Feed */}
                <div className="flex-1 overflow-y-auto p-10 space-y-10 scroll-smooth bg-slate-50/30 dark:bg-slate-950">
                  <div className="text-center py-4">
                    <span className="px-4 py-1.5 rounded-full bg-slate-900/5 dark:bg-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Security established at 09:00 AM Today</span>
                  </div>

                  {messages.map((msg) => (
                    <div key={msg.id} className={cn("flex flex-col gap-2 max-w-[70%]", msg.isOwn ? "ml-auto items-end" : "items-start")}>
                      <div className={cn(
                        "p-6 rounded-[36px] shadow-sm relative overflow-hidden",
                        msg.isOwn
                          ? "bg-slate-900 text-white rounded-br-none"
                          : "bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-bl-none border border-slate-100 dark:border-slate-800"
                      )}>
                        {msg.isOwn && <div className="absolute top-0 right-0 w-2 h-full bg-blue-600" />}
                        <p className="text-base font-medium leading-relaxed italic">{msg.content}</p>
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-4">{msg.time} • {msg.sender}</span>
                    </div>
                  ))}
                </div>

                {/* Premium Input Unit */}
                <footer className="p-10 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 shrink-0">
                  <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex flex-col gap-4">
                    <div className="relative group">
                      <Textarea
                        placeholder="Secure message to Lead Counsel..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="min-h-[120px] rounded-[32px] bg-slate-50 dark:bg-slate-800 border-none shadow-inner p-8 text-base font-medium focus:ring-4 focus:ring-blue-500/10 resize-none"
                      />
                      <div className="absolute right-6 bottom-6 flex gap-2">
                        <Button type="button" size="icon" variant="ghost" className="rounded-2xl bg-white dark:bg-slate-700 shadow-sm border border-slate-100 dark:border-slate-600 text-slate-400 hover:text-blue-600">
                          <Paperclip className="w-5 h-5" />
                        </Button>
                        <Button
                          type="submit"
                          disabled={!newMessage.trim()}
                          className="rounded-2xl h-11 px-8 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[10px] border-none shadow-xl shadow-blue-500/20 gap-2 transition-all hover:scale-105"
                        >
                          <Send className="w-4 h-4" /> Finalize & Send
                        </Button>
                      </div>
                    </div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center italic">Encryption mode: Active and Verified</p>
                  </form>
                </footer>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-8 p-10 max-w-sm mx-auto animate-in zoom-in-95 duration-700">
                <div className="w-40 h-40 rounded-[64px] bg-slate-50 dark:bg-slate-900 flex items-center justify-center shadow-inner">
                  <MessageSquare className="w-20 h-20 text-slate-100" />
                </div>
                <div className="space-y-4">
                  <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none">Intelligence Stream</h2>
                  <p className="text-slate-500 font-bold text-xs uppercase italic tracking-widest">Select a counsel representative from the Left Array to establish a secure comms link.</p>
                </div>
              </div>
            )}
          </main>

        </div>
      </div>
    </ProtectedRoute>
  );
}
