import React from 'react';
import { Scale, Shield, Landmark, Gavel, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen w-full flex bg-white dark:bg-slate-950 selection:bg-blue-500 selection:text-white">
            {/* Left Side - Brand & Visuals */}
            <div className="hidden lg:flex w-[45%] bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-900 relative overflow-hidden flex-col justify-between p-16 text-white border-r border-white/5">
                {/* Background Effects */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-[100px]" />
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-500/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-[100px]" />

                {/* Content */}
                <div className="relative z-10">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                            <Scale className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-2xl font-black italic tracking-tighter uppercase whitespace-nowrap">
                            APNA <span className="text-blue-500">WAQEEL</span>
                        </h1>
                    </Link>
                    <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 text-slate-400 font-black text-[8px] uppercase tracking-[0.2em] border border-white/10 backdrop-blur-md italic">
                        <Sparkles className="w-3 h-3 text-blue-400" />
                        Enterprise Legal OS
                    </div>
                </div>

                <div className="relative z-10 space-y-12 max-w-lg italic">
                    <h2 className="text-4xl md:text-5xl font-black tracking-tighter leading-[0.9] uppercase italic">
                        The Future <br />
                        <span className="text-blue-500 italic">of Law</span> <br />
                        starts here.
                    </h2>

                    <p className="text-slate-400 font-medium text-lg leading-relaxed">
                        Join the most prestigious legal workspace in Pakistan. Engineered for high-stakes litigation and firm-wide efficiency.
                    </p>

                    <div className="grid grid-cols-1 gap-6 pt-4">
                        <div className="flex items-center gap-4 group">
                            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 backdrop-blur-sm group-hover:bg-blue-600 transition-colors shadow-xl">
                                <Shield className="w-6 h-6 text-blue-400 group-hover:text-white" />
                            </div>
                            <div>
                                <h4 className="text-xs font-black uppercase tracking-widest text-white leading-none">Military-Grade Security</h4>
                                <p className="text-xs text-slate-500 mt-1 uppercase font-bold tracking-tighter">Your data is an encrypted fortress.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 group">
                            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 backdrop-blur-sm group-hover:bg-emerald-600 transition-colors shadow-xl">
                                <Landmark className="w-6 h-6 text-emerald-400 group-hover:text-white" />
                            </div>
                            <div>
                                <h4 className="text-xs font-black uppercase tracking-widest text-white leading-none">Pakistan Compliant</h4>
                                <p className="text-xs text-slate-500 mt-1 uppercase font-bold tracking-tighter">Built for our local legal framework.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 text-[10px] font-black uppercase tracking-widest text-slate-500 italic">
                    © {new Date().getFullYear()} APNA WAQEEL. ALL RIGHTS RESERVED.
                </div>

                {/* Decor */}
                <div className="absolute right-0 bottom-0 opacity-[0.03] translate-y-1/4 translate-x-1/4">
                    <Gavel className="w-[500px] h-[500px] text-white" />
                </div>
            </div>

            {/* Right Side - Forms */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-950">
                <div className="w-full max-w-[480px] space-y-10">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex justify-center mb-12">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <Scale className="w-5 h-5 text-white" />
                            </div>
                            <h1 className="text-xl font-black italic tracking-tighter uppercase whitespace-nowrap">
                                APNA <span className="text-blue-600">WAQEEL</span>
                            </h1>
                        </Link>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-10 md:p-12 rounded-[48px] shadow-sm relative overflow-hidden group hover:border-blue-500 transition-all">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-blue-500/10 transition-colors" />
                        <div className="relative z-10">
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
