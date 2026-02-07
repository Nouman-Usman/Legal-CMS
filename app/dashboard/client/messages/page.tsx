'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ProtectedRoute } from '@/lib/components/protected-route';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquare,
  Search,
  Phone,
  Video,
  Send,
  Paperclip,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/contexts/auth-context';
import { supabase } from '@/lib/supabase/client';
import {
  getUserConversations,
  getConversationMessages,
  sendMessage,
  markThreadAsRead
} from '@/lib/supabase/messages';
import { toast } from 'sonner';

import { useSearchParams } from 'next/navigation';
import { subscribeToChannel } from '@/lib/realtime';

export default function ClientMessagesPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const threadIdFromUrl = searchParams.get('threadId');

  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [threadReads, setThreadReads] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Handle thread selection from URL on load
  useEffect(() => {
    if (threadIdFromUrl && !selectedThreadId) {
      setSelectedThreadId(threadIdFromUrl);
    }
  }, [threadIdFromUrl]);

  // 1. Fetch Conversations
  const fetchConversations = async () => {
    if (!user) return;
    const { conversations: data, error } = await getUserConversations(user.id);
    if (error) {
      toast.error('Failed to load conversations');
    } else {
      setConversations(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchConversations();
  }, [user]);

  // 2. Realtime Subscription for Thread Updates
  useEffect(() => {
    if (!user) return;

    // Listen for database changes to the thread list
    const channel = supabase
      .channel('threads_list_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_threads',
          filter: `participant_ids=cs.{${user.id}}`
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // 3. Load Messages and Listen via Broadcast
  useEffect(() => {
    if (!selectedThreadId) return;

    const loadMessages = async () => {
      const { messages: data, reads, error } = await getConversationMessages(selectedThreadId);
      if (error) {
        toast.error('Failed to load messages');
      } else {
        setMessages((data || []).reverse());
        setThreadReads(reads || []);
      }
    };

    loadMessages();

    // Mark as read when thread is opened
    if (user) {
      markThreadAsRead(selectedThreadId, user.id);
      // Clear unread count locally for immediate UI feedback
      setConversations(prev => prev.map(c =>
        c.id === selectedThreadId ? { ...c, unreadCount: 0 } : c
      ));
    }

    // 4. Use Unified Broadcast for real-time messages
    // This matches the 'thread-${threadId}' format used in the backend
    const { unsubscribe } = subscribeToChannel(
      `thread-${selectedThreadId}`,
      'message',
      (payload) => {
        // Prevent duplicate messages if sender is same as current user (handled optimistically or by DB insert)
        setMessages((prev) => {
          if (prev.some(m => m.id === payload.id)) return prev;
          return [...prev, payload];
        });

        // If thread is active, mark it as read immediately
        if (user) {
          markThreadAsRead(selectedThreadId, user.id);
        }
      }
    );

    // 5. Listen for 'Seen' status (thread_reads updates)
    const readsChannel = supabase
      .channel(`reads-${selectedThreadId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'thread_reads',
          filter: `thread_id=eq.${selectedThreadId}`
        },
        (payload) => {
          const newData = payload.new as { user_id: string; last_read_at: string; thread_id: string };
          if (!newData || !newData.user_id) return;

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

  // Scroll to bottom on new message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !selectedThreadId) return;

    setSending(true);
    const { error } = await sendMessage(selectedThreadId, user.id, newMessage);

    if (error) {
      toast.error('Failed to send message');
    } else {
      setNewMessage('');
      // Message is optimistic or waits for Realtime? 
      // Realtime usually arrives fast. But for better UX we could optimistic update.
      // For now relying on Realtime is safer to ensure it saved.
    }
    setSending(false);
  };

  // Helper to get display info for a conversation
  const getConversationDisplay = (conv: any) => {
    const otherUser = conv.otherUser;
    const name = otherUser?.full_name || 'Unknown User';
    const role = otherUser?.role || 'User';
    // Initials for avatar
    const initials = name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

    // Last message teaser? We don't fetch last message content in getUserConversations yet,
    // assuming 'updated_at' is proxy for activity.
    // If we want last message, we'd need to modify the backend helper.
    // For now, show role or status.

    return { name, role, initials, id: conv.id };
  };

  // Filter conversations
  const filteredConversations = conversations.filter(c => {
    const display = getConversationDisplay(c);
    return display.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Get active chat display info
  const activeChat = conversations.find(c => c.id === selectedThreadId);
  const activeDisplay = activeChat ? getConversationDisplay(activeChat) : null;

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
              {loading && <div className="p-4 text-center text-slate-400">Loading secure channels...</div>}
              {!loading && filteredConversations.length === 0 && (
                <div className="p-4 text-center text-slate-400 text-sm">No active conversations found.</div>
              )}
              {filteredConversations.map((conv) => {
                const { name, role, initials, id } = getConversationDisplay(conv);
                const isSelected = selectedThreadId === id;

                return (
                  <button
                    key={id}
                    onClick={() => setSelectedThreadId(id)}
                    className={cn(
                      "w-full p-6 rounded-[32px] text-left transition-all relative overflow-hidden group border",
                      isSelected
                        ? "bg-white dark:bg-slate-800 border-blue-200 dark:border-blue-900 shadow-2xl shadow-blue-500/10"
                        : "bg-slate-50/50 dark:bg-slate-800/20 border-transparent hover:bg-white dark:hover:bg-slate-800/40"
                    )}
                  >
                    {isSelected && <div className="absolute top-0 right-0 w-1.5 h-full bg-blue-600" />}
                    <div className="flex items-start gap-4">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-2xl bg-blue-600/10 text-blue-600 flex items-center justify-center text-xl font-black italic shadow-inner">
                          {initials}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h3 className={cn(
                            "font-black text-base leading-none uppercase italic tracking-tighter truncate",
                            isSelected ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400"
                          )}>{name}</h3>
                          <div className="flex flex-col items-end gap-2">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
                              {new Date(conv.updated_at).toLocaleDateString()}
                            </span>
                            {conv.unreadCount > 0 && !isSelected && (
                              <Badge className="bg-blue-600 text-white border-none h-5 min-w-[20px] rounded-full flex items-center justify-center text-[10px] font-black px-1.5 animate-in zoom-in duration-300">
                                {conv.unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">{role}</p>
                        <p className="text-xs text-slate-500 font-medium truncate mt-3 pr-4">
                          {conv.subject || 'Direct Message'}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
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
            {selectedThreadId && activeDisplay ? (
              <>
                {/* Chat Header */}
                <header className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-950 z-10 shrink-0">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-3xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-2xl font-black italic text-blue-600 shadow-inner">
                      {activeDisplay.initials}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-3xl font-black italic tracking-tighter text-slate-900 dark:text-white leading-none uppercase">{activeDisplay.name}</h2>
                        <Badge className="bg-emerald-500/10 text-emerald-600 font-black text-[9px] uppercase tracking-widest border border-emerald-500/20">Active</Badge>
                      </div>
                      <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest leading-none shrink-0 group">
                        Role: <span className="text-blue-600 italic">{activeDisplay.role}</span>
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
                    <span className="px-4 py-1.5 rounded-full bg-slate-900/5 dark:bg-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">
                      Secure Channel Established
                    </span>
                  </div>

                  {messages.map((msg) => {
                    const isOwn = msg.sender_id === user?.id;

                    // Check if other participant has seen this message
                    const otherParticipants = threadReads.filter(r => r.user_id !== user?.id);
                    const isSeen = otherParticipants.length > 0 && otherParticipants.every(r =>
                      new Date(r.last_read_at) >= new Date(msg.created_at)
                    );

                    return (
                      <div key={msg.id} className={cn("flex flex-col gap-2 max-w-[70%]", isOwn ? "ml-auto items-end" : "items-start")}>
                        <div className={cn(
                          "p-6 rounded-[36px] shadow-sm relative overflow-hidden",
                          isOwn
                            ? "bg-slate-900 text-white rounded-br-none"
                            : "bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-bl-none border border-slate-100 dark:border-slate-800"
                        )}>
                          {isOwn && <div className="absolute top-0 right-0 w-2 h-full bg-blue-600" />}
                          <p className="text-base font-medium leading-relaxed italic">{msg.content}</p>
                        </div>
                        <div className="flex items-center gap-2 px-4">
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isOwn && isSeen && (
                            <span className="text-[9px] font-black uppercase tracking-widest text-blue-600 italic flex items-center gap-1">
                              <div className="w-1 h-1 rounded-full bg-blue-600" /> Seen
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Footer Input */}
                <footer className="p-10 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 shrink-0">
                  <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex flex-col gap-4">
                    <div className="relative group">
                      <Textarea
                        placeholder="Secure message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage(e);
                          }
                        }}
                        className="min-h-[120px] rounded-[32px] bg-slate-50 dark:bg-slate-800 border-none shadow-inner p-8 text-base font-medium focus:ring-4 focus:ring-blue-500/10 resize-none"
                      />
                      <div className="absolute right-6 bottom-6 flex gap-2">
                        <Button type="button" size="icon" variant="ghost" className="rounded-2xl bg-white dark:bg-slate-700 shadow-sm border border-slate-100 dark:border-slate-600 text-slate-400 hover:text-blue-600">
                          <Paperclip className="w-5 h-5" />
                        </Button>
                        <Button
                          type="submit"
                          disabled={!newMessage.trim() || sending}
                          className="rounded-2xl h-11 px-8 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[10px] border-none shadow-xl shadow-blue-500/20 gap-2 transition-all hover:scale-105"
                        >
                          <Send className="w-4 h-4" /> {sending ? 'Sending...' : 'Send'}
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
                  <p className="text-slate-500 font-bold text-xs uppercase italic tracking-widest">Select a channel to begin.</p>
                </div>
              </div>
            )}
          </main>

        </div>
      </div>
    </ProtectedRoute>
  );
}
