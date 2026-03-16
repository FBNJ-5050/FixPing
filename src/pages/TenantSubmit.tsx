import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface UnitOption {
  id: string
  unit_number: string
  property_name: string
}

const CATEGORIES = [
  'Plumbing',
  'Electrical',
  'HVAC',
  'Appliance',
  'Structural',
  'Pest Control',
  'Other',
]

// ─── Input / label shared styles ─────────────────────────────────────────────

const inputCls =
  'w-full px-4 py-3 rounded-xl border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0F172A] focus:border-transparent transition bg-white'

const labelCls = 'block text-sm font-medium text-gray-700 mb-1.5'

// ─── Component ────────────────────────────────────────────────────────────────

export default function TenantSubmit() {
  const { landlordId } = useParams<{ landlordId: string }>()

  // Unit options loaded from DB
  const [units, setUnits] = useState<UnitOption[]>([])
  const [unitsLoading, setUnitsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Form state
  const [tenantName, setTenantName] = useState('')
  const [tenantPhone, setTenantPhone] = useState('')
  const [unitId, setUnitId] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)

  // Submission state
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  // ─── Load units for this landlord ────────────────────────────────────────

  useEffect(() => {
    if (!landlordId) return

    const loadUnits = async () => {
      // Fetch properties for this landlord (public read policy required)
      const { data: properties, error: propError } = await supabase
        .from('properties')
        .select('id, name')
        .eq('landlord_id', landlordId)

      if (propError || !properties || properties.length === 0) {
        if (propError) setLoadError('Could not load units. Please try again.')
        setUnitsLoading(false)
        return
      }

      const propertyIds = properties.map((p) => p.id)

      // Fetch units belonging to those properties (public read policy required)
      const { data: unitRows, error: unitError } = await supabase
        .from('units')
        .select('id, unit_number, property_id')
        .in('property_id', propertyIds)
        .order('unit_number', { ascending: true })

      if (unitError) {
        setLoadError('Could not load units. Please try again.')
        setUnitsLoading(false)
        return
      }

      // Build display list: "Property Name – Unit X"
      const propertyMap = Object.fromEntries(properties.map((p) => [p.id, p.name]))
      const options: UnitOption[] = (unitRows ?? []).map((u) => ({
        id: u.id,
        unit_number: u.unit_number,
        property_name: propertyMap[u.property_id] ?? '',
      }))

      setUnits(options)
      setUnitsLoading(false)
    }

    loadUnits()
  }, [landlordId])

  // ─── Submit handler ───────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!landlordId) return
    setSubmitting(true)
    setSubmitError(null)

    try {
      let photoUrl: string | null = null

      // Upload photo if provided
      if (photo) {
        const path = `${landlordId}/${Date.now()}-${photo.name.replace(/\s+/g, '_')}`
        const { error: uploadError } = await supabase.storage
          .from('maintenance-photos')
          .upload(path, photo, { contentType: photo.type, upsert: false })

        if (uploadError) {
          console.warn('Photo upload failed, continuing without photo:', uploadError.message)
        } else {
          const { data: urlData } = supabase.storage
            .from('maintenance-photos')
            .getPublicUrl(path)
          photoUrl = urlData?.publicUrl ?? null
        }
      }

      // Insert the maintenance request
      const { error: insertError } = await supabase
        .from('maintenance_requests')
        .insert({
          landlord_id: landlordId,
          unit_id: unitId || null,
          description,
          photo_url: photoUrl,
          status: 'open',
          tenant_name: tenantName.trim(),
          tenant_phone: tenantPhone.trim(),
          category: category || null,
        })

      if (insertError) {
        throw new Error(insertError.message)
      }

      setSubmitted(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      setSubmitError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Success screen ───────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-sm w-full text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-green-500" strokeWidth={1.5} />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Request Submitted!</h1>
          <p className="text-sm text-gray-500 leading-relaxed mb-4">
            Your landlord has been notified and will be in touch soon.
          </p>
          <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
            <p className="text-sm text-gray-700 font-medium">{tenantName}</p>
          </div>
        </div>
      </div>
    )
  }

  // ─── Main form ────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header bar */}
      <div className="bg-[#0F172A] px-4 py-4 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>
          <span className="text-white font-semibold text-base tracking-tight">FixPing</span>
        </div>
      </div>

      {/* Form card */}
      <div className="px-4 py-8">
        <div className="max-w-lg mx-auto">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-[#0F172A]">Report a Maintenance Issue</h1>
            <p className="text-sm text-gray-500 mt-1.5">
              Fill out the form below and your landlord will be notified right away.
            </p>
          </div>

          {loadError && (
            <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
              <AlertCircle size={15} className="flex-shrink-0" />
              {loadError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
            {/* Name */}
            <div>
              <label className={labelCls}>
                Your Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                placeholder="John Smith"
                className={inputCls}
              />
            </div>

            {/* Phone */}
            <div>
              <label className={labelCls}>
                Your Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={tenantPhone}
                onChange={(e) => setTenantPhone(e.target.value)}
                placeholder="(555) 123-4567"
                className={inputCls}
              />
            </div>

            {/* Unit */}
            <div>
              <label className={labelCls}>Unit</label>
              {unitsLoading ? (
                <div className="flex items-center gap-2 text-sm text-gray-400 py-3">
                  <Loader2 size={14} className="animate-spin" />
                  Loading units...
                </div>
              ) : (
                <select
                  value={unitId}
                  onChange={(e) => setUnitId(e.target.value)}
                  className={inputCls}
                >
                  <option value="">— Select your unit —</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.property_name} – Unit {u.unit_number}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Category */}
            <div>
              <label className={labelCls}>Issue Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={inputCls}
              >
                <option value="">— Select a category —</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className={labelCls}>
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Describe the issue in detail..."
                className={`${inputCls} resize-none`}
              />
            </div>

            {/* Photo */}
            <div>
              <label className={labelCls}>Photo (optional)</label>
              <label className="flex flex-col items-center justify-center w-full border-2 border-dashed border-gray-300 rounded-xl px-4 py-6 cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition">
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
                />
                {photo ? (
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-900">{photo.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Tap to change</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm text-gray-500">Tap to upload a photo</p>
                    <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, HEIC accepted</p>
                  </div>
                )}
              </label>
            </div>

            {/* Error */}
            {submitError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                <AlertCircle size={15} className="flex-shrink-0" />
                {submitError}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-[#0F172A] text-white text-sm font-semibold rounded-xl hover:bg-[#1e293b] transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6">
            Powered by FixPing — Property Maintenance Made Simple
          </p>
        </div>
      </div>
    </div>
  )
}
