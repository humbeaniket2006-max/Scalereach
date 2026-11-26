/**
 * Mock data and domain constants.
 * Everything here is fake content for the design exercise.
 */

export const STEPS = ['Upload', 'Transcript', 'Best moments', 'Captions', 'Clips'];
export const RENDER_STEP = STEPS.length - 1;

/** Same weighting ScaleReach shows on its site: hook 40%, pacing 35%, engagement 25%. */
export const SCORE_WEIGHTS = { hook: 0.4, pacing: 0.35, engagement: 0.25 };
export const HIGH_SCORE = 80;

export function viralScore({ hook, pacing, engagement }) {
  return Math.round(
    hook * SCORE_WEIGHTS.hook + pacing * SCORE_WEIGHTS.pacing + engagement * SCORE_WEIGHTS.engagement,
  );
}

/** Sample files offered in the upload dialog. ep42 is already uploaded, so it demonstrates de-duplication. */
export const SAMPLE_FILES = {
  ep42: {
    name: 'ep42_pricing.mp4',
    size: 1_873_402_112,
    lastModified: 1_732_530_000_000,
    title: 'Ep. 42: Pricing your first B2B deal',
  },
  ep44: {
    name: 'ep44_churn.mp4',
    size: 2_214_001_664,
    lastModified: 1_732_616_400_000,
    title: 'Ep. 44: Why customers really churn',
  },
};

/** The idempotency key the browser sends with an upload. Same file -> same key -> same job. */
export function uploadKeyFor(file) {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

const THUMB_TONES = 8;

function makeClip(id, [title, start, length, hook, pacing, engagement, caption, selected = false], index) {
  const [pre, highlight, post] = caption;
  return {
    id,
    title,
    start,
    end: start + length,
    hook,
    pacing,
    engagement,
    caption: { pre, highlight, post },
    selected,
    tone: index % THUMB_TONES,
  };
}

// [title, start (s), length (s), hook, pacing, engagement, [caption before, highlighted, after], selected]
// Plain-language reasons for the top clips, shown under each title.
const EP42_REASONS = {
  c1: 'Bold claim in the first 2 seconds',
  c2: 'Names a fear every founder has',
  c3: 'Surprising number, clear payoff',
  c4: 'One tip people can use today',
};

/** Fallback reason based on the clip's strongest score part. */
export function clipReason(clip) {
  if (clip.reason) return clip.reason;
  const best = ['hook', 'pacing', 'engagement'].sort((a, b) => clip[b] - clip[a])[0];
  return {
    hook: 'Strong opening line',
    pacing: 'Tight pacing, no dead air',
    engagement: 'Ends on a clear payoff',
  }[best];
}

// Transcript excerpts for the top clips of the sample episode: [offset from clip start (s), line]
const EP42_TRANSCRIPTS = {
  c1: [[0, 'Our first enterprise customer signed in four minutes.'], [9, 'I celebrated. Then my co-founder asked one question.'], [21, 'If they say yes instantly, you priced it wrong.'], [33, 'So the next deal, we quoted three times more and still closed.']],
  c2: [[0, 'Most founders think low prices win deals.'], [12, 'You are not cheap, you are scared of hearing no.'], [30, 'Buyers read a low price as a small product.']],
  c3: [[0, 'We had eleven thousand free users.'], [14, 'Free users never paid us, and they filled the support queue.'], [27, 'Killing the plan doubled paid signups in a quarter.']],
  c4: [[0, 'Here is the trick for pricing calls.'], [10, 'Say the number, then stop talking.'], [22, 'The first person to fill the silence gives up margin.']],
};

const EP42_CLIPS = [
  ['If they say yes instantly, you priced it wrong', 1122, 49, 99, 96, 84, ['if they say yes', 'instantly', 'you priced it wrong'], true],
  ['The pricing mistake first-time founders make', 250, 52, 98, 82, 93, ['you are not', 'cheap', 'you are scared'], true],
  ['Why we killed our free plan', 1335, 38, 84, 95, 86, ['free users never', 'paid', 'us'], true],
  ['How to say your price out loud', 1900, 44, 78, 93, 81, ['say the number then', 'stop', 'talking'], true],
  ['Annual vs monthly: what actually closed', 2402, 57, 91, 70, 74, ['annual deals closed', '3x faster', '']],
  ['The follow-up email that doubled deal size', 2850, 41, 78, 75, 74, ['we just', 'asked', 'for more']],
  ['Procurement is not the enemy', 3492, 35, 72, 71, 69, ['loop them in', 'early', '']],
  ['Discounts teach buyers to wait', 3970, 48, 70, 67, 66, ['every discount', 'trains', 'them to wait']],
  ['Our first price was a guess', 510, 40, 69, 64, 64, ['we picked', '$49', 'because it felt safe']],
  ['Talk to the CFO, not the champion', 785, 45, 64, 63, 61, ['the CFO', 'signs', 'the cheque']],
  ['When to raise prices', 1640, 50, 62, 59, 58, ['raise it', 'before', 'you feel ready']],
  ['The pilot that never ended', 3180, 39, 60, 57, 56, ['no end date', 'means', 'no deal']],
];

// Pool used to "generate" clips when a simulated job finishes.
const LINE_POOL = [
  ['The question every customer asks first', ['they always ask about', 'price', 'first']],
  ['Why churn starts in week one', ['churn starts in', 'week one', '']],
  ['Stop building features nobody asked for', ['nobody', 'asked', 'for that']],
  ['How we doubled trial conversions', ['trials', 'doubled', 'in a month']],
  ['The support ticket that changed our roadmap', ['one ticket', 'changed', 'everything']],
  ['Hiring before product-market fit', ['we hired', 'too early', '']],
  ['What a good demo actually looks like', ['show the', 'outcome', 'not the menu']],
  ['Cold email that still works', ['keep it', 'short', 'and specific']],
  ['Saying no to your biggest customer', ['we said', 'no', 'and kept them']],
  ['The metric we check every Monday', ['one number', 'every', 'Monday']],
  ['Why annual plans fix cash flow', ['annual plans', 'fund', 'your runway']],
  ['The onboarding call we cancelled', ['we cancelled', 'the call', 'and activation went up']],
];

/** Deterministic PRNG so generated clips are stable across reloads. */
export function seededRandom(seedText) {
  let seed = [...seedText].reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 7);
  return () => {
    seed = (seed * 1_664_525 + 1_013_904_223) >>> 0;
    return seed / 2 ** 32;
  };
}

