import { useState } from 'react'

export default function SectionSettings() {
  const [settings, setSettings] = useState({
    siteName: 'StreamVault',
    supportEmail: 'support@streamvault.com',
    maintenanceMode: false,
    allowRegistration: true,
    freeTrialDays: 7,
    defaultPlan: 'Free',
  })

  const set = (field) => (e) => setSettings((prev) => ({ ...prev, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const [saved, setSaved] = useState(false)
  const save = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="max-w-3xl space-y-6">
      <h2 className="font-display text-2xl text-white">Settings</h2>

      {saved && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm text-green-300">
          Settings saved (frontend-only - connect backend to persist)
        </div>
      )}

      <div className="glass space-y-4 rounded-xl p-4 sm:p-6">
        <h3 className="text-sm font-semibold text-white">General</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs text-gray-400">Platform Name</label>
            <input type="text" value={settings.siteName} onChange={set('siteName')} className="input-dark" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-gray-400">Support Email</label>
            <input type="email" value={settings.supportEmail} onChange={set('supportEmail')} className="input-dark" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-gray-400">Default Plan for New Users</label>
            <select value={settings.defaultPlan} onChange={set('defaultPlan')} className="input-dark">
              {['Free', 'Basic', 'Standard', 'Premium'].map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-gray-400">Free Trial Days</label>
            <input type="number" value={settings.freeTrialDays} onChange={set('freeTrialDays')} className="input-dark" />
          </div>
        </div>
      </div>

      <div className="glass space-y-4 rounded-xl p-4 sm:p-6">
        <h3 className="text-sm font-semibold text-white">Access Control</h3>
        {[
          { field: 'maintenanceMode', label: 'Maintenance Mode', desc: 'Blocks all user access while you update content' },
          { field: 'allowRegistration', label: 'Allow New Registrations', desc: 'Toggle to close sign-ups temporarily' },
        ].map(({ field, label, desc }) => (
          <div key={field} className="flex items-start justify-between gap-3 sm:items-center">
            <div>
              <p className="text-sm font-medium text-white">{label}</p>
              <p className="text-xs text-gray-500">{desc}</p>
            </div>
            <button
              onClick={() => setSettings((prev) => ({ ...prev, [field]: !prev[field] }))}
              className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors ${settings[field] ? 'bg-[#D4A017]' : 'bg-[#1E1E2E]'}`}
            >
              <div className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${settings[field] ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        ))}
      </div>

      <div className="space-y-3 rounded-xl border border-red-500/20 p-4 sm:p-6">
        <h3 className="text-sm font-semibold text-red-400">Danger Zone</h3>
        <p className="text-xs text-gray-500">These actions are irreversible. Proceed with caution.</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button className="rounded-lg border border-red-500/30 px-4 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10">Clear All Cache</button>
          <button className="rounded-lg border border-red-500/30 px-4 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10">Reset Analytics</button>
        </div>
      </div>

      <button onClick={save} className="btn-shine rounded-xl bg-[#D4A017] px-8 py-3 font-bold text-white transition-all hover:bg-[#b8860b]">
        Save Settings
      </button>
    </div>
  )
}
