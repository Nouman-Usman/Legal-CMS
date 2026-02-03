'use client';

import React, { useState } from 'react';
import { ProtectedRoute } from '@/lib/components/protected-route';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Search, Pin, Archive, MoreVertical, Send, Phone, Video, Info } from 'lucide-react';

export default function LawyerMessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');

  // Mock data for conversations
  const conversations = [
    {
      id: 1,
      name: 'John Smith (Client)',
      lastMessage: 'Thank you for your help with the case...',
      timestamp: '2 minutes ago',
      unread: 2,
      status: 'online',
      avatar: 'JS',
      isPinned: true,
    },
    {
      id: 2,
      name: 'Sarah Johnson (Colleague)',
      lastMessage: 'Can you review the document I sent?',
      timestamp: '1 hour ago',
      unread: 0,
      status: 'offline',
      avatar: 'SJ',
      isPinned: false,
    },
    {
      id: 3,
      name: 'Michael Chen (Client)',
      lastMessage: 'When is the next hearing scheduled?',
      timestamp: '3 hours ago',
      unread: 0,
      status: 'online',
      avatar: 'MC',
      isPinned: false,
    },
  ];

  const messages = [
    { id: 1, sender: 'John Smith', content: 'Hi, I wanted to follow up on my case', time: '10:30 AM', isOwn: false },
    { id: 2, sender: 'You', content: 'Of course! Let me review the recent documents.', time: '10:32 AM', isOwn: true },
    { id: 3, sender: 'John Smith', content: 'Thank you for your help with the case. I really appreciate it.', time: '10:35 AM', isOwn: false },
  ];

  const selectedChat = conversations[selectedConversation || 0];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      setNewMessage('');
    }
  };

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
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv.id - 1)}
                    className={`w-full text-left px-4 py-3 border-b border-slate-100 dark:border-slate-800 transition-all duration-200 ${
                      selectedConversation === conv.id - 1
                        ? 'bg-blue-50 dark:bg-blue-950/30 border-l-4 border-l-blue-500'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">{conv.avatar}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">{conv.name}</p>
                              {conv.isPinned && <Pin className="w-3 h-3 text-amber-500 flex-shrink-0" />}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{conv.lastMessage}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <p className="text-xs text-slate-500 dark:text-slate-400">{conv.timestamp}</p>
                        {conv.unread > 0 && (
                          <Badge className="bg-blue-600 text-white text-xs">{conv.unread}</Badge>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Area */}
            {selectedChat && (
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex flex-col shadow-sm">
                {/* Chat Header */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-50 to-slate-50/50 dark:from-slate-800 dark:to-slate-800/50">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">{selectedChat.avatar}</span>
                      </div>
                      <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${
                        selectedChat.status === 'online' ? 'bg-green-500' : 'bg-slate-400'
                      }`} />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{selectedChat.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{selectedChat.status}</p>
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
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs px-4 py-2 rounded-lg ${
                        msg.isOwn
                          ? 'bg-blue-600 dark:bg-blue-700 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                      }`}>
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                        <p className={`text-xs mt-1 ${
                          msg.isOwn ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'
                        }`}>
                          {msg.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Input Area */}
                <form onSubmit={handleSendMessage} className="border-t border-slate-200 dark:border-slate-800 p-4 space-y-3">
                  <Textarea
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="resize-none bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-blue-400 min-h-[80px]"
                  />
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Send Message
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
