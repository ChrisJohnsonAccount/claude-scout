export type WorkModel = 'In-office or hybrid' | 'Remote';
export type PipelineStage = 'New' | 'In Review' | 'Applied' | 'Outreach' | 'Interview' | 'Offer' | 'Rejected' | 'Passed';
export type DigestFrequency = 'daily' | 'every2days' | 'weekdays' | 'weekly';
export type JobSource = 'web_search' | 'manual';
export type Track = 'Management' | 'Individual Contributor';

export const TRACKS: Track[] = ['Management', 'Individual Contributor'];

export const TRACK_COLORS: Record<Track, string> = {
  Management:               'bg-purple-900/60 text-purple-300',
  'Individual Contributor': 'bg-blue-900/60 text-blue-300',
};

const MANAGEMENT_PATTERNS = /\b(vp|svp|evp|director|chief|president)\b|head of/i;

export function classifyTrack(title: string): Track {
  return MANAGEMENT_PATTERNS.test(title) ? 'Management' : 'Individual Contributor';
}

export interface OutreachDraft {
  subject: string;
  body: string;
  savedAt?: string;
}

export interface PipelineEntry {
  id: string;
  title: string;
  company: string;
  location: string;
  workModel: WorkModel;
  employeeCount: string;
  salary: string;
  url: string;
  posted: string;
  addedDate: string;
  stage: PipelineStage;
  track: Track;
  fitScore: number;
  fitReason: string;
  snippet: string;
  notes: string;
  outreachDraft?: OutreachDraft;
  source: JobSource;
}

export interface FitWeights {
  roleTypeMatch: number;
  locationWorkModel: number;
  companySize: number;
  salaryRange: number;
  keywordMatch: number;
}

export interface Settings {
  location: string;
  workModel: WorkModel;
  minEmployees: number;
  maxJobCount: number;
  keywords: string;
  exclusions: string;
  roleTypes: string[];
  resumeSummary: string;
  senderName: string;
  senderEmail: string;
  digestFrequency: DigestFrequency;
  digestTime: string;
  fitWeights: FitWeights;
  lastDigestRun?: string;
  nextDigestRun?: string;
}

export const DEFAULT_SETTINGS: Settings = {
  location: 'Austin, TX',
  workModel: 'In-office or hybrid',
  minEmployees: 1000,
  maxJobCount: 5,
  keywords: 'AI, product, strategy',
  exclusions: '',
  roleTypes: [
    'AI Product Manager',
    'AI Strategy',
    'AI GTM / Solutions',
    'Head of AI Product',
    'Director/VP of AI',
  ],
  resumeSummary: '',
  senderName: 'Chris',
  senderEmail: '',
  digestFrequency: 'daily',
  digestTime: '08:00',
  fitWeights: {
    roleTypeMatch: 3,
    locationWorkModel: 3,
    companySize: 2,
    salaryRange: 1,
    keywordMatch: 2,
  },
};

export const PIPELINE_STAGES: PipelineStage[] = [
  'New', 'In Review', 'Applied', 'Outreach', 'Interview', 'Offer', 'Rejected', 'Passed',
];

export const STAGE_COLORS: Record<PipelineStage, string> = {
  New:        'bg-blue-900/60 text-blue-300',
  'In Review':'bg-cyan-900/60 text-cyan-300',
  Applied:    'bg-purple-900/60 text-purple-300',
  Outreach:   'bg-yellow-900/60 text-yellow-300',
  Interview:  'bg-orange-900/60 text-orange-300',
  Offer:      'bg-green-900/60 text-green-300',
  Rejected:   'bg-red-900/60 text-red-400',
  Passed:     'bg-gray-800 text-gray-500',
};

export function fitScoreColor(score: number): string {
  if (score >= 8) return 'bg-green-900/60 text-green-300';
  if (score >= 6) return 'bg-amber-900/60 text-amber-300';
  return 'bg-gray-800 text-gray-400';
}
