'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { ProtectedRoute } from '@/lib/components/protected-route';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  MapPin,
  Star,
  Phone,
  Mail,
  ArrowRight,
  Filter,
  Grid3x3,
  List,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Award,
  Clock,
  ExternalLink,
  ChevronRight,
  Gavel,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Lawyer {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  bar_number?: string;
  status: string;
  lawyer_profile?: {
    licenseNumber: string;
    practiceAreas: string[];
    tagline: string;
    location?: string;
    bio?: string;
    yearsOfExperience?: number;
  };
}

export default function FindLawyersPage() {
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [practiceAreas, setPracticeAreas] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);

  useEffect(() => {
    const fetchLawyers = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('users')
          .select('id, full_name, avatar_url, bar_number, status, lawyer_profile')
          .eq('role', 'lawyer')
          .eq('status', 'active')
          .eq('onboarding_completed', true);

        if (error) throw error;

        const typedLawyers = (data || []) as Lawyer[];
        setLawyers(typedLawyers);

        const areas = Array.from(new Set(typedLawyers.flatMap(lawyer => lawyer.lawyer_profile?.practiceAreas || []))).sort();
        setPracticeAreas(areas);

        const uniqueLocations = Array.from(new Set(typedLawyers.map(lawyer => lawyer.lawyer_profile?.location).filter(Boolean) as string[])).sort();
        setLocations(uniqueLocations);
      } catch (error) {
        console.error('Error fetching lawyers:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLawyers();
  }, []);

  const filteredLawyers = lawyers.filter((lawyer) => {
    const profile = lawyer.lawyer_profile;
    const matchesSearch = lawyer.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile?.tagline?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile?.practiceAreas?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesLocation = !selectedLocation || profile?.location === selectedLocation;
    const matchesSpecialties = selectedSpecialties.length === 0 || selectedSpecialties.some(spec => profile?.practiceAreas?.includes(spec));

    return matchesSearch && matchesLocation && matchesSpecialties;
  });

  if (loading) {
    return (
      <ProtectedRoute requiredRole="client">
        <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Scanning Legal Network...</p>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="client">
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 p-8 pb-20">
        <div className="max-w-7xl mx-auto space-y-12">

          {/* Hero Section */}
          <div className="text-center space-y-6 max-w-3xl mx-auto py-10">
            <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-blue-600/10 text-blue-600 dark:text-blue-400 font-black text-xs uppercase tracking-[0.2em] animate-in zoom-in-50">
              <ShieldCheck className="w-4 h-4" />
              Verified Expert Network
            </div>
            <h1 className="text-6xl font-black tracking-tighter text-slate-900 dark:text-white leading-[0.9] italic uppercase">
              Secure Your <span className="text-blue-600">Counsel.</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-lg leading-relaxed">
              Connect with top-tier verified legal professionals. Filter by specialty, jurisdiction, and proven track record.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">

            {/* Filter Sidebar */}
            <div className="lg:col-span-1 space-y-8">

              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <Input
                  placeholder="Expert name or keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-14 pl-12 pr-4 rounded-[24px] bg-white dark:bg-slate-900 border-none shadow-sm font-bold text-sm"
                />
              </div>

              <Card className="border-none shadow-sm dark:bg-slate-900 rounded-[32px] overflow-hidden bg-white">
                <CardHeader className="pb-3 pt-8 px-8">
                  <CardTitle className="text-xs font-black uppercase text-slate-400 tracking-widest italic flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5" /> Jurisdiction
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-8 space-y-1">
                  <button
                    onClick={() => setSelectedLocation('')}
                    className={cn(
                      "w-full text-left px-4 py-3 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest",
                      !selectedLocation ? "bg-blue-600 text-white shadow-lg shadow-blue-500/10" : "text-slate-500 hover:bg-slate-100"
                    )}
                  >
                    All Regions
                  </button>
                  {locations.map((loc) => (
                    <button
                      key={loc}
                      onClick={() => setSelectedLocation(loc)}
                      className={cn(
                        "w-full text-left px-4 py-3 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest",
                        selectedLocation === loc ? "bg-blue-600 text-white shadow-lg shadow-blue-500/10" : "text-slate-500 hover:bg-slate-100"
                      )}
                    >
                      {loc}
                    </button>
                  ))}
                </CardContent>
              </Card>

              <div className="p-8 rounded-[40px] bg-slate-900 text-white space-y-6 relative overflow-hidden group shadow-2xl">
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                  <Gavel className="w-24 h-24" />
                </div>
                <h3 className="text-xl font-black italic tracking-tighter leading-none uppercase">Legal <br /> Matching Engine</h3>
                <p className="text-slate-500 text-xs font-medium leading-relaxed">Our system analyzes practice history to recommend the best representative for your specific case type.</p>
                <Button className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 font-black uppercase tracking-widest text-[10px] border-none shadow-xl">
                  Auto-Match Me
                </Button>
              </div>

            </div>

            {/* Counsel Results */}
            <div className="lg:col-span-3 space-y-8">

              <div className="flex items-center justify-between px-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Inventory identified: <span className="text-slate-900 dark:text-white">{filteredLawyers.length} Verified Counsel</span></p>
                <div className="flex gap-2">
                  <Badge className="bg-emerald-500/10 text-emerald-600 font-black text-[9px] uppercase tracking-widest border border-emerald-500/20">Active Indexing</Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredLawyers.map((lawyer) => (
                  <Card key={lawyer.id} className="border-none shadow-sm dark:bg-slate-900 rounded-[40px] overflow-hidden bg-white group hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-500">
                    <CardContent className="p-10 space-y-8">
                      <div className="flex justify-between items-start">
                        <div className="w-20 h-20 rounded-[32px] bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-3xl font-black italic text-blue-600 shadow-inner group-hover:scale-110 transition-transform">
                          {lawyer.full_name.charAt(0)}
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 justify-end">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span className="text-sm font-black text-slate-900 dark:text-white italic">4.9</span>
                          </div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Verified Expert</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-2xl font-black italic tracking-tighter text-slate-900 dark:text-white uppercase leading-none group-hover:text-blue-600 transition-colors">{lawyer.full_name}</h3>
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest line-clamp-1">{lawyer.lawyer_profile?.tagline || 'Leading Legal Representative'}</p>
                      </div>

                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed italic">
                        {lawyer.lawyer_profile?.bio || 'Experienced legal counsel specializing in high-stakes litigation and strategic advisory.'}
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {lawyer.lawyer_profile?.practiceAreas?.slice(0, 3).map((area) => (
                          <Badge key={area} className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-black text-[9px] uppercase tracking-widest border-none px-3 py-1">
                            {area}
                          </Badge>
                        ))}
                      </div>

                      <div className="pt-8 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">Jurisdiction</p>
                          <div className="flex items-center gap-1.5 text-xs font-black uppercase italic tracking-tighter">
                            <MapPin className="w-3.5 h-3.5 text-rose-500" />
                            {lawyer.lawyer_profile?.location || 'General'}
                          </div>
                        </div>
                        <Button className="rounded-2xl h-12 px-8 bg-slate-900 dark:bg-slate-800 text-white hover:bg-blue-600 font-black uppercase tracking-widest text-[10px] border-none shadow-xl transition-all group-hover:scale-105">
                          Connect Counsel <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {filteredLawyers.length === 0 && (
                  <div className="col-span-full py-32 text-center space-y-6">
                    <Sparkles className="w-20 h-20 mx-auto text-slate-100" />
                    <div className="space-y-2">
                      <h3 className="text-3xl font-black italic tracking-tighter uppercase leading-none">Zero Index Match</h3>
                      <p className="text-slate-500 font-bold text-xs uppercase italic tracking-widest">Adjust your search parameters to find available counsel.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      </div>
    </ProtectedRoute>
  );
}
