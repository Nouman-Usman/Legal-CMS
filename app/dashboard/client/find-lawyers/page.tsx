'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { ProtectedRoute } from '@/lib/components/protected-route';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  MapPin,
  Phone,
  Mail,
  Filter,
  Loader2,
  ShieldCheck,
  Building2,
  ChevronDown,
  ChevronUp,
  Globe,
  Briefcase,
  Star,
  Users,
  ChevronRight,
  Gavel,
  MessageSquare,
  Award,
  User,
  CheckCircle,
  GraduationCap,
  History,
  Layout,
  ExternalLink,
  MapPinOff,
  SearchX
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from '@/lib/contexts/auth-context';
import { getOrCreateConversation, sendMessage, sendNotification } from '@/lib/supabase/messages';
import { createLead } from '@/lib/supabase/leads';
import { getCasesByFilter } from '@/lib/supabase/cases';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface Lawyer {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  chamber_id?: string;
  status: string;
  lawyer_profile?: {
    licenseNumber?: string;
    practiceAreas?: string[];
    tagline?: string;
    location?: string;
    bio?: string;
    experience_years?: number;
    education?: {
      school: string;
      degree: string;
      year: string;
    }[];
    memberships?: string[];
    skills?: string[];
  };
}

interface Chamber {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  website?: string;
  description?: string;
  logo_url?: string;
  lawyers?: Lawyer[];
}