export function generateClips(seedText, duration, count) {
  const random = seededRandom(seedText);
  const between = (min, max) => Math.round(min + random() * (max - min));
  const lines = [...LINE_POOL].sort(() => random() - 0.5).slice(0, count);
  const slot = duration / count;

  return lines.map(([title, caption], i) => {
    const length = between(30, 58);
    const start = Math.round(i * slot + random() * Math.max(0, slot - length));
    const base = between(55, 92);
    return makeClip(
      `${seedText}-c${i + 1}`,
      [title, start, length, Math.min(99, base + between(0, 6)), base, Math.max(40, base - between(0, 6)), caption],
      i,
    );
  });
}

export function createInitialState() {
  return {
    version: 2,
    lastTickAt: Date.now(),
    activeJobId: 'job_8f3a2c',
    activeClipId: 'c1',
    filter: 'all',
    sort: 'score',
    jobs: [
      {
        id: 'job_8f3a2c',
        title: 'Ep. 42: Pricing your first B2B deal',
        duration: 4360,
        uploadKey: uploadKeyFor(SAMPLE_FILES.ep42),
        status: 'done',
        step: RENDER_STEP,
        finishedAt: '6:31 PM',
        attempt: 1,
        clips: EP42_CLIPS.map((row, i) => ({
          ...makeClip(`c${i + 1}`, row, i),
          transcript: EP42_TRANSCRIPTS[`c${i + 1}`] ?? null,
          reason: EP42_REASONS[`c${i + 1}`] ?? null,
        })),
      },
      {
        id: 'job_4b91d0',
        title: 'Live Q&A, Nov 22',
        duration: 3125,
        uploadKey: 'live_qa_nov22.mp4:1402331136:1732275000000',
        status: 'processing',
        step: RENDER_STEP,
        renderDone: 2,
        renderTotal: 8,
        attempt: 1,
        clips: [],
      },
      {
        id: 'job_c27e55',
        title: 'Ep. 43: Firing a client',
        duration: 3540,
        uploadKey: 'ep43_firing.mp4:1650210816:1732441200000',
        status: 'queued',
        step: 1,
        queuedAt: 1,
        attempt: 1,
        clips: [],
      },
      {
        id: 'job_91aa07',
        title: 'Webinar: GTM for SaaS',
        duration: 2710,
        uploadKey: 'gtm_webinar.mp4:988213248:1732183200000',
        status: 'failed',
        step: 3,
        failedStep: 3,
        error: 'The caption service timed out after 10 minutes.',
        attempt: 1,
        clips: [],
      },
      {
        id: 'job_2d6f13',
        title: 'Ep. 41: Hiring your first AE',
        duration: 3900,
        uploadKey: 'ep41_hiring.mp4:1720123392:1732096800000',
        status: 'done',
        step: RENDER_STEP,
        finishedAt: 'Nov 20',
        attempt: 1,
        clips: generateClips('job_2d6f13', 3900, 9),
      },
    ],
  };
}
