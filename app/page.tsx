// Landing page for ViniBank.
// Goal: simulate the look & feel of a real digital bank onboarding page,
// while also showcasing modern front-end techniques (gradients, glassmorphism,
// responsive layout, motion and well-structured copy).

export default function Home() {
  return (
    // Main container: full height, dark background, safe text color.
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-50">
      {/* Decorative background: blurred color blobs and subtle radial gradient.
          This creates depth and a "fintech" visual style without extra libraries. */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        {/* Emerald blurred circle in the upper-left corner */}
        <div className="absolute -top-32 -left-24 h-72 w-72 rounded-full bg-emerald-500/30 blur-3xl" />
        {/* Cyan blurred circle in the bottom-right corner */}
        <div className="absolute -bottom-40 -right-10 h-80 w-80 rounded-full bg-cyan-500/25 blur-3xl" />
        {/* Thin glowing horizontal line across the center */}
        <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent opacity-60" />
        {/* Radial gradient overlay to softly highlight the top area */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.18),_transparent_55%)]" />
      </div>

      {/* Content wrapper: centers everything and constrains reading width */}
      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-4 py-10">
        {/* =========================== HEADER SECTION =========================== */}
        <header className="mb-8 text-center space-y-3">
          {/* Small identity line to introduce the product/portfolio context */}
          <p className="text-xs uppercase tracking-[0.35em] text-emerald-300/80">
            vinicius-fausto · vinibank
          </p>

          {/* Main headline with gradient highlight for the brand tagline */}
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight">
            ViniBank —{" "}
            <span className="bg-gradient-to-r from-emerald-300 via-cyan-300 to-emerald-200 bg-clip-text text-transparent">
              a modern digital banking experience in a simulated environment
            </span>
          </h1>

          {/* Supporting paragraph: explains what ViniBank is from a user perspective. */}
          <p className="mx-auto max-w-2xl text-sm md:text-base text-slate-300">
            ViniBank emulates a contemporary online banking platform: secure
            sign-in, account overview, transfers and transaction history.
            Designed as a realistic, end-to-end simulation — no real money, but
            real product thinking.
          </p>
        </header>

        {/* =========================== FEATURED CARD (GLASS PANEL) =========================== */}
        {/* Glass-like panel: uses semi-transparent background, border and backdrop blur
            to create a premium dashboard-onboarding feel. */}
        <section className="w-full max-w-3xl rounded-3xl border border-slate-800/70 bg-slate-900/70 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.9)] backdrop-blur-xl">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            {/* Text block describing what the main dashboard will offer. */}
            <div className="space-y-1 text-center sm:text-left">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">
                simulated banking dashboard
              </p>
              <p className="text-sm text-slate-300">
                The core experience will include checking and savings accounts,
                recent payments, incoming transfers and smart insights —
                presented as a responsive, data-driven dashboard.
              </p>
            </div>

            {/* Call-to-action buttons: they do not navigate yet,
                but already showcase hover states and motion. */}
            <div className="flex flex-col gap-3 sm:flex-row">
              {/* Primary CTA: stronger background, elevation and subtle hover motion. */}
              <button className="inline-flex items-center justify-center rounded-full bg-emerald-400 px-5 py-2.5 text-xs font-semibold text-slate-950 shadow-lg shadow-emerald-500/30 transition-transform transition-shadow hover:-translate-y-0.5 hover:bg-emerald-300 hover:shadow-emerald-400/40 active:translate-y-0">
                Enter ViniBank demo (soon)
              </button>

              {/* Secondary CTA: outlined style with border + color shift on hover. */}
              <button className="inline-flex items-center justify-center rounded-full border border-slate-600/80 bg-slate-900/60 px-5 py-2.5 text-xs font-medium text-slate-100 transition-colors hover:border-cyan-400/70 hover:bg-slate-900">
                Read how the simulation works (soon)
              </button>
            </div>
          </div>
        </section>

        {/* =========================== FEATURES GRID =========================== */}
        {/* Responsive three-column grid on desktop, stacked on mobile.
            Each card describes a key dimension of the project. */}
        <section className="mt-10 grid w-full max-w-5xl grid-cols-1 gap-4 md:grid-cols-3">
          {/* === CARD 1: Technology stack === */}
          <article className="group rounded-2xl border border-slate-800/70 bg-slate-900/70 p-4 text-left shadow-[0_10px_30px_rgba(15,23,42,0.75)] backdrop-blur-lg transition-transform transition-shadow hover:-translate-y-1 hover:border-emerald-400/70 hover:shadow-emerald-500/25">
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
              technology
            </p>
            <p className="text-sm text-slate-200">
              ViniBank is built with Next.js 14 (App Router), TypeScript and
              Tailwind CSS. Data is managed through Prisma ORM and PostgreSQL,
              with authentication powered by NextAuth and a simulated Stripe
              integration for subscription flows.
            </p>
          </article>

          {/* === CARD 2: Product & UX focus === */}
          <article className="group rounded-2xl border border-slate-800/70 bg-slate-900/70 p-4 text-left shadow-[0_10px_30px_rgba(15,23,42,0.75)] backdrop-blur-lg transition-transform transition-shadow hover:-translate-y-1 hover:border-cyan-400/70 hover:shadow-cyan-500/25">
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
              experience
            </p>
            <p className="text-sm text-slate-200">
              The interface follows modern digital banking patterns: clear
              hierarchy, responsive design, keyboard-friendly navigation and
              accessible color contrast. Every screen is treated as if it were
              going into production for real customers.
            </p>
          </article>

          {/* === CARD 3: Objective for the project === */}
          <article className="group rounded-2xl border border-slate-800/70 bg-slate-900/70 p-4 text-left shadow-[0_10px_30px_rgba(15,23,42,0.75)] backdrop-blur-lg transition-transform transition-shadow hover:-translate-y-1 hover:border-emerald-300/70 hover:shadow-emerald-500/25">
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
              objective
            </p>
            <p className="text-sm text-slate-200">
              The goal is to present a realistic banking simulation that
              demonstrates end-to-end thinking: from database schema and
              security to UX details and copywriting. ViniBank is a showcase of
              how I would approach building a real digital bank experience.
            </p>
          </article>
        </section>
      </div>
    </main>
  );
}
