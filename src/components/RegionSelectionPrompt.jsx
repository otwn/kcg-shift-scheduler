export default function RegionSelectionPrompt() {
  return (
    <section
      role="status"
      aria-live="polite"
      className="text-center py-12 bg-white rounded-xl border border-slate-200"
    >
      <h1 className="text-xl font-semibold text-slate-800">Choose a region</h1>
      <p className="text-slate-500 mt-2">
        Choose a region from the navigation dropdown to view this page.
      </p>
    </section>
  )
}
