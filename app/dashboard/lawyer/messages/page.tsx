'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ProtectedRoute } from '@/lib/components/protected-route';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Search, Pin, Send, Phone, Video, Info } from 'lucide-react';
import { useAuth } from '@/lib/contexts/auth-context';
import { supabase } from '@/lib/supabase/client';
import {
  getUserConversations,
  getConversationMessages,
  sendMessage
} from '@/lib/supabase/messages';
import { toast } from 'sonner';

export default function LawyerMessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations
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

  // Subscribe to thread updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('lawyer_threads_updates')
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

  // Load messages for selected thread
  useEffect(() => {
    if (!selectedThreadId) return;

    const loadMessages = async () => {
      const { messages: data, error } = await getConversationMessages(selectedThreadId);
      if (error) {
        toast.error('Failed to load messages');
      } else {
        setMessages((data || []).reverse());
      }
    };

    loadMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`lawyer_thread_${selectedThreadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `thread_id=eq.${selectedThreadId}`
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedThreadId]);

  // Auto-scroll to bottom
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
    }
    setSending(false);
  };

  // Helper to format conversation display
  const getConversationDisplay = (conv: any) => {
    const otherUser = conv.otherUser;
    const name = otherUser?.full_name || 'Unknown User';
    const role = otherUser?.role || 'User';
    const initials = name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

    return { name, role, initials, id: conv.id };
  };

  // Filter conversations
  const filteredConversations = conversations.filter(c => {
    const display = getConversationDisplay(c);
    return display.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const activeChat = conversations.find(c => c.id === selectedThreadId);
  const activeDisplay = activeChat ? getConversationDisplay(activeChat) : null;

  return (
    <ProtectedRoute requiredRole="lawyer">
      <div className="p-8 bg-gradient-to-b from-slate-50 to-slate-50/50 dark:from-slate-950 dark:to-slate-950/50 min-h-screen">
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Messages</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">Communicate with clients and colleagues</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
            {/* Conversations List */}
            <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex flex-col shadow-sm">
              {/* Search */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-blue-400"
                  />
                </div>
              </div>

              {/* Conversations */}
              <div className="flex-1 overflow-y-auto">
                {loading && <div className="p-4 text-center text-slate-400 text-sm">Loading conversations...</div>}
                {!loading && filteredConversations.length === 0 && (
                  <div className="p-4 text-center text-slate-400 text-sm">No conversations found.</div>
                )}
                {filteredConversations.map((conv) => {
                  const { name, role, initials, id } = getConversationDisplay(conv);
                  const isSelected = selectedThreadId === id;

                  return (
                    <button
                      key={id}
                      onClick={() => setSelectedThreadId(id)}
                      className={`w-full text-left px-4 py-3 border-b border-slate-100 dark:border-slate-800 transition-all duration-200 ${isSelected
                          ? 'bg-blue-50 dark:bg-blue-950/30 border-l-4 border-l-blue-500'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">{initials}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">{name}</p>
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                {role} • {conv.subject || 'Direct Message'}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {new Date(conv.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Chat Area */}
            {selectedThreadId && activeDisplay ? (
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex flex-col shadow-sm">
                {/* Chat Header */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-50 to-slate-50/50 dark:from-slate-800 dark:to-slate-800/50">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">{activeDisplay.initials}</span>
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{activeDisplay.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{activeDisplay.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                      <Phone className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                      <Video className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                      <Info className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((msg) => {
                    const isOwn = msg.sender_id === user?.id;
                    return (
                      <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs px-4 py-2 rounded-lg ${isOwn
                            ? 'bg-blue-600 dark:bg-blue-700 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                          }`}>
                          <p className="text-sm leading-relaxed">{msg.content}</p>
                          <p className={`text-xs mt-1 ${isOwn ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'
                            }`}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={handleSendMessage} className="border-t border-slate-200 dark:border-slate-800 p-4 space-y-3">
                  <Textarea
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                    className="resize-none bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-blue-400 min-h-[80px]"
                  />
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={!newMessage.trim() || sending}
                      className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      {sending ? 'Sending...' : 'Send Message'}
                    </Button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-center">
                <div className="text-center space-y-4 p-8">
                  <MessageSquare className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto" />
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No conversation selected</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Select a conversation to start messaging</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
