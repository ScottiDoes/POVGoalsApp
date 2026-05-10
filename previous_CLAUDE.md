# Nevada James LLC — NJMSP Workspace

## Business context
Nevada James is a Managed Services Provider (MSP). This workspace is used for three things:
1. **Website** — public-facing company site
2. **Marketing collateral** — branded materials (printed as PDFs)
3. **Offer prototypes** — focused landing pages for specific service offers

The goal across all three is to make offers feel like no-brainers: high credibility, clear outcome, value delivered whether or not the prospect becomes a client.

---

## Repo structure

```
/website      — main company website (deployed to Vercel, main branch)
/collateral   — HTML marketing materials (printed to PDF via browser)
/offers       — standalone landing pages for specific service offers
  /managed-patching  — POV offer: achieve 95% patch compliance on scoped systems
```

---

## Website

- **Stack:** Static HTML + Bootstrap (CDN)
- **Deployment:** Vercel, auto-deploys from `main` branch
- **UI components:** Pull from [21st.dev](https://21st.dev) when possible

> **21st.dev note:** Components on 21st.dev are React/Tailwind. When adapting them for static HTML, extract the underlying HTML structure and inline or extract the relevant CSS — do not introduce a React or build step into `/website`. Flag this tradeoff whenever a component requires significant adaptation.

---

## Marketing collateral (`/collateral`)

- Written in HTML with inline or embedded CSS for print fidelity
- Styled to match brand (consistent with website)
- Intended to be printed to PDF via browser print dialog (`@media print` CSS)
- No JavaScript required — must render correctly as static HTML

---

## Offer prototypes (`/offers`)

Each offer is a self-contained landing page. Current offers:

### Cyber Exposure Closure POV
**Path:** `/offers/managed-patching` (legacy directory name; the offer itself is exposure-closure positioned)

**Positioning:** Escape the patching commodity trap. We don't sell "patching as a service" — we sell **cyber liability reduction with proof**. The buyer is the CFO/CEO, not the IT manager. IT is the beneficiary.

**Core reframe:**
- From: "We patch your systems."
- To: "We close your exposure window — and prove it to your board."

**Offer concept:**
- Target buyer: exec-led (CFO/CEO/board), not IT-led
- Offer: a free, time-boxed Proof of Value
- Outcome: 95% of critical cyber exposure closed across scoped systems within 7 days, with audit-ready documentation and a continuous risk score
- Pricing (after POV): $20/endpoint/month or $12/endpoint/month billed annually
- Positioning: leaves the prospect with closed exposure + audit-ready posture document + continuous risk score, **whether or not they continue as a client**

**Differentiators (the moat):**
- Risk reported in business-language dollar terms, not CVE counts
- Audit-ready posture document for auditors, cyber insurers, and the board
- Vulnerabilities prioritized by real-world exploitation activity, not just CVSS
- Monthly executive risk briefings (not just IT reports)
- SLA-backed exposure closure window
- Cyber insurance underwriting alignment

**Copy tone:** business/financial language ("liability," "exposure," "audit-ready"), not technical. IT readers should still feel respected, but the page sells to the exec.

---

## Conventions

- Keep everything static where possible — no build tools, no bundlers, no npm unless strictly necessary
- All pages should be self-contained or use only CDN dependencies
- Collateral and offers should look polished — these go to real prospects
- Prefer Bootstrap utility classes over custom CSS; only add custom CSS when Bootstrap can't do it
- No placeholder content in committed files — every committed page should be real, not lorem ipsum

---

## Screenshot workflow

**Required for any theme or structural change:** take at least two screenshots using the Puppeteer tool and visually compare them before considering a change done.

```bash
# Capture a local page
node tools/screenshots/screenshot.js file <path-to-html> <label>

# Capture a live URL (e.g. inspiration site)
node tools/screenshots/screenshot.js url <url> <label>
```

Screenshots save to `tools/screenshots/output/` (gitignored). Both desktop (1440px) and mobile (390px) are captured automatically.

**Workflow for theme/structure changes:**
1. Screenshot the page *before* making changes — label it `<name>-before`
2. Make the changes
3. Screenshot *after* — label it `<name>-after`
4. Read both images and confirm visually before moving on
5. If the inspiration site is relevant, also screenshot it for side-by-side comparison

The inspiration site for the current theme is: `https://reliable-place-998908.framer.app/`

---

## Commands

- **Preview locally:** open HTML files directly in browser, or use `npx serve .` from any subdirectory
- **Deploy website:** push to `main` — Vercel handles the rest
- **Generate PDF:** open collateral HTML in Chrome → Print → Save as PDF
