'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  FileText,
  Users,
  MessageSquare,
  Lock,
  BarChart3,
  Clock,
  Gavel,
  Briefcase,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Building2,
  Scale
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 selection:bg-blue-500 selection:text-white">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-black/[0.03] dark:border-white/[0.03] rounded-[24px] px-8 py-3 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-black italic tracking-tighter uppercase">APNA <span className="text-blue-600">WAQEEL</span></h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost" className="font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 rounded-xl">Sign In</Button>
            </Link>
            <Link href="/auth/signup">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-blue-500/20 px-6">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-24">
        {/* Hero Section */}
        <section className="px-6 py-12 md:py-24">
          <div className="max-w-7xl mx-auto">
            <div className="relative p-12 md:p-24 rounded-[48px] md:rounded-[64px] bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-900 text-white overflow-hidden shadow-2xl border border-white/5">
              <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-[100px]" />
              <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-[100px]" />

              <div className="relative z-10 max-w-3xl space-y-8">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-white font-black text-[9px] uppercase tracking-[0.3em] border border-white/10 backdrop-blur-md">
                  <Sparkles className="w-3 h-3 text-blue-400" />
                  The Next Gen of Legal Operations
                </div>

                <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.85] italic uppercase italic">
                  Manage <br />
                  <span className="text-blue-500 italic">Justice</span> <br />
                  Better.
                </h1>

                <p className="text-slate-400 font-medium text-lg md:text-xl max-w-xl leading-relaxed">
                  The most powerful case management system for modern law firms. Streamline workflows, automate drafting, and grow your practice.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Link href="/auth/signup">
                    <Button className="bg-white text-slate-900 hover:bg-blue-50 font-black rounded-2xl h-14 px-10 border-none shadow-xl transition-all hover:scale-105 uppercase tracking-tight text-sm">
                      Start Free Trial
                    </Button>
                  </Link>
                  <Link href="/auth/login">
                    <Button variant="outline" className="bg-white/5 hover:bg-white/10 text-white font-black rounded-2xl h-14 px-10 border-white/20 backdrop-blur-sm uppercase tracking-tight text-sm">
                      Live Demo <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="absolute right-0 bottom-0 opacity-[0.03] hidden xl:block translate-y-1/4 translate-x-1/4">
                <Gavel className="w-[800px] h-[800px] text-white" />
              </div>
            </div>
          </div>
        </section>

        {/* Stats Strip */}
        <section className="px-6 pb-24">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Cases Managed', value: '50k+', icon: Briefcase, color: 'bg-indigo-600', trend: 'Global' },
                { label: 'Active Lawyers', value: '1,200', icon: Gavel, color: 'bg-blue-600', trend: 'Trusted' },
                { label: 'Success Rate', value: '94%', icon: ShieldCheck, color: 'bg-emerald-600', trend: 'Proven' },
                { label: 'Time Saved', value: '60%', icon: Clock, color: 'bg-rose-600', trend: 'Efficiency' },
              ].map((kpi, i) => (
                <div key={i} className="p-8 rounded-[40px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex flex-col gap-6 shadow-sm group hover:border-blue-500 transition-all">
                  <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg group-hover:scale-110 transition-transform", kpi.color)}>
                    <kpi.icon className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</p>
                      <span className="text-[8px] font-black text-blue-600 uppercase tracking-tighter bg-blue-50 px-2 py-0.5 rounded-full">{kpi.trend}</span>
                    </div>
                    <p className="text-4xl font-black italic text-slate-900 dark:text-white tracking-tighter">{kpi.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="px-6 py-24 bg-slate-50/50 dark:bg-slate-950/50 overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 font-black text-[9px] uppercase tracking-widest border border-blue-100 italic">
                  Core Engine
                </div>
                <h2 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-[0.9]">
                  Engineered for <br />
                  <span className="text-blue-600 italic">Precision.</span>
                </h2>
              </div>
              <p className="text-slate-500 font-medium max-w-sm text-lg">
                Every feature is designed to eliminate cognitive load and let you focus on what matters most: your clients.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: 'Case Management',
                  desc: 'Total oversight of every case file, filing dates, and hearing schedules with high-performance tracking.',
                  icon: FileText,
                  color: 'bg-indigo-600'
                },
                {
                  title: 'Team Dynamics',
                  desc: 'Scale your practice by assigning roles, tracking lawyer output, and optimizing firm-wide resources.',
                  icon: Users,
                  color: 'bg-blue-600'
                },
                {
                  title: 'Live Exchange',
                  desc: 'End-to-end encrypted messaging with clients and chambers staff with real-time push alerts.',
                  icon: MessageSquare,
                  color: 'bg-emerald-600'
                },
                {
                  title: 'Zero-Trust Security',
                  desc: 'Enterprise-grade encryption for all documents and communications. Your client data is a fortress.',
                  icon: Lock,
                  color: 'bg-slate-900'
                },
                {
                  title: 'Deep Analytics',
                  desc: 'Visualize your firm performance with AI-powered forecasting and revenue tracking dashboards.',
                  icon: BarChart3,
                  color: 'bg-blue-600'
                },
                {
                  title: 'Milestone Tracking',
                  desc: 'Never miss a filing deadline with automated court schedule syncing and priority task lists.',
                  icon: Clock,
                  color: 'bg-rose-600'
                }
              ].map((feat, i) => (
                <div key={i} className="group p-10 rounded-[48px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-blue-500 hover:shadow-2xl transition-all h-full flex flex-col">
                  <div className={cn("w-16 h-16 rounded-[24px] flex items-center justify-center text-white mb-8 group-hover:scale-110 transition-transform shadow-xl", feat.color)}>
                    <feat.icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-black italic tracking-tighter uppercase mb-4 group-hover:text-blue-600 transition-colors italic">{feat.title}</h3>
                  <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed italic">
                    {feat.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* User Roles */}
        <section className="px-6 py-32">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-black tracking-tighter uppercase italic text-center mb-16 italic underline decoration-blue-500 decoration-4 underline-offset-8 italic">Tailored Experience</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {[
                {
                  role: 'Chamber Admins',
                  desc: 'Full orbital control over firm dynamics, lawyer performance, and financial analytics.',
                  icon: Building2,
                  accent: 'indigo'
                },
                {
                  role: 'Lawyers',
                  desc: 'Streamlined case view, document automation, and direct client secure channels.',
                  icon: Gavel,
                  accent: 'blue'
                },
                {
                  role: 'Clients',
                  desc: 'Transparent case progress, instant updates, and easy document sharing with legal counsel.',
                  icon: Users,
                  accent: 'emerald'
                }
              ].map((item, i) => (
                <div key={i} className="relative group p-10 rounded-[40px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl transition-all">
                  <div className={cn(
                    "absolute top-0 right-0 w-32 h-32 opacity-5 translate-x-1/2 -translate-y-1/2 group-hover:rotate-12 transition-transform",
                    item.accent === 'indigo' && "text-indigo-600",
                    item.accent === 'blue' && "text-blue-600",
                    item.accent === 'emerald' && "text-emerald-600",
                  )}>
                    <item.icon className="w-full h-full" />
                  </div>
                  <div className="relative z-10 space-y-4 italic">
                    <h4 className="text-xl font-black uppercase tracking-tight italic">{item.role}</h4>
                    <p className="text-slate-500 font-medium leading-relaxed italic">
                      {item.desc}
                    </p>
                    <div className="flex items-center gap-2 text-xs font-black uppercase text-blue-600 tracking-widest pt-2 italic">
                      View Portal <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 py-24">
          <div className="max-w-7xl mx-auto">
            <div className="p-12 md:p-24 rounded-[48px] md:rounded-[64px] bg-blue-600 text-white text-center space-y-10 relative overflow-hidden shadow-2xl shadow-blue-500/40">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <ShieldCheck className="w-64 h-64" />
              </div>
              <div className="relative z-10 max-w-2xl mx-auto space-y-8 italic">
                <h3 className="text-4xl md:text-6xl font-black italic tracking-tighter leading-none uppercase italic">Scale Your <br />Practice Now.</h3>
                <p className="text-blue-100 text-lg font-medium italic">
                  Join the elite law firms that have digitized their operations with our zero-compromise platform.
                </p>
                <Link href="/auth/signup">
                  <Button size="lg" className="bg-white text-blue-600 hover:bg-slate-50 font-black px-12 h-16 rounded-2xl shadow-xl transition-all hover:scale-105 uppercase tracking-widest text-xs">
                    Get Started Now
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="px-6 py-16 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 italic">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 italic">
          <div className="flex items-center gap-2 italic">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center italic">
              <Scale className="w-4 h-4 text-white italic" />
            </div>
            <h1 className="text-lg font-black italic tracking-tighter uppercase italic">APNA <span className="text-blue-600 italic">WAQEEL</span></h1>
          </div>
          <div className="flex flex-wrap justify-center gap-8 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
            <Link href="#" className="hover:text-blue-600 transition-colors">Integrations</Link>
            <Link href="#" className="hover:text-blue-600 transition-colors">Enterprise</Link>
            <Link href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-blue-600 transition-colors">Terms of Service</Link>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
            &copy; 2026 APNA WAQEEL. ALL RIGHTS RESERVED.
          </p>
        </div>
      </footer>
    </div>
  );
}

