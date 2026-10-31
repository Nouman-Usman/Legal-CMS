/**
 * All visible copy for the landing page (`/`). Components read from here; never
 * hardcode copy in JSX. `[DRAFT]` lines and `[BRACKETS]` are placeholders the owner
 * replaces before launch. Facts (feature names, court names) are written as-is.
 */
export const landing = {
    meta: {
        title: 'Apna Waqeel',
        description: '[DRAFT] Case management for chambers, lawyers and clients in Pakistan.',
    },
    brand: { first: 'apna', second: 'waqeel', urdu: 'اپنا وکیل' },
    nav: {
        links: [
            { label: 'Chambers', href: '#chambers' },
            { label: 'Lawyers', href: '#lawyers' },
            { label: 'Clients', href: '#clients' },
        ],
        signIn: { label: 'Sign in', href: '/auth/login' },
        cta: { label: 'Get started', href: '/auth/signup' },
        openMenu: 'Open menu',
        closeMenu: 'Close menu',
        menuTitle: 'Menu',
    },
    hero: {
        eyebrow: 'Case management · Pakistan',
        lines: ['Every case.', 'One'],
        accent: 'file.',
        subhead:
            '[DRAFT] Diaries, WhatsApp threads, cause lists and file folders, gathered into one case file the whole chamber and the client can see.',
        primary: { label: 'Get started', href: '/auth/signup' },
        secondary: { label: 'See how it works', href: '#how-it-works' },
        scraps: {
            diary: ['Diary · [DATE]', '10:00 LHC Ct. [#]', '11:30 Civil Ct.', 'Call [client]'],
            whatsapp: 'Sir, next date kab hai?',
            folder: 'File no. [###]',
            causeList: ['Cause list', 'Sr. 14 · W.P. [####]/26', 'Sr. 15 · C.R. [####]/25'],
        },
        card: {
            ariaLabel: 'Example case file',
            label: 'Case file',
            number: 'W.P. [####]/26',
            title: ['[Petitioner] v.', '[Respondent]'],
            rows: [
                { term: 'Next hearing', value: '[DATE] · 10:15', accent: true },
                { term: 'Court', value: 'Lahore High Court', accent: false },
                { term: 'Documents', value: '[#] files', accent: false },
                { term: 'Client', value: 'Notified', accent: false },
            ],
        },
    },
    problem: {
        eyebrow: 'Where cases stall',
        title: 'Where do cases get lost?',
        stops: ['Client walks in', 'Filing', 'Hearings', 'Judgment'],
        today: {
            label: 'Today',
            title: '[DRAFT] The diary is the system.',
            body: '[Short line on how chambers run cases today: paper diaries, WhatsApp, checking cause lists by hand.]',
            chips: ['Paper diary', 'WhatsApp threads', 'Missed dates', 'Files in cabinets'],
        },
        withUs: {
            label: 'With Apna Waqeel',
            title: '[DRAFT] Every case, one file.',
            body: '[Short line on what changes: one case file everyone shares, hearing reminders, clients see status themselves.]',
            chips: ['Hearing reminders', 'Shared case file', 'Client portal', 'Drafting templates'],
        },
    },
    journey: {
        eyebrow: 'The case lifecycle',
        title: 'How a case moves.',
        intro: '[DRAFT, 1-2 lines] From the first meeting to the final order, every step lives in the same case file.',
        steps: [
            { title: 'Intake', body: '[Client details, conflict check, engagement]' },
            { title: 'Filing', body: '[Drafting from templates, court, case number]' },
            { title: 'Hearings', body: '[Dates, reminders, adjournments, notes]' },
            { title: 'Orders', body: '[Orders, judgments, next steps]' },
            { title: 'Closure', body: '[Billing, archive, appeal if any]' },
        ],
    },
    audiences: {
        eyebrow: 'One system, three sides',
        title: 'Built for every side of the case.',
        backLabel: 'Card flipping in',
        cards: [
            {
                id: 'chambers',
                label: '01 · For chambers',
                title: ['Run the', 'firm.'],
                features: ['Lawyer roster and case assignment', 'Firm-wide hearing calendar', 'Oversight of every open case', 'Invite lawyers by email'],
                cta: { label: 'Set up your chamber', href: '/auth/signup?role=chamber_admin' },
                secondary: null,
            },
            {
                id: 'lawyers',
                label: '02 · For lawyers',
                title: ['Run the', 'cases.'],
                features: ['Case files, hearings and tasks', 'Drafting from legal templates', 'Case law research', 'Messages with clients'],
                cta: { label: '[DRAFT] Practising on your own? Start your chamber.', href: '/auth/signup?role=chamber_admin' },
                secondary: { label: '[DRAFT] Invited by your chamber? Sign in', href: '/auth/login' },
            },
            {
                id: 'clients',
                label: '03 · For clients',
                title: ['Know where', 'it stands.'],
                features: ['Find a lawyer', 'Case status and next date', 'Secure messages', 'Shared documents'],
                cta: { label: 'Find legal help', href: '/auth/signup?role=client' },
                secondary: null,
            },
        ],
    },
    product: {
        eyebrow: 'The product',
        title: 'Your day, on one screen.',
        example: 'Example data',
        date: '[DATE]',
        heading: "Today's hearings",
        newCase: 'New case',
        nav: ['Today', 'Cases', 'Calendar', 'Drafting', 'Research', 'Messages'],
        columns: ['Time', 'Case', 'Court', 'Stage', 'Lawyer'],
        hearings: [
            { time: '09:30', caseTitle: '[Case title A]', court: 'Lahore High Court', stage: 'Arguments', tone: 'lime', lawyer: '[Lawyer]' },
            { time: '11:00', caseTitle: '[Case title B]', court: 'Civil Court, Lahore', stage: 'Evidence', tone: 'plain', lawyer: '[Lawyer]' },
            { time: '12:15', caseTitle: '[Case title C]', court: 'Sessions Court', stage: 'Adjourned', tone: 'violet', lawyer: '[Lawyer]' },
            { time: '14:00', caseTitle: '[Case title D]', court: 'Family Court', stage: 'Filing', tone: 'plain', lawyer: '[Lawyer]' },
        ],
    },
    getStarted: {
        eyebrow: 'Get started',
        title: ['[DRAFT] Ready before', 'your next hearing.'],
        rows: [
            { label: 'I run a chamber', href: '/auth/signup?role=chamber_admin', note: null },
            {
                label: "I'm a lawyer",
                href: '/auth/signup?role=chamber_admin',
                note: { label: '[DRAFT] Invited by your chamber? Sign in', href: '/auth/login' },
            },
            { label: 'I need a lawyer', href: '/auth/signup?role=client', note: null },
        ],
    },
    footer: {
        columns: [
            {
                title: 'Product',
                links: [
                    { label: 'For chambers', href: '#chambers' },
                    { label: 'For lawyers', href: '#lawyers' },
                    { label: 'For clients', href: '#clients' },
                    { label: 'How it works', href: '#how-it-works' },
                ],
            },
            {
                title: 'Account',
                links: [
                    { label: 'Sign in', href: '/auth/login' },
                    { label: 'Create account', href: '/auth/signup' },
                ],
            },
            {
                title: 'Contact',
                links: [
                    { label: '[EMAIL]', href: '[EMAIL]' },
                    { label: '[PHONE / WHATSAPP]', href: '[PHONE]' },
                ],
            },
        ],
        legal: [
            { label: '[PRIVACY]', href: '[PRIVACY]' },
            { label: '[TERMS]', href: '[TERMS]' },
        ],
        credit: 'Apna Waqeel · A Techfini Solutions product',
    },
    courts: {
        label: 'Courts',
        pause: 'Pause courts marquee',
        play: 'Play courts marquee',
        items: [
            'Supreme Court',
            'Lahore High Court',
            'Sindh High Court',
            'Islamabad High Court',
            'Peshawar High Court',
            'Balochistan High Court',
            'District & Sessions Courts',
            'Family Courts',
        ],
    },
} as const;
