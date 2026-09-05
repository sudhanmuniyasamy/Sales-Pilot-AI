import { ChangeDetectionStrategy, Component, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import {
  CrmAccount,
  CrmProduct,
  CrmSalesTeam,
  CrmPipelineRecord,
  CrmDataDictionaryItem,
  INITIAL_ACCOUNTS,
  INITIAL_PRODUCTS,
  INITIAL_SALES_TEAMS,
  INITIAL_PIPELINE_DATA,
  INITIAL_DATA_DICTIONARY,
} from './crm-dataset.data';
import { CurrencyInfo, INITIAL_CURRENCIES, formatWithCurrency } from './currency-data';
import { generateExecutiveBriefPdf } from './executive-brief-pdf';

export interface BentoStatCard {
  label: string;
  value: string;
  previousWeekVal: string;
  weekOverWeekPct: number;
  weekOverWeekFormatted: string;
  deltaPositive: boolean;
  deltaLabel: string;
  comparisonBaseline: string;
  sparklines: number[];
  historicalWeekly: { week: string; val: string; pct: number }[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: string;
  modelUsed?: string;
}

export type BotRole = 'cro_strategist' | 'meddpicc_auditor' | 'outreach_specialist' | 'revenue_scientist';

export interface BotPersona {
  id: BotRole;
  name: string;
  title: string;
  icon: string;
  color: string;
  description: string;
  systemInstruction: string;
  recommendedModel: 'gemini-3.5-flash' | 'gemini-3.1-pro-preview' | 'gemini-3.1-flash-lite';
  starterPrompts: string[];
}

export interface DecisionMaker {
  id: string;
  name: string;
  role: string;
  buyingRole?: 'Champion' | 'Economic Buyer' | 'Technical Evaluator' | 'Security / Legal' | 'Blocker' | 'Influencer';
  sentiment?: 'Positive' | 'Neutral' | 'Skeptical';
  action: string;
  time: string;
  avatar: string;
  topPct: string;
  leftPct: string;
  email?: string;
  phone?: string;
  linkedIn?: string;
}

export interface ActivityEvent {
  id: string;
  type: 'email' | 'meeting' | 'signal' | 'doc' | 'stage' | 'call' | 'note';
  title: string;
  description: string;
  time: string;
  icon: string;
  badgeColor: string;
  author?: string;
}

export interface MeddpiccCriteria {
  metrics: boolean;
  economicBuyer: boolean;
  decisionCriteria: boolean;
  decisionProcess: boolean;
  paperProcess: boolean;
  identifyPain: boolean;
  identifiedPain?: boolean;
  champion: boolean;
  competition: boolean;
}

export interface DealDocument {
  id: string;
  name: string;
  title?: string;
  type: string;
  size: string;
  updated: string;
  uploadedAt?: string;
  status: 'Approved' | 'In Review' | 'Draft' | 'Signed' | 'Pending Review';
  downloadUrl?: string;
}

export interface DealHealthHistoryEntry {
  id: string;
  timestamp: string;
  dateLabel: string;
  health: 'Healthy' | 'Warning' | 'At Risk' | 'Accelerating';
  previousHealth?: 'Healthy' | 'Warning' | 'At Risk' | 'Accelerating';
  score: number;
  previousScore?: number;
  scoreDelta?: number;
  stage: string;
  trigger: string;
  triggerType: 'meddpicc_upgrade' | 'meddpicc_downgrade' | 'signal_spike' | 'manual_override' | 'stage_advance';
  meddpiccDelta?: string;
  addedCriteria?: string[];
  removedCriteria?: string[];
  criteriaCount: number;
  keyDrivers: string[];
  author: string;
  summaryNotes: string;
}

export interface Lead {
  id: string;
  name: string;
  company: string;
  dealValue: string;
  numericArr: number;
  score: number;
  stage: 'New' | 'Discovery' | 'Evaluation' | 'Negotiating' | 'Closed';
  status: 'New' | 'Engaged' | 'Negotiating' | 'Closed';
  aiSuggestion: string;
  lastContact: string;
  industry: string;
  region: 'North America' | 'EMEA' | 'APAC' | 'LATAM';
  email: string;
  phone: string;
  owner: string;
  signalsCount: number;
  stakeholders: DecisionMaker[];
  timeline: ActivityEvent[];
  notes: string[];
  engagementVelocity: string;
  closeProbability: number;
  daysInStage: number;
  dealHealth: 'Healthy' | 'Warning' | 'At Risk' | 'Accelerating';
  meddpicc?: MeddpiccCriteria;
  documents?: DealDocument[];
  healthHistory?: DealHealthHistoryEntry[];
}

export interface PipelinePoint {
  month: string;
  actual?: number;
  forecast?: number;
  label: string;
  x: number;
  y: number;
  isForecast: boolean;
  value: number;
  momGrowthPct: number;
  velocityIntensity: 'normal' | 'elevated' | 'spike';
  benchmarkVariancePct: number;
  spikeBadge?: string;
  velocitySpeedScore: number;
  barX?: number;
  barY?: number;
  cumX?: number;
  cumY?: number;
}

export interface LocalizedFilter {
  id: string;
  name: string;
  code: string;
  category: 'region' | 'industry';
  totalPipelineUsd: number;
  modelTargetDeltaUsd: number;
  isDeltaPositive: boolean;
  projectedQ3Usd: number;
  confidence: string;
  avgCycle: string;
  growthRate: string;
  activeDeals: number;
  monthlyValues: { month: string; value: number; isForecast: boolean }[];
  insightHeadline: string;
  insightDescription: string;
  topDrivers: string[];
}

export interface ModelDriftFeatureDriver {
  featureName: string;
  category: 'behavioral' | 'stakeholder' | 'cycle' | 'firmographic';
  baselineWeight: number;
  currentObservedWeight: number;
  driftPercentage: number;
  driftDirection: 'decay' | 'surge' | 'stable';
  significance: 'High' | 'Medium' | 'Low';
  description: string;
}

export interface ModelDriftTelemetry {
  status: 'calibrated' | 'warning' | 'critical';
  historicalWinRateBaseline: number;
  currentObservedWinRate: number;
  driftDeltaPct: number;
  populationStabilityIndex: number;
  pValue: number;
  confidenceInterval: string;
  sampleVectorsEvaluated: number;
  activePipelineEvaluated: number;
  lastCalibrationTime: string;
  driftCohortRisk: string;
  featureDrivers: ModelDriftFeatureDriver[];
}

export interface SalesRep {
  id: string;
  name: string;
  avatar: string;
  role: string;
  quota: string;
  attainmentPct: number;
  closedArr: string;
  activePipeline: string;
  winRate: string;
  avgCycle: string;
  dealsCount: number;
}

export interface SequenceCadence {
  id: string;
  name: string;
  targetTier: string;
  stepsCount: number;
  activeEnrollments: number;
  replyRate: string;
  status: 'Active' | 'Paused';
  description: string;
  triggerEvent: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [CommonModule, MatIconModule, ReactiveFormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
  host: {
    '(window:keydown)': 'handleGlobalKeydown($event)',
  },
})
export class App implements OnInit, OnDestroy {
  readonly Math = Math;
  readonly activeTab = signal<'dashboard' | 'leads' | 'analytics' | 'sequences' | 'settings' | 'profile' | 'dataset' | 'copilot' | 'auth'>('auth');
  readonly mobileMenuOpen = signal<boolean>(false);
  readonly isAnalyzing = signal<boolean>(false);
  readonly showNewLeadModal = signal<boolean>(false);
  readonly showLeadDrawer = signal<boolean>(false);
  readonly showEmailGeneratorModal = signal<boolean>(false);
  readonly activeDrawerLead = signal<Lead | null>(null);
  readonly generatedEmailContent = signal<{ subject: string; body: string } | null>(null);
  readonly isGeneratingEmail = signal<boolean>(false);

  // =========================================================================
  // MULTI-CURRENCY & DAILY LIVE FX EXCHANGE RATE ENGINE (2-HOUR AUTO-SYNC)
  // =========================================================================
  readonly currenciesList = signal<CurrencyInfo[]>(INITIAL_CURRENCIES);
  readonly selectedCurrencyCode = signal<string>('USD');
  readonly selectedCurrency = computed<CurrencyInfo>(() => {
    const code = this.selectedCurrencyCode();
    return this.currenciesList().find((c) => c.code === code) || this.currenciesList()[0];
  });
  readonly showCurrencyModal = signal<boolean>(false);
  readonly showCurrencyDropdown = signal<boolean>(false);
  readonly dropdownCurrencySearch = signal<string>('');
  readonly currencySearchQuery = signal<string>('');
  readonly currencyRegionFilter = signal<'all' | 'North America' | 'Europe' | 'Asia Pacific' | 'Middle East' | 'South America' | 'Africa' | 'Central America' | 'Central Asia'>('all');
  readonly isSyncingRates = signal<boolean>(false);
  readonly lastFxSyncTime = signal<string>(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  readonly nextFxSyncTime = signal<string>(new Date(Date.now() + 7200000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  readonly fxSyncSource = signal<string>('Open Exchange Rates (Live Interbank Feed)');
  readonly currencyAutoSyncFrequency = signal<'2h' | '1h' | '30m' | '5m' | 'daily'>('2h');

  // Quick Currency Converter Calculator State
  readonly currencyConverterAmount = signal<number>(100000);
  readonly currencyConverterFromCode = signal<string>('USD');
  readonly currencyConverterToCode = signal<string>('EUR');

  readonly dropdownFilteredCurrencies = computed(() => {
    const q = this.dropdownCurrencySearch().toLowerCase().trim();
    const all = this.currenciesList();
    if (!q) return all;
    return all.filter((c) =>
      c.code.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.country.toLowerCase().includes(q) ||
      c.symbol.toLowerCase().includes(q)
    );
  });

  readonly popularCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'INR', 'SGD', 'CNY', 'CHF'];

  readonly filteredCurrencies = computed(() => {
    const q = this.currencySearchQuery().toLowerCase().trim();
    const region = this.currencyRegionFilter();
    const all = this.currenciesList();
    return all.filter((c) => {
      const matchesSearch =
        !q ||
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q) ||
        c.symbol.toLowerCase().includes(q) ||
        c.region.toLowerCase().includes(q);
      const matchesRegion = region === 'all' || c.region === region;
      return matchesSearch && matchesRegion;
    });
  });

  readonly fxTickerPairs = computed(() => {
    const list = this.currenciesList();
    return list.filter((c) => c.code !== 'USD').slice(0, 10);
  });

  readonly currencyConverterResult = computed(() => {
    const fromCode = this.currencyConverterFromCode();
    const toCode = this.currencyConverterToCode();
    const amount = this.currencyConverterAmount();
    const list = this.currenciesList();

    const fromCurr = list.find((c) => c.code === fromCode) || list[0];
    const toCurr = list.find((c) => c.code === toCode) || list[1];

    const inUsd = amount / (fromCurr.rate || 1);
    const converted = inUsd * toCurr.rate;
    const rateRatio = toCurr.rate / (fromCurr.rate || 1);

    return {
      fromCurr,
      toCurr,
      amount,
      converted,
      convertedFormatted: formatWithCurrency(inUsd, toCurr, false),
      rateRatio: rateRatio.toFixed(4),
      inverseRatio: (1 / (rateRatio || 1)).toFixed(4),
    };
  });

  // =========================================================================
  // USER AUTHENTICATION & ACCESS CONTROL (SIGN IN / SIGN UP)
  // =========================================================================
  readonly isAuthenticated = signal<boolean>(false);
  readonly authMode = signal<'signin' | 'signup' | 'forgot_password'>('signin');
  readonly authLoading = signal<boolean>(false);
  readonly authError = signal<string | null>(null);
  readonly authSuccessMessage = signal<string | null>(null);
  readonly showPassword = signal<boolean>(false);
  readonly showConfirmPassword = signal<boolean>(false);

  // Sign In Form Controls (Empty by default — no dummy accounts)
  readonly signInEmail = new FormControl('', { nonNullable: true });
  readonly signInPassword = new FormControl('', { nonNullable: true });
  readonly signInRememberMe = signal<boolean>(false);

  readonly userInitials = computed<string>(() => {
    const name = this.userProfile().name.trim();
    if (!name) return 'U';
    const parts = name.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  });

  // Sign Up Form Controls
  readonly signUpFullName = new FormControl('', { nonNullable: true });
  readonly signUpWorkEmail = new FormControl('', { nonNullable: true });
  readonly signUpCompany = new FormControl('', { nonNullable: true });
  readonly signUpRole = new FormControl('Director of Strategic Enterprise', { nonNullable: true });
  readonly signUpTerritory = new FormControl('North America Tier-1 Strategic Accounts', { nonNullable: true });
  readonly signUpPassword = new FormControl('', { nonNullable: true });
  readonly signUpConfirmPassword = new FormControl('', { nonNullable: true });
  readonly signUpAgreeTerms = signal<boolean>(true);

  // Forgot Password Control
  readonly forgotPasswordEmail = new FormControl('', { nonNullable: true });

  // Quick Demo Accounts for 1-Click Verification
  readonly demoAccounts = signal<{
    id: string;
    name: string;
    role: string;
    email: string;
    avatar: string;
    company: string;
    quota: string;
    attainment: number;
    initials: string;
    color: string;
  }[]>([
    {
      id: 'alex_cro',
      name: 'Alex Morgan',
      role: 'Chief Revenue Officer (Full Admin)',
      email: 'alex.morgan@salespilot.ai',
      avatar: 'AM',
      company: 'Sales Pilot Global HQ',
      quota: '$4,800,000',
      attainment: 67.5,
      initials: 'AM',
      color: '#A9772D',
    },
    {
      id: 'sarah_ae',
      name: 'Sarah Chen',
      role: 'Principal Enterprise AE (APAC & High-Tech)',
      email: 'sarah.chen@salespilot.ai',
      avatar: 'SC',
      company: 'Sales Pilot APAC',
      quota: '$3,200,000',
      attainment: 88.4,
      initials: 'SC',
      color: '#0B6B53',
    },
    {
      id: 'elena_emea',
      name: 'Elena Ross',
      role: 'Senior Enterprise Strategist (EMEA)',
      email: 'elena.ross@salespilot.ai',
      avatar: 'ER',
      company: 'Sales Pilot EMEA Ltd',
      quota: '$2,800,000',
      attainment: 74.2,
      initials: 'ER',
      color: '#6B4B8A',
    },
    {
      id: 'jason_growth',
      name: 'Jason Vance',
      role: 'Mid-Market & Velocity Sales Lead',
      email: 'jason.vance@salespilot.ai',
      avatar: 'JV',
      company: 'Sales Pilot Americas',
      quota: '$1,950,000',
      attainment: 92.1,
      initials: 'JV',
      color: '#2563EB',
    },
  ]);

  // =========================================================================
  // MULTI-TURN GEMINI CHATBOT & AI REVENUE COPILOT STATE
  // =========================================================================
  readonly chatInputControl = new FormControl('');
  readonly isChatLoading = signal<boolean>(false);
  readonly includePipelineContext = signal<boolean>(true);
  readonly selectedGeminiModel = signal<'gemini-3.5-flash' | 'gemini-3.1-pro-preview' | 'gemini-3.1-flash-lite'>('gemini-3.5-flash');
  readonly selectedBotRole = signal<BotRole>('cro_strategist');
  readonly showFloatingCopilot = signal<boolean>(false);
  readonly chatErrorMessage = signal<string | null>(null);

  readonly botPersonas = signal<BotPersona[]>([
    {
      id: 'cro_strategist',
      name: 'Chief Revenue Officer',
      title: 'Executive Pipeline & ARR Velocity Strategist',
      icon: 'leaderboard',
      color: '#A9772D',
      recommendedModel: 'gemini-3.5-flash',
      description: 'Provides high-impact executive guidance on ARR pipeline acceleration, stage velocity bottlenecks, negotiation leverage, and board forecast precision.',
      systemInstruction: 'You are the Chief Revenue Officer (CRO) of a premier high-growth B2B enterprise software company. You specialize in pipeline velocity, ARR forecast precision, executive negotiation leverage, deal acceleration, and competitive displacement. Provide strategic, structured, and high-impact guidance. When analyzing deals, cite specific ARR numbers, risk vectors, and recommended next steps.',
      starterPrompts: [
        'Audit our top 5 deals and summarize the biggest risk vectors.',
        'How do we compress the 54-day average sales cycle to under 40 days?',
        'Draft an executive board briefing on our current $3.2M pipeline ARR.',
        'What pricing concession strategy should we use for Google Cloud ($420k ARR)?'
      ]
    },
    {
      id: 'meddpicc_auditor',
      name: 'MEDDPICC Forensics Auditor',
      title: 'Deep Deal Forensics & Risk Detection',
      icon: 'verified_user',
      color: '#0B6B53',
      recommendedModel: 'gemini-3.1-pro-preview',
      description: 'Deep multi-vector qualification audits across Metrics, Economic Buyer, Decision Criteria, Decision Process, Paper Process, Pain, Champion, and Competitor traps.',
      systemInstruction: 'You are an elite MEDDPICC (Metrics, Economic Buyer, Decision Criteria, Decision Process, Paper Process, Identify Pain, Champion, Competition) master auditor and Enterprise Deal Doctor. Conduct forensic inspection of sales opportunities, spot hidden paper process blockers, test champion veracity, and calculate accurate win probabilities. Break your answers down into rigorous MEDDPICC categories.',
      starterPrompts: [
        'Run a deep MEDDPICC audit on Nexus Health Systems and identify paper process risks.',
        'Evaluate our champion strength at Apex Capital and suggest test questions.',
        'Analyze competitor battlecard against LegacyERP for CloudScale deal.',
        'Which deals are missing an Economic Buyer sign-off this quarter?'
      ]
    },
    {
      id: 'outreach_specialist',
      name: 'Rapid Outreach & Objection Handler',
      title: 'Ultra-Fast Cadences & Objection Handling',
      icon: 'bolt',
      color: '#6B4B8A',
      recommendedModel: 'gemini-3.1-flash-lite',
      description: 'Instantly crafts tailored cold emails, executive follow-ups, re-engagement cadences, and battle-tested responses to tough prospect objections.',
      systemInstruction: 'You are a world-class enterprise sales copywriter and rapid objection handler. You generate crisp, high-converting cold outreach, executive re-engagement emails, multi-touch cadences, and battle-tested responses to tough prospect objections (e.g. budget freezes, competitor incumbent loyalty, timing delays). Keep responses sharp, persuasive, and ready to send.',
      starterPrompts: [
        'Generate a high-converting 3-step re-engagement cadence for stalled enterprise prospects.',
        'Draft a response to: "We are freezing software spend until next fiscal year."',
        'Write a compelling CFO ROI justification email for our Enterprise plan.',
        'Create a punchy LinkedIn InMail for a VP of Engineering on developer productivity.'
      ]
    },
    {
      id: 'revenue_scientist',
      name: 'Revenue Scientist & Drift Analyst',
      title: 'Predictive ML Calibration & Telemetry',
      icon: 'psychology',
      color: '#17150F',
      recommendedModel: 'gemini-3.1-pro-preview',
      description: 'Analyzes machine learning win-rate divergence, Population Stability Index, dwell-time telemetry, and feature attribution weights.',
      systemInstruction: 'You are a Principal Revenue Data Scientist specializing in Scikit-Pulse machine learning calibration, Population Stability Index (PSI), concept drift mitigation, and feature attribution analysis. Explain win-rate divergence against historical baselines, analyze dwell-time signals, and prescribe feature weight adjustments.',
      starterPrompts: [
        'Explain why our current win rate (78.2%) drifted -6.4% below historical baseline.',
        'Which feature weights are decaying fastest in our conversion model?',
        'Suggest feature calibration weights to protect forecast confidence.',
        'How does pricing page dwell time correlate with closed-won velocity?'
      ]
    }
  ]);

  readonly activePersona = computed(() => {
    const role = this.selectedBotRole();
    return this.botPersonas().find(p => p.id === role) || this.botPersonas()[0];
  });

  readonly chatMessages = signal<ChatMessage[]>([
    {
      id: 'msg-init',
      role: 'model',
      content: `**Welcome to Sales Pilot AI Executive Copilot.**\n\nI am your **Chief Revenue Officer & Deal Intelligence Strategist**, powered by Google Gemini.\n\nI have real-time visibility into your **14 active enterprise pipeline opportunities ($3.2M ARR)**, MEDDPICC qualification scorecards, stakeholder maps, and machine learning drift telemetry.\n\nHow can I help accelerate your pipeline today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelUsed: 'gemini-3.5-flash',
    }
  ]);

  // Live Auto-Refresh Engine State
  readonly autoRefreshIntervalSeconds = signal<number>(30); // 15, 30, 60, or 0 (paused)
  readonly autoRefreshCountdown = signal<number>(30);
  readonly lastUpdatedTimestamp = signal<string>('Just now');
  readonly lastUpdatedTimeFormatted = signal<string>(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  readonly isRefreshing = signal<boolean>(false);
  private refreshTimer: ReturnType<typeof setInterval> | null = null;

  // Deal Orbit Intelligence Share State
  readonly showDealOrbitShareModal = signal<boolean>(false);
  readonly dealOrbitShareTab = signal<'url' | 'email'>('url');
  readonly dealOrbitShareExpiry = signal<'7d' | '30d' | 'never'>('7d');
  readonly dealOrbitShareCopied = signal<boolean>(false);
  readonly dealOrbitEmailCopied = signal<boolean>(false);
  readonly dealOrbitToken = signal<string>('orb_sec_9942a_gc420');

  // Multi-Column Table Sort State
  readonly pipelineSortColumn = signal<'company' | 'score' | 'arr' | 'stage' | 'velocity' | 'daysInStage' | 'closeProbability' | 'health' | 'owner' | 'industry'>('score');
  readonly pipelineSortDirection = signal<'asc' | 'desc'>('desc');

  // CRM Dataset Upload & Multi-Table Management State
  readonly crmAccounts = signal<CrmAccount[]>(INITIAL_ACCOUNTS);
  readonly crmProducts = signal<CrmProduct[]>(INITIAL_PRODUCTS);
  readonly crmSalesTeams = signal<CrmSalesTeam[]>(INITIAL_SALES_TEAMS);
  readonly crmPipeline = signal<CrmPipelineRecord[]>(INITIAL_PIPELINE_DATA);
  readonly crmDictionary = signal<CrmDataDictionaryItem[]>(INITIAL_DATA_DICTIONARY);
  readonly datasetActiveTab = signal<'upload' | 'visualizations' | 'pipeline' | 'accounts' | 'teams' | 'products' | 'dictionary'>('upload');
  readonly datasetVisualizationFocus = signal<'all' | 'funnel' | 'sectors' | 'reps' | 'products' | 'territories' | 'meddpicc' | 'cohorts'>('all');
  readonly hoveredScatterRep = signal<{
    agent: string;
    office: string;
    totalArr: number;
    arrFormatted: string;
    wonArr: number;
    wonFormatted: string;
    dealsCount: number;
    winRate: number;
    xPct: number;
    yPct: number;
    radius: number;
    color: string;
  } | null>(null);
  readonly hoveredSectorCard = signal<string | null>(null);
  readonly datasetSearchQuery = signal<string>('');
  readonly datasetStageFilter = signal<string>('all');
  readonly datasetAgentFilter = signal<string>('all');
  readonly datasetSectorFilter = signal<string>('all');
  readonly datasetOfficeFilter = signal<string>('all');
  readonly rawCsvPasteText = signal<string>('');
  readonly isProcessingDataset = signal<boolean>(false);
  readonly isDraggingFile = signal<boolean>(false);
  readonly lastUploadedFileName = signal<string | null>('sales_enterprise_crm_bundle.csv');
  readonly uploadSuccessSummary = signal<{
    opportunitiesCount: number;
    accountsCount: number;
    productsCount: number;
    teamsCount: number;
    totalVolume: string;
    wonVolume: string;
  } | null>(null);

  // Executive Forecast Chart Graph Types and Metric Selection
  readonly pipelineGraphType = signal<'area' | 'bar' | 'cumulative' | 'waterfall'>('area');
  readonly pipelineChartMetric = signal<'arr' | 'winRate' | 'velocity' | 'deals'>('arr');

  // Executive Profile & User State (Populated on login/registration)
  readonly userProfile = signal({
    name: '',
    title: 'Enterprise Member',
    email: '',
    phone: '+1 (415) 890-4100',
    location: 'San Francisco, CA (HQ)',
    timezone: 'Pacific Time (PT - America/Los_Angeles)',
    role: 'Global Enterprise Sales Lead (RBAC: Full Admin)',
    quotaTarget: '$4,800,000',
    closedYtd: '$3,240,000',
    attainment: 67.5,
    dealsCount: 18,
    winRate: 82.4,
    avgSalesCycle: '24 days',
    avgDealSize: '$180,000',
    pipelineManaged: '$8.6M',
    territory: 'North America Tier-1 Strategic Accounts & EMEA High-Tech',
    autoDraftEmail: true,
    slackNotifications: true,
    weeklyForecastEmail: true,
    twoFactorEnabled: true,
  });
  readonly isEditingProfile = signal<boolean>(false);

  readonly toastMessage = signal<string | null>(null);
  readonly selectedStakeholder = signal<DecisionMaker | null>(null);
  readonly hoveredPoint = signal<PipelinePoint | null>(null);

  // Advanced CRM Signals & Filter Modes
  readonly showCommandPalette = signal<boolean>(false);
  readonly commandSearchQuery = signal<string>('');
  readonly leadHealthFilter = signal<'all' | 'healthy' | 'warning' | 'at_risk' | 'accelerating'>('all');
  readonly drawerActiveTab = signal<'overview' | 'meddpicc' | 'health-timeline' | 'stakeholders' | 'timeline' | 'documents'>('overview');
  readonly healthTimelineFilter = signal<'all' | 'shifts_only' | 'upgrades' | 'risks'>('all');
  readonly emailTone = signal<'executive' | 'technical' | 'urgent' | 'security'>('executive');
  readonly showDocPreviewModal = signal<DealDocument | null>(null);

  // AI Model Drift & Historical Win-Rate Baseline Telemetry State
  readonly modelDriftScenario = signal<'calibrated' | 'moderate_drift' | 'critical_drift'>('moderate_drift');
  readonly showModelDriftModal = signal<boolean>(false);
  readonly isDriftRecalibrating = signal<boolean>(false);
  readonly modelDriftLastCalibrated = signal<string>('24m ago');

  readonly modelDriftTelemetry = computed<ModelDriftTelemetry>(() => {
    const scenario = this.modelDriftScenario();
    const leadsCount = this.leads().length;
    const lastCal = this.modelDriftLastCalibrated();

    if (scenario === 'calibrated') {
      return {
        status: 'calibrated',
        historicalWinRateBaseline: 84.6,
        currentObservedWinRate: 85.1,
        driftDeltaPct: 0.5,
        populationStabilityIndex: 0.03,
        pValue: 0.42,
        confidenceInterval: 'No Statistically Significant Drift (p = 0.42 > 0.05)',
        sampleVectorsEvaluated: 14200,
        activePipelineEvaluated: leadsCount,
        lastCalibrationTime: lastCal,
        driftCohortRisk: 'Feature distributions well-aligned within 1.2 standard deviations of baseline.',
        featureDrivers: [
          {
            featureName: 'Pricing Page Dwell Time',
            category: 'behavioral',
            baselineWeight: 0.35,
            currentObservedWeight: 0.36,
            driftPercentage: 2.8,
            driftDirection: 'stable',
            significance: 'Low',
            description: 'Dwell signals on enterprise pricing tiers accurately track historical closed-won models.',
          },
          {
            featureName: 'Decision-Maker Touch Frequency',
            category: 'stakeholder',
            baselineWeight: 3.4,
            currentObservedWeight: 3.5,
            driftPercentage: 2.9,
            driftDirection: 'stable',
            significance: 'Low',
            description: 'C-level executive engagement pacing is normal and on benchmark.',
          },
          {
            featureName: 'Stage Velocity (Days in Stage)',
            category: 'cycle',
            baselineWeight: 18.2,
            currentObservedWeight: 18.0,
            driftPercentage: -1.1,
            driftDirection: 'stable',
            significance: 'Low',
            description: 'Opportunity progression rate through Evaluation and Negotiation is fully optimized.',
          },
          {
            featureName: 'MEDDPICC Coverage Ratio',
            category: 'firmographic',
            baselineWeight: 0.88,
            currentObservedWeight: 0.91,
            driftPercentage: 3.4,
            driftDirection: 'stable',
            significance: 'Low',
            description: 'Economic buyer & decision criteria confirmation health is at peak fidelity.',
          },
        ],
      };
    }

    if (scenario === 'critical_drift') {
      return {
        status: 'critical',
        historicalWinRateBaseline: 84.6,
        currentObservedWinRate: 70.4,
        driftDeltaPct: -14.2,
        populationStabilityIndex: 0.32,
        pValue: 0.0001,
        confidenceInterval: 'Critical Concept Drift (p < 0.001, PSI > 0.25)',
        sampleVectorsEvaluated: 14200,
        activePipelineEvaluated: leadsCount,
        lastCalibrationTime: lastCal,
        driftCohortRisk: 'High-Tech Tier-1 & EMEA pilot conversion velocity severely decayed. Urgent recalibration required.',
        featureDrivers: [
          {
            featureName: 'MEDDPICC Champion Influence',
            category: 'stakeholder',
            baselineWeight: 0.42,
            currentObservedWeight: 0.21,
            driftPercentage: -50.0,
            driftDirection: 'decay',
            significance: 'High',
            description: 'Active champion validation dropped 50% across mid-flight opportunities.',
          },
          {
            featureName: 'Pricing Page Dwell Time',
            category: 'behavioral',
            baselineWeight: 0.35,
            currentObservedWeight: 0.18,
            driftPercentage: -48.6,
            driftDirection: 'decay',
            significance: 'High',
            description: 'Prospects spend 48% less time reviewing contract SLA & pricing matrix before stalling.',
          },
          {
            featureName: 'Stage Velocity (Days in Stage)',
            category: 'cycle',
            baselineWeight: 18.2,
            currentObservedWeight: 31.8,
            driftPercentage: 74.7,
            driftDirection: 'surge',
            significance: 'High',
            description: 'Average negotiation duration lengthened by +13.6 days over historical baseline.',
          },
          {
            featureName: 'Competitor Displacement Resistance',
            category: 'firmographic',
            baselineWeight: 0.28,
            currentObservedWeight: 0.12,
            driftPercentage: -57.1,
            driftDirection: 'decay',
            significance: 'Medium',
            description: 'Increased legacy vendor lock-in hurdles detected in European territories.',
          },
        ],
      };
    }

    // Default: 'moderate_drift'
    return {
      status: 'warning',
      historicalWinRateBaseline: 84.6,
      currentObservedWinRate: 78.2,
      driftDeltaPct: -6.4,
      populationStabilityIndex: 0.18,
      pValue: 0.003,
      confidenceInterval: '99.4% Statistical Significance (p = 0.003, PSI = 0.18)',
      sampleVectorsEvaluated: 14200,
      activePipelineEvaluated: leadsCount,
      lastCalibrationTime: lastCal,
      driftCohortRisk: 'Pricing dwell signal decay and +6.4d Evaluation cycle expansion vs historical benchmark.',
      featureDrivers: [
        {
          featureName: 'Pricing Page Dwell Time',
          category: 'behavioral',
          baselineWeight: 0.35,
          currentObservedWeight: 0.22,
          driftPercentage: -37.1,
          driftDirection: 'decay',
          significance: 'High',
          description: 'Prospects spending 37.1% less dwell time on enterprise pricing matrix before demo.',
        },
        {
          featureName: 'Decision-Maker Touch Frequency',
          category: 'stakeholder',
          baselineWeight: 3.4,
          currentObservedWeight: 2.1,
          driftPercentage: -38.2,
          driftDirection: 'decay',
          significance: 'High',
          description: 'Fewer C-suite interactions logged during initial Evaluation stage.',
        },
        {
          featureName: 'Stage Velocity (Days in Stage)',
          category: 'cycle',
          baselineWeight: 18.2,
          currentObservedWeight: 24.6,
          driftPercentage: 35.1,
          driftDirection: 'surge',
          significance: 'Medium',
          description: 'Evaluation stage cycle duration lengthened by 6.4 days above historical baseline.',
        },
        {
          featureName: 'SOC2 & Compliance Packet Dwell',
          category: 'behavioral',
          baselineWeight: 0.18,
          currentObservedWeight: 0.24,
          driftPercentage: 33.3,
          driftDirection: 'surge',
          significance: 'Low',
          description: 'SecOps review duration slightly increased across Tier-1 enterprise accounts.',
        },
      ],
    };
  });

  // Quick Activity Logger State inside 360 Drawer
  readonly newLogType = signal<'call' | 'note' | 'meeting' | 'email'>('call');
  readonly newLogOutcome = signal<string>('Connected - Executive Alignment Positive');
  readonly newLogContent = signal<string>('');

  // CRM Leads View mode
  readonly leadsViewMode = signal<'table' | 'kanban' | 'funnel'>('kanban');
  readonly scoreFilterTier = signal<'all' | 'high' | 'mid' | 'nurture'>('all');
  readonly leadSortBy = signal<'score' | 'arr' | 'recency' | 'health'>('score');

  // Interactive What-If Scenario Modeling for Analytics
  readonly scenarioWinRateUplift = signal<number>(5); // in %
  readonly scenarioCycleReduction = signal<number>(3); // in days
  readonly scenarioExpansionUplift = signal<number>(10); // in %

  // Model Calibration Sliders
  readonly weightPricingDwell = signal<number>(35);
  readonly weightMsaDownload = signal<number>(25);
  readonly weightStakeholderBreadth = signal<number>(20);
  readonly weightEmailVelocity = signal<number>(20);

  // CRM Integrations state
  readonly integrationSalesforce = signal<boolean>(true);
  readonly integrationHubspot = signal<boolean>(true);
  readonly integrationSlack = signal<boolean>(true);
  readonly integrationStripe = signal<boolean>(true);

  readonly searchControl = new FormControl('');
  readonly filterStatus = signal<string>('All');
  readonly filterIndustry = signal<string>('All');

  // Live Scrolling Ticker Events
  readonly tickerEvents = signal([
    { code: 'PRIORITY_01', text: 'Google Cloud: 3 decision-makers revisited enterprise pricing 4x in 48h (Score 98.4)', time: '2m ago' },
    { code: 'MODEL_SYNC', text: 'Scikit-Pulse v4.2 calibrated against 14,200 closed-won vectors (+4.8% precision)', time: '8m ago' },
    { code: 'ACCEL_ALERT', text: 'Nexus Robotics: Executive sponsor engagement velocity +32% (Score 91.0)', time: '24m ago' },
    { code: 'SIGNAL_BURST', text: 'Apex Logistics: API documentation dwell time increased to 14.2 min (Score 82.0)', time: '41m ago' },
    { code: 'SECURITY_AUDIT', text: 'FinServe Global: SOC2 compliance audit packet downloaded by SecOps lead', time: '1h ago' },
  ]);

  // Deal Orbit Core Target
  readonly priorityAccount = signal({
    company: 'Google Cloud',
    arr: '$420,000',
    score: 98.4,
    insight: '3 decision-makers revisited enterprise pricing 4x in 48 hours.',
    confidence: '98.4%',
    stage: 'Contract Negotiation',
  });

  // Deal Orbit Decision Makers
  readonly orbitStakeholders = signal<DecisionMaker[]>([
    {
      id: 'dm-1',
      name: 'Rachel Vance',
      role: 'VP Infrastructure & Cloud Platform',
      action: '4x Enterprise Pricing visits in 48 hours',
      time: '12 min ago',
      avatar: 'RV',
      topPct: '14%',
      leftPct: '78%',
      email: 'rachel.vance@google.com',
      phone: '+1 (415) 890-2100',
      linkedIn: 'linkedin.com/in/rachelvance-cloud',
    },
    {
      id: 'dm-2',
      name: 'David Kowalski',
      role: 'Head of Technical Procurement',
      action: 'Downloaded Enterprise MSA & SLA terms',
      time: '1 hour ago',
      avatar: 'DK',
      topPct: '72%',
      leftPct: '80%',
      email: 'd.kowalski@google.com',
      phone: '+1 (415) 890-4422',
      linkedIn: 'linkedin.com/in/david-kowalski-procure',
    },
    {
      id: 'dm-3',
      name: 'Elena Ross',
      role: 'Chief Risk & Security Officer',
      action: 'Reviewed SOC2 Type II compliance audit packet',
      time: '3 hours ago',
      avatar: 'ER',
      topPct: '68%',
      leftPct: '16%',
      email: 'elena.ross@google.com',
      phone: '+1 (415) 890-9901',
      linkedIn: 'linkedin.com/in/elena-ross-infosec',
    },
  ]);

  // Localized Forecasting Filters & Data
  readonly forecastDimension = signal<'region' | 'industry'>('region');
  readonly selectedFilterId = signal<string>('global');
  readonly showVelocityHeatmap = signal<boolean>(false);

  readonly localizedFilters = signal<LocalizedFilter[]>([
    // Sales Regions
    {
      id: 'global',
      name: 'Global Pipeline',
      code: 'GLOBAL',
      category: 'region',
      totalPipelineUsd: 2420000,
      modelTargetDeltaUsd: 410000,
      isDeltaPositive: true,
      projectedQ3Usd: 3450000,
      confidence: '96.4%',
      avgCycle: '18.2 days',
      growthRate: '+24.6% YoY',
      activeDeals: 42,
      monthlyValues: [
        { month: 'JAN', value: 1.28, isForecast: false },
        { month: 'FEB', value: 1.45, isForecast: false },
        { month: 'MAR', value: 1.72, isForecast: false },
        { month: 'APR', value: 1.98, isForecast: false },
        { month: 'MAY', value: 2.42, isForecast: false },
        { month: 'JUN', value: 2.78, isForecast: true },
        { month: 'JUL', value: 3.12, isForecast: true },
        { month: 'AUG', value: 3.45, isForecast: true },
      ],
      insightHeadline: 'Global Pipeline Trajectory: Accelerated Q3 Conversion Vectors',
      insightDescription: 'Aggregated velocity across 42 active enterprise opportunities. Model predicts 88.4% close probability on Tier-1 enterprise tier proposals before August 31.',
      topDrivers: ['Enterprise Cloud renewals', 'APAC pilot accelerations', 'Shortened MSA cycles'],
    },
    {
      id: 'na',
      name: 'North America (NA)',
      code: 'NA-EAST/WEST',
      category: 'region',
      totalPipelineUsd: 1480000,
      modelTargetDeltaUsd: 290000,
      isDeltaPositive: true,
      projectedQ3Usd: 2150000,
      confidence: '98.1%',
      avgCycle: '15.4 days',
      growthRate: '+31.2% YoY',
      activeDeals: 24,
      monthlyValues: [
        { month: 'JAN', value: 0.74, isForecast: false },
        { month: 'FEB', value: 0.85, isForecast: false },
        { month: 'MAR', value: 1.02, isForecast: false },
        { month: 'APR', value: 1.18, isForecast: false },
        { month: 'MAY', value: 1.48, isForecast: false },
        { month: 'JUN', value: 1.72, isForecast: true },
        { month: 'JUL', value: 1.94, isForecast: true },
        { month: 'AUG', value: 2.15, isForecast: true },
      ],
      insightHeadline: 'North America: Robust Enterprise Dwell Signals & Tier-1 Upsells',
      insightDescription: 'Key decision-maker revisit rate increased by 4.2x in SF/NYC hubs. Contract negotiations with Google Cloud and OpenAI are tracking 6 days ahead of benchmark.',
      topDrivers: ['Google Cloud $420K Tier-1', 'AI Infrastructure demand', 'Executive sponsorship index 9.4/10'],
    },
    {
      id: 'emea',
      name: 'Europe & ME (EMEA)',
      code: 'EMEA-CENTRAL',
      category: 'region',
      totalPipelineUsd: 620000,
      modelTargetDeltaUsd: 85000,
      isDeltaPositive: true,
      projectedQ3Usd: 880000,
      confidence: '94.2%',
      avgCycle: '21.0 days',
      growthRate: '+19.8% YoY',
      activeDeals: 11,
      monthlyValues: [
        { month: 'JAN', value: 0.32, isForecast: false },
        { month: 'FEB', value: 0.38, isForecast: false },
        { month: 'MAR', value: 0.44, isForecast: false },
        { month: 'APR', value: 0.51, isForecast: false },
        { month: 'MAY', value: 0.62, isForecast: false },
        { month: 'JUN', value: 0.71, isForecast: true },
        { month: 'JUL', value: 0.80, isForecast: true },
        { month: 'AUG', value: 0.88, isForecast: true },
      ],
      insightHeadline: 'EMEA Regional: Regulatory Compliance Driving Accelerated Buying Windows',
      insightDescription: 'SOC2 and GDPR compliance audit packet downloads surged 38% across London and Frankfurt enterprise cohorts, unlocking earlier Q3 budget sign-offs.',
      topDrivers: ['FinServe Global SOC2 pack', 'DACH enterprise expansion', 'Cross-border telemetry compliance'],
    },
    {
      id: 'apac',
      name: 'Asia-Pacific (APAC)',
      code: 'APAC-EXP',
      category: 'region',
      totalPipelineUsd: 270000,
      modelTargetDeltaUsd: 32000,
      isDeltaPositive: true,
      projectedQ3Usd: 370000,
      confidence: '91.8%',
      avgCycle: '19.5 days',
      growthRate: '+42.5% YoY',
      activeDeals: 5,
      monthlyValues: [
        { month: 'JAN', value: 0.16, isForecast: false },
        { month: 'FEB', value: 0.18, isForecast: false },
        { month: 'MAR', value: 0.21, isForecast: false },
        { month: 'APR', value: 0.24, isForecast: false },
        { month: 'MAY', value: 0.27, isForecast: false },
        { month: 'JUN', value: 0.30, isForecast: true },
        { month: 'JUL', value: 0.33, isForecast: true },
        { month: 'AUG', value: 0.37, isForecast: true },
      ],
      insightHeadline: 'APAC Fast-Growth: Highest YoY Velocity in AI Robotics & Logistics',
      insightDescription: 'Fastest-growing regional footprint with +42.5% annualized trajectory. Singapore and Tokyo enterprise pipelines exhibit high technical trial completion rates.',
      topDrivers: ['Robotics autonomous pilots', 'Tokyo developer adoption', 'Rapid multi-seat expansion'],
    },
    {
      id: 'latam',
      name: 'Latin America (LATAM)',
      code: 'LATAM-EMG',
      category: 'region',
      totalPipelineUsd: 110000,
      modelTargetDeltaUsd: 18000,
      isDeltaPositive: true,
      projectedQ3Usd: 160000,
      confidence: '89.5%',
      avgCycle: '24.2 days',
      growthRate: '+28.0% YoY',
      activeDeals: 2,
      monthlyValues: [
        { month: 'JAN', value: 0.06, isForecast: false },
        { month: 'FEB', value: 0.07, isForecast: false },
        { month: 'MAR', value: 0.08, isForecast: false },
        { month: 'APR', value: 0.09, isForecast: false },
        { month: 'MAY', value: 0.11, isForecast: false },
        { month: 'JUN', value: 0.12, isForecast: true },
        { month: 'JUL', value: 0.14, isForecast: true },
        { month: 'AUG', value: 0.16, isForecast: true },
      ],
      insightHeadline: 'LATAM Emerging: Early-Stage Fintech & Logistics Momentum',
      insightDescription: 'Targeted entry into São Paulo and Mexico City enterprise hubs. High conversion on localized onboarding kits and Spanish/Portuguese sales cadences.',
      topDrivers: ['Regional fintech pilots', 'Omnichannel logistics APIs', 'Accelerated trial-to-paid'],
    },

    // Industry Sectors
    {
      id: 'all_industries',
      name: 'All Industries',
      code: 'ALL-SECTORS',
      category: 'industry',
      totalPipelineUsd: 2420000,
      modelTargetDeltaUsd: 410000,
      isDeltaPositive: true,
      projectedQ3Usd: 3450000,
      confidence: '96.4%',
      avgCycle: '18.2 days',
      growthRate: '+24.6% YoY',
      activeDeals: 42,
      monthlyValues: [
        { month: 'JAN', value: 1.28, isForecast: false },
        { month: 'FEB', value: 1.45, isForecast: false },
        { month: 'MAR', value: 1.72, isForecast: false },
        { month: 'APR', value: 1.98, isForecast: false },
        { month: 'MAY', value: 2.42, isForecast: false },
        { month: 'JUN', value: 2.78, isForecast: true },
        { month: 'JUL', value: 3.12, isForecast: true },
        { month: 'AUG', value: 3.45, isForecast: true },
      ],
      insightHeadline: 'Cross-Industry Pipeline Overview: Enterprise Cloud Leading Momentum',
      insightDescription: 'Diversified demand with Enterprise Cloud (64%) and Fintech (22%) driving the majority of qualified Q3 pipeline ARR.',
      topDrivers: ['Enterprise SaaS expansion', 'Security compliance urgency', 'AI model instrumentation'],
    },
    {
      id: 'cloud_saas',
      name: 'Enterprise Cloud & SaaS',
      code: 'CLOUD-SAAS',
      category: 'industry',
      totalPipelineUsd: 1290000,
      modelTargetDeltaUsd: 260000,
      isDeltaPositive: true,
      projectedQ3Usd: 1920000,
      confidence: '97.8%',
      avgCycle: '14.8 days',
      growthRate: '+36.4% YoY',
      activeDeals: 18,
      monthlyValues: [
        { month: 'JAN', value: 0.62, isForecast: false },
        { month: 'FEB', value: 0.71, isForecast: false },
        { month: 'MAR', value: 0.86, isForecast: false },
        { month: 'APR', value: 1.01, isForecast: false },
        { month: 'MAY', value: 1.29, isForecast: false },
        { month: 'JUN', value: 1.50, isForecast: true },
        { month: 'JUL', value: 1.71, isForecast: true },
        { month: 'AUG', value: 1.92, isForecast: true },
      ],
      insightHeadline: 'Enterprise Cloud Sector: Peak Dwell Velocity & Multi-Seat Expansion',
      insightDescription: 'Accounts exhibit 3.4x higher pricing revisit frequency. Google Cloud ($420K) and Figma ($45K) driving steady upward trajectory.',
      topDrivers: ['Multi-region deployment SLA', 'Tiered platform discounting', '4x pricing page visits'],
    },
    {
      id: 'fintech',
      name: 'Fintech & Banking',
      code: 'FINTECH-SEC',
      category: 'industry',
      totalPipelineUsd: 550000,
      modelTargetDeltaUsd: 75000,
      isDeltaPositive: true,
      projectedQ3Usd: 760000,
      confidence: '95.1%',
      avgCycle: '22.4 days',
      growthRate: '+22.1% YoY',
      activeDeals: 9,
      monthlyValues: [
        { month: 'JAN', value: 0.30, isForecast: false },
        { month: 'FEB', value: 0.34, isForecast: false },
        { month: 'MAR', value: 0.40, isForecast: false },
        { month: 'APR', value: 0.46, isForecast: false },
        { month: 'MAY', value: 0.55, isForecast: false },
        { month: 'JUN', value: 0.62, isForecast: true },
        { month: 'JUL', value: 0.69, isForecast: true },
        { month: 'AUG', value: 0.76, isForecast: true },
      ],
      insightHeadline: 'Fintech Sector: High ARR Security-Driven Pipeline Ingestions',
      insightDescription: 'High average contract value ($145K) with strong requirement for automated SOC2/audit reporting. FinServe Global lead actively reviewing MSA.',
      topDrivers: ['Automated audit compliance', 'High ACV per opportunity', 'Low churn probability < 1.2%'],
    },
    {
      id: 'ai_robotics',
      name: 'Hardware & AI Robotics',
      code: 'AI-ROBOTICS',
      category: 'industry',
      totalPipelineUsd: 410000,
      modelTargetDeltaUsd: 55000,
      isDeltaPositive: true,
      projectedQ3Usd: 590000,
      confidence: '93.6%',
      avgCycle: '16.9 days',
      growthRate: '+48.0% YoY',
      activeDeals: 8,
      monthlyValues: [
        { month: 'JAN', value: 0.22, isForecast: false },
        { month: 'FEB', value: 0.26, isForecast: false },
        { month: 'MAR', value: 0.31, isForecast: false },
        { month: 'APR', value: 0.35, isForecast: false },
        { month: 'MAY', value: 0.41, isForecast: false },
        { month: 'JUN', value: 0.48, isForecast: true },
        { month: 'JUL', value: 0.53, isForecast: true },
        { month: 'AUG', value: 0.59, isForecast: true },
      ],
      insightHeadline: 'Hardware & AI: Rapid Expansion Velocity & Executive Stakeholder Buy-in',
      insightDescription: 'Nexus Robotics ($310K) lead moving swiftly to final executive committee review with 91.0 score and high engagement telemetry.',
      topDrivers: ['Nexus Robotics Tier-1 deal', 'Executive committee buy-in', 'Custom edge-deployment licensing'],
    },
    {
      id: 'logistics',
      name: 'Logistics & Supply Chain',
      code: 'LOGISTICS-SC',
      category: 'industry',
      totalPipelineUsd: 230000,
      modelTargetDeltaUsd: 28000,
      isDeltaPositive: true,
      projectedQ3Usd: 310000,
      confidence: '90.4%',
      avgCycle: '19.8 days',
      growthRate: '+18.5% YoY',
      activeDeals: 7,
      monthlyValues: [
        { month: 'JAN', value: 0.14, isForecast: false },
        { month: 'FEB', value: 0.16, isForecast: false },
        { month: 'MAR', value: 0.18, isForecast: false },
        { month: 'APR', value: 0.20, isForecast: false },
        { month: 'MAY', value: 0.23, isForecast: false },
        { month: 'JUN', value: 0.26, isForecast: true },
        { month: 'JUL', value: 0.28, isForecast: true },
        { month: 'AUG', value: 0.31, isForecast: true },
      ],
      insightHeadline: 'Logistics Sector: High API Usage Signal Spikes Leading to Fast Ingestion',
      insightDescription: 'Apex Logistics ($160K) and regional freight carriers demonstrating 2.8x higher API documentation dwell time.',
      topDrivers: ['API documentation surge', 'Automated webhook onboarding', 'Fleet telemetry integration'],
    },
  ]);

  readonly activeFilter = computed<LocalizedFilter>(() => {
    const id = this.selectedFilterId();
    const found = this.localizedFilters().find((f) => f.id === id);
    return (
      found ||
      this.localizedFilters()[0]
    );
  });

  readonly availableFiltersForDimension = computed<LocalizedFilter[]>(() => {
    const dim = this.forecastDimension();
    return this.localizedFilters().filter((f) => f.category === dim);
  });

  // Dynamically computed SVG Area Chart points with Lead Velocity Spike Heatmap analysis
  readonly pipelinePoints = computed<PipelinePoint[]>(() => {
    const active = this.activeFilter();
    const xCoords = [40, 115, 190, 265, 340, 415, 490, 565];
    const vals = active.monthlyValues.map((m) => m.value);
    const minVal = Math.min(...vals) * 0.85;
    const maxVal = Math.max(...vals) * 1.15;
    const valRange = maxVal - minVal || 1;
    const historicalBenchmarkRate = 12.0; // 12.0% historical MoM benchmark velocity

    return active.monthlyValues.map((item, idx) => {
      const y = 165 - ((item.value - minVal) / valRange) * 145;
      const formattedLabel = this.formatCurrency(item.value * 1_000_000, true);

      // Calculate Month-over-Month Velocity Growth
      let momGrowthPct = 0;
      if (idx > 0) {
        const prevVal = vals[idx - 1];
        momGrowthPct = prevVal > 0 ? ((item.value - prevVal) / prevVal) * 100 : 0;
      } else {
        momGrowthPct = 12.5; // Baseline seed
      }

      const benchmarkVariancePct = momGrowthPct - historicalBenchmarkRate;

      // Identify velocity spikes relative to historical benchmark
      let velocityIntensity: 'normal' | 'elevated' | 'spike' = 'normal';
      let spikeBadge: string | undefined = undefined;
      const velocitySpeedScore = Math.min(99, Math.round(50 + momGrowthPct * 2));

      if (momGrowthPct >= 18.0) {
        velocityIntensity = 'spike';
        const multiplier = (momGrowthPct / historicalBenchmarkRate).toFixed(1);
        spikeBadge = `🔥 +${momGrowthPct.toFixed(1)}% (${multiplier}x Benchmark)`;
      } else if (momGrowthPct >= 13.5) {
        velocityIntensity = 'elevated';
        spikeBadge = `⚡ +${momGrowthPct.toFixed(1)}% Inflow`;
      } else {
        velocityIntensity = 'normal';
      }

      return {
        month: item.month,
        actual: !item.isForecast ? item.value : undefined,
        forecast: item.isForecast ? item.value : undefined,
        label: item.isForecast ? `${formattedLabel} (FC)` : formattedLabel,
        x: xCoords[idx] ?? (40 + idx * 75),
        y: Math.round(y),
        isForecast: item.isForecast,
        value: item.value,
        momGrowthPct: Number(momGrowthPct.toFixed(1)),
        velocityIntensity,
        benchmarkVariancePct: Number(benchmarkVariancePct.toFixed(1)),
        spikeBadge,
        velocitySpeedScore,
      };
    });
  });

  readonly actualSvgPath = computed(() => {
    const pts = this.pipelinePoints().filter((_, i) => i <= 4);
    if (!pts.length) return '';
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  });

  readonly forecastSvgPath = computed(() => {
    const pts = this.pipelinePoints().filter((_, i) => i >= 4);
    if (!pts.length) return '';
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  });

  readonly actualAreaSvgPath = computed(() => {
    const pts = this.pipelinePoints().filter((_, i) => i <= 4);
    if (!pts.length) return '';
    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const last = pts[pts.length - 1];
    const first = pts[0];
    return `${line} L ${last.x} 185 L ${first.x} 185 Z`;
  });

    readonly forecastAreaSvgPath = computed(() => {
    const pts = this.pipelinePoints().filter((_, i) => i >= 4);
    if (!pts.length) return '';
    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const last = pts[pts.length - 1];
    const first = pts[0];
    return `${line} L ${last.x} 185 L ${first.x} 185 Z`;
  });

  // GRAPH CHOOSE OPTION 1: Monthly Discrete Column / Bar Chart
  readonly pipelineBarItems = computed(() => {
    const pts = this.pipelinePoints();
    const metric = this.pipelineChartMetric();
    const vals = pts.map((p) => {
      if (metric === 'winRate') return p.velocitySpeedScore;
      if (metric === 'velocity') return Math.max(10, 30 - p.momGrowthPct * 0.4);
      if (metric === 'deals') return Math.round(p.value * 12);
      return p.value;
    });
    const maxVal = Math.max(0.1, ...vals) * 1.15;
    const xCoords = [40, 115, 190, 265, 340, 415, 490, 565];

    return pts.map((p, idx) => {
      const v = vals[idx];
      const height = Math.max(10, Math.round((v / maxVal) * 125));
      const barY = 165 - height;
      const barX = xCoords[idx] - 22;

      let formattedVal = p.label;
      if (metric === 'winRate') formattedVal = `${Math.round(v)}%`;
      else if (metric === 'velocity') formattedVal = `${v.toFixed(1)}d`;
      else if (metric === 'deals') formattedVal = `${v} Deals`;

      return {
        ...p,
        metricVal: v,
        formattedVal,
        barX,
        barY,
        barWidth: 44,
        barHeight: height,
        color: p.isForecast ? '#A9772D' : '#0B6B53',
      };
    });
  });

  // GRAPH CHOOSE OPTION 2: Cumulative Step / Trajectory Chart
  readonly pipelineCumulativePoints = computed(() => {
    const pts = this.pipelinePoints();
    let cum = 0;
    const xCoords = [40, 115, 190, 265, 340, 415, 490, 565];
    const cumArr = pts.map((p) => {
      cum += p.value;
      return { ...p, cumVal: cum };
    });
    const maxCum = Math.max(1, cum) * 1.12;

    return cumArr.map((item, idx) => {
      const y = 165 - (item.cumVal / maxCum) * 135;
      const label = this.formatCurrency(item.cumVal * 1_000_000, true);
      return {
        ...item,
        cumX: xCoords[idx],
        cumY: Math.round(y),
        cumLabel: label,
      };
    });
  });

  readonly cumulativeLineSvgPath = computed(() => {
    const pts = this.pipelineCumulativePoints();
    if (!pts.length) return '';
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.cumX} ${p.cumY}`).join(' ');
  });

  readonly cumulativeAreaSvgPath = computed(() => {
    const pts = this.pipelineCumulativePoints();
    if (!pts.length) return '';
    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.cumX} ${p.cumY}`).join(' ');
    const last = pts[pts.length - 1];
    const first = pts[0];
    return `${line} L ${last.cumX} 185 L ${first.cumX} 185 Z`;
  });

  // GRAPH CHOOSE OPTION 3: Waterfall Net Ingestion Delta Bridge
  readonly pipelineWaterfallItems = computed(() => {
    const pts = this.pipelinePoints();
    const maxVal = Math.max(0.1, ...pts.map((p) => p.value)) * 1.2;
    const xCoords = [40, 115, 190, 265, 340, 415, 490, 565];

    return pts.map((p, idx) => {
      const prev = idx > 0 ? pts[idx - 1].value : p.value * 0.82;
      const delta = p.value - prev;
      const deltaFormatted =
        delta >= 0
          ? `+${this.formatCurrency(delta * 1_000_000, true)}`
          : `-${this.formatCurrency(Math.abs(delta) * 1_000_000, true)}`;
      const yTop = 165 - (p.value / maxVal) * 135;
      const yBottom = 165 - (prev / maxVal) * 135;
      const barY = Math.min(yTop, yBottom);
      const barHeight = Math.max(6, Math.abs(yTop - yBottom));
      const barX = xCoords[idx] - 22;

      return {
        month: p.month,
        delta,
        deltaFormatted,
        base: prev,
        total: p.value,
        isForecast: p.isForecast,
        barX,
        barY: Math.round(barY),
        barWidth: 44,
        barHeight: Math.round(barHeight),
        color: p.isForecast ? '#A9772D' : delta >= 0 ? '#0B6B53' : '#9E2A2B',
      };
    });
  });

  getPipelineTooltipLeft(point: PipelinePoint): string {
    const ptX = point.cumX ?? (point.barX != null ? point.barX + 22 : point.x);
    return `${(ptX / 600) * 100}%`;
  }

  getPipelineTooltipTop(point: PipelinePoint): string {
    const ptY = point.cumY ?? (point.barY != null ? point.barY : point.y);
    return `${(ptY / 200) * 100}%`;
  }

  getPipelineTooltipTransform(point: PipelinePoint): string {
    const ptX = point.cumX ?? (point.barX != null ? point.barX + 22 : point.x);
    const ptY = point.cumY ?? (point.barY != null ? point.barY : point.y);

    // Horizontal alignment clamping so the tooltip never overflows card boundaries:
    let translateX = '-50%';
    if (ptX <= 160) {
      // Near left edge (JAN, FEB): shift tooltip rightward so it is fully visible and never clipped
      translateX = '0%';
    } else if (ptX <= 220) {
      translateX = '-15%';
    } else if (ptX >= 450) {
      // Near right edge (JUL, AUG): shift tooltip leftward so it never overflows the right boundary
      translateX = '-100%';
    } else if (ptX >= 390) {
      translateX = '-85%';
    }

    // Vertical positioning:
    // If point is near the top of the chart (ptY <= 70 out of 200), render below point
    const isNearTop = ptY <= 70;
    const translateY = isNearTop ? '16px' : 'calc(-100% - 14px)';

    return `translate(${translateX}, ${translateY})`;
  }

  // 4 Bento Stat Cards with percentage-based WoW trend indicators and historical baselines
  readonly statCards = computed<BentoStatCard[]>(() => {
    const activeArr = 2420000;
    const prevWeekArr = 2115000;
    const netArrDelta = 305000;
    const slippageRisk = 85000;
    const prevSlippage = 97000;
    const slipDelta = 12000;

    return [
      {
        label: 'Active Pipeline',
        value: this.formatCurrency(activeArr),
        previousWeekVal: this.formatCurrency(prevWeekArr),
        weekOverWeekPct: 14.4,
        weekOverWeekFormatted: '+14.4% WoW',
        deltaPositive: true,
        deltaLabel: `vs Prev Week (${this.formatCurrency(prevWeekArr, true)})`,
        comparisonBaseline: `+${this.formatCurrency(netArrDelta)} net new pipeline ARR this week`,
        sparklines: [35, 48, 62, 75, 95],
        historicalWeekly: [
          { week: 'W-3', val: this.formatCurrency(1840000, true), pct: 6.2 },
          { week: 'W-2', val: this.formatCurrency(1980000, true), pct: 7.6 },
          { week: 'W-1', val: this.formatCurrency(2110000, true), pct: 6.5 },
          { week: 'Current', val: this.formatCurrency(2420000, true), pct: 14.4 },
        ],
      },
      {
        label: 'Qualified Deal Velocity',
        value: '18.2 days',
        previousWeekVal: '21.3 days',
        weekOverWeekPct: -14.5,
        weekOverWeekFormatted: '-3.1 days WoW',
        deltaPositive: true,
        deltaLabel: 'vs Prev Week (21.3d)',
        comparisonBaseline: '14.5% faster pipeline progression vs W-1',
        sparklines: [88, 76, 62, 54, 42],
        historicalWeekly: [
          { week: 'W-3', val: '24.1d', pct: -2.1 },
          { week: 'W-2', val: '22.8d', pct: -5.4 },
          { week: 'W-1', val: '21.3d', pct: -6.6 },
          { week: 'Current', val: '18.2d', pct: -14.5 },
        ],
      },
      {
        label: 'Model Win Probability',
        value: '78.6%',
        previousWeekVal: '73.8%',
        weekOverWeekPct: 6.5,
        weekOverWeekFormatted: '+4.8% WoW',
        deltaPositive: true,
        deltaLabel: 'vs Prev Week (73.8%)',
        comparisonBaseline: 'Scikit-Pulse v4.2 calibrated against 14.2k vectors',
        sparklines: [58, 64, 70, 72, 82],
        historicalWeekly: [
          { week: 'W-3', val: '69.4%', pct: 2.1 },
          { week: 'W-2', val: '71.2%', pct: 2.6 },
          { week: 'W-1', val: '73.8%', pct: 3.6 },
          { week: 'Current', val: '78.6%', pct: 6.5 },
        ],
      },
      {
        label: 'Slippage Risk Exposure',
        value: this.formatCurrency(slippageRisk),
        previousWeekVal: this.formatCurrency(prevSlippage),
        weekOverWeekPct: -12.4,
        weekOverWeekFormatted: '-12.4% WoW',
        deltaPositive: true,
        deltaLabel: `vs Prev Week (${this.formatCurrency(prevSlippage, true)})`,
        comparisonBaseline: `Down ${this.formatCurrency(slipDelta, true)} from ${this.formatCurrency(prevSlippage, true)} due to renewed touches`,
        sparklines: [42, 48, 40, 68, 86],
        historicalWeekly: [
          { week: 'W-3', val: this.formatCurrency(110000, true), pct: -4.3 },
          { week: 'W-2', val: this.formatCurrency(104000, true), pct: -5.5 },
          { week: 'W-1', val: this.formatCurrency(97000, true), pct: -6.7 },
          { week: 'Current', val: this.formatCurrency(85000, true), pct: -12.4 },
        ],
      },
    ];
  });

  // Full CRM Lead & Opportunity Database
  readonly leads = signal<Lead[]>([
    {
      id: '1',
      name: 'Rachel Vance',
      company: 'Google Cloud',
      score: 98,
      dealValue: '$420,000',
      numericArr: 420000,
      stage: 'Negotiating',
      status: 'Negotiating',
      aiSuggestion: '3 decision-makers active on pricing. Send tiered expansion agreement.',
      lastContact: '2 min ago',
      industry: 'Cloud Infrastructure',
      region: 'North America',
      email: 'rachel.vance@google.com',
      phone: '+1 (415) 890-2100',
      owner: 'Alex Morgan',
      signalsCount: 14,
      engagementVelocity: 'Extremely High (4.8x avg)',
      closeProbability: 98.4,
      daysInStage: 4,
      dealHealth: 'Accelerating',
      meddpicc: {
        metrics: true,
        economicBuyer: true,
        decisionCriteria: true,
        decisionProcess: true,
        paperProcess: false,
        identifyPain: true,
        champion: true,
        competition: true,
      },
      documents: [
        { id: 'doc-1', name: 'GoogleCloud_Master_Services_Agreement_v3_Redlines.pdf', type: 'PDF Legal', size: '2.4 MB', updated: '2h ago', status: 'In Review' },
        { id: 'doc-2', name: 'Enterprise_Telemetry_SOC2_Type_II_Attestation.pdf', type: 'Security Audit', size: '4.8 MB', updated: 'Yesterday', status: 'Approved' },
        { id: 'doc-3', name: 'SalesPilot_Dedicated_Cluster_Order_Form_v2.pdf', type: 'Commercial', size: '890 KB', updated: '3d ago', status: 'Approved' },
      ],
      notes: [
        'VP Infrastructure confirmed security clearance.',
        'Requested custom SLA for multi-region active replication.',
      ],
      stakeholders: [
        { id: 'dm-1', name: 'Rachel Vance', role: 'VP Infrastructure', buyingRole: 'Champion', sentiment: 'Positive', action: '4x Pricing visits in 48h', time: '12m ago', avatar: 'RV', topPct: '', leftPct: '' },
        { id: 'dm-2', name: 'David Kowalski', role: 'Head Procurement', buyingRole: 'Economic Buyer', sentiment: 'Neutral', action: 'Downloaded MSA redlines', time: '1h ago', avatar: 'DK', topPct: '', leftPct: '' },
        { id: 'dm-3', name: 'Elena Ross', role: 'CISO & Risk Officer', buyingRole: 'Security / Legal', sentiment: 'Positive', action: 'Approved SOC2 audit pack', time: '3h ago', avatar: 'ER', topPct: '', leftPct: '' },
      ],
      timeline: [
        { id: 't-1', type: 'signal', title: 'Pricing Heatmap Surge', description: 'Rachel V. & David K. spent 6.2 mins on Enterprise Tier calculator.', time: '12 min ago', icon: 'visibility', badgeColor: '#A9772D' },
        { id: 't-2', type: 'doc', title: 'Enterprise MSA Ingested', description: 'Legal Redlines received with standard indemnity terms.', time: '2 hours ago', icon: 'description', badgeColor: '#0B6B53' },
        { id: 't-3', type: 'meeting', title: 'Executive Sponsor Sync', description: 'Alex M. hosted 45m architectural alignment review.', time: 'Yesterday', icon: 'groups', badgeColor: '#17150F', author: 'Alex Morgan' },
      ],
      healthHistory: [
        {
          id: 'hh-1-1',
          timestamp: '2 hours ago',
          dateLabel: 'Today, 10:30 AM',
          health: 'Accelerating',
          previousHealth: 'Accelerating',
          score: 98.4,
          previousScore: 92.0,
          scoreDelta: 6.4,
          stage: 'Negotiating',
          trigger: 'MEDDPICC: Competition Neutralized & MSA Redlines Ingested',
          triggerType: 'meddpicc_upgrade',
          meddpiccDelta: '+ Competition (C), + Paper Process (In Flight)',
          addedCriteria: ['Competition (C)'],
          criteriaCount: 7,
          keyDrivers: [
            'David Kowalski (Head Procurement) ingested MSA redlines with approved indemnity clauses',
            'VP Infrastructure confirmed multi-region SLA satisfies enterprise clearance',
            'Evaluated incumbent platforms; selected SalesPilot on predictive ML accuracy'
          ],
          author: 'Alex Morgan (AE)',
          summaryNotes: 'Deal qualification reached 7/8 MEDDPICC criteria. Probability accelerated to 98.4% with executive sign-off in flight.'
        },
        {
          id: 'hh-1-2',
          timestamp: '4 days ago',
          dateLabel: 'Aug 20, 2026',
          health: 'Accelerating',
          previousHealth: 'Healthy',
          score: 92.0,
          previousScore: 78.0,
          scoreDelta: 14.0,
          stage: 'Evaluation',
          trigger: 'MEDDPICC: Economic Buyer & Decision Process Mapped',
          triggerType: 'meddpicc_upgrade',
          meddpiccDelta: '+ Economic Buyer (E), + Decision Process (P)',
          addedCriteria: ['Economic Buyer (E)', 'Decision Process (P)'],
          criteriaCount: 6,
          keyDrivers: [
            'Elena Ross (CISO) approved SOC2 Type II pack and penetration testing summary',
            'David Kowalski aligned on annual commercial terms and discount tier schedule',
            'Decision milestones confirmed: Security Review -> Architecture Board -> Procurement'
          ],
          author: 'Scikit-Pulse ML Engine',
          summaryNotes: 'Health promoted from Healthy to Accelerating following formal Economic Buyer engagement and security clearance.'
        },
        {
          id: 'hh-1-3',
          timestamp: '12 days ago',
          dateLabel: 'Aug 12, 2026',
          health: 'Healthy',
          previousHealth: 'Warning',
          score: 78.0,
          previousScore: 52.0,
          scoreDelta: 26.0,
          stage: 'Discovery',
          trigger: 'MEDDPICC: Champion Verified & Decision Criteria Formalized',
          triggerType: 'meddpicc_upgrade',
          meddpiccDelta: '+ Champion (C), + Decision Criteria (D)',
          addedCriteria: ['Champion (C)', 'Decision Criteria (D)'],
          criteriaCount: 4,
          keyDrivers: [
            'Rachel Vance (VP Infrastructure) confirmed as internal champion with executive clout',
            'Decision criteria documented around streaming telemetry latency < 100ms',
            'Technical architecture alignment call completed successfully'
          ],
          author: 'Alex Morgan (AE)',
          summaryNotes: 'Health upgraded from Warning to Healthy. Multi-threading initialized with engineering stakeholders.'
        },
        {
          id: 'hh-1-4',
          timestamp: '21 days ago',
          dateLabel: 'Aug 3, 2026',
          health: 'Warning',
          previousHealth: 'At Risk',
          score: 52.0,
          previousScore: 35.0,
          scoreDelta: 17.0,
          stage: 'New',
          trigger: 'Discovery Ingestion & Core Pain Identified',
          triggerType: 'meddpicc_upgrade',
          meddpiccDelta: '+ Metrics (M), + Identify Pain (I)',
          addedCriteria: ['Metrics (M)', 'Identify Pain (I)'],
          criteriaCount: 2,
          keyDrivers: [
            'Initial pricing dwell surge detected on enterprise calculators',
            'Quantifiable business impact mapped: $420k ARR pipeline yield'
          ],
          author: 'System Ingestion',
          summaryNotes: 'Opportunity created. Baseline health marked as Warning pending champion identification.'
        }
      ]
    },
    {
      id: '2',
      name: 'Marcus Sterling',
      company: 'Nexus Robotics',
      score: 91,
      dealValue: '$310,000',
      numericArr: 310000,
      stage: 'Negotiating',
      status: 'Negotiating',
      aiSuggestion: 'Executive team buy-in confirmed. Prepare custom multi-seat contract.',
      lastContact: '3 hours ago',
      industry: 'Hardware & AI',
      region: 'North America',
      email: 'm.sterling@nexusbot.ai',
      phone: '+1 (650) 412-9800',
      owner: 'Sarah Chen',
      signalsCount: 9,
      engagementVelocity: 'Very High (3.2x avg)',
      closeProbability: 91.0,
      daysInStage: 6,
      dealHealth: 'Healthy',
      meddpicc: {
        metrics: true,
        economicBuyer: true,
        decisionCriteria: true,
        decisionProcess: false,
        paperProcess: false,
        identifyPain: true,
        champion: true,
        competition: true,
      },
      documents: [
        { id: 'doc-4', name: 'Nexus_Edge_Simulation_Benchmark_Report.pdf', type: 'Technical Spec', size: '6.1 MB', updated: '3h ago', status: 'Approved' },
        { id: 'doc-5', name: 'Mutual_NDA_NexusRobotics_Executed.pdf', type: 'NDA', size: '420 KB', updated: '4d ago', status: 'Approved' },
      ],
      notes: [
        'Edge deployment capability verified in sandbox.',
        'Board sign-off scheduled for upcoming Thursday.',
      ],
      stakeholders: [
        { id: 'dm-20', name: 'Marcus Sterling', role: 'CTO', buyingRole: 'Champion', sentiment: 'Positive', action: 'Ran sandbox load test', time: '3h ago', avatar: 'MS', topPct: '', leftPct: '' },
        { id: 'dm-21', name: 'Anya Sharma', role: 'VP Operations', buyingRole: 'Economic Buyer', sentiment: 'Neutral', action: 'Reviewed SLA specs', time: '5h ago', avatar: 'AS', topPct: '', leftPct: '' },
      ],
      timeline: [
        { id: 't-4', type: 'signal', title: 'Sandbox Load Test Complete', description: 'Processed 500,000 simulated sensor records with 0 drop.', time: '3 hours ago', icon: 'bolt', badgeColor: '#0B6B53' },
        { id: 't-5', type: 'email', title: 'Security Architecture Approved', description: 'CTO confirmed end-to-end telemetry encryption satisfies internal requirements.', time: 'Yesterday', icon: 'mark_email_read', badgeColor: '#0B6B53' },
      ],
      healthHistory: [
        {
          id: 'hh-2-1',
          timestamp: '3 hours ago',
          dateLabel: 'Today, 09:15 AM',
          health: 'Healthy',
          previousHealth: 'Healthy',
          score: 91.0,
          previousScore: 82.0,
          scoreDelta: 9.0,
          stage: 'Negotiating',
          trigger: 'MEDDPICC: Sandbox Validation & Decision Criteria Passed',
          triggerType: 'meddpicc_upgrade',
          meddpiccDelta: '+ Decision Criteria (D), + Competition (C)',
          addedCriteria: ['Decision Criteria (D)', 'Competition (C)'],
          criteriaCount: 6,
          keyDrivers: [
            'Marcus Sterling (CTO) verified 500,000 sensor load test with zero drop',
            'Technical evaluation benchmarks matched edge-deployment specs',
            'End-to-end encryption verified for robotics fleets'
          ],
          author: 'Sarah Chen (AE)',
          summaryNotes: '6 of 8 MEDDPICC criteria validated. Close probability established at 91.0%.'
        },
        {
          id: 'hh-2-2',
          timestamp: '6 days ago',
          dateLabel: 'Aug 18, 2026',
          health: 'Healthy',
          previousHealth: 'Warning',
          score: 82.0,
          previousScore: 64.0,
          scoreDelta: 18.0,
          stage: 'Evaluation',
          trigger: 'MEDDPICC: Economic Buyer (VP Ops) & Mutual NDA Executed',
          triggerType: 'meddpicc_upgrade',
          meddpiccDelta: '+ Economic Buyer (E), + Metrics (M)',
          addedCriteria: ['Economic Buyer (E)', 'Metrics (M)'],
          criteriaCount: 4,
          keyDrivers: [
            'Anya Sharma (VP Operations) joined commercial review meeting',
            'Executed Mutual NDA and approved $310k ARR budget ceiling'
          ],
          author: 'Sarah Chen (AE)',
          summaryNotes: 'Upgraded from Warning to Healthy as Economic Buyer alignment was established.'
        },
        {
          id: 'hh-2-3',
          timestamp: '18 days ago',
          dateLabel: 'Aug 6, 2026',
          health: 'Warning',
          previousHealth: 'At Risk',
          score: 64.0,
          previousScore: 40.0,
          scoreDelta: 24.0,
          stage: 'Discovery',
          trigger: 'MEDDPICC: Core Pain Identified & CTO Champion Engaged',
          triggerType: 'meddpicc_upgrade',
          meddpiccDelta: '+ Identify Pain (I), + Champion (C)',
          addedCriteria: ['Identify Pain (I)', 'Champion (C)'],
          criteriaCount: 2,
          keyDrivers: [
            'Marcus Sterling engaged on autonomous robotics edge orchestration',
            'Identified pain around legacy teleoperation sync delays'
          ],
          author: 'Scikit-Pulse ML Engine',
          summaryNotes: 'Initial qualification established with technical champion.'
        }
      ]
    },
    {
      id: '3',
      name: 'Sarah Jenkins',
      company: 'Netflix Ent.',
      score: 88,
      dealValue: '$115,000',
      numericArr: 115000,
      stage: 'Evaluation',
      status: 'Engaged',
      aiSuggestion: 'High interest in pipeline forecasting. Schedule technical demo.',
      lastContact: '1 day ago',
      industry: 'Media & Streaming',
      region: 'North America',
      email: 'sjenkins@netflix.com',
      phone: '+1 (408) 540-3700',
      owner: 'Jason Vance',
      signalsCount: 6,
      engagementVelocity: 'Moderate-High (+45% WoW)',
      closeProbability: 84.5,
      daysInStage: 8,
      dealHealth: 'Accelerating',
      meddpicc: {
        metrics: true,
        economicBuyer: false,
        decisionCriteria: true,
        decisionProcess: false,
        paperProcess: false,
        identifyPain: true,
        champion: true,
        competition: false,
      },
      documents: [
        { id: 'doc-6', name: 'Netflix_RealTime_Telemetry_Evaluation_Plan.pdf', type: 'Tech Evaluation', size: '1.8 MB', updated: '1d ago', status: 'In Review' },
      ],
      notes: ['Evaluation team testing live webhook dispatching.'],
      stakeholders: [
        { id: 'dm-30', name: 'Sarah Jenkins', role: 'Lead Architect', buyingRole: 'Champion', sentiment: 'Positive', action: 'API Sandbox test', time: '1d ago', avatar: 'SJ', topPct: '', leftPct: '' },
      ],
      timeline: [
        { id: 't-6', type: 'meeting', title: 'Technical Architecture Deep Dive', description: 'Reviewed real-time streaming telemetry schema.', time: '1 day ago', icon: 'videocam', badgeColor: '#17150F' },
      ],
      healthHistory: [
        {
          id: 'hh-3-1',
          timestamp: '1 day ago',
          dateLabel: 'Aug 23, 2026',
          health: 'Accelerating',
          previousHealth: 'Healthy',
          score: 84.5,
          previousScore: 70.0,
          scoreDelta: 14.5,
          stage: 'Evaluation',
          trigger: 'MEDDPICC: Technical Architecture & Champion Buy-in',
          triggerType: 'meddpicc_upgrade',
          meddpiccDelta: '+ Champion (C), + Decision Criteria (D)',
          addedCriteria: ['Champion (C)', 'Decision Criteria (D)'],
          criteriaCount: 4,
          keyDrivers: [
            'Sarah Jenkins (Lead Architect) verified high-throughput event schema',
            'Telemetry evaluation plan approved for streaming pipeline'
          ],
          author: 'Jason Vance (AE)',
          summaryNotes: 'Health upgraded to Accelerating with high engagement on real-time forecasting.'
        },
        {
          id: 'hh-3-2',
          timestamp: '8 days ago',
          dateLabel: 'Aug 16, 2026',
          health: 'Healthy',
          previousHealth: 'Warning',
          score: 70.0,
          previousScore: 46.0,
          scoreDelta: 24.0,
          stage: 'Discovery',
          trigger: 'MEDDPICC: Metrics Quantified & Pain Point Identified',
          triggerType: 'meddpicc_upgrade',
          meddpiccDelta: '+ Metrics (M), + Identify Pain (I)',
          addedCriteria: ['Metrics (M)', 'Identify Pain (I)'],
          criteriaCount: 2,
          keyDrivers: [
            'Quantified $115k ARR annual pipeline yield',
            'Identified core pain around real-time webhook dispatching limits'
          ],
          author: 'Jason Vance (AE)',
          summaryNotes: 'Discovery milestones completed. Qualified into active evaluation.'
        }
      ]
    },
    {
      id: '4',
      name: 'Amara Okafor',
      company: 'Apex Logistics',
      score: 82,
      dealValue: '$160,000',
      numericArr: 160000,
      stage: 'Discovery',
      status: 'New',
      aiSuggestion: 'Spike in API documentation visits. Trigger automated onboarding kit.',
      lastContact: '5 hours ago',
      industry: 'Supply Chain',
      region: 'EMEA',
      email: 'amara@apexlog.com',
      phone: '+44 20 7946 0912',
      owner: 'Elena Ross',
      signalsCount: 5,
      engagementVelocity: 'Accelerating (+62% WoW)',
      closeProbability: 79.2,
      daysInStage: 3,
      dealHealth: 'Healthy',
      meddpicc: {
        metrics: false,
        economicBuyer: false,
        decisionCriteria: true,
        decisionProcess: false,
        paperProcess: false,
        identifyPain: true,
        champion: true,
        competition: false,
      },
      documents: [
        { id: 'doc-7', name: 'Apex_Fleet_Integration_Architecture_Draft.pdf', type: 'Draft Spec', size: '3.1 MB', updated: '5h ago', status: 'Draft' },
      ],
      notes: ['Interested in routing optimization and automated webhook sync.'],
      stakeholders: [
        { id: 'dm-40', name: 'Amara Okafor', role: 'VP Logistics Tech', buyingRole: 'Champion', sentiment: 'Positive', action: 'Docs dwell 14.2m', time: '5h ago', avatar: 'AO', topPct: '', leftPct: '' },
      ],
      timeline: [
        { id: 't-7', type: 'signal', title: 'API Dwell Spike', description: '14.2 mins spent reading Webhook & Event Stream specs.', time: '5 hours ago', icon: 'code', badgeColor: '#A9772D' },
      ],
      healthHistory: [
        {
          id: 'hh-4-1',
          timestamp: '5 hours ago',
          dateLabel: 'Today, 07:45 AM',
          health: 'Healthy',
          previousHealth: 'Warning',
          score: 79.2,
          previousScore: 62.0,
          scoreDelta: 17.2,
          stage: 'Discovery',
          trigger: 'MEDDPICC: Champion Confirmed & Decision Criteria Drafted',
          triggerType: 'meddpicc_upgrade',
          meddpiccDelta: '+ Champion (C), + Decision Criteria (D)',
          addedCriteria: ['Champion (C)', 'Decision Criteria (D)'],
          criteriaCount: 3,
          keyDrivers: [
            'Amara Okafor (VP Logistics Tech) spent 14.2 mins reviewing webhook event stream specs',
            'Fleet integration architecture draft submitted to engineering'
          ],
          author: 'Elena Ross (AE)',
          summaryNotes: 'Health upgraded to Healthy following high-intensity developer engagement.'
        },
        {
          id: 'hh-4-2',
          timestamp: '3 days ago',
          dateLabel: 'Aug 21, 2026',
          health: 'Warning',
          previousHealth: 'At Risk',
          score: 62.0,
          previousScore: 45.0,
          scoreDelta: 17.0,
          stage: 'New',
          trigger: 'MEDDPICC: Identified Pain in Supply Chain Latency',
          triggerType: 'meddpicc_upgrade',
          meddpiccDelta: '+ Identify Pain (I)',
          addedCriteria: ['Identify Pain (I)'],
          criteriaCount: 1,
          keyDrivers: [
            'Inbound inquiry regarding fleet routing telemetry synchronization'
          ],
          author: 'Elena Ross (AE)',
          summaryNotes: 'Initial qualification in progress.'
        }
      ]
    },
    {
      id: '5',
      name: 'Elena Rodriguez',
      company: 'FinServe Global',
      score: 76,
      dealValue: '$95,000',
      numericArr: 95000,
      stage: 'Discovery',
      status: 'New',
      aiSuggestion: 'Send SOC2 compliance whitepaper and fintech case study.',
      lastContact: 'Just now',
      industry: 'Financial Services',
      region: 'EMEA',
      email: 'elena.r@finserve.io',
      phone: '+44 20 7946 0881',
      owner: 'Alex Morgan',
      signalsCount: 3,
      engagementVelocity: 'Moderate',
      closeProbability: 72.0,
      daysInStage: 11,
      dealHealth: 'Warning',
      meddpicc: {
        metrics: true,
        economicBuyer: false,
        decisionCriteria: false,
        decisionProcess: false,
        paperProcess: false,
        identifyPain: true,
        champion: false,
        competition: true,
      },
      documents: [
        { id: 'doc-8', name: 'FinServe_Security_Compliance_Questionnaire_v1.pdf', type: 'InfoSec', size: '1.2 MB', updated: '1h ago', status: 'In Review' },
      ],
      notes: ['Requires dedicated tenant isolation documentation.'],
      stakeholders: [
        { id: 'dm-50', name: 'Elena Rodriguez', role: 'Compliance Director', buyingRole: 'Security / Legal', sentiment: 'Skeptical', action: 'Downloaded SOC2 pack', time: '1h ago', avatar: 'ER', topPct: '', leftPct: '' },
      ],
      timeline: [
        { id: 't-8', type: 'doc', title: 'SOC2 Whitepaper Downloaded', description: 'Downloaded full SOC2 Type II audit report.', time: '1 hour ago', icon: 'verified_user', badgeColor: '#0B6B53' },
      ],
      healthHistory: [
        {
          id: 'hh-5-1',
          timestamp: '1 hour ago',
          dateLabel: 'Today, 11:20 AM',
          health: 'Warning',
          previousHealth: 'At Risk',
          score: 72.0,
          previousScore: 48.0,
          scoreDelta: 24.0,
          stage: 'Discovery',
          trigger: 'MEDDPICC: SOC2 Review & Quantifiable Metrics Ingested',
          triggerType: 'meddpicc_upgrade',
          meddpiccDelta: '+ Metrics (M), + Competition (C)',
          addedCriteria: ['Metrics (M)', 'Competition (C)'],
          criteriaCount: 3,
          keyDrivers: [
            'Elena Rodriguez (Compliance Director) downloaded SOC2 Type II audit report',
            'Fintech compliance questionnaire received for tenant isolation validation'
          ],
          author: 'Alex Morgan (AE)',
          summaryNotes: 'Health recovered from At Risk to Warning as infosec compliance engagement began.'
        },
        {
          id: 'hh-5-2',
          timestamp: '11 days ago',
          dateLabel: 'Aug 13, 2026',
          health: 'At Risk',
          previousHealth: 'At Risk',
          score: 48.0,
          previousScore: 40.0,
          scoreDelta: 8.0,
          stage: 'Discovery',
          trigger: 'Security Hesitation & Missing Economic Buyer',
          triggerType: 'meddpicc_downgrade',
          meddpiccDelta: '+ Identify Pain (I)',
          addedCriteria: ['Identify Pain (I)'],
          criteriaCount: 1,
          keyDrivers: [
            'Prospect expressed concern regarding banking regulatory compliance',
            'No internal champion identified during initial outreach'
          ],
          author: 'Scikit-Pulse ML Engine',
          summaryNotes: 'Flagged as At Risk due to compliance hesitation and lack of executive sponsor.'
        }
      ]
    },
    {
      id: '6',
      name: 'Rick Burns',
      company: 'Figma Systems',
      score: 54,
      dealValue: '$45,000',
      numericArr: 45000,
      stage: 'Evaluation',
      status: 'Engaged',
      aiSuggestion: 'Low velocity. Enroll in weekly product optimization nurture cadence.',
      lastContact: '4 days ago',
      industry: 'Design Tech',
      region: 'North America',
      email: 'rburns@figma.com',
      phone: '+1 (415) 390-1122',
      owner: 'Jason Vance',
      signalsCount: 2,
      engagementVelocity: 'Stalled (-12% WoW)',
      closeProbability: 48.0,
      daysInStage: 22,
      dealHealth: 'At Risk',
      meddpicc: {
        metrics: false,
        economicBuyer: false,
        decisionCriteria: false,
        decisionProcess: false,
        paperProcess: false,
        identifyPain: false,
        champion: false,
        competition: true,
      },
      documents: [
        { id: 'doc-9', name: 'Figma_Pilot_Evaluation_Summary.pdf', type: 'Pilot Review', size: '540 KB', updated: '4d ago', status: 'Draft' },
      ],
      notes: ['Follow up after quarterly design sprint.'],
      stakeholders: [
        { id: 'dm-60', name: 'Rick Burns', role: 'Staff Product Manager', buyingRole: 'Technical Evaluator', sentiment: 'Neutral', action: 'Opened nurture email', time: '4d ago', avatar: 'RB', topPct: '', leftPct: '' },
      ],
      timeline: [
        { id: 't-9', type: 'email', title: 'Nurture Sequence Delivered', description: 'Opened Step 2: "Advanced Sales Forecasting in Real-time".', time: '4 days ago', icon: 'mail', badgeColor: '#8C8672' },
      ],
      healthHistory: [
        {
          id: 'hh-6-1',
          timestamp: '4 days ago',
          dateLabel: 'Aug 20, 2026',
          health: 'At Risk',
          previousHealth: 'Warning',
          score: 48.0,
          previousScore: 62.0,
          scoreDelta: -14.0,
          stage: 'Evaluation',
          trigger: 'MEDDPICC: 22 Days Stalled in Stage & Champion Inactive',
          triggerType: 'meddpicc_downgrade',
          meddpiccDelta: '- Identify Pain (I), - Decision Criteria (D)',
          removedCriteria: ['Identify Pain', 'Decision Criteria'],
          criteriaCount: 1,
          keyDrivers: [
            'Deal stalled in Evaluation for >22 days without stakeholder response',
            'Missing Economic Buyer and formal Decision Criteria'
          ],
          author: 'Scikit-Pulse ML Engine',
          summaryNotes: 'Health degraded from Warning to At Risk due to extended evaluation latency and missing budget authority.'
        },
        {
          id: 'hh-6-2',
          timestamp: '14 days ago',
          dateLabel: 'Aug 10, 2026',
          health: 'Warning',
          previousHealth: 'Healthy',
          score: 62.0,
          previousScore: 72.0,
          scoreDelta: -10.0,
          stage: 'Evaluation',
          trigger: 'Pilot Review Deferred to Next Sprint',
          triggerType: 'meddpicc_downgrade',
          meddpiccDelta: '+ Decision Criteria (D), + Competition (C)',
          criteriaCount: 2,
          keyDrivers: [
            'Rick Burns deferred pilot sign-off to next quarterly design sprint'
          ],
          author: 'Jason Vance (AE)',
          summaryNotes: 'Health lowered to Warning following pilot deferral.'
        },
        {
          id: 'hh-6-3',
          timestamp: '28 days ago',
          dateLabel: 'Jul 27, 2026',
          health: 'Healthy',
          previousHealth: 'Warning',
          score: 72.0,
          previousScore: 50.0,
          scoreDelta: 22.0,
          stage: 'Discovery',
          trigger: 'Initial Pilot Evaluation Ingested',
          triggerType: 'meddpicc_upgrade',
          meddpiccDelta: '+ Identify Pain (I), + Decision Criteria (D)',
          addedCriteria: ['Identify Pain (I)', 'Decision Criteria (D)'],
          criteriaCount: 2,
          keyDrivers: [
            'Initial engagement regarding sales forecast visualization for design team'
          ],
          author: 'System Ingestion',
          summaryNotes: 'Discovery commenced.'
        }
      ]
    },
    {
      id: '7',
      name: 'Kenji Takahashi',
      company: 'Rakuten Cloud',
      score: 86,
      dealValue: '$210,000',
      numericArr: 210000,
      stage: 'Closed',
      status: 'Closed',
      aiSuggestion: 'Closed Won. Kick off white-glove onboarding cadence.',
      lastContact: '2 days ago',
      industry: 'Cloud Infrastructure',
      region: 'APAC',
      email: 'k.takahashi@rakuten.jp',
      phone: '+81 3 5555 0192',
      owner: 'Sarah Chen',
      signalsCount: 18,
      engagementVelocity: 'Closed Won Target',
      closeProbability: 100,
      daysInStage: 0,
      dealHealth: 'Accelerating',
      meddpicc: {
        metrics: true,
        economicBuyer: true,
        decisionCriteria: true,
        decisionProcess: true,
        paperProcess: true,
        identifyPain: true,
        champion: true,
        competition: true,
      },
      documents: [
        { id: 'doc-10', name: 'Rakuten_Signed_Enterprise_Subscription_24M.pdf', type: 'Fully Executed', size: '1.9 MB', updated: '2d ago', status: 'Approved' },
      ],
      notes: ['Signed 24-month enterprise commitment with APAC hosting.'],
      stakeholders: [
        { id: 'dm-70', name: 'Kenji Takahashi', role: 'VP Engineering', buyingRole: 'Champion', sentiment: 'Positive', action: 'Executed Docusign agreement', time: '2d ago', avatar: 'KT', topPct: '', leftPct: '' },
      ],
      timeline: [
        { id: 't-10', type: 'stage', title: 'Deal Closed Won', description: '$210,000 ARR executed contract received.', time: '2 days ago', icon: 'check_circle', badgeColor: '#0B6B53' },
      ],
      healthHistory: [
        {
          id: 'hh-7-1',
          timestamp: '2 days ago',
          dateLabel: 'Aug 22, 2026',
          health: 'Accelerating',
          previousHealth: 'Accelerating',
          score: 100.0,
          previousScore: 86.0,
          scoreDelta: 14.0,
          stage: 'Closed',
          trigger: 'MEDDPICC: 8/8 Completed & Contract Executed (Closed Won)',
          triggerType: 'stage_advance',
          meddpiccDelta: '+ Paper Process (P) Executed',
          addedCriteria: ['Paper Process (P)'],
          criteriaCount: 8,
          keyDrivers: [
            'Kenji Takahashi executed 24-month enterprise subscription contract ($210,000 ARR)',
            'APAC dedicated hosting cluster provisioned in Tokyo data center'
          ],
          author: 'Sarah Chen (AE)',
          summaryNotes: '100% MEDDPICC criteria achieved. Deal marked Closed Won.'
        },
        {
          id: 'hh-7-2',
          timestamp: '7 days ago',
          dateLabel: 'Aug 17, 2026',
          health: 'Accelerating',
          previousHealth: 'Healthy',
          score: 86.0,
          previousScore: 72.0,
          scoreDelta: 14.0,
          stage: 'Negotiating',
          trigger: 'MEDDPICC: Economic Buyer & Legal Terms Approved',
          triggerType: 'meddpicc_upgrade',
          meddpiccDelta: '+ Economic Buyer (E), + Decision Process (P)',
          addedCriteria: ['Economic Buyer (E)', 'Decision Process (P)'],
          criteriaCount: 7,
          keyDrivers: [
            'Procurement board approved 24-month multi-year commitment',
            'Security and privacy addendum signed'
          ],
          author: 'Sarah Chen (AE)',
          summaryNotes: 'Health upgraded to Accelerating during final commercial closing.'
        }
      ]
    },
  ]);

  // Sales Rep Quota Leaderboard
  readonly salesReps = signal<SalesRep[]>([
    {
      id: 'rep-1',
      name: 'Alex Morgan',
      avatar: 'AM',
      role: 'Director of Strategic Enterprise',
      quota: '$1,200,000',
      attainmentPct: 118,
      closedArr: '$1,416,000',
      activePipeline: '$980,000',
      winRate: '41.2%',
      avgCycle: '16.4 days',
      dealsCount: 8,
    },
    {
      id: 'rep-2',
      name: 'Sarah Chen',
      avatar: 'SC',
      role: 'Principal Account Executive (APAC / AI)',
      quota: '$950,000',
      attainmentPct: 104,
      closedArr: '$988,000',
      activePipeline: '$640,000',
      winRate: '38.5%',
      avgCycle: '18.1 days',
      dealsCount: 6,
    },
    {
      id: 'rep-3',
      name: 'Elena Ross',
      avatar: 'ER',
      role: 'Enterprise AE (EMEA / Fintech)',
      quota: '$800,000',
      attainmentPct: 92,
      closedArr: '$736,000',
      activePipeline: '$520,000',
      winRate: '34.0%',
      avgCycle: '21.5 days',
      dealsCount: 5,
    },
    {
      id: 'rep-4',
      name: 'Jason Vance',
      avatar: 'JV',
      role: 'Mid-Market Growth Lead',
      quota: '$500,000',
      attainmentPct: 86,
      closedArr: '$430,000',
      activePipeline: '$280,000',
      winRate: '29.8%',
      avgCycle: '14.2 days',
      dealsCount: 9,
    },
  ]);

  // Autonomous Outreach Sequences
  readonly sequences = signal<SequenceCadence[]>([
    {
      id: 'seq-1',
      name: 'Enterprise Pricing Dwell Strike',
      targetTier: 'Tier-1 High Intent (>90 Score)',
      stepsCount: 4,
      activeEnrollments: 12,
      replyRate: '54.2%',
      status: 'Active',
      description: 'Triggered when >2 decision-makers spend >4 minutes reviewing custom SLA or Enterprise tiers.',
      triggerEvent: 'Pricing Page Dwell > 4 mins',
    },
    {
      id: 'seq-2',
      name: 'CISO Compliance & SOC2 Fast-Track',
      targetTier: 'Security & Legal Gatekeepers',
      stepsCount: 3,
      activeEnrollments: 8,
      replyRate: '46.8%',
      status: 'Active',
      description: 'Automatically dispatches pre-cleared SOC2 Type II summary, penetration test attestations, and architecture whitepaper.',
      triggerEvent: 'Compliance packet downloaded',
    },
    {
      id: 'seq-3',
      name: 'Executive Sponsor Re-Engagement',
      targetTier: 'Stalled Evaluation Deals (Score 50-70)',
      stepsCount: 5,
      activeEnrollments: 19,
      replyRate: '31.0%',
      status: 'Active',
      description: 'Nurtures stalled evaluations with fresh customer benchmark studies and product velocity releases.',
      triggerEvent: 'Inactive for > 72 hours',
    },
    {
      id: 'seq-4',
      name: 'APAC Expansion Pilot Ingestion',
      targetTier: 'Cross-Border Fast Growth',
      stepsCount: 3,
      activeEnrollments: 6,
      replyRate: '48.5%',
      status: 'Active',
      description: 'Automated welcome and localized data residency documentation for Tokyo/Singapore accounts.',
      triggerEvent: 'APAC Regional IP detected',
    },
  ]);

  // 14-Day Activity Heatmap Data
  readonly heatmapDays = signal([
    { day: '01', intensity: 2, count: '14 signals' },
    { day: '02', intensity: 4, count: '28 signals' },
    { day: '03', intensity: 3, count: '19 signals' },
    { day: '04', intensity: 5, count: '42 signals' },
    { day: '05', intensity: 2, count: '12 signals' },
    { day: '06', intensity: 1, count: '6 signals' },
    { day: '07', intensity: 1, count: '4 signals' },
    { day: '08', intensity: 3, count: '21 signals' },
    { day: '09', intensity: 4, count: '31 signals' },
    { day: '10', intensity: 5, count: '49 signals' },
    { day: '11', intensity: 4, count: '36 signals' },
    { day: '12', intensity: 5, count: '52 signals' },
    { day: '13', intensity: 3, count: '22 signals' },
    { day: '14', intensity: 5, count: '48 signals (Today)' },
  ]);

  // Filtered Leads based on search, status, industry, score tier, and health
  readonly filteredLeads = computed(() => {
    const query = this.searchControl.value?.toLowerCase().trim() || '';
    const status = this.filterStatus();
    const industry = this.filterIndustry();
    const scoreTier = this.scoreFilterTier();
    const healthFilter = this.leadHealthFilter();

    const list = this.leads().filter((lead) => {
      const matchesQuery =
        !query ||
        lead.name.toLowerCase().includes(query) ||
        lead.company.toLowerCase().includes(query) ||
        lead.industry.toLowerCase().includes(query) ||
        lead.owner.toLowerCase().includes(query);
      const matchesStatus = status === 'All' || lead.stage === status || lead.status === status;
      const matchesIndustry = industry === 'All' || lead.industry === industry;
      
      let matchesScore = true;
      if (scoreTier === 'high') matchesScore = lead.score >= 85;
      else if (scoreTier === 'mid') matchesScore = lead.score >= 70 && lead.score < 85;
      else if (scoreTier === 'nurture') matchesScore = lead.score < 70;

      let matchesHealth = true;
      if (healthFilter === 'healthy') matchesHealth = lead.dealHealth === 'Healthy';
      else if (healthFilter === 'accelerating') matchesHealth = lead.dealHealth === 'Accelerating';
      else if (healthFilter === 'warning') matchesHealth = lead.dealHealth === 'Warning';
      else if (healthFilter === 'at_risk') matchesHealth = lead.dealHealth === 'At Risk';

      return matchesQuery && matchesStatus && matchesIndustry && matchesScore && matchesHealth;
    });

    return list.sort((a, b) => {
      const sortCol = this.pipelineSortColumn();
      const sortDir = this.pipelineSortDirection();
      const mult = sortDir === 'asc' ? 1 : -1;

      switch (sortCol) {
        case 'company':
          return mult * a.company.localeCompare(b.company);
        case 'score':
          return mult * (a.score - b.score);
        case 'arr':
          return mult * (a.numericArr - b.numericArr);
        case 'stage':
          return mult * a.stage.localeCompare(b.stage);
        case 'daysInStage':
          return mult * (a.daysInStage - b.daysInStage);
        case 'closeProbability':
          return mult * (a.closeProbability - b.closeProbability);
        case 'health': {
          const healthRank: Record<string, number> = { Accelerating: 4, Healthy: 3, Warning: 2, 'At Risk': 1 };
          return mult * ((healthRank[a.dealHealth] || 0) - (healthRank[b.dealHealth] || 0));
        }
        case 'owner':
          return mult * a.owner.localeCompare(b.owner);
        case 'industry':
          return mult * a.industry.localeCompare(b.industry);
        case 'velocity':
          return mult * ((a.closeProbability / Math.max(1, a.daysInStage)) - (b.closeProbability / Math.max(1, b.daysInStage)));
        default:
          return mult * (a.score - b.score);
      }
    });
  });

  // Pipeline Velocity Index Metric: (Active Deals * Avg Win Rate * Avg Deal Size) / Avg Sales Cycle (18 days)
  readonly pipelineVelocityIndex = computed(() => {
    const active = this.leads().filter((l) => l.stage !== 'Closed');
    if (!active.length) return '$0 / day';
    const totalArr = active.reduce((s, l) => s + l.numericArr, 0);
    const avgArr = totalArr / active.length;
    const avgProb = active.reduce((s, l) => s + l.closeProbability, 0) / active.length / 100;
    const velocityDaily = (active.length * avgProb * avgArr) / 18.2;
    return `$${Math.round(velocityDaily).toLocaleString()} / day`;
  });

  // Global Command Palette Search Results
  readonly commandPaletteResults = computed(() => {
    const q = this.commandSearchQuery().toLowerCase().trim();
    const allLeads = this.leads();
    if (!q) {
      return [
        { type: 'action', title: 'Open New Deal Ingestion Modal', subtitle: 'Quickly register enterprise prospect', icon: 'add_circle', action: 'NEW_LEAD' },
        { type: 'action', title: 'Run Live Monte Carlo & Scikit-Pulse Recalibration', subtitle: 'Recalibrate 14,200 closed vectors', icon: 'auto_fix_high', action: 'RECALIBRATE' },
        { type: 'action', title: 'Export Full CRM Pipeline Dataset (JSON)', subtitle: 'Export opportunities & activity telemetry', icon: 'download', action: 'EXPORT_JSON' },
        { type: 'tab', title: 'Switch to Executive Profile & Workspace', subtitle: 'Executive quota attainment & preferences', icon: 'account_circle', action: 'GOTO_PROFILE' },
        { type: 'tab', title: 'Switch to Pipeline Matrix (Kanban)', subtitle: 'View interactive stages and deal cards', icon: 'view_kanban', action: 'GOTO_LEADS' },
        { type: 'tab', title: 'Switch to Revenue Forecaster & Scenarios', subtitle: 'What-if parameter modeling', icon: 'trending_up', action: 'GOTO_ANALYTICS' },
        { type: 'tab', title: 'Switch to Model Calibration & Settings', subtitle: 'Scikit-Pulse v4.2 weights and CRM sync', icon: 'tune', action: 'GOTO_SETTINGS' },
        { type: 'lead', title: 'Google Cloud ($420K)', subtitle: 'Stage: Negotiating • 98.4% Win Prob • Rachel Vance', icon: 'business', lead: allLeads[0] },
        { type: 'lead', title: 'Nexus Robotics ($310K)', subtitle: 'Stage: Negotiating • 91.0% Win Prob • Marcus Sterling', icon: 'business', lead: allLeads[1] },
      ];
    }
    const matchedLeads = allLeads
      .filter((l) => l.name.toLowerCase().includes(q) || l.company.toLowerCase().includes(q) || l.industry.toLowerCase().includes(q) || l.owner.toLowerCase().includes(q))
      .map((l) => ({
        type: 'lead' as const,
        title: `${l.company} (${l.dealValue})`,
        subtitle: `Contact: ${l.name} • Stage: ${l.stage} • Health: ${l.dealHealth}`,
        icon: 'business',
        lead: l,
      }));

    const matchedActions = [
      { type: 'action' as const, title: 'Open New Deal Ingestion Modal', subtitle: 'Register enterprise prospect', icon: 'add_circle', action: 'NEW_LEAD' },
      { type: 'action' as const, title: 'Switch to Executive Profile & Workspace', subtitle: 'Executive quota attainment & preferences', icon: 'account_circle', action: 'GOTO_PROFILE' },
      { type: 'action' as const, title: 'Recalibrate AI Conversion Model', subtitle: 'Trigger live weight rebalancing', icon: 'auto_fix_high', action: 'RECALIBRATE' },
      { type: 'action' as const, title: 'Export CRM Database as JSON', subtitle: 'Download comprehensive snapshot', icon: 'download', action: 'EXPORT_JSON' },
    ].filter((a) => a.title.toLowerCase().includes(q) || a.subtitle.toLowerCase().includes(q));

    return [...matchedLeads, ...matchedActions];
  });

  // Kanban Columns Computed
  readonly kanbanColumns = computed(() => {
    const all = this.filteredLeads();
    return [
      { id: 'New', title: 'New Ingestions', count: all.filter((l) => l.stage === 'New').length, leads: all.filter((l) => l.stage === 'New'), badgeBg: 'bg-[#17150F]/5 text-[#17150F]' },
      { id: 'Discovery', title: 'Discovery & Dwell', count: all.filter((l) => l.stage === 'Discovery').length, leads: all.filter((l) => l.stage === 'Discovery'), badgeBg: 'bg-[#A9772D]/10 text-[#A9772D]' },
      { id: 'Evaluation', title: 'Technical Evaluation', count: all.filter((l) => l.stage === 'Evaluation').length, leads: all.filter((l) => l.stage === 'Evaluation'), badgeBg: 'bg-[#6B4B8A]/10 text-[#6B4B8A]' },
      { id: 'Negotiating', title: 'Proposal & Legal MSA', count: all.filter((l) => l.stage === 'Negotiating').length, leads: all.filter((l) => l.stage === 'Negotiating'), badgeBg: 'bg-[#A9772D]/20 text-[#A9772D]' },
      { id: 'Closed', title: 'Closed-Won ARR', count: all.filter((l) => l.stage === 'Closed').length, leads: all.filter((l) => l.stage === 'Closed'), badgeBg: 'bg-[#0B6B53]/10 text-[#0B6B53]' },
    ];
  });

  // Simulated Q3 Revenue Outcome based on What-If Sliders
  readonly simulatedQ3Arr = computed(() => {
    const base = 3450000; // $3.45M
    const winRateImpact = (this.scenarioWinRateUplift() / 100) * 450000;
    const cycleImpact = (this.scenarioCycleReduction() / 20) * 320000;
    const expansionImpact = (this.scenarioExpansionUplift() / 100) * 580000;
    const total = base + winRateImpact + cycleImpact + expansionImpact;
    return this.formatCurrency(total, true);
  });

  readonly simulatedNetGain = computed(() => {
    const winRateImpact = (this.scenarioWinRateUplift() / 100) * 450000;
    const cycleImpact = (this.scenarioCycleReduction() / 20) * 320000;
    const expansionImpact = (this.scenarioExpansionUplift() / 100) * 580000;
    const gain = winRateImpact + cycleImpact + expansionImpact;
    return `+${this.formatCurrency(gain)}`;
  });

  // Total Pipeline ARR sum
  readonly totalPipelineSum = computed(() => {
    const total = this.leads().reduce((acc, lead) => acc + lead.numericArr, 0);
    return this.formatCurrency(total, true);
  });

  // CRM Dataset Ingestion Analytics & Computed Metrics
  readonly datasetMetrics = computed(() => {
    const pipeline = this.crmPipeline();
    const accounts = this.crmAccounts();
    const products = this.crmProducts();
    const teams = this.crmSalesTeams();

    const wonRecords = pipeline.filter((p) => p.dealStage === 'Won');
    const lostRecords = pipeline.filter((p) => p.dealStage === 'Lost');
    const engagingRecords = pipeline.filter((p) => p.dealStage === 'Engaging');
    const prospectingRecords = pipeline.filter((p) => p.dealStage === 'Prospecting');

    const totalWonRevenue = wonRecords.reduce((sum, p) => sum + (p.closeValue || 0), 0);
    const activePipelineValue = pipeline
      .filter((p) => p.dealStage === 'Engaging' || p.dealStage === 'Prospecting')
      .reduce((sum, p) => sum + (p.closeValue || 0), 0);
    const grossTotalVolume = pipeline.reduce((sum, p) => sum + (p.closeValue || 0), 0);

    const closedCount = wonRecords.length + lostRecords.length;
    const winRate = closedCount > 0 ? (wonRecords.length / closedCount) * 100 : 0;
    const avgDealSize = wonRecords.length > 0 ? totalWonRevenue / wonRecords.length : 0;

    return {
      totalOpportunities: pipeline.length,
      totalAccounts: accounts.length,
      totalProducts: products.length,
      totalSalesTeams: teams.length,
      wonCount: wonRecords.length,
      lostCount: lostRecords.length,
      engagingCount: engagingRecords.length,
      prospectingCount: prospectingRecords.length,
      totalWonRevenue: this.formatCurrency(totalWonRevenue, true),
      totalWonRevenueRaw: totalWonRevenue,
      activePipelineValue: this.formatCurrency(activePipelineValue, true),
      grossTotalVolume: this.formatCurrency(grossTotalVolume, true),
      winRatePct: winRate.toFixed(1),
      avgDealSize: this.formatCurrency(avgDealSize),
    };
  });

  // Dataset Visualizer: Full Funnel Conversion Metrics
  readonly datasetFunnelMetrics = computed(() => {
    const pipeline = this.crmPipeline();
    const total = pipeline.length || 1;
    const won = pipeline.filter((p) => p.dealStage === 'Won');
    const lost = pipeline.filter((p) => p.dealStage === 'Lost');
    const engaging = pipeline.filter((p) => p.dealStage === 'Engaging');
    const prospecting = pipeline.filter((p) => p.dealStage === 'Prospecting');

    const totalARR = pipeline.reduce((s, p) => s + (p.closeValue || 0), 0);
    const wonARR = won.reduce((s, p) => s + (p.closeValue || 0), 0);
    const lostARR = lost.reduce((s, p) => s + (p.closeValue || 0), 0);
    const engagingARR = engaging.reduce((s, p) => s + (p.closeValue || 0), 0);
    const prospectingARR = prospecting.reduce((s, p) => s + (p.closeValue || 0), 0);

    const closedTotal = won.length + lost.length;
    const winRate = closedTotal > 0 ? (won.length / closedTotal) * 100 : 0;

    return {
      stages: [
        {
          name: '1. Ingested Opportunities',
          stageKey: 'All',
          count: pipeline.length,
          arr: totalARR,
          arrFormatted: this.formatCurrency(totalARR, true),
          conversionPct: 100,
          color: '#17150F',
          widthPct: 100,
          desc: 'Total opportunities parsed from CSV records',
        },
        {
          name: '2. Prospecting Stage',
          stageKey: 'Prospecting',
          count: prospecting.length,
          arr: prospectingARR,
          arrFormatted: this.formatCurrency(prospectingARR, true),
          conversionPct: Math.round((prospecting.length / total) * 100),
          color: '#8C8672',
          widthPct: Math.max(30, Math.round(((prospecting.length + engaging.length + won.length) / total) * 100)),
          desc: 'Early account discovery and initial ICP verification',
        },
        {
          name: '3. Engaging / Active Trials',
          stageKey: 'Engaging',
          count: engaging.length,
          arr: engagingARR,
          arrFormatted: this.formatCurrency(engagingARR, true),
          conversionPct: Math.round(((engaging.length + won.length) / total) * 100),
          color: '#A9772D',
          widthPct: Math.max(25, Math.round(((engaging.length + won.length) / total) * 85)),
          desc: 'Product evaluations, proof-of-concept, and pricing discussions',
        },
        {
          name: '4. Closed-Won Bookings',
          stageKey: 'Won',
          count: won.length,
          arr: wonARR,
          arrFormatted: this.formatCurrency(wonARR, true),
          conversionPct: Math.round(winRate),
          color: '#0B6B53',
          widthPct: Math.max(20, Math.round((won.length / total) * 80)),
          desc: 'Successfully executed customer orders and realized revenue',
        },
      ],
      lostStage: {
        name: 'Closed-Lost / Dropped',
        stageKey: 'Lost',
        count: lost.length,
        arr: lostARR,
        arrFormatted: this.formatCurrency(lostARR, true),
        dropPct: Math.round(100 - winRate),
        color: '#9E2A2B',
        desc: 'Deals disqualified or lost to competitors during sales cycle',
      },
      winRatePct: winRate.toFixed(1),
      avgCycleDays: '18.6 Days',
      velocityScore: '89.2/100',
    };
  });

  // Dataset Visualizer: Sector Market Share & Revenue Distribution
  readonly datasetSectorBreakdown = computed(() => {
    const pipeline = this.crmPipeline();
    const accounts = this.crmAccounts();
    const acctSectorMap = new Map<string, string>();
    accounts.forEach((a) => acctSectorMap.set(a.account.toLowerCase(), a.sector));

    const sectorARR = new Map<string, { arr: number; count: number; wonArr: number; wonCount: number }>();
    let totalArrAll = 0;

    pipeline.forEach((p) => {
      const rawSector = acctSectorMap.get(p.account.toLowerCase()) || 'other';
      const sector = rawSector.charAt(0).toUpperCase() + rawSector.slice(1);
      const current = sectorARR.get(sector) || { arr: 0, count: 0, wonArr: 0, wonCount: 0 };
      current.arr += p.closeValue || 0;
      current.count += 1;
      if (p.dealStage === 'Won') {
        current.wonArr += p.closeValue || 0;
        current.wonCount += 1;
      }
      sectorARR.set(sector, current);
      totalArrAll += p.closeValue || 0;
    });

    const colors = ['#0B6B53', '#A9772D', '#17150F', '#6B4B8A', '#2A6F97', '#8C8672', '#C77DFF', '#E07A5F'];
    let colorIdx = 0;

    const list = Array.from(sectorARR.entries()).map(([sector, data]) => {
      const pct = totalArrAll > 0 ? (data.arr / totalArrAll) * 100 : 0;
      const winRate = data.count > 0 ? (data.wonCount / data.count) * 100 : 0;
      const avgDeal = data.count > 0 ? Math.round(data.arr / data.count) : 0;
      const color = colors[colorIdx++ % colors.length];
      return {
        sector,
        arr: data.arr,
        arrFormatted: this.formatCurrency(data.arr, true),
        wonFormatted: this.formatCurrency(data.wonArr, true),
        count: data.count,
        wonCount: data.wonCount,
        pct: Math.round(pct),
        winRate: Math.round(winRate),
        avgDeal: this.formatCurrency(avgDeal),
        color,
      };
    });

    return list.sort((a, b) => b.arr - a.arr);
  });

  // Dataset Visualizer: Sales Rep Win-Rate & Pipeline Volume Bubble Plot Data
  readonly datasetRepScatterData = computed(() => {
    const pipeline = this.crmPipeline();
    const teams = this.crmSalesTeams();
    const teamOfficeMap = new Map<string, string>();
    teams.forEach((t) => teamOfficeMap.set(t.salesAgent.toLowerCase(), t.regionalOffice));

    const repMap = new Map<string, { totalArr: number; wonArr: number; count: number; wonCount: number; lostCount: number }>();
    pipeline.forEach((p) => {
      const agent = p.salesAgent;
      const current = repMap.get(agent) || { totalArr: 0, wonArr: 0, count: 0, wonCount: 0, lostCount: 0 };
      current.totalArr += p.closeValue || 0;
      current.count += 1;
      if (p.dealStage === 'Won') {
        current.wonArr += p.closeValue || 0;
        current.wonCount += 1;
      } else if (p.dealStage === 'Lost') {
        current.lostCount += 1;
      }
      repMap.set(agent, current);
    });

    const maxArr = Math.max(1, ...Array.from(repMap.values()).map((v) => v.totalArr));

    return Array.from(repMap.entries()).map(([agent, stats], idx) => {
      const closed = stats.wonCount + stats.lostCount;
      const winRate = closed > 0 ? (stats.wonCount / closed) * 100 : Math.round(45 + (idx % 40));
      const office = teamOfficeMap.get(agent.toLowerCase()) || 'Global Field';

      // SVG coordinates 0-100 viewBox
      const xPct = Math.min(94, Math.max(10, (stats.totalArr / maxArr) * 82 + 8));
      const yPct = Math.min(90, Math.max(12, 95 - winRate * 0.85));
      const radius = Math.min(18, Math.max(7, Math.round(Math.sqrt(stats.count) * 4.2)));

      const officeColor = office.includes('Central')
        ? '#0B6B53'
        : office.includes('West')
        ? '#A9772D'
        : office.includes('East')
        ? '#6B4B8A'
        : '#17150F';

      return {
        agent,
        office,
        totalArr: stats.totalArr,
        arrFormatted: this.formatCurrency(stats.totalArr, true),
        wonArr: stats.wonArr,
        wonFormatted: this.formatCurrency(stats.wonArr, true),
        dealsCount: stats.count,
        wonCount: stats.wonCount,
        lostCount: stats.lostCount,
        winRate: Math.round(winRate),
        xPct,
        yPct,
        radius,
        color: officeColor,
      };
    }).sort((a, b) => b.totalArr - a.totalArr);
  });

  // Dataset Visualizer: Product Tier Economics & Volume Matrix
  readonly datasetProductVisualizer = computed(() => {
    const pipeline = this.crmPipeline();
    const products = this.crmProducts();
    const prodMap = new Map<string, { arr: number; wonArr: number; wonCount: number; lostCount: number; totalCount: number }>();

    pipeline.forEach((p) => {
      const current = prodMap.get(p.product) || { arr: 0, wonArr: 0, wonCount: 0, lostCount: 0, totalCount: 0 };
      current.arr += p.closeValue || 0;
      current.totalCount += 1;
      if (p.dealStage === 'Won') {
        current.wonArr += p.closeValue || 0;
        current.wonCount += 1;
      }
      if (p.dealStage === 'Lost') current.lostCount += 1;
      prodMap.set(p.product, current);
    });

    const maxArr = Math.max(1, ...Array.from(prodMap.values()).map((p) => p.arr));

    return products.map((prod) => {
      const stats = prodMap.get(prod.product) || { arr: 0, wonArr: 0, wonCount: 0, lostCount: 0, totalCount: 0 };
      const closed = stats.wonCount + stats.lostCount;
      const winRate = closed > 0 ? (stats.wonCount / closed) * 100 : stats.totalCount > 0 ? (stats.wonCount / stats.totalCount) * 100 : 0;
      const barPct = Math.round((stats.arr / maxArr) * 100);

      return {
        product: prod.product,
        series: prod.series,
        price: this.formatCurrency(prod.salesPrice),
        arrFormatted: this.formatCurrency(stats.arr, true),
        wonFormatted: this.formatCurrency(stats.wonArr, true),
        totalCount: stats.totalCount,
        wonCount: stats.wonCount,
        winRate: Math.round(winRate),
        barPct: Math.max(8, barPct),
      };
    }).sort((a, b) => (prodMap.get(b.product)?.arr || 0) - (prodMap.get(a.product)?.arr || 0));
  });

  // VISUALIZATION CHOOSE OPTION 5: Regional Office Territory Matrix
  readonly datasetRegionalTerritoryMatrix = computed(() => {
    const pipeline = this.crmPipeline();
    const teams = this.crmSalesTeams();

    const officeColors: Record<string, string> = {
      Central: '#0B6B53',
      West: '#A9772D',
      East: '#6B4B8A',
      'Global / EMEA': '#17150F',
      APAC: '#2A6F97',
    };

    const teamOfficeLookup = new Map<string, string>();
    teams.forEach((t) => teamOfficeLookup.set(t.salesAgent.toLowerCase(), t.regionalOffice));

    const officeMap = new Map<
      string,
      {
        office: string;
        totalArr: number;
        wonArr: number;
        count: number;
        wonCount: number;
        repsCount: number;
        quotaTarget: number;
        color: string;
      }
    >();

    teams.forEach((t) => {
      const off = t.regionalOffice;
      if (!officeMap.has(off)) {
        officeMap.set(off, {
          office: off,
          totalArr: 0,
          wonArr: 0,
          count: 0,
          wonCount: 0,
          repsCount: 0,
          quotaTarget: 1400000,
          color: officeColors[off] || '#8C8672',
        });
      }
      officeMap.get(off)!.repsCount += 1;
    });

    pipeline.forEach((p) => {
      const off = teamOfficeLookup.get(p.salesAgent.toLowerCase()) || 'Central';
      if (!officeMap.has(off)) {
        officeMap.set(off, {
          office: off,
          totalArr: 0,
          wonArr: 0,
          count: 0,
          wonCount: 0,
          repsCount: 1,
          quotaTarget: 1200000,
          color: officeColors[off] || '#8C8672',
        });
      }
      const data = officeMap.get(off)!;
      data.totalArr += p.closeValue || 0;
      data.count += 1;
      if (p.dealStage === 'Won') {
        data.wonArr += p.closeValue || 0;
        data.wonCount += 1;
      }
    });

    const maxArr = Math.max(1, ...Array.from(officeMap.values()).map((o) => o.totalArr));

    return Array.from(officeMap.values())
      .map((o) => {
        const winRate = o.count > 0 ? Math.round((o.wonCount / o.count) * 100) : 0;
        const attainment = Math.min(140, Math.round((o.wonArr / (o.quotaTarget || 1)) * 100));
        return {
          ...o,
          arrFormatted: this.formatCurrency(o.totalArr, true),
          wonFormatted: this.formatCurrency(o.wonArr, true),
          winRate,
          quotaAttainment: attainment,
          barPct: Math.round((o.totalArr / maxArr) * 100),
        };
      })
      .sort((a, b) => b.totalArr - a.totalArr);
  });

  // VISUALIZATION CHOOSE OPTION 6: 8-Axis MEDDPICC Pipeline Health Radar Web Graph
  readonly datasetMeddpiccRadar = computed(() => {
    const leads = this.leads();
    const total = leads.length || 1;

    const criteria = [
      { key: 'metrics', label: 'Metrics (M)', count: leads.filter((l) => !!l.meddpicc?.metrics).length, target: 85, angle: 0 },
      { key: 'economicBuyer', label: 'Economic Buyer (E)', count: leads.filter((l) => !!l.meddpicc?.economicBuyer).length, target: 80, angle: 45 },
      { key: 'decisionCriteria', label: 'Decision Criteria (Dc)', count: leads.filter((l) => !!l.meddpicc?.decisionCriteria).length, target: 90, angle: 90 },
      { key: 'decisionProcess', label: 'Decision Process (Dp)', count: leads.filter((l) => !!l.meddpicc?.decisionProcess).length, target: 75, angle: 135 },
      { key: 'paperProcess', label: 'Paper Process (P)', count: leads.filter((l) => !!l.meddpicc?.paperProcess).length, target: 70, angle: 180 },
      { key: 'identifyPain', label: 'Identify Pain (I)', count: leads.filter((l) => !!l.meddpicc?.identifyPain).length, target: 95, angle: 225 },
      { key: 'champion', label: 'Champion (C)', count: leads.filter((l) => !!l.meddpicc?.champion).length, target: 88, angle: 270 },
      { key: 'competition', label: 'Competition (Co)', count: leads.filter((l) => !!l.meddpicc?.competition).length, target: 82, angle: 315 },
    ];

    const cx = 150;
    const cy = 150;
    const maxRadius = 105;

    const actualPoints: string[] = [];
    const targetPoints: string[] = [];

    const axes = criteria.map((c) => {
      const score = Math.round((c.count / total) * 100);
      const rad = (c.angle - 90) * (Math.PI / 180);

      const rActual = (score / 100) * maxRadius;
      const ax = cx + rActual * Math.cos(rad);
      const ay = cy + rActual * Math.sin(rad);
      actualPoints.push(`${ax.toFixed(1)},${ay.toFixed(1)}`);

      const rTarget = (c.target / 100) * maxRadius;
      const tx = cx + rTarget * Math.cos(rad);
      const ty = cy + rTarget * Math.sin(rad);
      targetPoints.push(`${tx.toFixed(1)},${ty.toFixed(1)}`);

      const outerX = cx + (maxRadius + 22) * Math.cos(rad);
      const outerY = cy + (maxRadius + 22) * Math.sin(rad);

      return {
        ...c,
        score,
        actualX: ax,
        actualY: ay,
        targetX: tx,
        targetY: ty,
        outerX,
        outerY,
        lineX: cx + maxRadius * Math.cos(rad),
        lineY: cy + maxRadius * Math.sin(rad),
      };
    });

    const actualPolygon = actualPoints.join(' ');
    const targetPolygon = targetPoints.join(' ');

    return {
      axes,
      actualPolygon,
      targetPolygon,
      overallScore: Math.round(axes.reduce((s, a) => s + a.score, 0) / axes.length),
    };
  });

  // VISUALIZATION CHOOSE OPTION 7: Deal Age & Stage Velocity Cohort Heatmap
  readonly datasetStageAgeCohortHeatmap = computed(() => {
    const pipeline = this.crmPipeline();
    const stages = ['Prospecting', 'Engaging', 'Won', 'Lost'];
    const buckets = [
      { key: 'fast', label: '< 7 Days' },
      { key: 'standard', label: '7–14 Days' },
      { key: 'mature', label: '15–30 Days' },
      { key: 'aged', label: '31–60 Days' },
      { key: 'stagnant', label: '> 60 Days' },
    ];

    const matrix = stages.map((stage) => {
      const stageDeals = pipeline.filter((p) => p.dealStage.toLowerCase() === stage.toLowerCase());
      const stageArr = stageDeals.reduce((s, d) => s + (d.closeValue || 0), 0);

      const bucketStats = buckets.map((bucket, bIdx) => {
        const pctDistribution =
          stage === 'Won'
            ? [0.15, 0.45, 0.3, 0.08, 0.02]
            : stage === 'Lost'
            ? [0.1, 0.2, 0.35, 0.25, 0.1]
            : stage === 'Engaging'
            ? [0.3, 0.4, 0.2, 0.08, 0.02]
            : [0.5, 0.3, 0.15, 0.04, 0.01];

        const dealCount = Math.round(stageDeals.length * (pctDistribution[bIdx] || 0.1));
        const arr = Math.round(stageArr * (pctDistribution[bIdx] || 0.1));

        let intensity: 'low' | 'med' | 'high' | 'peak' = 'low';
        let bgClass = 'bg-[#F6F3EC] text-[#8C8672]';
        if (dealCount > 10) {
          intensity = 'peak';
          bgClass = 'bg-[#0B6B53] text-[#FFFFFF] font-bold';
        } else if (dealCount > 5) {
          intensity = 'high';
          bgClass = 'bg-[#0B6B53]/25 text-[#0B6B53] font-bold';
        } else if (dealCount > 2) {
          intensity = 'med';
          bgClass = 'bg-[#A9772D]/20 text-[#A9772D] font-semibold';
        }

        return {
          bucket: bucket.label,
          dealCount,
          arrFormatted: `$${(arr / 1000).toFixed(0)}k`,
          intensity,
          bgClass,
        };
      });

      return {
        stage,
        totalDeals: stageDeals.length,
        totalArrFormatted: `$${(stageArr / 1000).toFixed(0)}k`,
        buckets: bucketStats,
      };
    });

    return {
      stages,
      buckets: buckets.map((b) => b.label),
      matrix,
    };
  });

  // Live Pipeline Funnel Visualization Metrics for Leads Page
  readonly livePipelineFunnel = computed(() => {
    const leads = this.filteredLeads();
    const stages = [
      { id: 'New', name: 'New Ingestions', count: leads.filter((l) => l.stage === 'New').length, arr: leads.filter((l) => l.stage === 'New').reduce((s, l) => s + l.numericArr, 0), color: '#8C8672', avgDays: '3.2d', icon: 'fiber_new' },
      { id: 'Discovery', name: 'Discovery & Dwell', count: leads.filter((l) => l.stage === 'Discovery').length, arr: leads.filter((l) => l.stage === 'Discovery').reduce((s, l) => s + l.numericArr, 0), color: '#A9772D', avgDays: '8.4d', icon: 'visibility' },
      { id: 'Evaluation', name: 'Technical Evaluation', count: leads.filter((l) => l.stage === 'Evaluation').length, arr: leads.filter((l) => l.stage === 'Evaluation').reduce((s, l) => s + l.numericArr, 0), color: '#6B4B8A', avgDays: '14.1d', icon: 'assessment' },
      { id: 'Negotiating', name: 'Proposal & Legal MSA', count: leads.filter((l) => l.stage === 'Negotiating').length, arr: leads.filter((l) => l.stage === 'Negotiating').reduce((s, l) => s + l.numericArr, 0), color: '#17150F', avgDays: '18.9d', icon: 'gavel' },
      { id: 'Closed', name: 'Closed-Won ARR', count: leads.filter((l) => l.stage === 'Closed').length, arr: leads.filter((l) => l.stage === 'Closed').reduce((s, l) => s + l.numericArr, 0), color: '#0B6B53', avgDays: '22.0d', icon: 'check_circle' },
    ];
    const totalArr = leads.reduce((s, l) => s + l.numericArr, 0) || 1;
    const maxCount = Math.max(1, ...stages.map((s) => s.count));

    return stages.map((s, idx) => ({
      ...s,
      arrFormatted: `$${(s.arr / 1000).toFixed(0)}k`,
      pctOfTotal: Math.round((s.arr / totalArr) * 100),
      barWidthPct: Math.max(12, Math.round((s.count / maxCount) * 100)),
      conversionFromPrev: idx === 0 ? 100 : Math.round((s.count / (stages[idx - 1].count || 1)) * 100),
    }));
  });

  // Filtered dataset table views
  readonly filteredCrmPipeline = computed(() => {
    const q = this.datasetSearchQuery().toLowerCase().trim();
    const stage = this.datasetStageFilter();
    const agent = this.datasetAgentFilter();

    return this.crmPipeline().filter((item) => {
      const matchesQ =
        !q ||
        item.opportunityId.toLowerCase().includes(q) ||
        item.account.toLowerCase().includes(q) ||
        item.salesAgent.toLowerCase().includes(q) ||
        item.product.toLowerCase().includes(q) ||
        item.dealStage.toLowerCase().includes(q);

      const matchesStage = stage === 'all' || item.dealStage.toLowerCase() === stage.toLowerCase();
      const matchesAgent = agent === 'all' || item.salesAgent === agent;

      return matchesQ && matchesStage && matchesAgent;
    });
  });

  readonly filteredCrmAccounts = computed(() => {
    const q = this.datasetSearchQuery().toLowerCase().trim();
    const sector = this.datasetSectorFilter();

    return this.crmAccounts().filter((item) => {
      const matchesQ =
        !q ||
        item.account.toLowerCase().includes(q) ||
        item.sector.toLowerCase().includes(q) ||
        item.officeLocation.toLowerCase().includes(q) ||
        (item.subsidiaryOf && item.subsidiaryOf.toLowerCase().includes(q));

      const matchesSector = sector === 'all' || item.sector.toLowerCase() === sector.toLowerCase();

      return matchesQ && matchesSector;
    });
  });

  readonly filteredCrmSalesTeams = computed(() => {
    const q = this.datasetSearchQuery().toLowerCase().trim();
    const office = this.datasetOfficeFilter();

    return this.crmSalesTeams().filter((item) => {
      const matchesQ =
        !q ||
        item.salesAgent.toLowerCase().includes(q) ||
        item.manager.toLowerCase().includes(q) ||
        item.regionalOffice.toLowerCase().includes(q);

      const matchesOffice = office === 'all' || item.regionalOffice.toLowerCase() === office.toLowerCase();

      return matchesQ && matchesOffice;
    });
  });

  readonly filteredCrmProducts = computed(() => {
    const q = this.datasetSearchQuery().toLowerCase().trim();
    return this.crmProducts().filter((item) => {
      return !q || item.product.toLowerCase().includes(q) || item.series.toLowerCase().includes(q);
    });
  });

  readonly uniquePipelineAgents = computed(() => {
    const agents = new Set<string>();
    this.crmPipeline().forEach((p) => {
      if (p.salesAgent) agents.add(p.salesAgent);
    });
    return Array.from(agents).sort();
  });

  readonly uniqueAccountSectors = computed(() => {
    const sectors = new Set<string>();
    this.crmAccounts().forEach((a) => {
      if (a.sector) sectors.add(a.sector);
    });
    return Array.from(sectors).sort();
  });

  readonly uniqueSalesOffices = computed(() => {
    const offices = new Set<string>();
    this.crmSalesTeams().forEach((t) => {
      if (t.regionalOffice) offices.add(t.regionalOffice);
    });
    return Array.from(offices).sort();
  });

  setTab(tab: 'dashboard' | 'leads' | 'analytics' | 'sequences' | 'settings' | 'profile' | 'dataset' | 'copilot' | 'auth') {
    this.activeTab.set(tab);
    this.mobileMenuOpen.set(false);
  }

  toggleEditingProfile() {
    this.isEditingProfile.update((v) => !v);
  }

  updateProfile(name: string, title: string, phone: string, timezone: string, territory: string) {
    this.userProfile.update((p) => ({
      ...p,
      name: name.trim() || p.name,
      title: title.trim() || p.title,
      phone: phone.trim() || p.phone,
      timezone: timezone.trim() || p.timezone,
      territory: territory.trim() || p.territory,
    }));
    this.isEditingProfile.set(false);
    this.showToast('Executive profile updated and synchronized with CRM system.');
  }

  toggleProfilePreference(prefKey: 'autoDraftEmail' | 'slackNotifications' | 'weeklyForecastEmail' | 'twoFactorEnabled') {
    this.userProfile.update((p) => ({
      ...p,
      [prefKey]: !p[prefKey],
    }));
    this.showToast(`Preference "${prefKey}" updated.`);
  }

  exportProfileAuditLog() {
    const auditData = {
      user: this.userProfile(),
      timestamp: new Date().toISOString(),
      activeDealsCount: this.leads().length,
      recentActivities: this.tickerEvents(),
      sessionSecurity: {
        mfa: 'FIDO2 Hardware Key (Active)',
        ip: '198.51.100.42',
        latencyMs: 42,
        ssoProvider: 'Google Workspace Enterprise',
      },
    };
    const dataStr = JSON.stringify(auditData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sales-pilot-profile-audit-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    this.showToast('Profile audit log & telemetry credentials exported.');
  }

  toggleMobileMenu() {
    this.mobileMenuOpen.update((open) => !open);
  }

  // =========================================================================
  // USER AUTHENTICATION & ACCESS CONTROL (SIGN IN / SIGN UP / RECOVERY)
  // =========================================================================

  setAuthMode(mode: 'signin' | 'signup' | 'forgot_password') {
    this.authMode.set(mode);
    this.authError.set(null);
    this.authSuccessMessage.set(null);
  }

  switchAuthMode(mode: 'signin' | 'signup' | 'forgot_password') {
    this.setAuthMode(mode);
  }

  toggleShowPassword() {
    this.showPassword.update((v) => !v);
  }

  toggleShowConfirmPassword() {
    this.showConfirmPassword.update((v) => !v);
  }

  toggleSignInRememberMe() {
    this.signInRememberMe.update((v) => !v);
  }

  toggleSignUpAgreeTerms() {
    this.signUpAgreeTerms.update((v) => !v);
  }

  openAuthPage(mode: 'signin' | 'signup' | 'forgot_password' = 'signin') {
    this.setAuthMode(mode);
    this.setTab('auth');
  }

  loginAsDemoAccount(account: {
    id: string;
    name: string;
    role: string;
    email: string;
    avatar: string;
    company: string;
    quota: string;
    attainment: number;
    initials: string;
    color: string;
  }) {
    this.signInEmail.setValue(account.email);
    this.signInPassword.setValue('Enterprise2026!#');

    this.authLoading.set(true);
    this.authError.set(null);
    this.authSuccessMessage.set(`Authenticating as ${account.name}...`);

    setTimeout(() => {
      this.userProfile.update((p) => ({
        ...p,
        name: account.name,
        email: account.email,
        title: account.role,
        role: account.role,
        quotaTarget: account.quota,
        attainment: account.attainment,
      }));

      this.saveSession({
        name: account.name,
        email: account.email,
        title: account.role,
        role: account.role,
        quotaTarget: account.quota,
        attainment: account.attainment,
      });

      this.isAuthenticated.set(true);
      this.authLoading.set(false);
      this.authSuccessMessage.set(null);
      this.setTab('dashboard');
      this.showToast(`Signed in successfully as ${account.name} (${account.role}).`);
    }, 450);
  }

  quickSignInWithDemo(demoId: string) {
    const account = this.demoAccounts().find((a) => a.id === demoId);
    if (account) {
      this.loginAsDemoAccount(account);
    }
  }

  private saveSession(profile: { name: string; email: string; title: string; role?: string; quotaTarget?: string; attainment?: number; territory?: string; company?: string }) {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        window.sessionStorage.setItem('salespilot_active_session', JSON.stringify(profile));
      } catch (e) {
        console.warn('Could not save session:', e);
      }
    }
  }

  private clearSession() {
    if (typeof window !== 'undefined') {
      try {
        if (window.sessionStorage) {
          window.sessionStorage.removeItem('salespilot_active_session');
        }
        if (window.localStorage) {
          window.localStorage.removeItem('salespilot_remembered_session');
        }
      } catch (e) {
        console.warn('Could not clear session:', e);
      }
    }
  }

  private restoreSession() {
    if (typeof window !== 'undefined') {
      try {
        // Only restore if user has an active session in the current tab/session
        const sessionStored = window.sessionStorage ? window.sessionStorage.getItem('salespilot_active_session') : null;

        if (sessionStored) {
          const parsed = JSON.parse(sessionStored);
          if (parsed && parsed.name && parsed.email) {
            this.userProfile.update((p) => ({
              ...p,
              ...parsed,
            }));
            this.isAuthenticated.set(true);
            this.activeTab.set('dashboard');
            return;
          }
        }
      } catch (e) {
        console.warn('Could not restore session:', e);
      }
    }
    // Initially and whenever entering site, lock the platform until user logs in
    this.isAuthenticated.set(false);
    this.activeTab.set('auth');
  }

  handleSignIn(event?: Event) {
    if (event) {
      event.preventDefault();
    }
    let email = this.signInEmail.value.trim();
    const password = this.signInPassword.value.trim();

    // Map common admin usernames to admin@salespilot.ai
    if (email.toLowerCase() === 'admin' || email.toLowerCase() === 'root') {
      email = 'admin@salespilot.ai';
    }

    if (!email || !email.includes('@')) {
      this.authError.set('Please enter a valid corporate work email or User ID (e.g. admin or admin@salespilot.ai).');
      return;
    }
    if (!password || password.length < 4) {
      this.authError.set('Please enter your account password (at least 4 characters).');
      return;
    }

    this.authLoading.set(true);
    this.authError.set(null);

    setTimeout(() => {
      // 1. Built-in Master Admin Account Check
      if (email.toLowerCase() === 'admin@salespilot.ai') {
        if (password !== 'admin123' && password !== 'Admin@2026' && password !== 'admin') {
          this.authLoading.set(false);
          this.authError.set('Incorrect admin password. Default admin password is: admin123');
          return;
        }

        const adminProfile = {
          name: 'System Administrator',
          email: 'admin@salespilot.ai',
          title: 'Chief Revenue Officer & Platform Admin',
          role: 'Chief Revenue Officer (Full Admin Access)',
          company: 'Sales Pilot Global HQ',
          territory: 'Global Strategic Operations',
          quotaTarget: '$5,000,000',
          attainment: 94.5,
        };

        this.userProfile.update((p) => ({
          ...p,
          ...adminProfile,
        }));
        this.saveSession(adminProfile);
        this.isAuthenticated.set(true);
        this.authLoading.set(false);
        this.setTab('dashboard');
        this.showToast('Logged in as System Administrator. Full enterprise privileges active.');
        return;
      }
      // Check registered users list in localStorage
      let registeredUsers: { name: string; email: string; company: string; role: string; territory: string; password?: string }[] = [];
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          const stored = window.localStorage.getItem('salespilot_registered_users');
          if (stored) registeredUsers = JSON.parse(stored);
        } catch (e) {}
      }

      const existingUser = registeredUsers.find(
        (u) => u.email.toLowerCase() === email.toLowerCase()
      );

      if (existingUser && existingUser.password && existingUser.password !== password) {
        this.authLoading.set(false);
        this.authError.set('Incorrect password for this account. Please verify credentials.');
        return;
      }

      // Check if user matches any quick demo profile
      const matchedDemo = this.demoAccounts().find((a) => a.email.toLowerCase() === email.toLowerCase());

      const userName = existingUser ? existingUser.name : (matchedDemo ? matchedDemo.name : email.split('@')[0].split('.').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' '));
      const userRole = existingUser ? existingUser.role : (matchedDemo ? matchedDemo.role : 'Enterprise Revenue Director');
      const userCompany = existingUser ? existingUser.company : (matchedDemo ? matchedDemo.company : 'Enterprise Workspace');
      const userTerritory = existingUser ? existingUser.territory : 'Global Accounts';

      const authenticatedProfile = {
        name: userName || 'Enterprise User',
        email,
        title: userRole,
        role: userRole,
        company: userCompany,
        territory: userTerritory,
      };

      this.userProfile.update((p) => ({
        ...p,
        ...authenticatedProfile,
      }));

      this.saveSession(authenticatedProfile);

      this.isAuthenticated.set(true);
      this.authLoading.set(false);
      this.setTab('dashboard');
      this.showToast(`Welcome back, ${this.userProfile().name}! Enterprise workspace unlocked.`);
    }, 500);
  }

  handleSignUp(event?: Event) {
    if (event) {
      event.preventDefault();
    }
    const fullName = this.signUpFullName.value.trim();
    const workEmail = this.signUpWorkEmail.value.trim();
    const company = this.signUpCompany.value.trim();
    const role = this.signUpRole.value.trim() || 'Director of Strategic Enterprise';
    const territory = this.signUpTerritory.value.trim() || 'Global Enterprise Accounts';
    const password = this.signUpPassword.value.trim();
    const confirmPassword = this.signUpConfirmPassword.value.trim();

    if (!fullName) {
      this.authError.set('Full name is required to create your account.');
      return;
    }
    if (!workEmail || !workEmail.includes('@')) {
      this.authError.set('A valid corporate work email is required.');
      return;
    }
    if (!company) {
      this.authError.set('Company or organization name is required.');
      return;
    }
    if (!password || password.length < 6) {
      this.authError.set('Password must contain at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      this.authError.set('Passwords do not match. Please verify your entries.');
      return;
    }
    if (!this.signUpAgreeTerms()) {
      this.authError.set('You must accept the Enterprise Service Agreement to proceed.');
      return;
    }

    this.authLoading.set(true);
    this.authError.set(null);

    setTimeout(() => {
      // Store into registered users in localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          const stored = window.localStorage.getItem('salespilot_registered_users');
          const users = stored ? JSON.parse(stored) : [];
          users.push({
            name: fullName,
            email: workEmail,
            company,
            role,
            territory,
            password,
          });
          window.localStorage.setItem('salespilot_registered_users', JSON.stringify(users));
        } catch (e) {
          console.warn('Could not save user to registered list:', e);
        }
      }

      const newProfile = {
        name: fullName,
        email: workEmail,
        title: role,
        role,
        company,
        territory,
      };

      this.userProfile.update((p) => ({
        ...p,
        ...newProfile,
      }));

      this.saveSession(newProfile);

      this.isAuthenticated.set(true);
      this.authLoading.set(false);
      this.setTab('dashboard');
      this.showToast(`Account successfully created for ${fullName} (${company}). Workspace unlocked!`);
    }, 600);
  }

  handleForgotPassword(event?: Event) {
    if (event) {
      event.preventDefault();
    }
    const email = this.forgotPasswordEmail.value.trim();
    if (!email || !email.includes('@')) {
      this.authError.set('Please enter a valid work email address.');
      return;
    }

    this.authLoading.set(true);
    this.authError.set(null);

    setTimeout(() => {
      this.authLoading.set(false);
      this.authSuccessMessage.set(`Password recovery link and OTP instructions dispatched to ${email}. Check your inbox.`);
      this.showToast(`Password reset instructions sent to ${email}.`);
    }, 600);
  }

  loginWithGoogleSSO() {
    const email = this.signInEmail.value.trim();
    if (!email || !email.includes('@')) {
      this.authError.set('Please enter your Google corporate work email in the email field above to proceed.');
      return;
    }
    this.authLoading.set(true);
    this.authError.set(null);

    setTimeout(() => {
      const extractedName = email.split('@')[0].split('.').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
      const ssoProfile = {
        name: extractedName || 'Enterprise User',
        email,
        title: 'Enterprise Revenue Lead',
        role: 'Enterprise Member',
        company: email.split('@')[1]?.split('.')[0]?.toUpperCase() || 'Corporate Workspace',
        territory: 'Global Accounts',
      };
      this.saveSession(ssoProfile);
      this.isAuthenticated.set(true);
      this.authLoading.set(false);
      this.userProfile.update((p) => ({
        ...p,
        ...ssoProfile,
      }));
      this.setTab('dashboard');
      this.showToast(`Verified via Google Workspace SSO. Welcome, ${ssoProfile.name}!`);
    }, 500);
  }

  handleSocialSignIn(provider = 'Microsoft Entra ID') {
    const email = this.signInEmail.value.trim();
    if (!email || !email.includes('@')) {
      this.authError.set(`Please enter your work email address above before authenticating with ${provider}.`);
      return;
    }
    this.authLoading.set(true);
    this.authError.set(null);

    setTimeout(() => {
      const extractedName = email.split('@')[0].split('.').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
      const ssoProfile = {
        name: extractedName || 'Enterprise User',
        email,
        title: 'Enterprise Revenue Lead',
        role: 'Enterprise Member',
        company: email.split('@')[1]?.split('.')[0]?.toUpperCase() || 'Corporate Workspace',
        territory: 'Global Accounts',
      };
      this.saveSession(ssoProfile);
      this.isAuthenticated.set(true);
      this.authLoading.set(false);
      this.userProfile.update((p) => ({
        ...p,
        ...ssoProfile,
      }));
      this.setTab('dashboard');
      this.showToast(`Verified via ${provider} SSO. Welcome, ${ssoProfile.name}!`);
    }, 500);
  }

  private fxIntervalId: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    // Restore persistent session if present
    this.restoreSession();

    // Initial fetch of daily FX rates
    this.syncDailyExchangeRates(false);

    // Setup recurring automated daily / interval FX rates synchronization
    this.setupCurrencySyncTimer();

    // Start auto-refresh timer for live dashboard
    this.startAutoRefreshTimer();
  }

  ngOnDestroy(): void {
    if (this.fxIntervalId) {
      clearInterval(this.fxIntervalId);
      this.fxIntervalId = null;
    }
    this.stopAutoRefreshTimer();
  }

  // =========================================================================
  // MULTI-CURRENCY CONVERSION & DAILY FX EXCHANGE RATE METHODS
  // =========================================================================

  formatCurrency(usdAmount: number, compact = false, customDecimals?: number): string {
    return formatWithCurrency(usdAmount, this.selectedCurrency(), compact, customDecimals);
  }

  formatFilterTotalPipeline(filter: LocalizedFilter): string {
    return this.formatCurrency(filter.totalPipelineUsd);
  }

  formatFilterTargetDelta(filter: LocalizedFilter): string {
    const prefix = filter.isDeltaPositive ? '+' : '-';
    return `${prefix}${this.formatCurrency(Math.abs(filter.modelTargetDeltaUsd))}`;
  }

  formatFilterProjectedQ3(filter: LocalizedFilter): string {
    return this.formatCurrency(filter.projectedQ3Usd);
  }

  formatLeadDealValue(lead: Lead): string {
    return formatWithCurrency(lead.numericArr, this.selectedCurrency(), false);
  }

  formatRepArr(amountUsd: number): string {
    return formatWithCurrency(amountUsd, this.selectedCurrency(), true);
  }

  getConvertedAmount(usdAmount: number, targetCode?: string): number {
    const target = targetCode
      ? this.currenciesList().find((c) => c.code === targetCode) || this.selectedCurrency()
      : this.selectedCurrency();
    return Number((usdAmount * target.rate).toFixed(target.decimals));
  }

  setCurrency(code: string) {
    const curr = this.currenciesList().find((c) => c.code === code);
    if (!curr) return;
    this.selectedCurrencyCode.set(code);
    this.showCurrencyDropdown.set(false);
    this.showToast(`Active platform currency changed to ${curr.name} (${curr.code} ${curr.symbol}). All ARR metrics recalibrated.`);
  }

  openCurrencyModal() {
    this.showCurrencyModal.set(true);
  }

  closeCurrencyModal() {
    this.showCurrencyModal.set(false);
  }

  toggleCurrencyDropdown() {
    this.showCurrencyDropdown.update((v) => !v);
  }

  setCurrencyAutoSync(freq: '2h' | '1h' | '30m' | '5m' | 'daily') {
    this.currencyAutoSyncFrequency.set(freq);
    this.setupCurrencySyncTimer();
    this.showToast(`Automated exchange rate sync interval updated to every ${freq}.`);
  }

  setCurrencyRegionFilter(region: 'all' | 'North America' | 'Europe' | 'Asia Pacific' | 'Middle East' | 'South America' | 'Africa' | 'Central America' | 'Central Asia') {
    this.currencyRegionFilter.set(region);
  }

  setCurrencySearchQuery(q: string) {
    this.currencySearchQuery.set(q);
  }

  private setupCurrencySyncTimer() {
    if (this.fxIntervalId) {
      clearInterval(this.fxIntervalId);
      this.fxIntervalId = null;
    }

    const freq = this.currencyAutoSyncFrequency();
    const intervalMs =
      freq === '2h'
        ? 7200000 // 2 hours
        : freq === '1h'
        ? 3600000 // 1 hour
        : freq === '30m'
        ? 1800000 // 30 minutes
        : freq === '5m'
        ? 300000  // 5 minutes
        : 86400000; // 24h daily

    this.nextFxSyncTime.set(new Date(Date.now() + intervalMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

    if (typeof window !== 'undefined') {
      this.fxIntervalId = setInterval(() => {
        this.syncDailyExchangeRates(false);
      }, intervalMs);
    }
  }

  async syncDailyExchangeRates(isManual = false) {
    if (this.isSyncingRates()) return;
    this.isSyncingRates.set(true);

    try {
      const res = await fetch('/api/fx-rates');
      if (res.ok) {
        const data = (await res.json()) as {
          rates?: Record<string, number>;
          source?: string;
          lastUpdated?: string;
        };

        if (data.rates && typeof data.rates === 'object') {
          const ratesDict = data.rates;
          this.currenciesList.update((list) =>
            list.map((c) => {
              if (c.code === 'USD') return c;
              const apiRate = ratesDict[c.code];
              if (typeof apiRate === 'number' && apiRate > 0) {
                const newRate = Number(apiRate.toFixed(c.decimals > 2 ? 4 : c.decimals === 0 ? 0 : 4));
                const prevRate = c.previousDayRate || c.rate;
                const changePct = Number((((newRate - prevRate) / (prevRate || 1)) * 100).toFixed(2));
                const trend: 'up' | 'down' | 'stable' = changePct > 0.05 ? 'up' : changePct < -0.05 ? 'down' : 'stable';
                const dayHigh = Math.max(c.dayHigh, newRate);
                const dayLow = Math.min(c.dayLow, newRate);
                const newSparkline = [...c.sparkline7d.slice(1), newRate];
                return {
                  ...c,
                  rate: newRate,
                  dailyChangePct: changePct,
                  dailyTrend: trend,
                  dayHigh,
                  dayLow,
                  sparkline7d: newSparkline,
                  lastUpdated: `Updated via 2h Feed`,
                };
              }
              return c;
            })
          );

          const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          this.lastFxSyncTime.set(nowStr);
          if (data.source) this.fxSyncSource.set(data.source);

          const freq = this.currencyAutoSyncFrequency();
          const intervalMs = freq === '2h' ? 7200000 : freq === '1h' ? 3600000 : freq === '30m' ? 1800000 : freq === '5m' ? 300000 : 86400000;
          this.nextFxSyncTime.set(new Date(Date.now() + intervalMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

          if (isManual) {
            this.showToast(`Daily FX exchange rates updated across all world currencies (2-hour auto-sync active).`);
          }
          return;
        }
      }
      // Fallback simulation if offline or error
      this.simulateDailyFxFluctuation();
      if (isManual) {
        this.showToast(`Simulated daily exchange rate fluctuation calibrated across all world currencies.`);
      }
    } catch {
      this.simulateDailyFxFluctuation();
      if (isManual) {
        this.showToast(`Daily FX exchange rates calibrated (Local High-Availability Feed).`);
      }
    } finally {
      this.isSyncingRates.set(false);
    }
  }

  simulateDailyFxFluctuation() {
    this.currenciesList.update((list) =>
      list.map((c) => {
        if (c.code === 'USD') return c;
        // Minor realistic micro-shift (+-0.08% to +-0.25%)
        const deltaPct = Number(((Math.random() - 0.49) * 0.4).toFixed(2));
        const newRate = Number((c.rate * (1 + deltaPct / 100)).toFixed(c.decimals > 2 ? 4 : c.decimals === 0 ? 1 : 4));
        const newDailyChange = Number((c.dailyChangePct + deltaPct).toFixed(2));
        const trend: 'up' | 'down' | 'stable' = newDailyChange > 0.05 ? 'up' : newDailyChange < -0.05 ? 'down' : 'stable';
        const newSparkline = [...c.sparkline7d.slice(1), newRate];
        return {
          ...c,
          rate: newRate,
          dailyChangePct: newDailyChange,
          dailyTrend: trend,
          dayHigh: Math.max(c.dayHigh, newRate),
          dayLow: Math.min(c.dayLow, newRate),
          sparkline7d: newSparkline,
          lastUpdated: `Live ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        };
      })
    );
    this.lastFxSyncTime.set(`Live ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
  }

  setConverterFrom(code: string) {
    this.currencyConverterFromCode.set(code);
  }

  setConverterTo(code: string) {
    this.currencyConverterToCode.set(code);
  }

  setConverterAmount(val: number) {
    this.currencyConverterAmount.set(Math.max(0, val));
  }

  swapConverterCurrencies() {
    const from = this.currencyConverterFromCode();
    const to = this.currencyConverterToCode();
    this.currencyConverterFromCode.set(to);
    this.currencyConverterToCode.set(from);
  }

  handleSignOut() {
    this.clearSession();
    this.isAuthenticated.set(false);
    this.authMode.set('signin');
    this.authError.set(null);
    this.authSuccessMessage.set('You have signed out of Sales Pilot. Workspace secured.');
    this.setTab('auth');
    this.showToast('You have signed out of Sales Pilot. Workspace secured.');
  }

  handleGlobalKeydown(e: KeyboardEvent) {
    // Ctrl+K / Cmd+K for command palette
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      this.openCommandPalette();
    }
    // Escape to close open modals/drawers
    if (e.key === 'Escape') {
      if (this.showCommandPalette()) {
        this.closeCommandPalette();
      } else if (this.showNewLeadModal()) {
        this.closeNewLeadModal();
      } else if (this.showLeadDrawer()) {
        this.closeLeadDrawer();
      } else if (this.mobileMenuOpen()) {
        this.mobileMenuOpen.set(false);
      }
    }
  }

  toggleVelocityHeatmap() {
    this.showVelocityHeatmap.update((v) => !v);
    const state = this.showVelocityHeatmap();
    this.showToast(state ? 'Lead velocity heatmap overlay activated.' : 'Heatmap overlay disabled.');
  }

  downloadChartDataCsv() {
    const active = this.activeFilter();
    const points = this.pipelinePoints();
    
    const headers = [
      'Month',
      'Timeline Phase',
      'Pipeline Value (Millions USD)',
      'Formatted Pipeline Amount',
      'Month-over-Month Velocity Growth (%)',
      'Historical Benchmark Variance (%)',
      'Velocity Status',
      'Filtered Slice Name',
      'Dimension Category',
      'Active Filter Deals Count',
      'Confidence Score',
      'Average Sales Cycle Duration',
      'Annual Growth Rate',
      'Q3 Projected Target',
    ];

    const rows = points.map((pt, idx) => {
      const type = pt.isForecast ? 'AI Forecast Projection' : 'Historical Actual';
      const mom = idx === 0 ? 'Baseline' : `${pt.momGrowthPct >= 0 ? '+' : ''}${pt.momGrowthPct}%`;
      const variance = idx === 0 ? 'Baseline' : `${pt.benchmarkVariancePct >= 0 ? '+' : ''}${pt.benchmarkVariancePct}% vs 12% Benchmark`;
      const status = pt.velocityIntensity === 'spike' ? 'Velocity Spike Surge' : pt.velocityIntensity === 'elevated' ? 'Elevated Inflow' : 'Normal Pace';
      
      return [
        `"${pt.month}"`,
        `"${type}"`,
        pt.value.toFixed(2),
        `"${pt.label}"`,
        `"${mom}"`,
        `"${variance}"`,
        `"${status}"`,
        `"${active.name}"`,
        `"${active.category === 'region' ? 'Sales Region' : 'Industry Sector'}"`,
        active.activeDeals,
        `"${active.confidence}"`,
        `"${active.avgCycle}"`,
        `"${active.growthRate}"`,
        `"${this.formatFilterProjectedQ3(active)}"`,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    link.download = `pipeline-forecast-${active.id}-${dateStr}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    this.showToast(`Exported ${points.length} months of forecast metrics for "${active.name}" to CSV.`);
  }

  setForecastDimension(dim: 'region' | 'industry') {
    this.forecastDimension.set(dim);
    if (dim === 'region') {
      this.selectedFilterId.set('global');
    } else {
      this.selectedFilterId.set('all_industries');
    }
    const filter = this.activeFilter();
    this.showToast(`Forecasting dimension switched to ${dim === 'region' ? 'Sales Regions' : 'Industry Sectors'}. Loaded ${filter.name}.`);
  }

  setFilterId(id: string) {
    this.selectedFilterId.set(id);
    const filter = this.activeFilter();
    this.showToast(`Applied filter: ${filter.name}. Localized Q3 forecast: ${this.formatFilterProjectedQ3(filter)}.`);
  }

  openLeadDrawer(lead: Lead) {
    this.activeDrawerLead.set(lead);
    this.showLeadDrawer.set(true);
  }

  closeLeadDrawer() {
    this.showLeadDrawer.set(false);
  }

  downloadExecutiveBrief(lead: Lead) {
    try {
      const formattedDeal = this.formatLeadDealValue(lead);
      const currency = this.selectedCurrency();
      const userName = this.userProfile().name;

      generateExecutiveBriefPdf(lead, formattedDeal, currency, userName);

      // Also log an activity event to the deal's timeline
      const docEvent: ActivityEvent = {
        id: `t-exec-brief-${Date.now()}`,
        type: 'doc',
        title: 'Executive Brief Generated & Exported',
        description: `Exported comprehensive PDF summary for executive leadership in ${currency.code}.`,
        time: 'Just now',
        icon: 'picture_as_pdf',
        badgeColor: '#A9772D',
        author: userName,
      };

      this.leads.update((all) =>
        all.map((l) => {
          if (l.id === lead.id) {
            return {
              ...l,
              timeline: [docEvent, ...(l.timeline || [])],
            };
          }
          return l;
        })
      );

      // Keep active drawer lead in sync
      this.activeDrawerLead.update((curr) => {
        if (curr && curr.id === lead.id) {
          return {
            ...curr,
            timeline: [docEvent, ...(curr.timeline || [])],
          };
        }
        return curr;
      });

      this.showToast(`Executive Brief PDF generated and downloaded for ${lead.company}.`);
    } catch (err) {
      console.error('Failed to generate executive brief PDF:', err);
      this.showToast(`Unable to generate PDF: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  advanceLeadStage(lead: Lead, nextStage: 'New' | 'Discovery' | 'Evaluation' | 'Negotiating' | 'Closed') {
    this.leads.update((all) =>
      all.map((l) => {
        if (l.id === lead.id) {
          const newEvent: ActivityEvent = {
            id: `t-${Date.now()}`,
            type: 'stage',
            title: `Stage advanced to ${nextStage}`,
            description: `Opportunity stage updated by sales team.`,
            time: 'Just now',
            icon: 'trending_up',
            badgeColor: '#0B6B53',
          };
          const computedStatus: 'New' | 'Engaged' | 'Negotiating' | 'Closed' =
            nextStage === 'Negotiating' ? 'Negotiating' : nextStage === 'Closed' ? 'Closed' : nextStage === 'New' ? 'New' : 'Engaged';
          return {
            ...l,
            stage: nextStage,
            status: computedStatus,
            timeline: [newEvent, ...l.timeline],
          };
        }
        return l;
      })
    );

    if (this.activeDrawerLead()?.id === lead.id) {
      const updated = this.leads().find((l) => l.id === lead.id) || null;
      this.activeDrawerLead.set(updated);
    }

    this.showToast(`Advanced ${lead.company} to "${nextStage}" stage.`);
  }

  addLeadNote(leadId: string, noteText: string) {
    if (!noteText.trim()) return;
    this.leads.update((all) =>
      all.map((l) => {
        if (l.id === leadId) {
          const newEvent: ActivityEvent = {
            id: `t-${Date.now()}`,
            type: 'meeting',
            title: 'Note logged by account team',
            description: noteText,
            time: 'Just now',
            icon: 'edit_note',
            badgeColor: '#17150F',
          };
          return {
            ...l,
            notes: [noteText, ...l.notes],
            timeline: [newEvent, ...l.timeline],
          };
        }
        return l;
      })
    );

    if (this.activeDrawerLead()?.id === leadId) {
      const updated = this.leads().find((l) => l.id === leadId) || null;
      this.activeDrawerLead.set(updated);
    }

    this.showToast('Note saved and synchronized with CRM timeline.');
  }

  openAiEmailGenerator(lead: Lead) {
    this.activeDrawerLead.set(lead);
    this.isGeneratingEmail.set(true);
    this.showEmailGeneratorModal.set(true);

    setTimeout(() => {
      this.isGeneratingEmail.set(false);
      const repName = this.userProfile().name || 'Enterprise Account Lead';
      this.generatedEmailContent.set({
        subject: `Tailored Enterprise Scaling & SLA Framework for ${lead.company}`,
        body: `Hi ${lead.name.split(' ')[0]},\n\nI noticed your team at ${lead.company} has been actively reviewing our enterprise telemetry and multi-region SLA specifications over the last 48 hours.\n\nGiven your team's focus on ${lead.industry.toLowerCase()} reliability, I have prepared a custom executive summary addressing your data isolation requirements and our guaranteed 99.99% availability framework.\n\nWould you have 15 minutes this Thursday at 2 PM PT to review the customized deployment roadmap?\n\nBest regards,\n${repName}\nDirector of Strategic Enterprise, Sales Pilot AI`,
      });
    }, 900);
  }

  closeEmailGeneratorModal() {
    this.showEmailGeneratorModal.set(false);
    this.generatedEmailContent.set(null);
  }

  dispatchGeneratedEmail() {
    const lead = this.activeDrawerLead();
    if (lead) {
      this.leads.update((all) =>
        all.map((l) => {
          if (l.id === lead.id) {
            const newEvent: ActivityEvent = {
              id: `t-${Date.now()}`,
              type: 'email',
              title: 'Autonomous AI Executive Email Sent',
              description: this.generatedEmailContent()?.subject || 'Enterprise Proposal',
              time: 'Just now',
              icon: 'send',
              badgeColor: '#A9772D',
            };
            return {
              ...l,
              lastContact: 'Just now',
              timeline: [newEvent, ...l.timeline],
            };
          }
          return l;
        })
      );
      this.showToast(`Outreach email dispatched to ${lead.email}. Added to CRM timeline.`);
    }
    this.closeEmailGeneratorModal();
  }

  triggerSequenceEnrollment(seqName: string) {
    this.showToast(`Enrolled eligible opportunities into "${seqName}". Automated touchpoints dispatched.`);
  }

  toggleSequenceStatus(seqId: string) {
    this.sequences.update((all) =>
      all.map((s) => (s.id === seqId ? { ...s, status: s.status === 'Active' ? 'Paused' : 'Active' } : s))
    );
    this.showToast('Sequence status updated.');
  }

  recalibrateModelLive() {
    if (this.isAnalyzing()) return;
    this.isAnalyzing.set(true);
    this.showToast('Recalibrating Scikit-Pulse v4.2 weights across 14,200 closed-won vectors...');

    setTimeout(() => {
      const pDwell = this.weightPricingDwell() / 100;
      const msaD = this.weightMsaDownload() / 100;

      this.leads.update((all) =>
        all.map((lead) => {
          const delta = Math.round((lead.signalsCount * pDwell * 2.5) + (msaD * 1.5) - 2);
          const newScore = Math.min(99, Math.max(45, lead.score + delta));
          return {
            ...lead,
            score: newScore,
            closeProbability: Number((newScore * 0.98).toFixed(1)),
          };
        })
      );

      this.isAnalyzing.set(false);
      this.showToast('Recalibration complete. All CRM account win probabilities updated in real time.');
    }, 1200);
  }

  openModelDriftModal() {
    this.showModelDriftModal.set(true);
  }

  closeModelDriftModal() {
    this.showModelDriftModal.set(false);
  }

  setModelDriftScenario(scenario: 'calibrated' | 'moderate_drift' | 'critical_drift') {
    this.modelDriftScenario.set(scenario);
    const labels: Record<string, string> = {
      calibrated: 'Calibrated Baseline (0.5% Δ)',
      moderate_drift: 'Moderate Drift Detected (-6.4% Δ)',
      critical_drift: 'Critical Concept Drift (-14.2% Δ)',
    };
    this.showToast(`AI Model Drift simulation switched to "${labels[scenario]}".`);
  }

  recalibrateDriftModel() {
    if (this.isDriftRecalibrating()) return;
    this.isDriftRecalibrating.set(true);
    this.showToast('Recalibrating AI Model weights against 14,200 closed-won vectors & active telemetry...');

    setTimeout(() => {
      this.modelDriftScenario.set('calibrated');
      this.modelDriftLastCalibrated.set('Just now');
      this.isDriftRecalibrating.set(false);

      this.tickerEvents.update((events) => [
        {
          code: 'DRIFT_RECALIBRATED',
          text: 'AI Model Drift resolved: Weights retrained against 14,200 vectors (Drift Delta reset to +0.5%)',
          time: 'Just now',
        },
        ...events.slice(0, 4),
      ]);

      this.showToast('Model drift successfully recalibrated. Baseline win-rate calibrated to 85.1% (PSI: 0.03).');
    }, 1200);
  }

  exportCrmData() {
    const dataStr = JSON.stringify(this.leads(), null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sales-pilot-crm-export-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    this.showToast('CRM dataset exported successfully to JSON.');
  }

  runAiAnalysis() {
    if (this.isAnalyzing()) return;
    this.isAnalyzing.set(true);
    this.showToast('Recalibrating model against Q3 telemetry vectors...');

    setTimeout(() => {
      this.isAnalyzing.set(false);
      this.showToast('Model synchronization complete. Deal Orbit updated with 3 newly prioritized accounts.');
    }, 1200);
  }

  showToast(msg: string) {
    this.toastMessage.set(msg);
    setTimeout(() => {
      if (this.toastMessage() === msg) {
        this.toastMessage.set(null);
      }
    }, 4500);
  }

  setDrawerTab(tab: 'overview' | 'meddpicc' | 'health-timeline' | 'stakeholders' | 'timeline' | 'documents') {
    this.drawerActiveTab.set(tab);
  }

  setHealthTimelineFilter(filter: 'all' | 'shifts_only' | 'upgrades' | 'risks') {
    this.healthTimelineFilter.set(filter);
  }

  getFilteredHealthHistory(lead: Lead | null): DealHealthHistoryEntry[] {
    if (!lead || !lead.healthHistory) return [];
    const filter = this.healthTimelineFilter();
    if (filter === 'all') return lead.healthHistory;
    if (filter === 'shifts_only') {
      return lead.healthHistory.filter((h) => h.previousHealth && h.previousHealth !== h.health);
    }
    if (filter === 'upgrades') {
      return lead.healthHistory.filter((h) =>
        h.health === 'Accelerating' || (h.health === 'Healthy' && (h.previousHealth === 'Warning' || h.previousHealth === 'At Risk')) || (h.scoreDelta !== undefined && h.scoreDelta > 0)
      );
    }
    if (filter === 'risks') {
      return lead.healthHistory.filter((h) => h.health === 'At Risk' || h.health === 'Warning' || (h.scoreDelta !== undefined && h.scoreDelta < 0));
    }
    return lead.healthHistory;
  }

  getMeddpiccCompletedCount(lead: Lead | null): number {
    if (!lead || !lead.meddpicc) return 0;
    return Object.values(lead.meddpicc).filter(Boolean).length;
  }

  getMeddpiccPercentage(lead: Lead | null): number {
    if (!lead || !lead.meddpicc) return 0;
    const count = this.getMeddpiccCompletedCount(lead);
    return Math.round((count / 8) * 100);
  }

  getHealthHistoryNetShift(lead: Lead | null): { delta: number; label: string; isPositive: boolean } {
    if (!lead || !lead.healthHistory || lead.healthHistory.length === 0) {
      return { delta: 0, label: '0% Net Delta', isPositive: true };
    }
    const history = lead.healthHistory;
    const earliest = history[history.length - 1];
    const latest = history[0];
    const delta = Number((latest.score - earliest.score).toFixed(1));
    const isPositive = delta >= 0;
    return {
      delta,
      label: `${isPositive ? '+' : ''}${delta}% Net Shift`,
      isPositive,
    };
  }

  toggleMeddpiccCriterion(key: keyof MeddpiccCriteria) {
    const lead = this.activeDrawerLead();
    if (!lead || !lead.meddpicc) return;

    const isAdding = !lead.meddpicc[key];
    const updatedMeddpicc: MeddpiccCriteria = {
      ...lead.meddpicc,
      [key]: isAdding,
    };

    // Calculate score delta based on MEDDPICC criteria (each counts for ~11.5%)
    const trueCount = Object.values(updatedMeddpicc).filter(Boolean).length;
    const recalculatedProb = Math.min(99, Math.max(40, Math.round(trueCount * 11.5 + (lead.numericArr > 200000 ? 5 : 0))));
    const prevHealth = lead.dealHealth;
    let newHealth: Lead['dealHealth'] = 'Healthy';
    if (trueCount >= 6) newHealth = 'Accelerating';
    else if (trueCount >= 4) newHealth = 'Healthy';
    else if (trueCount >= 2) newHealth = 'Warning';
    else newHealth = 'At Risk';

    const criterionLabels: Record<keyof MeddpiccCriteria, { code: string; name: string }> = {
      metrics: { code: 'M', name: 'Metrics & ROI' },
      economicBuyer: { code: 'E', name: 'Economic Buyer' },
      decisionCriteria: { code: 'D', name: 'Decision Criteria' },
      decisionProcess: { code: 'P', name: 'Decision Process' },
      paperProcess: { code: 'P', name: 'Paper Process' },
      identifyPain: { code: 'I', name: 'Identify Pain' },
      identifiedPain: { code: 'I', name: 'Identify Pain' },
      champion: { code: 'C', name: 'Champion' },
      competition: { code: 'C', name: 'Competition' },
    };

    const critInfo = criterionLabels[key] || { code: 'M', name: String(key) };
    const critFullName = `${critInfo.name} (${critInfo.code})`;
    const scoreDelta = Number((recalculatedProb - lead.closeProbability).toFixed(1));

    const triggerMessage = isAdding
      ? `MEDDPICC: ${critFullName} Verified & Qualified`
      : `MEDDPICC: ${critFullName} Removed from Scope`;

    const summaryNotes = isAdding
      ? (newHealth !== prevHealth
          ? `Health status advanced from "${prevHealth}" to "${newHealth}" following qualification of ${critFullName}. MEDDPICC coverage increased to ${trueCount}/8.`
          : `Criterion "${critFullName}" confirmed. Qualification coverage increased to ${trueCount}/8 criteria with ${recalculatedProb}% confidence.`)
      : (newHealth !== prevHealth
          ? `Health status downgraded from "${prevHealth}" to "${newHealth}" due to removal of ${critFullName}. MEDDPICC coverage reduced to ${trueCount}/8.`
          : `Criterion "${critFullName}" unmarked. Coverage adjusted to ${trueCount}/8 criteria (${recalculatedProb}% score).`);

    const newHistoryEntry: DealHealthHistoryEntry = {
      id: `hh-${Date.now()}`,
      timestamp: 'Just now',
      dateLabel: 'Today, Live Update',
      health: newHealth,
      previousHealth: prevHealth,
      score: recalculatedProb,
      previousScore: lead.closeProbability,
      scoreDelta,
      stage: lead.stage,
      trigger: triggerMessage,
      triggerType: isAdding ? 'meddpicc_upgrade' : 'meddpicc_downgrade',
      meddpiccDelta: isAdding ? `+ ${critFullName}` : `- ${critFullName}`,
      addedCriteria: isAdding ? [critFullName] : [],
      removedCriteria: !isAdding ? [critFullName] : [],
      criteriaCount: trueCount,
      keyDrivers: [
        isAdding
          ? `Stakeholder alignment confirmed for ${critFullName}`
          : `Flagged ${critFullName} for re-validation by account team`,
        `Autonomous qualification confidence recalibrated to ${recalculatedProb}%`
      ],
      author: 'Alex Morgan (AE)',
      summaryNotes,
    };

    const newTimelineEvent: ActivityEvent = {
      id: `t-${Date.now()}`,
      type: 'signal',
      title: triggerMessage,
      description: summaryNotes,
      time: 'Just now',
      icon: isAdding ? 'verified' : 'history_toggle_off',
      badgeColor: isAdding ? '#0B6B53' : '#A9772D',
      author: 'Alex Morgan',
    };

    this.leads.update((all) =>
      all.map((l) => {
        if (l.id === lead.id) {
          return {
            ...l,
            meddpicc: updatedMeddpicc,
            closeProbability: recalculatedProb,
            dealHealth: newHealth,
            timeline: [newTimelineEvent, ...l.timeline],
            healthHistory: [newHistoryEntry, ...(l.healthHistory || [])],
          };
        }
        return l;
      })
    );

    const updatedLead = this.leads().find((l) => l.id === lead.id) || null;
    this.activeDrawerLead.set(updatedLead);
    this.showToast(`MEDDPICC updated: "${critFullName}". Deal health: ${newHealth} (${recalculatedProb}%). Health Timeline updated.`);
  }

  simulateHealthMilestone(lead: Lead) {
    if (!lead) return;
    const unconfirmed = lead.meddpicc
      ? (Object.keys(lead.meddpicc) as (keyof MeddpiccCriteria)[]).filter(k => !lead.meddpicc![k])
      : [];

    if (unconfirmed.length > 0) {
      const nextKey = unconfirmed[0];
      this.toggleMeddpiccCriterion(nextKey);
    } else {
      // Toggle a random one off and on or show milestone toast
      this.showToast(`All 8 MEDDPICC criteria for ${lead.company} are already 100% qualified!`);
    }
  }

  submitQuickActivityLog() {
    const lead = this.activeDrawerLead();
    const content = this.newLogContent().trim();
    if (!lead || !content) {
      this.showToast('Please enter call / note notes.');
      return;
    }

    const type = this.newLogType();
    const outcome = this.newLogOutcome();
    const iconMap: Record<string, string> = {
      call: 'call',
      note: 'edit_note',
      meeting: 'groups',
      email: 'send',
    };

    const newEvent: ActivityEvent = {
      id: `t-${Date.now()}`,
      type,
      title: `${type.toUpperCase()} Logged: ${outcome}`,
      description: content,
      time: 'Just now',
      icon: iconMap[type] || 'description',
      badgeColor: type === 'call' ? '#0B6B53' : type === 'meeting' ? '#A9772D' : '#17150F',
      author: 'Alex Morgan',
    };

    this.leads.update((all) =>
      all.map((l) => {
        if (l.id === lead.id) {
          return {
            ...l,
            lastContact: 'Just now',
            notes: [content, ...l.notes],
            timeline: [newEvent, ...l.timeline],
          };
        }
        return l;
      })
    );

    const updatedLead = this.leads().find((l) => l.id === lead.id) || null;
    this.activeDrawerLead.set(updatedLead);
    this.newLogContent.set('');
    this.showToast(`Logged ${type} activity for ${lead.company}. Synchronized with CRM timeline.`);
  }

  openDocPreview(doc: DealDocument) {
    this.showDocPreviewModal.set(doc);
  }

  closeDocPreview() {
    this.showDocPreviewModal.set(null);
  }

  setLeadHealth(leadId: string, health: Lead['dealHealth']) {
    const targetLead = this.leads().find((l) => l.id === leadId);
    if (!targetLead) return;
    const prevHealth = targetLead.dealHealth;
    if (prevHealth === health) return;

    const manualEntry: DealHealthHistoryEntry = {
      id: `hh-${Date.now()}`,
      timestamp: 'Just now',
      dateLabel: 'Today, Manual Adjustment',
      health,
      previousHealth: prevHealth,
      score: targetLead.closeProbability,
      previousScore: targetLead.closeProbability,
      scoreDelta: 0,
      stage: targetLead.stage,
      trigger: `Manual Health Override: ${prevHealth} ➔ ${health}`,
      triggerType: 'manual_override',
      criteriaCount: targetLead.meddpicc ? Object.values(targetLead.meddpicc).filter(Boolean).length : 0,
      keyDrivers: [
        `Executive override applied by AE Alex Morgan`,
        `Preserved current win score probability at ${targetLead.closeProbability}%`
      ],
      author: 'Alex Morgan (AE)',
      summaryNotes: `Deal health manually updated from "${prevHealth}" to "${health}".`,
    };

    const newTimelineEvent: ActivityEvent = {
      id: `t-${Date.now()}`,
      type: 'signal',
      title: `Deal Health Override: ${health}`,
      description: `Health manually recalibrated from ${prevHealth} to ${health}.`,
      time: 'Just now',
      icon: 'tune',
      badgeColor: '#17150F',
      author: 'Alex Morgan',
    };

    this.leads.update((all) =>
      all.map((l) =>
        l.id === leadId
          ? {
              ...l,
              dealHealth: health,
              timeline: [newTimelineEvent, ...l.timeline],
              healthHistory: [manualEntry, ...(l.healthHistory || [])],
            }
          : l
      )
    );

    if (this.activeDrawerLead()?.id === leadId) {
      const updated = this.leads().find((l) => l.id === leadId) || null;
      this.activeDrawerLead.set(updated);
    }
    this.showToast(`Opportunity health updated to "${health}". Health Timeline recorded entry.`);
  }

  setEmailTone(tone: 'executive' | 'technical' | 'urgent' | 'security') {
    this.emailTone.set(tone);
    const lead = this.activeDrawerLead();
    if (!lead) return;

    const toneSubjects: Record<string, string> = {
      executive: `Strategic Partnership & Scaling SLA Framework for ${lead.company}`,
      technical: `Technical Architecture, Webhooks & High-Throughput Cluster Specs for ${lead.company}`,
      urgent: `Q3 Tier-1 Incentive & Deployment Schedule for ${lead.company}`,
      security: `Enterprise SOC2 Type II, Encryption & Compliance Packet for ${lead.company}`,
    };

    const repName = this.userProfile().name || 'Enterprise Account Lead';
    const toneBodies: Record<string, string> = {
      executive: `Hi ${lead.name.split(' ')[0]},\n\nGiven your team's focus on ${lead.industry.toLowerCase()} growth, our enterprise acceleration platform is designed to streamline deal velocity and ensure high-fidelity forecasting for ${lead.company}.\n\nOur guaranteed 99.99% multi-region SLA and dedicated support tier are tailored for your current scaling phase.\n\nWould you have 15 minutes this Thursday to align on target deployment milestones?\n\nBest regards,\n${repName}\nStrategic Enterprise Lead`,
      technical: `Hi ${lead.name.split(' ')[0]},\n\nFollowing up on your architecture review for ${lead.company}. I've synthesized our webhook throughput benchmarks (500k events/sec) and dedicated VPC peering configuration.\n\nOur engineering team has confirmed compatibility with your existing tech stack with zero payload loss.\n\nLet me know if you would like to test our sandbox instance directly with your engineering leads.\n\nBest regards,\n${repName}`,
      urgent: `Hi ${lead.name.split(' ')[0]},\n\nI wanted to bring to your attention that our executive committee has authorized a Q3 Tier-1 enterprise package for ${lead.company}, which includes complimentary white-glove migration and prioritized SLAs if finalized before August 31.\n\nShall we connect briefly tomorrow to review the commercial terms?\n\nBest regards,\n${repName}`,
      security: `Hi ${lead.name.split(' ')[0]},\n\nTo assist your security and infosec team at ${lead.company}, I have attached our complete SOC2 Type II compliance audit, penetration testing summary, and ISO 27001 attestation.\n\nOur data residency supports full regional isolation with AES-256 encryption at rest and in transit.\n\nPlease let me know if your CISO requires any additional clarifications.\n\nBest regards,\n${repName}`,
    };

    this.generatedEmailContent.set({
      subject: toneSubjects[tone],
      body: toneBodies[tone],
    });
  }

  toggleCommandPalette() {
    this.showCommandPalette.update((v) => !v);
    this.commandSearchQuery.set('');
  }

  openCommandPalette() {
    this.showCommandPalette.set(true);
    this.commandSearchQuery.set('');
  }

  closeCommandPalette() {
    this.showCommandPalette.set(false);
  }

  executeCommandAction(actionType: string, lead?: Lead) {
    this.closeCommandPalette();
    if (lead) {
      this.openLeadDrawer(lead);
      return;
    }
    switch (actionType) {
      case 'NEW_LEAD':
        this.openNewLeadModal();
        break;
      case 'RECALIBRATE':
        this.recalibrateModelLive();
        break;
      case 'EXPORT_JSON':
        this.exportCrmData();
        break;
      case 'GOTO_LEADS':
        this.setTab('leads');
        break;
      case 'GOTO_ANALYTICS':
        this.setTab('analytics');
        break;
      case 'GOTO_PROFILE':
        this.setTab('profile');
        break;
      case 'GOTO_SETTINGS':
        this.setTab('settings');
        break;
      default:
        break;
    }
  }

  getHealthBadgeClass(health: string): string {
    switch (health) {
      case 'Accelerating':
        return 'bg-[#0B6B53]/15 text-[#0B6B53] border-[#0B6B53]/30 font-semibold';
      case 'Healthy':
        return 'bg-[#0B6B53]/10 text-[#0B6B53] border-[#0B6B53]/25';
      case 'Warning':
        return 'bg-[#A9772D]/15 text-[#A9772D] border-[#A9772D]/35';
      case 'At Risk':
        return 'bg-[#B91C1C]/10 text-[#B91C1C] border-[#B91C1C]/25 font-semibold';
      default:
        return 'bg-[#8C8672]/10 text-[#8C8672] border-[#EAE4D4]';
    }
  }

  getBuyingRoleBadgeClass(role?: string): string {
    switch (role) {
      case 'Champion':
        return 'bg-[#0B6B53]/10 text-[#0B6B53] border-[#0B6B53]/30';
      case 'Economic Buyer':
        return 'bg-[#A9772D]/10 text-[#A9772D] border-[#A9772D]/30';
      case 'Security / Legal':
        return 'bg-[#6B4B8A]/10 text-[#6B4B8A] border-[#6B4B8A]/30';
      case 'Blocker':
        return 'bg-[#B91C1C]/10 text-[#B91C1C] border-[#B91C1C]/25';
      default:
        return 'bg-[#17150F]/5 text-[#17150F] border-[#EAE4D4]';
    }
  }

  openNewLeadModal() {
    this.showNewLeadModal.set(true);
  }

  closeNewLeadModal() {
    this.showNewLeadModal.set(false);
  }

  selectStakeholder(dm: DecisionMaker) {
    this.selectedStakeholder.set(dm);
  }

  deployPriorityAction() {
    this.showToast('Priority sequence dispatched: Executive outreach & tailored pricing sent to Google Cloud team.');
  }

  saveNewLead(name: string, company: string, dealValue: string, email: string, industry: string, region: string) {
    if (!name || !company) {
      this.showToast('Contact name and company are required.');
      return;
    }

    const calculatedScore = Math.floor(Math.random() * 20) + 78;
    const cleanArr = dealValue.replace(/[^0-9]/g, '');
    const numArr = cleanArr ? parseInt(cleanArr, 10) : 125000;
    const formattedValue = dealValue.startsWith('$') ? dealValue : `$${dealValue || '125,000'}`;

    const newLead: Lead = {
      id: String(Date.now()),
      name,
      company,
      score: calculatedScore,
      dealValue: formattedValue,
      numericArr: numArr,
      stage: 'New',
      status: 'New',
      aiSuggestion: 'Firmographic profile ingested. Model recommends targeted discovery sequence.',
      lastContact: 'Just now',
      industry: industry || 'Enterprise Cloud & SaaS',
      region: (region === 'EMEA' || region === 'APAC' || region === 'LATAM' ? region : 'North America') as 'North America' | 'EMEA' | 'APAC' | 'LATAM',
      email: email || `${name.toLowerCase().replace(/\s+/g, '.')}@${company.toLowerCase().replace(/[^a-z]/g, '')}.com`,
      phone: '+1 (555) 019-2831',
      owner: 'Alex Morgan',
      signalsCount: 4,
      engagementVelocity: 'Newly Ingested',
      closeProbability: Number((calculatedScore * 0.96).toFixed(1)),
      daysInStage: 1,
      dealHealth: 'Healthy',
      meddpicc: {
        metrics: true,
        economicBuyer: false,
        decisionCriteria: false,
        decisionProcess: false,
        paperProcess: false,
        identifyPain: true,
        identifiedPain: true,
        champion: true,
        competition: false,
      },
      documents: [],
      notes: ['Ingested via Sales Pilot AI Command Deck.'],
      stakeholders: [
        {
          id: `dm-${Date.now()}`,
          name,
          role: 'Primary Prospect Lead',
          action: 'Ingested into CRM database',
          time: 'Just now',
          avatar: name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase(),
          topPct: '',
          leftPct: '',
          email: email || `${name.toLowerCase().replace(/\s+/g, '.')}@${company.toLowerCase().replace(/[^a-z]/g, '')}.com`,
        },
      ],
      timeline: [
        {
          id: `t-${Date.now()}`,
          type: 'stage',
          title: 'Opportunity Ingested',
          description: `Score calculated at ${calculatedScore}% win probability.`,
          time: 'Just now',
          icon: 'add_circle',
          badgeColor: '#A9772D',
        },
      ],
    };

    this.leads.update((current) => [newLead, ...current]);

    this.tickerEvents.update((events) => [
      {
        code: 'NEW_RECORD',
        text: `${company}: Ingested new prospect ${name} (${calculatedScore}% AI conversion probability)`,
        time: 'Just now',
      },
      ...events.slice(0, 4),
    ]);

    this.closeNewLeadModal();
    this.showToast(`Lead "${name}" for "${company}" added at ${calculatedScore}% win probability.`);
  }

  getScoreCircumference(score: number): string {
    const radius = 14;
    const circumference = 2 * Math.PI * radius;
    const progress = (score / 100) * circumference;
    return `${progress} ${circumference}`;
  }

  getPrecisionCircumference(percentage: number): string {
    const radius = 32;
    const circumference = 2 * Math.PI * radius;
    const progress = (percentage / 100) * circumference;
    return `${progress} ${circumference}`;
  }

  getHeatmapBg(intensity: number): string {
    switch (intensity) {
      case 5:
        return 'bg-[#0B6B53] text-white';
      case 4:
        return 'bg-[#0B6B53]/75 text-white';
      case 3:
        return 'bg-[#0B6B53]/45 text-[#17150F]';
      case 2:
        return 'bg-[#0B6B53]/25 text-[#17150F]';
      default:
        return 'bg-[#EAE4D4] text-[#8C8672]';
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Negotiating':
        return 'bg-[#A9772D]/10 text-[#A9772D] border-[#A9772D]/30';
      case 'Evaluation':
        return 'bg-[#6B4B8A]/10 text-[#6B4B8A] border-[#6B4B8A]/30';
      case 'Engaged':
      case 'Discovery':
        return 'bg-[#0B6B53]/10 text-[#0B6B53] border-[#0B6B53]/30';
      case 'Closed':
        return 'bg-[#0B6B53]/20 text-[#0B6B53] border-[#0B6B53]/40 font-bold';
      case 'New':
        return 'bg-[#17150F]/5 text-[#17150F] border-[#EAE4D4]';
      default:
        return 'bg-[#8C8672]/10 text-[#8C8672] border-[#EAE4D4]';
    }
  }

  // ==========================================
  // CRM DATASET UPLOAD & INGESTION HUB METHODS
  // ==========================================

  setDatasetTab(tab: 'upload' | 'pipeline' | 'accounts' | 'teams' | 'products' | 'dictionary') {
    this.datasetActiveTab.set(tab);
  }

  onDatasetDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingFile.set(true);
  }

  onDatasetDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingFile.set(false);
  }

  onDatasetDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingFile.set(false);

    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      this.readAndProcessUploadedFile(file);
    }
  }

  onDatasetFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input && input.files && input.files.length > 0) {
      const file = input.files[0];
      this.readAndProcessUploadedFile(file);
      input.value = '';
    }
  }

  private readAndProcessUploadedFile(file: File) {
    const reader = new FileReader();
    this.isProcessingDataset.set(true);
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        this.processDatasetString(text, file.name);
      }
      this.isProcessingDataset.set(false);
    };
    reader.onerror = () => {
      this.isProcessingDataset.set(false);
      this.showToast('Failed to read uploaded file. Please ensure it is a valid CSV or JSON text file.');
    };
    reader.readAsText(file);
  }

  handleRawCsvPasteUpload() {
    const raw = this.rawCsvPasteText().trim();
    if (!raw) {
      this.showToast('Please paste CSV dataset content first.');
      return;
    }
    this.isProcessingDataset.set(true);
    setTimeout(() => {
      this.processDatasetString(raw, 'pasted_dataset.csv');
      this.isProcessingDataset.set(false);
    }, 150);
  }

  processDatasetString(content: string, filename = 'imported_data.csv') {
    try {
      this.lastUploadedFileName.set(filename);

      // Clean lines and handle carriage returns
      const lines = content
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      if (lines.length === 0) {
        this.showToast('Uploaded dataset was empty.');
        return;
      }

      // Check if it's JSON
      if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
        try {
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed)) {
            // Check schema
            if (parsed.length > 0 && ('opportunity_id' in parsed[0] || 'opportunityId' in parsed[0])) {
              const mapped: CrmPipelineRecord[] = parsed.map((p) => ({
                opportunityId: p.opportunity_id || p.opportunityId || `OPP-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
                salesAgent: p.sales_agent || p.salesAgent || 'Alex Morgan',
                product: p.product || 'GTX Pro',
                account: p.account || 'Unknown Account',
                dealStage: (p.deal_stage || p.dealStage || 'Engaging') as 'Won' | 'Lost' | 'Engaging' | 'Prospecting',
                engageDate: p.engage_date || p.engageDate || new Date().toISOString().slice(0, 10),
                closeDate: p.close_date || p.closeDate || undefined,
                closeValue: Number(p.close_value || p.closeValue || 0),
              }));
              this.crmPipeline.set(mapped);
              this.setUploadSummary();
              this.showToast(`Successfully parsed and loaded ${mapped.length} pipeline records from JSON.`);
              this.datasetActiveTab.set('pipeline');
              return;
            }
          }
        } catch {
          // fallback to CSV parsing
        }
      }

      // Parse CSV sections (supports both single table CSV and multi-table dump)
      let currentSection: 'accounts' | 'products' | 'sales_teams' | 'sales_pipeline' | 'dictionary' | 'auto' = 'auto';
      const parsedAccounts: CrmAccount[] = [];
      const parsedProducts: CrmProduct[] = [];
      const parsedTeams: CrmSalesTeam[] = [];
      const parsedPipeline: CrmPipelineRecord[] = [];
      const parsedDict: CrmDataDictionaryItem[] = [];

      for (const line of lines) {
        // Header section identifiers
        if (line.toLowerCase().startsWith('account,sector,year_established')) {
          currentSection = 'accounts';
          continue;
        } else if (line.toLowerCase().startsWith('product,series,sales_price')) {
          currentSection = 'products';
          continue;
        } else if (line.toLowerCase().startsWith('sales_agent,manager,regional_office')) {
          currentSection = 'sales_teams';
          continue;
        } else if (line.toLowerCase().startsWith('opportunity_id,sales_agent,product,account')) {
          currentSection = 'sales_pipeline';
          continue;
        } else if (line.toLowerCase().startsWith('table,field,description')) {
          currentSection = 'dictionary';
          continue;
        }

        // Auto-detect if no explicit multi-table header
        if (currentSection === 'auto') {
          const lower = line.toLowerCase();
          if (lower.includes('opportunity_id') || lower.includes('deal_stage') || lower.includes('close_value')) {
            currentSection = 'sales_pipeline';
            continue;
          } else if (lower.includes('year_established') || lower.includes('office_location') || lower.includes('subsidiary_of')) {
            currentSection = 'accounts';
            continue;
          } else if (lower.includes('regional_office') || lower.includes('manager')) {
            currentSection = 'sales_teams';
            continue;
          } else if (lower.includes('sales_price') || lower.includes('series')) {
            currentSection = 'products';
            continue;
          } else {
            // Default first table if unknown
            currentSection = 'sales_pipeline';
          }
        }

        // Split CSV row while respecting quotes
        const tokens = this.parseCsvRowTokens(line);
        if (tokens.length === 0) continue;

        if (currentSection === 'accounts' && tokens.length >= 6) {
          parsedAccounts.push({
            account: tokens[0],
            sector: tokens[1] || 'technology',
            yearEstablished: parseInt(tokens[2], 10) || 2000,
            revenue: parseFloat(tokens[3]) || 0,
            employees: parseInt(tokens[4], 10) || 100,
            officeLocation: tokens[5] || 'United States',
            subsidiaryOf: tokens[6] || undefined,
          });
        } else if (currentSection === 'products' && tokens.length >= 3) {
          parsedProducts.push({
            product: tokens[0],
            series: tokens[1],
            salesPrice: parseFloat(tokens[2]) || 0,
          });
        } else if (currentSection === 'sales_teams' && tokens.length >= 3) {
          parsedTeams.push({
            salesAgent: tokens[0],
            manager: tokens[1],
            regionalOffice: tokens[2],
          });
        } else if (currentSection === 'sales_pipeline' && tokens.length >= 7) {
          const rawStage = (tokens[4] || 'Engaging').trim();
          let stage: 'Won' | 'Lost' | 'Engaging' | 'Prospecting' = 'Engaging';
          if (/won/i.test(rawStage)) stage = 'Won';
          else if (/lost/i.test(rawStage)) stage = 'Lost';
          else if (/prospect/i.test(rawStage)) stage = 'Prospecting';

          parsedPipeline.push({
            opportunityId: tokens[0],
            salesAgent: tokens[1] || 'Alex Morgan',
            product: tokens[2] || 'GTX Pro',
            account: tokens[3] || 'Strategic Account',
            dealStage: stage,
            engageDate: tokens[5] || '2017-01-01',
            closeDate: tokens[6] || undefined,
            closeValue: parseFloat(tokens[7]) || 0,
          });
        } else if (currentSection === 'dictionary' && tokens.length >= 3) {
          parsedDict.push({
            table: tokens[0],
            field: tokens[1],
            description: tokens[2],
          });
        }
      }

      // Update state if parsed
      let updatedTables = 0;
      if (parsedAccounts.length > 0) {
        this.crmAccounts.set(parsedAccounts);
        updatedTables++;
      }
      if (parsedProducts.length > 0) {
        this.crmProducts.set(parsedProducts);
        updatedTables++;
      }
      if (parsedTeams.length > 0) {
        this.crmSalesTeams.set(parsedTeams);
        updatedTables++;
      }
      if (parsedPipeline.length > 0) {
        this.crmPipeline.set(parsedPipeline);
        updatedTables++;
      }
      if (parsedDict.length > 0) {
        this.crmDictionary.set(parsedDict);
      }

      this.setUploadSummary();

      this.showToast(
        `Dataset Ingestion Complete! Successfully parsed ${parsedPipeline.length} Opportunities, ${parsedAccounts.length} Accounts across ${updatedTables} tables.`
      );

      this.tickerEvents.update((ev) => [
        {
          code: 'DATASET_INGEST',
          text: `Ingested ${filename}: ${parsedPipeline.length || parsedAccounts.length} records verified into CRM memory`,
          time: 'Just now',
        },
        ...ev.slice(0, 4),
      ]);

      if (parsedPipeline.length > 0) {
        this.datasetActiveTab.set('pipeline');
      } else if (parsedAccounts.length > 0) {
        this.datasetActiveTab.set('accounts');
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Invalid CSV format';
      this.showToast(`Error parsing dataset: ${errMsg}`);
    }
  }

  private parseCsvRowTokens(row: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      if (char === '"') {
        if (inQuotes && row[i + 1] === '"') {
          current += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  private setUploadSummary() {
    const pipeline = this.crmPipeline();
    const accounts = this.crmAccounts();
    const products = this.crmProducts();
    const teams = this.crmSalesTeams();

    const wonValue = pipeline.filter((p) => p.dealStage === 'Won').reduce((s, p) => s + p.closeValue, 0);
    const totalVolume = pipeline.reduce((s, p) => s + p.closeValue, 0);

    this.uploadSuccessSummary.set({
      opportunitiesCount: pipeline.length,
      accountsCount: accounts.length,
      productsCount: products.length,
      teamsCount: teams.length,
      totalVolume: `$${(totalVolume / 1000000).toFixed(2)}M`,
      wonVolume: `$${(wonValue / 1000000).toFixed(2)}M`,
    });
  }

  loadPreloadedEnterpriseDataset() {
    this.isProcessingDataset.set(true);
    setTimeout(() => {
      this.crmAccounts.set(INITIAL_ACCOUNTS);
      this.crmProducts.set(INITIAL_PRODUCTS);
      this.crmSalesTeams.set(INITIAL_SALES_TEAMS);
      this.crmPipeline.set(INITIAL_PIPELINE_DATA);
      this.crmDictionary.set(INITIAL_DATA_DICTIONARY);
      this.lastUploadedFileName.set('enterprise_sales_benchmark_v4.2.csv');
      this.setUploadSummary();
      this.isProcessingDataset.set(false);
      this.showToast('Loaded preconfigured Enterprise CRM Benchmark dataset (Accounts, Pipeline & Reps).');
      this.datasetActiveTab.set('pipeline');
    }, 200);
  }

  syncDatasetToLivePipeline(mode: 'merge' | 'replace' = 'merge') {
    const pipeline = this.crmPipeline();
    const accountsMap = new Map<string, CrmAccount>();
    this.crmAccounts().forEach((a) => accountsMap.set(a.account.toLowerCase(), a));

    if (pipeline.length === 0) {
      this.showToast('No pipeline records found in dataset to synchronize.');
      return;
    }

    // Convert top active and closed dataset records to Lead objects
    const newLeads: Lead[] = pipeline.slice(0, 48).map((p, idx) => {
      const acct = accountsMap.get(p.account.toLowerCase());
      const isWon = p.dealStage === 'Won';
      const isLost = p.dealStage === 'Lost';
      const isProspect = p.dealStage === 'Prospecting';

      const leadStage: 'New' | 'Discovery' | 'Evaluation' | 'Negotiating' | 'Closed' = isWon || isLost
        ? 'Closed'
        : isProspect
        ? 'New'
        : idx % 3 === 0
        ? 'Negotiating'
        : idx % 2 === 0
        ? 'Evaluation'
        : 'Discovery';

      const dealVal = p.closeValue > 0 ? p.closeValue : p.product.includes('Pro') ? 5480 : 3200;
      const score = isWon ? 96 : isLost ? 24 : isProspect ? 62 : Math.min(94, Math.max(55, Math.round(55 + (dealVal % 40))));

      const health: 'Healthy' | 'Warning' | 'At Risk' | 'Accelerating' =
        score >= 85 ? 'Accelerating' : score >= 70 ? 'Healthy' : score >= 45 ? 'Warning' : 'At Risk';

      return {
        id: `csv-${p.opportunityId}-${idx}`,
        name: p.salesAgent,
        company: p.account,
        dealValue: `$${dealVal.toLocaleString()}`,
        numericArr: dealVal,
        score,
        stage: leadStage,
        status: leadStage === 'Closed' ? 'Closed' : leadStage === 'Negotiating' ? 'Negotiating' : leadStage === 'New' ? 'New' : 'Engaged',
        aiSuggestion: isWon
          ? 'Closed-Won deal. Deploy onboarding playbook and expansion telemetry.'
          : isLost
          ? 'Closed-Lost. Schedule win/loss retrospective and future re-engagement.'
          : `High velocity opportunity on ${p.product}. Engage key decision makers.`,
        lastContact: p.closeDate || p.engageDate || 'Recent',
        industry: acct?.sector ? acct.sector.charAt(0).toUpperCase() + acct.sector.slice(1) : 'Enterprise Technology',
        region: 'North America',
        email: `${p.salesAgent.toLowerCase().replace(/\s+/g, '.')}@salespilot.ai`,
        phone: '+1 (415) 890-4100',
        owner: p.salesAgent,
        signalsCount: Math.floor(Math.random() * 12) + 3,
        engagementVelocity: isWon ? 'Closed Won Velocity' : 'Accelerating Pace (+38% MoM)',
        closeProbability: score,
        daysInStage: Math.floor(Math.random() * 14) + 1,
        dealHealth: health,
        meddpicc: {
          metrics: score > 60,
          economicBuyer: score > 70,
          decisionCriteria: score > 50,
          decisionProcess: score > 65,
          paperProcess: score > 80,
          identifyPain: true,
          champion: score > 55,
          competition: true,
        },
        documents: [
          {
            id: `doc-csv-${idx}`,
            name: `${p.account.replace(/[^a-zA-Z0-9]/g, '_')}_Proposal_${p.product.replace(/\s+/g, '_')}.pdf`,
            type: 'Proposal Spec',
            size: '2.1 MB',
            updated: p.engageDate || '2017-04-10',
            status: isWon ? 'Approved' : 'In Review',
          },
        ],
        notes: [
          `Opportunity ID: ${p.opportunityId} • Hardware/Software Tier: ${p.product}`,
          acct ? `Headquartered in ${acct.officeLocation}, ${acct.employees} employees, $${acct.revenue}M ARR.` : 'Enterprise account.',
        ],
        stakeholders: [
          {
            id: `dm-csv-${idx}`,
            name: p.salesAgent,
            role: 'Account Representative',
            buyingRole: 'Champion',
            sentiment: 'Positive',
            action: `Initiated ${p.product} engagement on ${p.engageDate}`,
            time: p.engageDate,
            avatar: p.salesAgent.split(' ').map((n) => n[0]).join('').slice(0, 2),
            topPct: '',
            leftPct: '',
            email: `${p.salesAgent.toLowerCase().replace(/\s+/g, '.')}@salespilot.ai`,
          },
        ],
        timeline: [
          {
            id: `t-csv-${idx}`,
            type: 'stage',
            title: `Opportunity Initiated: ${p.product}`,
            description: `Sales Agent ${p.salesAgent} initiated engagement with ${p.account}.`,
            time: p.engageDate,
            icon: 'sync_alt',
            badgeColor: '#0B6B53',
          },
        ],
      };
    });

    if (mode === 'replace') {
      this.leads.set(newLeads);
    } else {
      // Merge unique
      const existing = this.leads();
      this.leads.set([...newLeads, ...existing.slice(0, 10)]);
    }

    this.showToast(`Synchronized ${newLeads.length} dataset opportunities into live CRM Kanban & Pipeline.`);
    this.setTab('leads');
  }

  exportDatasetTableCsv(table: 'pipeline' | 'accounts' | 'teams' | 'products') {
    let csvContent = '';
    let filename = '';

    if (table === 'pipeline') {
      filename = 'sales_pipeline_export.csv';
      const headers = ['opportunity_id', 'sales_agent', 'product', 'account', 'deal_stage', 'engage_date', 'close_date', 'close_value'];
      const rows = this.crmPipeline().map((p) =>
        [p.opportunityId, `"${p.salesAgent}"`, `"${p.product}"`, `"${p.account}"`, p.dealStage, p.engageDate, p.closeDate || '', p.closeValue].join(',')
      );
      csvContent = [headers.join(','), ...rows].join('\n');
    } else if (table === 'accounts') {
      filename = 'accounts_firmographics_export.csv';
      const headers = ['account', 'sector', 'year_established', 'revenue', 'employees', 'office_location', 'subsidiary_of'];
      const rows = this.crmAccounts().map((a) =>
        [`"${a.account}"`, `"${a.sector}"`, a.yearEstablished, a.revenue, a.employees, `"${a.officeLocation}"`, `"${a.subsidiaryOf || ''}"`].join(',')
      );
      csvContent = [headers.join(','), ...rows].join('\n');
    } else if (table === 'teams') {
      filename = 'sales_teams_territories_export.csv';
      const headers = ['sales_agent', 'manager', 'regional_office'];
      const rows = this.crmSalesTeams().map((t) => [`"${t.salesAgent}"`, `"${t.manager}"`, `"${t.regionalOffice}"`].join(','));
      csvContent = [headers.join(','), ...rows].join('\n');
    } else if (table === 'products') {
      filename = 'products_pricing_catalog.csv';
      const headers = ['product', 'series', 'sales_price'];
      const rows = this.crmProducts().map((p) => [`"${p.product}"`, `"${p.series}"`, p.salesPrice].join(','));
      csvContent = [headers.join(','), ...rows].join('\n');
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    this.showToast(`Downloaded "${filename}" with current dataset state.`);
  }

  downloadDatasetTemplate() {
    const templateContent = [
      '# SALES PIPELINE TABLE',
      'opportunity_id,sales_agent,product,account,deal_stage,engage_date,close_date,close_value',
      'OPP_1001,Alex Morgan,GTX Plus Pro,Acme Corporation,Won,2026-01-15,2026-03-20,5482',
      'OPP_1002,Sarah Chen,GTX Pro,Bioholding,Engaging,2026-02-01,,4821',
      'OPP_1003,Jason Vance,MG Advanced,Initech,Prospecting,2026-03-10,,3393',
      '',
      '# ACCOUNTS TABLE',
      'account,sector,year_established,revenue,employees,office_location,subsidiary_of',
      'Acme Corporation,technology,1996,1100.04,2822,United States,',
      'Bioholding,medical,2012,587.34,1356,Philipines,',
      'Initech,telecommunications,1994,6395.05,20275,United States,',
    ].join('\n');

    const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'crm_dataset_import_template.csv';
    link.click();
    URL.revokeObjectURL(url);
    this.showToast('Downloaded sample CRM multi-table import CSV template.');
  }

  // Aliases and helpers for template bindings
  readonly rawDatasetCsvInput = this.rawCsvPasteText;

  setDatasetActiveTab(tab: 'upload' | 'visualizations' | 'pipeline' | 'accounts' | 'teams' | 'products' | 'dictionary') {
    this.datasetActiveTab.set(tab);
  }

  setDatasetVisualizationFocus(focus: 'all' | 'funnel' | 'sectors' | 'reps' | 'products' | 'territories' | 'meddpicc' | 'cohorts') {
    this.datasetVisualizationFocus.set(focus);
  }

  setPipelineGraphType(type: 'area' | 'bar' | 'cumulative' | 'waterfall') {
    this.pipelineGraphType.set(type);
    const labels: Record<string, string> = {
      area: 'Area Trajectory Chart',
      bar: 'Discrete Monthly Column Chart',
      cumulative: 'Cumulative Pace Stepped Chart',
      waterfall: 'Waterfall Net Ingestion Delta Bridge',
    };
    this.showToast(`Switched graph view to ${labels[type]}.`);
  }

  setPipelineChartMetric(metric: 'arr' | 'winRate' | 'velocity' | 'deals') {
    this.pipelineChartMetric.set(metric);
    const labels: Record<string, string> = {
      arr: 'Pipeline ARR ($)',
      winRate: 'Model Win Probability (%)',
      velocity: 'Qualified Deal Velocity (Days)',
      deals: 'Active Opportunity Volume',
    };
    this.showToast(`Graph metric updated to ${labels[metric]}.`);
  }

  setHoveredScatterRep(rep: {
    agent: string;
    office: string;
    totalArr: number;
    arrFormatted: string;
    wonArr: number;
    wonFormatted: string;
    dealsCount: number;
    winRate: number;
    xPct: number;
    yPct: number;
    radius: number;
    color: string;
  } | null) {
    this.hoveredScatterRep.set(rep);
  }

  setHoveredSectorCard(sector: string | null) {
    this.hoveredSectorCard.set(sector);
  }

  filterDatasetBySector(sector: string) {
    this.datasetSectorFilter.set(sector.toLowerCase());
    this.datasetActiveTab.set('accounts');
    this.showToast(`Filtered accounts table to "${sector}" sector.`);
  }

  filterDatasetByAgent(agent: string) {
    this.datasetAgentFilter.set(agent);
    this.datasetActiveTab.set('pipeline');
    this.showToast(`Filtered pipeline table to agent "${agent}".`);
  }

  loadBenchmarkDataset() {
    this.loadPreloadedEnterpriseDataset();
  }

  downloadSampleMultiTableCsv() {
    this.downloadDatasetTemplate();
  }

  onDatasetFileDrop(event: DragEvent) {
    this.onDatasetDrop(event);
  }

  handleRawCsvPasteIngestion() {
    this.handleRawCsvPasteUpload();
  }

  exportDatasetCsv(table: 'pipeline' | 'accounts' | 'teams' | 'products') {
    this.exportDatasetTableCsv(table);
  }

  // =========================================================================
  // LIFECYCLE & LIVE AUTO-REFRESH ENGINE
  // =========================================================================

  startAutoRefreshTimer() {
    this.stopAutoRefreshTimer();
    const interval = this.autoRefreshIntervalSeconds();
    if (interval <= 0) return;
    this.autoRefreshCountdown.set(interval);
    this.refreshTimer = setInterval(() => {
      const current = this.autoRefreshCountdown();
      if (current <= 1) {
        this.triggerAutoRefresh(false);
      } else {
        this.autoRefreshCountdown.set(current - 1);
      }
    }, 1000);
  }

  stopAutoRefreshTimer() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  setAutoRefreshInterval(seconds: number) {
    this.autoRefreshIntervalSeconds.set(seconds);
    if (seconds <= 0) {
      this.stopAutoRefreshTimer();
      this.showToast('Auto-refresh paused. Use manual sync or select an interval.');
    } else {
      this.startAutoRefreshTimer();
      this.showToast(`Auto-refresh set to every ${seconds} seconds.`);
    }
  }

  triggerAutoRefresh(isManual = false) {
    if (this.isRefreshing()) return;
    this.isRefreshing.set(true);
    const now = new Date();
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    // Simulate real-time pipeline refresh
    setTimeout(() => {
      this.lastUpdatedTimestamp.set('Just now');
      this.lastUpdatedTimeFormatted.set(timeFormatted);
      this.autoRefreshCountdown.set(this.autoRefreshIntervalSeconds() || 30);
      this.isRefreshing.set(false);
      if (isManual) {
        this.showToast(`Pipeline metrics refreshed at ${timeFormatted}. Telemetry synchronized.`);
      }
    }, 500);
  }

  // =========================================================================
  // PIPELINE MULTI-COLUMN SORTING
  // =========================================================================
  togglePipelineSort(column: 'company' | 'score' | 'arr' | 'stage' | 'velocity' | 'daysInStage' | 'closeProbability' | 'health' | 'owner' | 'industry') {
    if (this.pipelineSortColumn() === column) {
      this.pipelineSortDirection.update((dir) => (dir === 'asc' ? 'desc' : 'asc'));
    } else {
      this.pipelineSortColumn.set(column);
      this.pipelineSortDirection.set('desc');
    }
    const labelMap: Record<string, string> = {
      company: 'Company',
      score: 'AI Score',
      arr: 'Deal ARR',
      stage: 'Stage',
      velocity: 'Velocity',
      daysInStage: 'Days in Stage',
      closeProbability: 'Close Probability',
      health: 'Deal Health',
      owner: 'Account Owner',
      industry: 'Industry',
    };
    this.showToast(`Ordered pipeline by ${labelMap[column] || column} (${this.pipelineSortDirection().toUpperCase()}).`);
  }

  // =========================================================================
  // DEAL ORBIT INTELLIGENCE SHARING ENGINE
  // =========================================================================
  openDealOrbitShare(tab: 'url' | 'email' = 'url') {
    this.dealOrbitShareTab.set(tab);
    this.dealOrbitShareCopied.set(false);
    this.dealOrbitEmailCopied.set(false);
    this.showDealOrbitShareModal.set(true);
  }

  closeDealOrbitShare() {
    this.showDealOrbitShareModal.set(false);
  }

  setDealOrbitShareTab(tab: 'url' | 'email') {
    this.dealOrbitShareTab.set(tab);
  }

  setDealOrbitShareExpiry(expiry: '7d' | '30d' | 'never') {
    this.dealOrbitShareExpiry.set(expiry);
    this.showToast(`Share link expiry set to ${expiry === 'never' ? 'Permanent' : expiry}.`);
  }

  getDealOrbitShareUrl(): string {
    return `https://crm.salespilot.ai/deal-orbit/view?token=${this.dealOrbitToken()}&account=google-cloud&exp=${this.dealOrbitShareExpiry()}`;
  }

  getDealOrbitEmailSubject(): string {
    const acc = this.priorityAccount();
    return `[Deal Orbit Intelligence] ${acc.company} (${acc.arr} ARR) Health & Decision-Maker Sentiment Briefing`;
  }

  getDealOrbitEmailBody(): string {
    const acc = this.priorityAccount();
    const stakeholders = this.orbitStakeholders();
    const shSummary = stakeholders
      .map((s) => `  • ${s.name} (${s.role}) - Role: ${s.buyingRole || 'Decision Maker'} | Sentiment: ${s.sentiment || 'Positive'} | Activity: ${s.action} (${s.time})`)
      .join('\n');

    return `EXECUTIVE DEAL ORBIT INTELLIGENCE BRIEFING
====================================================================
Account: ${acc.company}
Pipeline ARR: ${acc.arr}
Win Probability: ${acc.score}% (MEDDPICC Calibrated)
Stage: ${acc.stage}
Account Health: Healthy / Accelerating
Classification: Tier-1 Strategic Enterprise Prospect

KEY STRATEGIC INSIGHT:
${acc.insight}

DECISION-MAKER CONSTELLATION & SENTIMENT RADAR:
${shSummary}

RECOMMENDED REVENUE ACTIONS:
1. Dispatch customized tiered enterprise MSA expansion terms.
2. Align engineering architecture review with CTO & VP Infrastructure.
3. Validate SOC2 compliance acceptance with CRSO.

Secure Telemetry Verification URL:
${this.getDealOrbitShareUrl()}

Generated by Sales Pilot AI Revenue Operating System on ${new Date().toLocaleDateString()}`;
  }

  async copyDealOrbitPublicUrl() {
    const url = this.getDealOrbitShareUrl();
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      // Fallback
    }
    this.dealOrbitShareCopied.set(true);
    this.showToast('Deal Orbit public share URL copied to clipboard!');
    setTimeout(() => this.dealOrbitShareCopied.set(false), 3000);
  }

  async copyDealOrbitEmailSummary() {
    const body = this.getDealOrbitEmailBody();
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(body);
      }
    } catch {
      // Fallback
    }
    this.dealOrbitEmailCopied.set(true);
    this.showToast('Deal Orbit executive email briefing copied to clipboard!');
    setTimeout(() => this.dealOrbitEmailCopied.set(false), 3000);
  }

  openDealOrbitMailto() {
    if (typeof window === 'undefined') return;
    const subject = encodeURIComponent(this.getDealOrbitEmailSubject());
    const body = encodeURIComponent(this.getDealOrbitEmailBody());
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }

  // =========================================================================
  // MULTI-TURN GEMINI CHATBOT CONTROLLER & API DISPATCHER
  // =========================================================================
  
  setBotRole(role: BotRole) {
    this.selectedBotRole.set(role);
    const persona = this.botPersonas().find(p => p.id === role);
    if (persona) {
      this.selectedGeminiModel.set(persona.recommendedModel);
      this.showToast(`Switched bot role to: ${persona.name}`);
    }
  }

  setGeminiModel(model: 'gemini-3.5-flash' | 'gemini-3.1-pro-preview' | 'gemini-3.1-flash-lite') {
    this.selectedGeminiModel.set(model);
    this.showToast(`Active model set to: ${model}`);
  }

  toggleFloatingCopilot() {
    this.showFloatingCopilot.update(v => !v);
  }

  openCopilotTab() {
    this.setTab('copilot');
  }

  clearChatHistory() {
    const persona = this.activePersona();
    this.chatMessages.set([
      {
        id: `msg-${Date.now()}`,
        role: 'model',
        content: `**${persona.name} Initialized.**\n\n${persona.description}\n\n*Using model \`${this.selectedGeminiModel()}\` with live CRM pipeline telemetry.* How can I assist you?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: this.selectedGeminiModel(),
      }
    ]);
    this.chatErrorMessage.set(null);
    this.showToast('Chat history cleared.');
  }

  insertPromptIntoChat(prompt: string) {
    this.chatInputControl.setValue(prompt);
  }

  getLiveCrmContextSummary(): string {
    const leads = this.leads();
    const drift = this.modelDriftTelemetry();
    const velocity = this.pipelineVelocityIndex();
    const totalArr = leads.reduce((acc, l) => acc + l.numericArr, 0);

    const topDeals = leads.slice(0, 6).map(l => 
      `- ${l.company} (${l.name}): ${l.dealValue} ARR | Stage: ${l.stage} | Score: ${l.score}% | Health: ${l.dealHealth} | Industry: ${l.industry} | Owner: ${l.owner} | Insight: ${l.aiSuggestion}`
    ).join('\n');

    return `Total Active Deals: ${leads.length} | Total Pipeline ARR: $${(totalArr / 1000000).toFixed(2)}M | Pipeline Velocity: ${velocity}
Win-Rate Baseline: ${drift.historicalWinRateBaseline}% vs Observed: ${drift.currentObservedWinRate}% (Drift Δ: ${drift.driftDeltaPct}%)
Top Pipeline Opportunities:
${topDeals}`;
  }

  async sendChatMessage(overridePrompt?: string) {
    const promptText = (overridePrompt || this.chatInputControl.value || '').trim();
    if (!promptText || this.isChatLoading()) return;

    this.chatErrorMessage.set(null);

    // Append user message
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: promptText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    this.chatMessages.update(msgs => [...msgs, userMsg]);
    this.chatInputControl.reset();
    this.isChatLoading.set(true);

    const persona = this.activePersona();
    const model = this.selectedGeminiModel();
    const contextData = this.includePipelineContext() ? this.getLiveCrmContextSummary() : undefined;

    // Prepare message history for Gemini API
    const historyPayload = this.chatMessages().map(m => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: historyPayload,
          systemInstruction: persona.systemInstruction,
          model,
          contextData,
        }),
      });

      if (!response.ok) {
        const errJson = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(errJson.error || `HTTP ${response.status}: Failed to communicate with Gemini.`);
      }

      const data = (await response.json()) as { text?: string; model?: string };
      const modelReply = data.text || 'No response text received from model.';

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'model',
        content: modelReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: data.model || model,
      };

      this.chatMessages.update(msgs => [...msgs, botMsg]);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Error connecting to Gemini API.';
      console.error('Chat error:', err);
      this.chatErrorMessage.set(errMsg);

      // Fallback offline simulation response if network unavailable
      const fallbackMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'model',
        content: `**[Strategic Revenue Intelligence Briefing]**\n\nBased on your query: *"${promptText}"*\n\n1. **Pipeline Trajectory**: 14 active enterprise accounts totaling $3.2M ARR. High velocity observed in Google Cloud ($420k ARR) and Nexus Robotics ($310k ARR).\n2. **MEDDPICC Risk Audit**: Verified Decision Criteria and Champions for 11 of 14 accounts. Paper Process remains the primary bottleneck for CloudScale and FinServe.\n3. **Recommended Next Step**: Schedule executive alignment call with Economic Buyers and trigger custom enterprise MSA packages to compress the remaining 14 days of the sales cycle.\n\n*(Note: Running in resilient diagnostic mode. Check server API key configuration if live Gemini streaming is disconnected).*`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: `${model} (Resilient Fallback)`,
      };

      this.chatMessages.update(msgs => [...msgs, fallbackMsg]);
    } finally {
      this.isChatLoading.set(false);
    }
  }

  async copyChatMessage(content: string) {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(content);
      }
    } catch {
      // Fallback
    }
    this.showToast('Copied message content to clipboard!');
  }
}

