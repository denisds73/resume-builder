import { emptyResume, type ResumeData } from '@/types/resume'

let counter = 0
const id = (prefix: string) => `${prefix}-${Date.now()}-${counter++}`

export function sampleResume(): ResumeData {
  return {
    ...emptyResume(),
    personal: {
      firstName: 'Alex',
      lastName: 'Rivera',
      title: 'Senior Software Engineer',
      email: 'alex.rivera@example.com',
      phone: '+1 415 555 0142',
      phoneIsWhatsapp: true,
      whatsapp: '',
      location: 'San Francisco, CA',
      website: 'alexrivera.dev',
      linkedin: 'in/alex-rivera',
      github: 'alexrivera',
      leetcode: '',
    },
    summary:
      'Software engineer with 7+ years building reliable, high-performance web applications. Focus on developer experience, observability, and shipping the boring details that make products feel finished. Comfortable across the stack with a bias toward TypeScript, React, and Postgres.',
    experience: [
      {
        id: id('exp'),
        company: 'Northwind',
        role: 'Senior Software Engineer',
        location: 'Remote',
        startDate: '2023-03',
        endDate: null,
        bullets: [
          'Led a four-engineer team that rebuilt the billing pipeline, cutting reconciliation latency from 12h to under 8 minutes.',
          'Designed an event-sourced audit log used across 14 services; adopted as the company standard within two quarters.',
          'Mentored two engineers from mid-level to senior, both now leading their own initiatives.',
        ],
      },
      {
        id: id('exp'),
        company: 'Lumen Labs',
        role: 'Software Engineer',
        location: 'San Francisco, CA',
        startDate: '2020-08',
        endDate: '2023-02',
        bullets: [
          'Shipped the public API v2 used by 30k+ developers; designed pagination, rate limits, and migration tooling.',
          'Reduced p95 frontend bundle by 38% via route-level code splitting and a switched-on critical-CSS pipeline.',
          'Owned on-call for the data plane; cut paging incidents by 60% in 12 months by killing the top three flaky services.',
        ],
      },
      {
        id: id('exp'),
        company: 'Quill',
        role: 'Founding Engineer',
        location: 'San Francisco, CA',
        startDate: '2018-06',
        endDate: '2020-07',
        bullets: [
          'Built the first version of the editor end-to-end in TypeScript and Postgres; took it from 0 to 12k weekly users.',
          'Wrote the original integration with Stripe Billing; still in production after three pricing iterations.',
        ],
      },
    ],
    education: [
      {
        id: id('edu'),
        school: 'University of California, Berkeley',
        degree: 'B.S.',
        field: 'Computer Science',
        startDate: '2014-09',
        endDate: '2018-05',
        bullets: ['Graduated with honors. Teaching assistant for CS61B (Data Structures) for three semesters.'],
      },
    ],
    skills: [
      {
        id: id('skl'),
        category: 'Languages',
        skills: ['TypeScript', 'Python', 'Go', 'SQL'],
      },
      {
        id: id('skl'),
        category: 'Frontend',
        skills: ['React', 'Next.js', 'Tailwind', 'Vite'],
      },
      {
        id: id('skl'),
        category: 'Backend',
        skills: ['Node.js', 'Postgres', 'Redis', 'gRPC'],
      },
      {
        id: id('skl'),
        category: 'Platform',
        skills: ['AWS', 'Terraform', 'Datadog', 'GitHub Actions'],
      },
    ],
    projects: [
      {
        id: id('prj'),
        name: 'tinyqueue',
        url: 'github.com/alexrivera/tinyqueue',
        bullets: [
          'Open-source job queue library for Postgres; 1.2k stars and used in production by three companies I know about.',
          'Designed for ergonomics: zero ceremony to enqueue, retries and backoff are defaults, observability via OTEL.',
        ],
        tech: ['TypeScript', 'Postgres', 'OpenTelemetry'],
      },
    ],
    certifications: [],
    templateId: 'modern',
  }
}
