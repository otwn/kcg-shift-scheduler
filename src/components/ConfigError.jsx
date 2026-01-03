export default function ConfigError() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 max-w-lg w-full p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-slate-800 mb-2">Supabase Not Configured</h1>
          <p className="text-slate-500">Set up your database to get started</p>
        </div>

        <div className="space-y-4 text-sm">
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="font-medium text-slate-700 mb-2">1. Create a <code className="bg-slate-200 px-1 rounded">.env</code> file:</p>
            <code className="block bg-slate-800 text-slate-100 p-3 rounded text-xs overflow-x-auto">
              cp .env.example .env
            </code>
          </div>

          <div className="bg-slate-50 rounded-lg p-4">
            <p className="font-medium text-slate-700 mb-2">2. Add your Supabase credentials:</p>
            <code className="block bg-slate-800 text-slate-100 p-3 rounded text-xs overflow-x-auto whitespace-pre">
{`VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...`}
            </code>
            <p className="text-xs text-slate-500 mt-2">
              Get your publishable key from Project Settings → API Keys
            </p>
          </div>

          <div className="bg-slate-50 rounded-lg p-4">
            <p className="font-medium text-slate-700 mb-2">3. Restart the dev server:</p>
            <code className="block bg-slate-800 text-slate-100 p-3 rounded text-xs overflow-x-auto">
              npm run dev
            </code>
          </div>
        </div>

        <p className="text-xs text-slate-400 mt-6 text-center">
          See README.md for full setup instructions
        </p>
      </div>
    </div>
  )
}
