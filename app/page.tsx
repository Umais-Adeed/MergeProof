const dashboardCards = [
  {
    label: "Installations",
    value: "0",
    note: "GitHub App installs will appear here once webhooks are connected.",
  },
  {
    label: "Tracked Repositories",
    value: "0",
    note: "Repositories synced from installations will populate this list.",
  },
  {
    label: "Open Pull Requests",
    value: "0",
    note: "Queued pull requests will show up here before maintainer review.",
  },
];

const upcomingSections = [
  {
    title: "Webhook Inbox",
    description:
      "Incoming GitHub delivery records will be stored and processed from this pipeline.",
  },
  {
    title: "Review Queue",
    description:
      "Each pull request will surface its branch state, checks, and MergeProof verdict here.",
  },
  {
    title: "Checks Overview",
    description:
      "Check runs and conclusions will be summarized once PR synchronization is live.",
  },
];

export default function Home() {
  return (
    <main className="flex min-h-screen flex-1 bg-[linear-gradient(180deg,#f7f4ec_0%,#efe7d6_100%)] text-stone-950">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-10 sm:px-10 lg:px-12">
        <section className="overflow-hidden rounded-[2rem] border border-stone-900/10 bg-stone-950 text-stone-50 shadow-[0_30px_80px_rgba(35,26,12,0.18)]">
          <div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[1.4fr_0.8fr] lg:px-10 lg:py-10">
            <div className="space-y-5">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300/80">
                MergeProof Dashboard
              </p>
              <div className="space-y-3">
                <h1 className="max-w-2xl text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
                  Pre-review pull request intelligence for self-hosted GitHub App installs.
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-stone-300 sm:text-base">
                  This placeholder dashboard is the landing surface for webhook events,
                  repository sync, and pull request analysis. The data layer is ready;
                  the GitHub integration milestones come next.
                </p>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-white/6 p-5 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-300">
                Milestone Status
              </p>
              <div className="mt-5 space-y-4 text-sm text-stone-200">
                <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4">
                  <p className="font-medium text-emerald-200">Database foundation complete</p>
                  <p className="mt-1 text-stone-300">
                    Prisma schema, migration, and local Postgres are in place.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="font-medium text-stone-100">Next milestone</p>
                  <p className="mt-1 text-stone-300">
                    Connect webhook intake and persist GitHub installation events.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {dashboardCards.map((card) => (
            <article
              key={card.label}
              className="rounded-[1.5rem] border border-stone-900/10 bg-white/80 p-6 shadow-[0_12px_30px_rgba(58,42,18,0.08)] backdrop-blur"
            >
              <p className="text-sm font-medium text-stone-500">{card.label}</p>
              <p className="mt-4 text-4xl font-semibold tracking-[-0.05em]">{card.value}</p>
              <p className="mt-3 text-sm leading-6 text-stone-600">{card.note}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-[1.75rem] border border-stone-900/10 bg-white/75 p-6 shadow-[0_16px_40px_rgba(58,42,18,0.08)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
                  Pull Request Queue
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
                  Waiting for synced PR data
                </h2>
              </div>
              <span className="rounded-full border border-stone-900/10 bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">
                Placeholder
              </span>
            </div>

            <div className="mt-6 rounded-[1.25rem] border border-dashed border-stone-300 bg-stone-50/80 p-5">
              <p className="text-sm leading-7 text-stone-600">
                Once GitHub webhook ingestion is wired up, this table will list pull
                request number, repository, head SHA, review status, and check-run
                summaries from the database.
              </p>
            </div>
          </article>

          <aside className="rounded-[1.75rem] border border-stone-900/10 bg-[#f4efe2] p-6 shadow-[0_16px_40px_rgba(58,42,18,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
              Planned Data Surfaces
            </p>
            <div className="mt-5 space-y-4">
              {upcomingSections.map((section) => (
                <div
                  key={section.title}
                  className="rounded-[1.25rem] border border-stone-900/10 bg-white/70 p-4"
                >
                  <h3 className="text-base font-semibold">{section.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    {section.description}
                  </p>
                </div>
              ))}
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
