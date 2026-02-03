import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Users, MessageSquare, Lock, BarChart3, Clock } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Legal CMS</h1>
          <div className="flex gap-4">
            <Link href="/auth/login">
              <Button variant="outline">Sign In</Button>
            </Link>
            <Link href="/auth/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 py-20">
          <div className="text-center space-y-6">
            <h2 className="text-5xl font-bold">Professional Legal Case Management</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Streamline your law firm operations with our comprehensive case management platform. Manage cases, collaborate with your team, and keep clients informed—all in one place.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/auth/signup">
                <Button size="lg" className="px-8">
                  Start Free Trial
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button size="lg" variant="outline" className="px-8 bg-transparent">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-muted/30 py-20">
          <div className="max-w-7xl mx-auto px-4">
            <h3 className="text-3xl font-bold text-center mb-12">Key Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <FileText className="w-8 h-8 text-primary mb-2" />
                  <CardTitle>Case Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Organize and track all your cases with detailed information, documents, and timelines.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Users className="w-8 h-8 text-primary mb-2" />
                  <CardTitle>Team Collaboration</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Assign cases to lawyers, manage team members, and ensure smooth workflow coordination.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <MessageSquare className="w-8 h-8 text-primary mb-2" />
                  <CardTitle>Real-time Communication</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Chat with clients and team members in real-time with instant notifications.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Lock className="w-8 h-8 text-primary mb-2" />
                  <CardTitle>Secure & Private</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Enterprise-grade security with role-based access control and end-to-end encryption.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <BarChart3 className="w-8 h-8 text-primary mb-2" />
                  <CardTitle>Analytics & Reporting</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Get insights into case progress, team performance, and business metrics.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Clock className="w-8 h-8 text-primary mb-2" />
                  <CardTitle>Task Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Track deadlines, manage tasks, and never miss important case milestones.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Roles Section */}
        <section className="max-w-7xl mx-auto px-4 py-20">
          <h3 className="text-3xl font-bold text-center mb-12">Built for Every Role</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border rounded-lg p-6 space-y-4">
              <h4 className="text-xl font-bold">For Chambers Admins</h4>
              <p className="text-muted-foreground">
                Manage your entire law firm, monitor all cases, track team performance, and oversee operations.
              </p>
            </div>

            <div className="border rounded-lg p-6 space-y-4">
              <h4 className="text-xl font-bold">For Lawyers</h4>
              <p className="text-muted-foreground">
                Focus on your cases, collaborate with colleagues, communicate with clients, and manage deadlines.
              </p>
            </div>

            <div className="border rounded-lg p-6 space-y-4">
              <h4 className="text-xl font-bold">For Clients</h4>
              <p className="text-muted-foreground">
                Track your cases in real-time, receive updates, communicate with your lawyer, and manage documents.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-primary text-primary-foreground py-16">
          <div className="max-w-7xl mx-auto px-4 text-center space-y-6">
            <h3 className="text-3xl font-bold">Ready to Transform Your Law Practice?</h3>
            <p className="text-lg">Join hundreds of law firms using our platform to streamline their operations.</p>
            <Link href="/auth/signup">
              <Button size="lg" className="bg-background text-foreground hover:bg-background/90 px-8">
                Get Started Now
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2026 Legal CMS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