export default function FindLawyersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [chambers, setChambers] = useState<Chamber[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState<string>('All');
  const [expandedChamber, setExpandedChamber] = useState<string | null>(null);

  const practiceAreas = ['All', 'Criminal Law', 'Civil Litigation', 'Corporate', 'Family Law', 'Real Estate', 'Tax Law'];

  // Connection State
  const [selectedLawyer, setSelectedLawyer] = useState<Lawyer | null>(null);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState("Hello, I'm interested in your legal services and would like to discuss a potential case.");
  const [isConnecting, setIsConnecting] = useState(false);

  // Profile State
  const [viewingLawyer, setViewingLawyer] = useState<Lawyer | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [pastCases, setPastCases] = useState<any[]>([]);
  const [loadingCases, setLoadingCases] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch everything in one go: Active lawyer memberships joined with their chamber and user/lawyer profiles
        // We start from chamber_members as we know the client has read access there (as evidenced by logs)
        // Fetch everything: Active lawyer memberships joined with their chamber and user/lawyer profiles
        const { data: membershipData, error } = await supabase
          .from('chamber_members')
          .select(`
            chamber_id,
            chambers:chamber_id(*),
            users:user_id!inner(
              id,
              full_name,
              email,
              phone,
              avatar_url,
              onboarding_completed,
              role,
              lawyer_profile:lawyers!inner(
                bar_number,
                specialization,
                bio,
                experience_years
              )
            )
          `)
          .eq('is_active', true);

        if (error) {
          console.error('Fetch error:', error);
          throw error;
        }

        // Group the results by chamber
        const chamberMap: Record<string, Chamber> = {};

        (membershipData || []).forEach((row: any) => {
          const chamberData = row.chambers;
          const user = row.users;

          if (!chamberData || !user || user.role !== 'lawyer') return;

          if (!chamberMap[chamberData.id]) {
            chamberMap[chamberData.id] = {
              ...chamberData,
              lawyers: []
            };
          }

          // Transform 3NF data to UI format
          const rawProfile = user.lawyer_profile?.[0];
          const lawyer: Lawyer = {
            id: user.id,
            full_name: user.full_name || 'Anonymous',
            email: user.email,
            phone: user.phone,
            avatar_url: user.avatar_url,
            status: user.onboarding_completed ? 'active' : 'pending',
            chamber_id: row.chamber_id,
            lawyer_profile: rawProfile ? {
              licenseNumber: rawProfile.bar_number,
              practiceAreas: rawProfile.specialization ? rawProfile.specialization.split(',').map((s: string) => s.trim()) : [],
              bio: rawProfile.bio,
              experience_years: rawProfile.experience_years,
              tagline: rawProfile.tagline || `${rawProfile.specialization?.split(',')[0] || 'Associate'} Attorney`
            } : undefined
          };

          chamberMap[chamberData.id].lawyers?.push(lawyer);
        });

        const finalChambers = Object.values(chamberMap);
        console.log('Final Chambers Data:', finalChambers);
        setChambers(finalChambers);
      } catch (error) {
        console.error('Error in fetchData:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredChambers = chambers.filter((chamber) => {
    const matchesSearch =
      chamber.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chamber.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chamber.lawyers?.some(l => l.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      chamber.address?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesArea = selectedArea === 'All' ||
      chamber.lawyers?.some(l => l.lawyer_profile?.practiceAreas?.includes(selectedArea));

    return matchesSearch && matchesArea;
  });

  const toggleChamber = (id: string) => {
    setExpandedChamber(expandedChamber === id ? null : id);
  };

  const handleConnect = async () => {
    if (!user || !selectedLawyer) return;

    setIsConnecting(true);
    try {
      const response = await fetch('/api/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lawyerId: selectedLawyer.id,
          chamberId: selectedLawyer.chamber_id,
          message: connectionMessage,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to connect');
      }

      const data = await response.json();

      toast.success(`Connection request sent to ${selectedLawyer.full_name}`);
      setIsConnectModalOpen(false);

      // Redirect to messages with the new thread selected
      router.push(`/dashboard/client/messages?threadId=${data.threadId}`);
    } catch (error: any) {
      console.error('Connection error:', error);
      toast.error(error.message || 'Failed to connect with lawyer');
    } finally {
      setIsConnecting(false);
    }
  };

  const openProfile = async (lawyer: Lawyer) => {
    setViewingLawyer(lawyer);
    setIsProfileModalOpen(true);
    setLoadingCases(true);

    try {
      const { cases, error } = await getCasesByFilter({ assigned_to: lawyer.id, status: 'closed' });
      if (error) throw error;
      setPastCases(cases || []);
    } catch (error) {
      console.error('Error fetching past cases:', error);
      setPastCases([]);
    } finally {
      setLoadingCases(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="client">
        <div className="flex flex-col items-center justify-center h-[80vh] gap-6">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-600 blur-xl opacity-20 animate-pulse rounded-full" />
            <Building2 className="w-16 h-16 text-slate-300 relative z-10 animate-bounce" />
          </div>
          <div className="space-y-2 text-center">
            <h2 className="text-xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-white">Locating Firms</h2>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.2em] animate-pulse">Accessing Legal Directory...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="client">
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 p-6 md:p-12 pb-32">
        <div className="max-w-6xl mx-auto space-y-12">

          {/* Header */}
          <div className="flex flex-col items-center text-center space-y-8 py-8">
            <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl">
              <Gavel className="w-4 h-4" />
              Official Legal Directory
            </div>
            <div className="space-y-4 max-w-2xl">
              <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-slate-900 dark:text-white leading-[1.1]">
                Find Your <span className="text-blue-600">Legal Partner</span>
              </h1>
              <p className="text-base text-slate-500 font-medium leading-relaxed max-w-xl mx-auto">
                Explore elite legal chambers and connect with specialized attorneys tailored to your legal needs.
              </p>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="relative group z-10">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 rounded-[32px] blur opacity-20 group-focus-within:opacity-40 transition duration-1000" />
              <div className="relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <Input
                  placeholder="Search by Firm name, legal expert, or state..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-16 pl-14 pr-6 rounded-[28px] bg-white dark:bg-slate-900 border-none shadow-2xl font-bold text-base placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 overflow-x-auto pb-2 no-scrollbar">
              {practiceAreas.map((area) => (
                <button
                  key={area}
                  onClick={() => setSelectedArea(area)}
                  className={cn(
                    "px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                    selectedArea === area
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg scale-105"
                      : "bg-white dark:bg-slate-900 text-slate-500 hover:text-blue-600 shadow-sm border border-slate-100 dark:border-slate-800"
                  )}
                >
                  {area}
                </button>
              ))}
            </div>
          </div>

          {/* Results Grid */}
          <div className="grid grid-cols-1 gap-10 max-w-4xl mx-auto">
            <div className="flex items-center justify-between px-4">
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                  Available Directory
                </p>
                <p className="text-sm font-black text-slate-900 dark:text-white uppercase italic">
                  {filteredChambers.length} <span className="text-blue-600">Legal Institutions</span> Found
                </p>
              </div>
              <div className="flex items-center gap-4 bg-white dark:bg-slate-900 px-4 py-2 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 text-[9px] font-black uppercase tracking-widest text-slate-500">
                <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Verified</span>
                <span className="w-px h-3 bg-slate-200" />
                <span className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-amber-500" /> Top Rated</span>
              </div>
            </div>

            {filteredChambers.length === 0 ? (
              <div className="text-center py-24 space-y-8 bg-white dark:bg-slate-900 rounded-[48px] border-2 border-dashed border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <SearchX className="w-48 h-48" />
                </div>
                <div className="relative z-10 space-y-6">
                  <div className="w-24 h-24 mx-auto rounded-full bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
                    <MapPinOff className="w-10 h-10 text-slate-300" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-3xl font-black italic tracking-tighter uppercase text-slate-900 dark:text-white">Zero Matches Found</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest max-w-xs mx-auto">No chambers or lawyers currently match your specific search criteria.</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => { setSearchQuery(''); setSelectedArea('All'); }}
                    className="h-10 rounded-full border-slate-200 dark:border-slate-800 text-[10px] uppercase font-black tracking-widest px-8"
                  >
                    Reset Directory
                  </Button>
                </div>
              </div>
            ) : (
              filteredChambers.map((chamber) => (
                <Collapsible
                  key={chamber.id}
                  open={expandedChamber === chamber.id}
                  onOpenChange={() => toggleChamber(chamber.id)}
                  className="group relative"
                >
                  <div className={cn(
                    "rounded-[32px] bg-white dark:bg-slate-900 shadow-lg border border-slate-100 dark:border-slate-800 transition-all duration-300 overflow-hidden",
                    expandedChamber === chamber.id ? "ring-2 ring-blue-600 shadow-2xl translate-y-[-4px]" : "hover:shadow-xl hover:translate-y-[-2px]"
                  )}>
                    {/* Chamber Header */}
                    <CollapsibleTrigger className="w-full text-left">
                      <div className="p-8 md:p-10 flex flex-col md:flex-row gap-8 items-start md:items-center justify-between bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
                        <div className="flex items-center gap-6 md:gap-8">
                          <div className="w-24 h-24 shrink-0 rounded-[28px] bg-slate-900 text-white flex items-center justify-center text-3xl font-black italic shadow-2xl overflow-hidden border-4 border-white dark:border-slate-800">
                            {chamber.logo_url ? (
                              <img src={chamber.logo_url} alt={chamber.name} className="w-full h-full object-cover" />
                            ) : (
                              chamber.name.charAt(0)
                            )}
                          </div>
                          <div className="space-y-2">
                            <div>
                              <div className="flex items-center gap-3">
                                <h3 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                                  {chamber.name}
                                </h3>
                                {chamber.lawyers && chamber.lawyers.length > 0 && (
                                  <Badge className="bg-blue-600 text-white border-none font-black text-[9px] uppercase tracking-widest px-2 py-0.5">
                                    {chamber.lawyers.length} Attorneys
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm font-medium text-slate-500 mt-2 line-clamp-1 max-w-lg">
                                {chamber.description || 'Premier legal services firm specializing in corporate and civil litigation.'}
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-wide">
                              {chamber.address && (
                                <div className="flex items-center gap-1.5">
                                  <MapPin className="w-3.5 h-3.5" />
                                  <span className="truncate max-w-[200px]">{chamber.address}</span>
                                </div>
                              )}
                              {chamber.website && (
                                <div className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
                                  <Globe className="w-3.5 h-3.5" />
                                  <a href={chamber.website} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>Visit Website</a>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 w-full md:w-auto mt-4 md:mt-0">
                          <div
                            className={cn(
                              "bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-900 rounded-2xl h-14 px-8 font-black uppercase tracking-widest text-[10px] w-full md:w-auto transition-all gap-2 flex items-center justify-center cursor-pointer"
                            )}
                          >
                            {expandedChamber === chamber.id ? 'Close Roster' : 'View Attorneys'}
                            {expandedChamber === chamber.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </div>
                      </div>
                    </CollapsibleTrigger>

                    {/* Lawyers List */}
                    <CollapsibleContent>
                      <div className="p-8 md:p-10 pt-0 bg-slate-50/50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                        <div className="mb-8 mt-8 flex items-center justify-between">
                          <h4 className="text-lg font-black italic uppercase tracking-tighter text-slate-900 dark:text-white flex items-center gap-2">
                            <Users className="w-5 h-5 text-blue-600" />
                            Available Counsel
                          </h4>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {chamber.lawyers && chamber.lawyers.length > 0 ? (
                            chamber.lawyers.map((lawyer) => (
                              <div key={lawyer.id}
                                onClick={() => openProfile(lawyer)}
                                className="group/lawyer flex items-start gap-5 p-5 rounded-[24px] bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900 hover:shadow-xl hover:shadow-blue-900/5 transition-all cursor-pointer"
                              >
                                <div className="relative">
                                  <Avatar className="w-16 h-16 rounded-2xl border-2 border-slate-100 dark:border-slate-800 group-hover/lawyer:scale-110 transition-transform">
                                    <AvatarImage src={lawyer.avatar_url} />
                                    <AvatarFallback className="bg-slate-900 text-white font-black italic">{lawyer.full_name.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-950 animate-pulse" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h5 className="font-bold text-slate-900 dark:text-white truncate group-hover/lawyer:text-blue-600 transition-colors">{lawyer.full_name}</h5>
                                      <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-0.5">{lawyer.lawyer_profile?.tagline || 'Associate Attorney'}</p>
                                    </div>
                                    <div className="flex gap-0.5">
                                      {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />)}
                                    </div>
                                  </div>

                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {lawyer.lawyer_profile?.practiceAreas?.slice(0, 2).map((area: string) => (
                                      <Badge key={area} variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-[8px] font-black uppercase tracking-widest border-none px-2 rounded-lg">
                                        {area}
                                      </Badge>
                                    ))}
                                  </div>

                                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3 gap-2">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                      <Briefcase className="w-3 h-3" />
                                      {lawyer.lawyer_profile?.experience_years || '5+'} Years Exp.
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedLawyer(lawyer);
                                          setIsConnectModalOpen(true);
                                        }}
                                        className="h-8 rounded-xl bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest px-4 hover:bg-blue-600 transition-all shadow-md active:scale-95"
                                      >
                                        Connect
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="col-span-full py-10 text-center text-slate-400 text-sm font-medium italic">
                              No lawyers currently listed for this firm.
                            </div>
                          )}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))
            )}

          </div>

        </div>
      </div>

      {/* Connect Modal */}
      <Dialog open={isConnectModalOpen} onOpenChange={setIsConnectModalOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-slate-950 rounded-[32px] border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-slate-950 p-8 text-white relative">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <MessageSquare className="w-24 h-24" />
            </div>
            <DialogHeader className="relative z-10">
              <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">Connect with {selectedLawyer?.full_name}</DialogTitle>
              <DialogDescription className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Initiate a direct communication line</DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Initial Message</label>
              <Textarea
                value={connectionMessage}
                onChange={(e) => setConnectionMessage(e.target.value)}
                placeholder="How can this expert help you?"
                className="min-h-[120px] rounded-2xl bg-slate-50 dark:bg-slate-900 border-none p-4 font-medium focus:ring-2 focus:ring-blue-600 transition-all resize-none"
              />
            </div>
            <DialogFooter className="flex gap-3">
              <Button
                variant="ghost"
                onClick={() => setIsConnectModalOpen(false)}
                className="flex-1 h-12 rounded-xl font-black uppercase tracking-widest text-[10px]"
              >
                Abort
              </Button>
              <Button
                onClick={handleConnect}
                disabled={isConnecting}
                className="flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-500/20"
              >
                {isConnecting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <MessageSquare className="w-4 h-4 mr-2" />}
                Send Request
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lawyer Profile Modal - Premium UX Refined */}
      <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
        <DialogContent className="sm:max-w-4xl bg-white dark:bg-slate-950 rounded-[32px] border-none shadow-2xl p-0 overflow-hidden max-h-[95vh] flex flex-col">
          {/* LinkedIn-style High-End Header */}
          <div className="relative shrink-0">
            {/* Banner with Pattern */}
            <div className="h-44 bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
            </div>

            <div className="px-10 pb-6 relative">
              <div className="flex flex-col md:flex-row md:items-end gap-8 -mt-20">
                <div className="relative shrink-0">
                  <div className="w-44 h-44 rounded-full border-8 border-white dark:border-slate-950 overflow-hidden shadow-2xl bg-slate-100 dark:bg-slate-900">
                    <Avatar className="w-full h-full rounded-none">
                      <AvatarImage src={viewingLawyer?.avatar_url} className="object-cover" />
                      <AvatarFallback className="bg-blue-600 text-white text-6xl font-bold">{viewingLawyer?.full_name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="absolute bottom-4 right-4 w-6 h-6 bg-emerald-500 border-4 border-white dark:border-slate-950 rounded-full shadow-lg" />
                </div>

                <div className="flex-1 space-y-4 pb-2">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <DialogTitle className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">{viewingLawyer?.full_name}</DialogTitle>
                      <Badge className="bg-blue-50 text-blue-600 border-blue-100 font-bold text-[10px] px-3 py-1 rounded-full uppercase tracking-widest">
                        Licensed Professional
                      </Badge>
                    </div>
                    <DialogDescription className="text-xl font-medium text-slate-500 dark:text-slate-400">
                      {viewingLawyer?.lawyer_profile?.tagline || 'Principal Attorney at Law'}
                    </DialogDescription>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 text-[12px] font-semibold text-slate-400">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {viewingLawyer?.lawyer_profile?.location || 'Lahore, Pakistan'}
                    </div>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      ID: {viewingLawyer?.lawyer_profile?.licenseNumber || 'Official Member'}
                    </div>
                  </div>
                </div>


              </div>
            </div>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            <Tabs defaultValue="overview" className="flex-1 flex flex-col">
              <div className="px-10 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <TabsList className="h-16 bg-transparent gap-8 p-0">
                  {['overview', 'professional', 'cases'].map((tab) => (
                    <TabsTrigger
                      key={tab}
                      value={tab}
                      className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent text-[10px] font-black uppercase tracking-[0.3em] px-0 transition-all data-[state=active]:text-blue-600 italic"
                    >
                      {tab === 'overview' && <Layout className="w-4 h-4 mr-2" />}
                      {tab === 'professional' && <GraduationCap className="w-4 h-4 mr-2" />}
                      {tab === 'cases' && <History className="w-4 h-4 mr-2" />}
                      {tab}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <div className="flex-1 overflow-y-auto p-10 no-scrollbar">
                <TabsContent value="overview" className="mt-0 space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-6">
                    {[
                      { label: 'Experience', value: `${viewingLawyer?.lawyer_profile?.experience_years || '5+'} Years`, sub: 'Active Practice', icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50' },
                      { label: 'Success Rate', value: '4.9/5.0', sub: 'Client Choice', icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' },
                      { label: 'Status', value: 'Available', sub: 'Accepting Cases', icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' }
                    ].map((stat, i) => (
                      <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4 shadow-sm", stat.bg)}>
                          <stat.icon className={cn("w-5 h-5", stat.color)} />
                        </div>
                        <h4 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{stat.value}</h4>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 border-b pb-2 flex items-center gap-2">
                      <User className="w-4 h-4" /> Professional Statement
                    </h3>
                    <p className="text-md font-medium text-slate-600 dark:text-slate-300 leading-relaxed italic">
                      "{viewingLawyer?.lawyer_profile?.bio || 'Highly dedicated legal professional with a focus on delivering excellence and strategic litigation results.'}"
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 border-b pb-2 flex items-center gap-2">
                      <Layout className="w-4 h-4" /> Expertise Areas
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {(viewingLawyer?.lawyer_profile?.practiceAreas || ['Civil Litigation', 'Corporate', 'Criminal Defense']).map(area => (
                        <div key={area} className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 font-bold text-[11px] text-slate-600 dark:text-slate-300">
                          {area}
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="professional" className="mt-0 space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="space-y-8">
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-3">
                      <GraduationCap className="w-4 h-4" /> Academic Background
                    </h3>
                    <div className="grid grid-cols-1 gap-6">
                      {(viewingLawyer?.lawyer_profile?.education || [{ school: 'Faculty of Law', degree: 'Juris Doctor (JD)', year: '2016' }]).map((edu, idx) => (
                        <div key={idx} className="flex gap-8 p-6 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                          <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-sm text-blue-600">
                            <Building2 className="w-8 h-8" />
                          </div>
                          <div className="space-y-2">
                            <h4 className="text-xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white">{edu.school}</h4>
                            <p className="text-sm font-bold text-slate-500 italic">{edu.degree}</p>
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-2">{edu.year}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="cases" className="mt-0 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-3">
                      <History className="w-4 h-4" /> Case History & Results
                    </h3>
                  </div>

                  <div className="space-y-4">
                    {loadingCases ? (
                      <div className="py-20 text-center">
                        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Syncing Trial Records...</p>
                      </div>
                    ) : pastCases.length > 0 ? (
                      pastCases.map((c: any) => (
                        <div key={c.id} className="p-8 rounded-[32px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-between group hover:shadow-2xl hover:border-blue-600/20 transition-all overflow-hidden relative">
                          <div className="absolute right-0 top-0 bottom-0 w-1 bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="space-y-4 relative z-10">
                            <div className="flex items-center gap-4">
                              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-lg">Trial ID: {c.case_number}</span>
                              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[8px] font-black uppercase tracking-widest">
                                <CheckCircle className="w-3 h-3" /> Favorable Verdict
                              </div>
                            </div>
                            <div>
                              <h4 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">{c.title}</h4>
                              <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 line-clamp-2 max-w-2xl mt-2 italic leading-relaxed">
                                {c.description}
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Date of Resolution</p>
                            <p className="text-sm font-black text-slate-900 dark:text-white uppercase italic mt-1">{new Date(c.updated_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-24 text-center rounded-[48px] bg-slate-50/50 dark:bg-slate-900/50 border-2 border-dashed border-slate-200 dark:border-slate-800">
                        <History className="w-16 h-16 text-slate-200 dark:text-slate-800 mx-auto mb-6" />
                        <h4 className="text-xl font-black italic uppercase text-slate-300">Archive Empty</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 max-w-xs mx-auto">This professional profile has no public case history recorded in our secure system yet.</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* Sticky Action Footer */}
          <div className="p-8 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 shrink-0">
            <div className="max-w-3xl mx-auto flex items-center justify-between gap-8">
              <div className="hidden md:block">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Connect with Professional</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">Ready to establish a <span className="text-blue-600 font-bold">Secure Legal Partnership</span>?</p>
              </div>
              <Button
                onClick={() => {
                  setIsProfileModalOpen(false);
                  setSelectedLawyer(viewingLawyer);
                  setIsConnectModalOpen(true);
                }}
                className="flex-1 md:flex-initial h-12 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold px-10 shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-3 group"
              >
                Initiate Connect <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  );
}
