import React from 'react';
import { Scale, Shield, Landmark } from 'lucide-react';

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen w-full flex">
            {/* Left Side - Brand & Visuals */}
            <div className="hidden lg:flex w-1/2 bg-slate-900 relative overflow-hidden flex-col justify-between p-12 text-white">
                {/* Background Effects */}
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black opacity-80" />
                <div className="absolute -right-20 -top-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-50" />
                <div className="absolute -left-20 bottom-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl opacity-30" />

                {/* Content */}
                <div className="relative z-10">
                    <div className="flex items-center gap-3 text-2xl font-bold tracking-tight">
                        <div className="p-2 bg-primary/20 rounded-lg backdrop-blur-sm border border-primary/20">
                            <Scale className="w-6 h-6 text-primary" />
                        </div>
                        Apna Waqeel
                    </div>
                    <div className="mt-2 text-slate-400 text-sm font-medium tracking-wide uppercase opacity-70">
                        Enterprise Legal Operating System
                    </div>
                </div>

                <div className="relative z-10 space-y-8 max-w-lg">
                    <blockquote className="text-2xl font-medium leading-relaxed">
                        "The leading platform for Pakistan's legal ecosystem. Manage chambers, clients, and courts with enterprise-grade precision."
                    </blockquote>

                    <div className="flex gap-8 pt-4">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-primary font-semibold">
                                <Shield className="w-5 h-5" />
                                <span>Secure</span>
                            </div>
                            <p className="text-sm text-slate-400">Bank-grade data encryption and audit logs.</p>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-primary font-semibold">
                                <Landmark className="w-5 h-5" />
                                <span>Compliant</span>
                            </div>
                            <p className="text-sm text-slate-400">Built for Pakistan's legal framework.</p>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 text-sm text-slate-500">
                    © {new Date().getFullYear()} Apna Waqeel. All rights reserved.
                </div>
            </div>

            {/* Right Side - Forms */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 bg-background">
                <div className="w-full max-w-[440px] space-y-8">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex justify-center mb-8">
                        <div className="flex items-center gap-2 text-xl font-bold">
                            <div className="p-1.5 bg-primary/20 rounded-lg border border-primary/20">
                                <Scale className="w-5 h-5 text-primary" />
                            </div>
                            Apna Waqeel
                        </div>
                    </div>

                    {children}
                </div>
            </div>
        </div>
    );
}
