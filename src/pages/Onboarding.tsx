import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Plus, Trash2, CheckCircle } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Unit {
  unit_number: string
  tempId: string // client-only id for list keys
}

interface TenantEntry {
  full_name: string
  phone: string
  email: string
  unit_tempId: string // which unit this tenant belongs to
}

interface VendorEntry {
  name: string
  phone: string
  specialty: string
}

const SPECIALTIES = ['Plumbing', 'Electrical', 'HVAC', 'General', 'Landscaping', 'Other']

// ─── Step progress bar ────────────────────────────────────────────────────────

function ProgressBar({ step }: { step: number }) {
  const steps = ['Property', 'Tenants', 'Vendors', 'Done']
  return (
    <div className="w-full max-w-lg mx-auto mb-10">
      <div className="flex items-center justify-between">
        {steps.map((label, i) => {
          const num = i + 1
          const done = num < step
          const active = num === step
          return (
            <div key={label} className="flex-1 flex flex-col items-center">
              {/* connector line before */}
              <div className="flex items-center w-full">
                {i > 0 && (
                  <div className={`flex-1 h-0.5 ${done || active ? 'bg-blue-600' : 'bg-gray-200'}`} />
                )}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 transition-colors ${
                    done
                      ? 'bg-blue-600 text-white'
                      : active
                      ? 'bg-[#0F172A] text-white ring-4 ring-blue-100'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {done ? '✓' : num}
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 ${done ? 'bg-blue-600' : 'bg-gray-200'}`} />
                )}
              </div>
              <span
                className={`mt-1.5 text-xs font-medium ${
                  active ? 'text-[#0F172A]' : done ? 'text-blue-600' : 'text-gray-400'
                }`}
              >
                {label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Onboarding() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Step 1
  const [propertyName, setPropertyName] = useState('')
  const [address, setAddress] = useState('')
  const [units, setUnits] = useState<Unit[]>([{ unit_number: '', tempId: crypto.randomUUID() }])

  // Saved after step 1 — maps tempId → real DB id
  const [savedUnits, setSavedUnits] = useState<{ tempId: string; id: string; unit_number: string }[]>([])

  // Step 2
  const [tenants, setTenants] = useState<TenantEntry[]>([
    { full_name: '', phone: '', email: '', unit_tempId: '' },
  ])

  // Step 3
  const [vendors, setVendors] = useState<VendorEntry[]>([
    { name: '', phone: '', specialty: 'General' },
  ])

  // ─── Step 1 handlers ───────────────────────────────────────────────────────

  const addUnit = () => {
    setUnits((prev) => [...prev, { unit_number: '', tempId: crypto.randomUUID() }])
  }

  const removeUnit = (tempId: string) => {
    if (units.length === 1) return
    setUnits((prev) => prev.filter((u) => u.tempId !== tempId))
  }

  const updateUnit = (tempId: string, value: string) => {
    setUnits((prev) => prev.map((u) => (u.tempId === tempId ? { ...u, unit_number: value } : u)))
  }

  const saveStep1 = async () => {
    if (!user) return
    if (!propertyName.trim()) { setError('Property name is required'); return }
    const filledUnits = units.filter((u) => u.unit_number.trim())
    if (filledUnits.length === 0) { setError('Add at least one unit'); return }

    setError(null)
    setSaving(true)

    // Insert property
    const { data: property, error: propError } = await supabase
      .from('properties')
      .insert({ landlord_id: user.id, name: propertyName.trim(), address: address.trim() || null })
      .select()
      .single()

    if (propError) { setError(propError.message); setSaving(false); return }

    // Insert units
    const { data: insertedUnits, error: unitsError } = await supabase
      .from('units')
      .insert(filledUnits.map((u) => ({ property_id: property.id, unit_number: u.unit_number.trim() })))
      .select()

    if (unitsError) { setError(unitsError.message); setSaving(false); return }

    // Map tempId → real DB id
    const mapped = filledUnits.map((u, i) => ({
      tempId: u.tempId,
      id: insertedUnits[i].id,
      unit_number: u.unit_number.trim(),
    }))
    setSavedUnits(mapped)

    // Pre-populate tenant form with one entry per unit
    setTenants(
      mapped.map((u) => ({ full_name: '', phone: '', email: '', unit_tempId: u.tempId }))
    )

    setSaving(false)
    setStep(2)
  }

  // ─── Step 2 handlers ───────────────────────────────────────────────────────

  const addTenant = () => {
    setTenants((prev) => [
      ...prev,
      { full_name: '', phone: '', email: '', unit_tempId: savedUnits[0]?.tempId ?? '' },
    ])
  }

  const removeTenant = (idx: number) => {
    if (tenants.length === 1) return
    setTenants((prev) => prev.filter((_, i) => i !== idx))
  }

  const updateTenant = (idx: number, field: keyof TenantEntry, value: string) => {
    setTenants((prev) => prev.map((t, i) => (i === idx ? { ...t, [field]: value } : t)))
  }

  const saveStep2 = async () => {
    if (!user) return
    const filled = tenants.filter((t) => t.full_name.trim() && t.phone.trim())

    if (filled.length > 0) {
      setError(null)
      setSaving(true)

      const rows = filled.map((t) => {
        const unit = savedUnits.find((u) => u.tempId === t.unit_tempId)
        return {
          landlord_id: user.id,
          full_name: t.full_name.trim(),
          phone: t.phone.trim(),
          email: t.email.trim() || null,
          unit_id: unit?.id ?? null,
        }
      })

      const { error: tenantError } = await supabase.from('tenants').insert(rows)
      if (tenantError) { setError(tenantError.message); setSaving(false); return }
      setSaving(false)
    }

    setStep(3)
  }

  // ─── Step 3 handlers ───────────────────────────────────────────────────────

  const addVendor = () => {
    setVendors((prev) => [...prev, { name: '', phone: '', specialty: 'General' }])
  }

  const removeVendor = (idx: number) => {
    if (vendors.length === 1) return
    setVendors((prev) => prev.filter((_, i) => i !== idx))
  }

  const updateVendor = (idx: number, field: keyof VendorEntry, value: string) => {
    setVendors((prev) => prev.map((v, i) => (i === idx ? { ...v, [field]: value } : v)))
  }

  const saveStep3 = async () => {
    if (!user) return
    const filled = vendors.filter((v) => v.name.trim() && v.phone.trim())

    if (filled.length > 0) {
      setError(null)
      setSaving(true)

      const rows = filled.map((v) => ({
        landlord_id: user.id,
        name: v.name.trim(),
        phone: v.phone.trim(),
        specialty: v.specialty,
      }))

      const { error: vendorError } = await supabase.from('vendors').insert(rows)
      if (vendorError) { setError(vendorError.message); setSaving(false); return }
      setSaving(false)
    }

    setStep(4)
  }

  // ─── Shared input style ────────────────────────────────────────────────────

  const inputCls =
    'w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition'

  const btnPrimary =
    'flex items-center justify-center gap-2 bg-[#0F172A] text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-[#1e293b] transition disabled:opacity-60 disabled:cursor-not-allowed'

  const btnSecondary =
    'flex items-center gap-1.5 text-sm text-blue-600 font-medium hover:text-blue-700 transition'

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center px-4 py-12">
      {/* Wordmark */}
      <h1 className="text-2xl font-bold text-[#0F172A] mb-2">FixPing</h1>
      <p className="text-sm text-gray-500 mb-10">Let's get your account set up</p>

      <ProgressBar step={step} />

      <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm border border-gray-200 px-8 py-8">
        {error && (
          <div className="mb-5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {/* ── STEP 1: Property ── */}
        {step === 1 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Add your first property</h2>
            <p className="text-sm text-gray-500 mb-6">You can add more properties after setup.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Property name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={propertyName}
                  onChange={(e) => setPropertyName(e.target.value)}
                  className={inputCls}
                  placeholder="e.g. 123 Oak Street"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className={inputCls}
                  placeholder="e.g. 123 Oak Street, Austin TX 78701"
                />
              </div>

              {/* Units */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Units <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {units.map((unit) => (
                    <div key={unit.tempId} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={unit.unit_number}
                        onChange={(e) => updateUnit(unit.tempId, e.target.value)}
                        className={inputCls}
                        placeholder="e.g. Unit 1, Apt A, #201"
                      />
                      <button
                        type="button"
                        onClick={() => removeUnit(unit.tempId)}
                        disabled={units.length === 1}
                        className="p-2 text-gray-400 hover:text-red-500 transition disabled:opacity-30"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addUnit} className={`mt-3 ${btnSecondary}`}>
                  <Plus size={15} />
                  Add unit
                </button>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button type="button" onClick={saveStep1} disabled={saving} className={btnPrimary}>
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Continue'
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Tenants ── */}
        {step === 2 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Add your tenants</h2>
            <p className="text-sm text-gray-500 mb-6">
              Skip any unit that is currently vacant. You can add tenants later.
            </p>

            <div className="space-y-5">
              {tenants.map((tenant, idx) => (
                <div key={idx} className="p-4 border border-gray-200 rounded-xl space-y-3 relative">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Tenant {idx + 1}
                    </span>
                    {tenants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTenant(idx)}
                        className="text-gray-400 hover:text-red-500 transition"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>

                  {/* Unit assignment */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Unit</label>
                    <select
                      value={tenant.unit_tempId}
                      onChange={(e) => updateTenant(idx, 'unit_tempId', e.target.value)}
                      className={inputCls}
                    >
                      <option value="">— Select unit —</option>
                      {savedUnits.map((u) => (
                        <option key={u.tempId} value={u.tempId}>
                          {u.unit_number}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Full name
                    </label>
                    <input
                      type="text"
                      value={tenant.full_name}
                      onChange={(e) => updateTenant(idx, 'full_name', e.target.value)}
                      className={inputCls}
                      placeholder="Jane Smith"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Phone number
                    </label>
                    <input
                      type="tel"
                      value={tenant.phone}
                      onChange={(e) => updateTenant(idx, 'phone', e.target.value)}
                      className={inputCls}
                      placeholder="+1 (512) 555-0100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Email <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <input
                      type="email"
                      value={tenant.email}
                      onChange={(e) => updateTenant(idx, 'email', e.target.value)}
                      className={inputCls}
                      placeholder="jane@example.com"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button type="button" onClick={addTenant} className={`mt-4 ${btnSecondary}`}>
              <Plus size={15} />
              Add another tenant
            </button>

            <div className="mt-8 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-sm text-gray-500 hover:text-gray-700 transition"
              >
                Back
              </button>
              <button type="button" onClick={saveStep2} disabled={saving} className={btnPrimary}>
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Continue'
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Vendors ── */}
        {step === 3 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Add your vendors</h2>
            <p className="text-sm text-gray-500 mb-6">
              Add contractors and service providers you work with. You can skip this and add them later.
            </p>

            <div className="space-y-5">
              {vendors.map((vendor, idx) => (
                <div key={idx} className="p-4 border border-gray-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Vendor {idx + 1}
                    </span>
                    {vendors.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeVendor(idx)}
                        className="text-gray-400 hover:text-red-500 transition"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Vendor name
                    </label>
                    <input
                      type="text"
                      value={vendor.name}
                      onChange={(e) => updateVendor(idx, 'name', e.target.value)}
                      className={inputCls}
                      placeholder="e.g. Mike's Plumbing"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Phone number
                    </label>
                    <input
                      type="tel"
                      value={vendor.phone}
                      onChange={(e) => updateVendor(idx, 'phone', e.target.value)}
                      className={inputCls}
                      placeholder="+1 (512) 555-0200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Specialty
                    </label>
                    <select
                      value={vendor.specialty}
                      onChange={(e) => updateVendor(idx, 'specialty', e.target.value)}
                      className={inputCls}
                    >
                      {SPECIALTIES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>

            <button type="button" onClick={addVendor} className={`mt-4 ${btnSecondary}`}>
              <Plus size={15} />
              Add another vendor
            </button>

            <div className="mt-8 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-sm text-gray-500 hover:text-gray-700 transition"
              >
                Back
              </button>
              <button type="button" onClick={saveStep3} disabled={saving} className={btnPrimary}>
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Continue'
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Done ── */}
        {step === 4 && (
          <div className="text-center py-4">
            <div className="flex justify-center mb-5">
              <CheckCircle size={56} className="text-green-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">You're all set!</h2>
            <p className="text-sm text-gray-500 mb-2">
              Your property, tenants, and vendors have been saved.
            </p>
            <div className="my-5 bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 text-sm text-blue-800">
              <span className="font-semibold">Your FixPing number will be assigned shortly.</span>
              <br />
              Once active, tenants can text that number to submit maintenance requests — they'll appear
              on your dashboard instantly.
            </div>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className={`${btnPrimary} mx-auto px-8 py-3 text-base`}
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
