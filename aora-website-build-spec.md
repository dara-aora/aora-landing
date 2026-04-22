# AORA — Website Build Spec

> **For the AI agent executing this:** This is a complete build brief. Read it end-to-end before writing code. Every section is load-bearing. When in doubt, err toward *less*, not more. If you find yourself adding a gradient, a pastel color, or a stock photo of someone meditating — stop and re-read Section 3.

---

## 0. Project goal

Build a marketing + lead-capture site for **Aora** — an Apple Watch companion app/device for brain health, positioned for the California biohacker + longevity audience.

The site's single job: take a visitor from "cool, what's this?" → completing a 2-minute science-backed brain-state quiz → converting to a paid membership.

**Target stack:** Next.js 14 (App Router) + Tailwind CSS + Framer Motion for micro-animations + a single-page quiz built with client-side state (no backend required for MVP — submit to a form endpoint of the user's choice, e.g. Resend, Loops, or a webhook).

**Deploy target:** Vercel. Domain: aoramind.com.

---

## 1. Audience (who we are writing for)

Not "wellness consumers." Specifically:

- 28–45, disposable income $150k+, concentrated in SF / LA / San Diego / Austin.
- Already owns a Whoop, Oura, or Apple Watch. Has taken a VO2 max test. Has Googled "NAD+."
- Reads Huberman, listens to Peter Attia, follows Bryan Johnson on X.
- Knows what HRV is. Thinks "wellness" is a slur.
- Buys identity, not features. The product is a signal of being a serious person about their own biology.

**Everything on the site should feel like it was made for that person and no one else.** Don't hedge for mainstream readers.

---

## 2. Brand positioning

**One-line positioning:** *A Whoop for your brain.*

**Core insight:** People track sleep, steps, HRV, and glucose — but the organ that runs all of it is invisible. Aora measures cognitive load, recovery, and burnout risk the way Whoop measures strain and recovery.

**The owned metric:** Aora owns one number — **Cognitive Load Score** (working name). Every page, chart, and piece of marketing should anchor back to it. (Whoop owns "Recovery." Oura owns "Readiness." Pick one and don't dilute it.)

**Brand tone:** Casually authoritative. Numerical. Short sentences. No exclamation marks. No emojis anywhere on the site. Think: a neurosurgeon who listens to Aphex Twin.

**Words we use:** measurement, baseline, protocol, load, recovery, signal, data, state, system.

**Words we never use:** wellness, holistic, journey, unlock, empower, vibes, self-care, mindfulness (unless quoting a clinical instrument).

---

## 3. Design system — "Hot Minimalism"

The aesthetic pulls from:
- **Merge Labs (mergelabs.co)** — text-first, monochrome, confident negative space.
- **Early Apple (Think Different era → original iPhone page)** — one idea per screen, huge product shot, ruthless subtraction.
- **Neuralink** — mission-first framing, clinical confidence.
- **Bryan Johnson's Blueprint protocol site** — data shown proudly, organ-green accents.

### 3.1 Color tokens

```css
--ink: #0A0A0A;           /* near-black, all body text and backgrounds in dark mode */
--paper: #FFFFFF;          /* pure white, default background */
--paper-warm: #F4F2EC;     /* warm off-white, for cards and secondary sections */
--rule: #E5E3DD;           /* hairline borders, dividers */
--mute: #6B6B6B;           /* secondary text, captions */

--green: #4D6B2F;          /* primary accent — "Blueprint green" */
--green-bright: #6E8B3D;   /* hover / active */
--green-tint: #EEF2E4;     /* ultra-light background for score highlights */

/* that's it. no other colors. */
```

**Rules:**
- Green is used ONLY for: primary CTAs, live-data ticks, score highlights, the Aora logotype accent, and occasional underlines under key phrases.
- No gradients. Ever. Not even subtle ones.
- No glassmorphism, no neumorphism, no blurred background blobs.
- No drop shadows except a single very subtle one on product photography (2px 20px rgba(0,0,0,0.04)).

### 3.2 Typography

```
Display:  "Tiempos Headline" or "GT Sectra" — serif, for headlines > 32px
Body:     "Söhne" or "Inter" — geometric sans, for body copy
Mono:     "Söhne Mono" or "JetBrains Mono" — for numbers, metrics, code-like data
```

Free substitutes if licensing is an issue: **Fraunces** (display serif) + **Inter** (body) + **JetBrains Mono** (numbers). All available on Google Fonts.

**Scale (desktop):**
- H1: 72–96px, line-height 0.95, letter-spacing -0.03em, serif
- H2: 48–56px, line-height 1.0, serif
- H3: 28–32px, sans, medium weight
- Body: 18px, line-height 1.5
- Caption / small caps: 12px, letter-spacing 0.1em, uppercase

**Mobile:** H1 drops to 44–52px. Everything else scales ~0.75x.

### 3.3 Layout rules

- **Max content width:** 1200px. Most sections: 960px. Hero text block: 720px.
- **Vertical rhythm:** 8px base grid. Section padding: 120px desktop / 72px mobile.
- **Grids:** 12-column desktop, 4-column mobile. Generous gutters.
- **One idea per screen.** If a section has more than one headline, split it.

### 3.4 Imagery

- **Product shots:** the device/watch on pure white, shot from a slight angle, one hero shot per page. Treat it like the original iPhone launch pages.
- **Data visualizations:** black-on-white line charts, one green accent line for the "Aora" data series. No 3D charts, no pie charts, no animated counters that spin for 4 seconds.
- **People photography (use sparingly):** black-and-white, editorial, never smiling at the camera. Think *New York Times Magazine* not wellness brand.
- **Absolutely never:** stock photos of meditation, yoga poses, glowing brain graphics, neural network spaghetti, sunrise over mountains.

### 3.5 Motion

- Subtle. Everything under 300ms.
- On scroll: fade-up with 20px translate, never slide-in from the side.
- Hover states: 150ms ease-out, color shift only, no scale transforms.
- Live-data ticks (the one flourish): a single green dot that pulses at 1Hz next to "live" data. This is our signature.

---

## 4. Site architecture

```
/                    → Home
/quiz                → Brain State Assessment (the core funnel entry)
/quiz/result/[id]    → Dynamic result page, one of 4 archetypes
/product             → Product + membership page
/science             → The research & methodology page
/faq                 → FAQ
/checkout            → Single-page checkout
```

No blog for MVP. No "About Us." No "Team." Add those after launch once the core funnel converts.

---

## 5. Page-by-page spec

### 5.1 Home (`/`)

**Above the fold — single screen, no scroll required to see the CTA:**

```
[ logo: AORA — top left, green dot after the A ]

                 You track your sleep.
                 You track your steps.
                 You've never tracked the
                 organ that runs both.

                 [ Take the 2-min Brain State assessment → ]

                 [ device shot, centered, 600px wide ]
```

- Background: pure white.
- Headline: serif, 88px desktop.
- CTA button: solid green, white text, 56px tall, 24px horizontal padding. Rounded corners: 4px (not pill-shaped).
- Below CTA, in small caps mute text: `NO SIGN-UP · RESULTS IN 2 MINUTES · BACKED BY PEER-REVIEWED INSTRUMENTS`

**Section 2 — The number:**

Full-bleed, warm paper background. One stat, huge.

```
                 73%
                 of high-performers
                 score in the "overclocked"
                 range on the first test.

                 Most never knew.
```

**Section 3 — What Aora measures (3-column, text only):**

```
  COGNITIVE LOAD          NEURAL RECOVERY         BURNOUT RISK
  A real-time read of     How well your brain     Early-warning signal
  how hard your brain     is recovering between   built from validated
  is working right now.   deep-work sessions.     clinical instruments.
```

No icons. No illustrations. Just typography.

**Section 4 — Social proof strip:**

A thin strip with 3–5 logos (publications / podcasts where Aora has been covered). Monochrome. No testimonial carousel — too generic.

**Section 5 — The method (teaser for `/science`):**

```
                 Built on instruments your
                 neurologist already uses.

                 Aora's assessments are adapted from the
                 Copenhagen Burnout Inventory, the Perceived
                 Stress Scale, and peer-reviewed cognitive
                 load research — the same tools used in
                 Stanford and Mass General studies.

                 [ Read the science → ]
```

**Section 6 — Final CTA:**

Same as hero. Don't get creative with it.

**Footer:** Minimal. Logo, 4 links (Science, FAQ, Privacy, Terms), one line of small-caps copyright.

---

### 5.2 Quiz (`/quiz`)

This is the most important page on the site. Build it with care.

**Structure:** Single-page app, one question at a time, progress bar at top, no skip-ahead.

**Questions (12 total, in this order — order matters for flow):**

The 12 questions are specified in Section 6 below. Each question is one screen. Huge question text (serif, 48px), five response buttons stacked vertically below.

**Response buttons:** Full-width, 64px tall, left-aligned text, with a small 0–100 numerical label on the right in mono font. Hover: green hairline border appears.

**Progress bar:** Hairline at the very top of the viewport. Green. Animates smoothly.

**Micro-interaction:** After clicking an answer, the question fades out in 150ms, the next fades in 150ms later. No page reload.

**Email gate:** After question 10 of 12, insert a soft email capture screen:

```
                 Two more questions.

                 Where should we send your
                 Brain State report?

                 [ email input ]
                 [ Continue → ]

                 Small-caps: WE DON'T SEND NEWSLETTERS. ONE EMAIL, YOUR RESULT.
```

Make this skippable (small "skip" link below) — but track who skips. Most won't.

**Calculation:** Average the 12 scores (each on a 0–100 scale). Map to one of four archetypes (see Section 7).

**Redirect:** On completion, generate a result ID, save to localStorage + the backend, redirect to `/quiz/result/[id]`.

---

### 5.3 Result page (`/quiz/result/[id]`)

**Above the fold:**

```
YOUR BRAIN STATE IS

[ huge serif, 96px ]

OVERCLOCKED
Score: 62 / 100

[ one-paragraph description of the archetype ]

[ CTA: See what Aora would track for you → ]
```

**Below the fold — three modules:**

1. **"What this means"** — 3 bullet points specific to the archetype, referencing the sub-scores (exhaustion, stress, focus, sleep).
2. **"What Aora measures that relates to your score"** — a mini-preview of the product tailored to the archetype.
3. **One testimonial** — from someone who matches the archetype. Quote + name + one-line bio. Black-and-white headshot, 80px, square.

**Bottom CTA:** Membership pricing CTA → `/product`.

**Shareability:** Add OG tags so when someone shares their result on X, the preview shows their archetype name and score on a clean black card. This is how the quiz goes viral.

---

### 5.4 Product (`/product`)

**Hero:**

```
                 The Aora Membership

                 The device is included.
                 The data is what you're paying for.

                 [ product shot ]
```

**Membership tiers (3 cards, side-by-side desktop, stacked mobile):**

| Essentials | Performance | Longevity |
|---|---|---|
| $29/mo | $49/mo | $99/mo |
| Device included | Device included | Device included |
| Cognitive Load Score | + Neural Recovery | + Brain Age tracking |
| Weekly reports | Daily insights | + Monthly 1:1 with a neuroscientist |
| Cancel anytime | Cancel anytime | 12-month commit |
| [ Start → ] | [ Start → ] | [ Start → ] |

**Design note:** The middle card (Performance) gets a subtle green hairline border — no "MOST POPULAR" badge, no color fill. Understatement is the point.

**Below pricing — "How the membership works" in 3 steps:** Text only, no icons. Think Apple product pages circa 2008.

**FAQ accordion** at the bottom. 6–8 questions max. Cover: cancellation, data privacy, compatibility, shipping, scientific validation.

---

### 5.5 Science (`/science`)

This is where credibility lives. Make it feel like a research paper, not a marketing page.

**Structure:**

```
THE SCIENCE BEHIND AORA

1. The instruments we adapted
   — Copenhagen Burnout Inventory (Kristensen et al., 2005)
   — Perceived Stress Scale (Cohen et al., 1983)
   — Pittsburgh Sleep Quality Index (Buysse et al., 1989)
   — Cognitive Failures Questionnaire (Broadbent et al., 1982)
   [ each with a 2-sentence explanation + citation link ]

2. How the wearable layer works
   — HRV as a proxy for autonomic load
   — Sleep architecture tracking
   — Apple Health integration
   [ reference Nature Medicine 2025 study on Apple Watch cognitive assessment ]

3. Our methodology
   — How we combine self-report + passive sensing
   — What we're not: a diagnostic device
   — What we are: a measurement and pattern-recognition tool

4. The team
   [ 3–5 advisors with real neuroscience / longevity credentials.
     Black-and-white headshots. One-line bios. No LinkedIn links — 
     link to their actual research. ]

5. Data privacy
   — End-to-end encrypted
   — Never sold
   — User-exportable
   — HIPAA-aligned (not certified yet, be honest about this)
```

**Visual treatment:** Serif body copy here (not sans). Makes it feel like an essay, not a product page. Citations in superscript, with a references section at the bottom.

---

### 5.6 FAQ (`/faq`)

Simple accordion. Black text on white. One-line question, collapsible answer.

Must-answer questions:
- Is this a medical device? (No — be explicit.)
- Does it work without an Apple Watch?
- How is this different from Whoop / Oura?
- What's the refund policy?
- How accurate is the Cognitive Load Score?
- Do you share my data?
- Who's behind this company?
- What happens if I cancel?

---

## 6. The quiz — exact questions and logic

### 6.1 The 12 questions

Each uses a 5-point Likert scale, scored 0 / 25 / 50 / 75 / 100.

**Response scale A (for questions 1–8):**
- Never / almost never → 0
- Seldom → 25
- Sometimes → 50
- Often → 75
- Always → 100

**Response scale B (for questions 9–11):**
- Very poor → 100
- Poor → 75
- Neutral → 50
- Good → 25
- Very good → 0

**Question 12 is segmentation only — not scored.**

---

**Q1.** How often do you feel tired?
*(Source: CBI Personal Burnout, item 1)*

**Q2.** How often are you physically exhausted?
*(Source: CBI Personal Burnout, item 2)*

**Q3.** How often are you emotionally exhausted?
*(Source: CBI Personal Burnout, item 3)*

**Q4.** How often do you feel worn out?
*(Source: CBI Personal Burnout, item 5)*

**Q5.** How often do you think "I can't take it anymore"?
*(Source: CBI Personal Burnout, item 4)*

**Q6.** In the last month, how often have you felt unable to control the important things in your life?
*(Source: PSS-10, item 2)*

**Q7.** In the last month, how often have you felt nervous or stressed?
*(Source: PSS-10, item 3)*

**Q8.** How often do you lose focus mid-task and have to restart?
*(Source: CFQ-adapted)*

**Q9.** How would you rate your overall sleep quality in the last month?
*(Source: PSQI, item 6 — uses scale B)*

**Q10.** How often do you wake feeling rested?
*(Source: PSQI-derived — uses scale B, reverse-keyed — flip the scoring)*

**Q11.** How would you rate your ability to concentrate for deep work?
*(Source: self-rated cognitive performance — uses scale B)*

**Q12.** Which best describes your work?
- Founder / operator
- Creator / artist
- Athlete / performer
- Investor / finance
- Engineer / scientist
- Knowledge worker (other)
- Between things right now

*(Not scored — used to personalize result copy and testimonials.)*

### 6.2 Scoring logic

```js
// Average all 11 scored questions (Q1-Q11) on a 0-100 scale.
// Q10 is reverse-scored: use (100 - rawScore).

const score = (answers) => {
  const scored = [
    answers.q1, answers.q2, answers.q3, answers.q4, answers.q5,
    answers.q6, answers.q7, answers.q8, answers.q9,
    100 - answers.q10,  // reverse-keyed
    answers.q11
  ];
  return Math.round(scored.reduce((a, b) => a + b, 0) / scored.length);
};
```

### 6.3 Archetype mapping

```js
const archetype = (score) => {
  if (score <= 24)  return "BASELINE_CLEAR";
  if (score <= 49)  return "AMBIENT_LOAD";
  if (score <= 74)  return "OVERCLOCKED";
  return "BURNOUT_TERRITORY";
};
```

### 6.4 Sub-scores (show on result page)

Calculate three sub-scores from the question groups:

- **Exhaustion:** avg(Q1, Q2, Q3, Q4, Q5) — the CBI Personal Burnout subscale.
- **Stress load:** avg(Q6, Q7) — the PSS subset.
- **Cognitive clarity:** avg(Q8, Q11, 100 - Q10) — focus + rested-waking.

Display each as a simple horizontal bar on the result page, 0–100, with a green fill up to the score.

---

## 7. Result archetypes — exact copy

### 7.1 BASELINE CLEAR (0–24)

**Headline:** Your brain state is **Baseline Clear**.
**Score line:** Score: [N] / 100

**Description paragraph:**
> You're in the top 15% of people who take this assessment. Your exhaustion, stress, and cognitive clarity scores are all low. The question isn't whether you need help — it's whether you want to stay here, or push the ceiling.

**What this means (3 bullets):**
- Your recovery signals are strong. Most people in this zone have a sleep protocol they stick to.
- You're operating at a sustainable load — but "sustainable" isn't the same as "optimal."
- The biggest risk at Baseline Clear is complacency. Performance decays silently.

**What Aora would track for you:**
- Peak cognitive hours (when your brain is sharpest — train around them)
- Early deviation detection (catch drift weeks before you'd feel it)
- Brain Age trend (the long-game metric)

**CTA:** See the Longevity membership →

---

### 7.2 AMBIENT LOAD (25–49)

**Headline:** Your brain state is **Ambient Load**.

**Description paragraph:**
> You're carrying invisible friction. It doesn't feel like burnout — it feels like baseline. That's the problem. Your system is compensating, and the cost shows up in focus, mood, and recovery long before it shows up on any blood test.

**What this means:**
- Your exhaustion scores are elevated but not alarming — which is when most high-performers ignore them.
- Your stress response is slightly over-activated, likely chronically.
- Cognitive clarity is holding, but it's being propped up by willpower and caffeine.

**What Aora would track for you:**
- Daily Cognitive Load — see where the friction actually lives
- Recovery between deep-work sessions
- HRV correlation with self-reported state

**CTA:** Start the Performance membership →

---

### 7.3 OVERCLOCKED (50–74)

**Headline:** Your brain state is **Overclocked**.

**Description paragraph:**
> Your brain is running too hot, too long. This is where most founders, operators, and serious athletes live — and it's where they fail. You're still producing, but the quality is dropping and you know it. Most people in this zone are 6–12 months from a forced recalibration.

**What this means:**
- Your exhaustion scores are clinically elevated.
- Your stress load is sustained, not episodic — which is the pattern that predicts burnout.
- Your cognitive clarity score tells you what you already know: focus is harder than it used to be.

**What Aora would track for you:**
- Real-time Cognitive Load alerts (before you notice the drop)
- Burnout Risk trajectory — a 90-day forward projection
- Daily protocol adjustments based on your recovery

**CTA:** Start the Performance membership →

---

### 7.4 BURNOUT TERRITORY (75–100)

**Headline:** Your brain state is **Burnout Territory**.

**Description paragraph:**
> You don't need another productivity app. You need data, and a way out. Scores in this range correlate with the clinical definition of burnout on the Copenhagen Burnout Inventory. This isn't a personality flaw — it's a measurable state, and the first step out is measuring where you actually are.

**What this means:**
- Your exhaustion scores meet or exceed the clinical threshold for personal burnout.
- Your stress load has almost certainly been elevated for months, not weeks.
- Cognitive clarity is compromised in ways that compound — which is why things feel harder than they should.

**What Aora would track for you:**
- A personalized de-load protocol built from your first 14 days of data
- Recovery trajectory (the number that matters most right now)
- Sleep architecture analysis — often the fastest lever

**CTA:** Start the Essentials membership → *(we recommend starting here, not Performance, until your recovery signal stabilizes)*

**Tone note for this archetype:** Softer. No hype. Treat them like a friend who just got a bad lab result — direct, but kind. Do not upsell to the Longevity tier. Recommend Essentials.

---

## 8. Copy library (ready to paste)

### Hero headlines — pick one, A/B test
- You track your sleep. You track your steps. You've never tracked the organ that runs both.
- A Whoop for your brain.
- The first wearable built for the organ that runs everything.
- Measure the one thing you can't afford to lose.

### CTA labels
- Take the 2-min Brain State assessment
- See your Brain State
- Start the membership
- Read the science

### Small-caps support text
- NO SIGN-UP · RESULTS IN 2 MINUTES · BACKED BY PEER-REVIEWED INSTRUMENTS
- DEVICE INCLUDED · CANCEL ANYTIME · NO DATA SOLD
- ADAPTED FROM INSTRUMENTS USED AT STANFORD AND MASS GENERAL

### Objection-handling one-liners
- *"Another tracker?"* → Aora is the first one built for the organ you haven't measured yet.
- *"Is this medical?"* → No. It's a measurement tool. Your doctor uses the same underlying instruments.
- *"Why subscription?"* → Because the hardware is the cheap part. The data model improves every month you're a member.

---

## 9. Technical implementation checklist

### 9.1 Stack
- [ ] Next.js 14 with App Router
- [ ] Tailwind CSS with custom color tokens from Section 3.1
- [ ] Framer Motion for page transitions and quiz animations
- [ ] React Hook Form for the quiz state
- [ ] Zod for validation
- [ ] Resend or Loops for transactional email (result delivery)
- [ ] Vercel Analytics + PostHog for funnel tracking

### 9.2 Fonts
- [ ] Load Fraunces (display) and Inter (body) from Google Fonts
- [ ] Load JetBrains Mono from Google Fonts
- [ ] Use `next/font` for optimization

### 9.3 Routes
- [ ] `/` home
- [ ] `/quiz` quiz entry + flow
- [ ] `/quiz/result/[id]` dynamic result page with OG image generation
- [ ] `/product` product + membership
- [ ] `/science` science page
- [ ] `/faq` FAQ accordion
- [ ] `/privacy`, `/terms` — boilerplate

### 9.4 Dynamic OG images
- [ ] Build `/api/og/[id]` that renders a 1200×630 PNG with the user's archetype name + score on a black background with the Aora logo. Use `@vercel/og`.

### 9.5 Quiz state
- [ ] Store progress in localStorage so accidental refresh doesn't lose data
- [ ] Submit final answers to an endpoint (placeholder: `/api/submit-quiz`) that returns a result ID
- [ ] Email the result link via Resend

### 9.6 Analytics events to track
- `quiz_started`
- `quiz_question_answered` (with question number)
- `quiz_email_captured`
- `quiz_completed` (with archetype)
- `result_viewed`
- `cta_clicked` (with location)
- `checkout_started`

### 9.7 Accessibility
- [ ] All interactive elements keyboard-navigable
- [ ] Quiz supports arrow keys for answer selection + Enter to confirm
- [ ] Color contrast meets WCAG AA (the green on white does — verify)
- [ ] All images have alt text
- [ ] Reduced-motion media query respected for all Framer Motion animations

### 9.8 Performance
- [ ] Lighthouse target: 95+ on all four metrics
- [ ] Images via `next/image` with explicit dimensions
- [ ] No third-party scripts above the fold
- [ ] Ship less than 100KB of JS to the homepage

---

## 10. What NOT to build (seriously)

If the agent is tempted to add any of these, stop:

- ❌ A chatbot or live chat widget
- ❌ A "Why Aora?" comparison table against Whoop/Oura (we don't fight on features)
- ❌ Testimonial carousels with 20 generic quotes
- ❌ A hero video with a dramatic voiceover
- ❌ Animated brain graphics with firing neurons
- ❌ A gradient hero background
- ❌ A "As Seen In" logo bar in the hero (move it to a thin strip below)
- ❌ Cookie consent banners that take over the page (use a bottom strip)
- ❌ Exit-intent popups
- ❌ A countdown timer on pricing
- ❌ A "50% off for the first 100 members" promo (the brand doesn't discount)
- ❌ Social sharing buttons everywhere (the quiz result page is the only shareable moment)

---

## 11. Launch checklist

Before going live:

- [ ] All 12 quiz questions answerable by keyboard alone
- [ ] All 4 archetype result pages render correctly with live data
- [ ] OG images generate correctly for each archetype
- [ ] Stripe / payment flow tested end-to-end with a test card
- [ ] All emails (quiz result, welcome, receipt) render in Gmail, Apple Mail, and Outlook
- [ ] Mobile scroll performance smooth on a 3-year-old iPhone
- [ ] One human reads every page out loud and cuts one word per sentence
- [ ] One human tries to break the quiz by hitting back, refresh, and closing the tab mid-flow
- [ ] Legal review on all science claims (we say "adapted from" not "validated by")
- [ ] Privacy policy explicitly covers biometric data handling

---

## 12. Post-launch: what to add in order

1. **Week 2:** A/B test 3 hero headlines.
2. **Week 4:** Add a second quiz variant (a "sleep-first" flow) to test acquisition angle.
3. **Week 6:** Referral program — Whoop's worked because it was generous. Give a free month per referral.
4. **Month 3:** Start the essay / science content hub at `/writing`. Not a blog — long-form, one essay per month, written by the founder or a named scientist.
5. **Month 6:** Team / advisors page, once there are real names to list.

---

## Appendix A: Citations for the science page

- Kristensen, T. S., Borritz, M., Villadsen, E., & Christensen, K. B. (2005). *The Copenhagen Burnout Inventory: A new tool for the assessment of burnout.* Work & Stress, 19(3), 192–207.
- Cohen, S., Kamarck, T., & Mermelstein, R. (1983). *A global measure of perceived stress.* Journal of Health and Social Behavior, 24(4), 385–396.
- Buysse, D. J., Reynolds, C. F., Monk, T. H., Berman, S. R., & Kupfer, D. J. (1989). *The Pittsburgh Sleep Quality Index: A new instrument for psychiatric practice and research.* Psychiatry Research, 28(2), 193–213.
- Broadbent, D. E., Cooper, P. F., FitzGerald, P., & Parkes, K. R. (1982). *The Cognitive Failures Questionnaire (CFQ) and its correlates.* British Journal of Clinical Psychology, 21(1), 1–16.
- Butler, P. M., et al. (2025). *Smartwatch- and smartphone-based remote assessment of brain health and detection of mild cognitive impairment.* Nature Medicine. DOI: 10.1038/s41591-024-03475-9

---

**End of spec. Build it clean.**
