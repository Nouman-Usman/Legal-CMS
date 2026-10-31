import type { Metadata } from 'next';
import { LandingPage } from '@/components/landing/landing-page';
import { landing } from '@/content/landing';

export const metadata: Metadata = {
    title: landing.meta.title,
    description: landing.meta.description,
};

export default function Home() {
    return <LandingPage />;
}
