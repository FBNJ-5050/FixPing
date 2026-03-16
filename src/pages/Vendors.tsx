import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, X, Check, Wrench } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

// ─── Types ────────────────────────────────────────────────────────────────────

type Specialty =
  | 'Plumbing'
  | 'Electrical'
  | 'HVAC'
  | 'General'
  | 'Landscaping'
  | 'Pest Control'
  | 'Other'

interface Vendor {
  id: string
  name: string
  phone: string
  specialty: Specialty
}

// ─── Specialty config ─────────────────────────────────────────────────────────

const SPECIALTIES: Specialty[] = [
  'Plumbing',
  'Electrical',
  'HVAC',
  'General',
  'Landscaping',
  'Pest Control',
  'Other',
]

const SPECIALTY_BADGE: Record<Specialty, string> = {
  Plumbing: 'bg-blue-100 text-blue-700',
  Electrical: 'bg-yellow-100 text-yellow-700',
  HVAC: 'bg-purple-100 text-purple-700',
  General: 'bg-gray-100 text-gray-600',
  Landscaping: 'bg-green-100 text-green-700',
  'Pest Control': 'bg-orange-100 text-orange-700',
  Other: 'bg-slate-100 text-slate-600',
}

function SpecialtyBadge({ specialty }: { specialty: Specialty }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
        SPECIALTY_BADGE[specialty] ?? 'bg-gray-100 text-gray-600'
      }`}
    >
      {specialty}
    </span>
  )
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputCls =
  'w-full px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white'

const labelCls = 'block text-xs font-medium text-gray-600 mb-1'

// ─── Vendor Form ──────────────────────────────────────────────────────────────

function VendorForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<Vendor>
  onSave: (data: { name: string; phone: string; specialty: Specialty }) => Promise<void>
  onCancel: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [phone, setPhone] = useState(initial?.phone ?? '')
  const [specialty, setSpecialty] = useState<Specialty>(initial?.specialty ?? 'General')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !phone.trim()) return
    setSaving(true)
    await onSave({ name: name.trim(), phone: phone.trim(), specialty })
    setSaving(false)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6"
    >
      <h3 className="text-sm font-semibold text-gray-800 mb-4">
        {initial?.id ? 'Edit Vendor' : 'New Vendor'}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div>
          <label className={labelCls}>Name *</label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Mike's Plumbing"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Phone *</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 555 000 0000"
            type="tel"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Specialty</label>
          <select
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value as Specialty)}
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
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving || !name.trim() || !phone.trim()}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#0F172A] text-white text-sm font-medium rounded-lg hover:bg-[#1e293b] transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Check size={14} />
          )}
          {initial?.id ? 'Save Changes' : 'Add Vendor'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition"
        >
          <X size={14} />
          Cancel
        </button>
      </div>
    </form>
  )
}

// ─── Vendor Card ──────────────────────────────────────────────────────────────

function VendorCard({
  vendor,
  onEdit,
  onDelete,
}: {
  vendor: Vendor
  onEdit: () => void
  onDelete: () => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{vendor.name}</p>
          <p className="text-sm text-gray-500 mt-0.5">{vendor.phone}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onEdit}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
          >
            <Pencil size={14} />
          </button>
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <button
                onClick={onDelete}
                className="text-xs font-medium text-red-600 hover:text-red-800 px-1.5 py-0.5 rounded hover:bg-red-50 transition"
              >
                Yes
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-xs font-medium text-gray-500 px-1.5 py-0.5 rounded hover:bg-gray-100 transition"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
      <div>
        <SpecialtyBadge specialty={vendor.specialty} />
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Vendors() {
  const { user } = useAuth()
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchVendors = async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('vendors')
      .select('id, name, phone, specialty')
      .eq('landlord_id', user.id)
      .order('name', { ascending: true })

    if (error) {
      setError('Failed to load vendors.')
    } else {
      setVendors((data ?? []) as Vendor[])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchVendors()
  }, [user])

  const handleAdd = async (data: { name: string; phone: string; specialty: Specialty }) => {
    if (!user) return
    const { error } = await supabase.from('vendors').insert({ ...data, landlord_id: user.id })
    if (!error) {
      setShowForm(false)
      fetchVendors()
    }
  }

  const handleEdit = async (data: { name: string; phone: string; specialty: Specialty }) => {
    if (!editingVendor) return
    const { error } = await supabase
      .from('vendors')
      .update(data)
      .eq('id', editingVendor.id)
    if (!error) {
      setEditingVendor(null)
      fetchVendors()
    }
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('vendors').delete().eq('id', id)
    if (!error) fetchVendors()
  }

  const handleOpenEdit = (vendor: Vendor) => {
    setShowForm(false)
    setEditingVendor(vendor)
  }

  const handleOpenAdd = () => {
    setEditingVendor(null)
    setShowForm(true)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#0F172A]">Vendors</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {vendors.length} {vendors.length === 1 ? 'vendor' : 'vendors'}
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 bg-[#0F172A] text-white text-sm font-medium rounded-lg hover:bg-[#1e293b] transition"
          >
            <Plus size={16} />
            Add Vendor
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Add/Edit form */}
        {showForm && (
          <VendorForm
            onSave={handleAdd}
            onCancel={() => setShowForm(false)}
          />
        )}
        {editingVendor && (
          <VendorForm
            initial={editingVendor}
            onSave={handleEdit}
            onCancel={() => setEditingVendor(null)}
          />
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : vendors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Wrench size={24} className="text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-700">No vendors yet</p>
            <p className="text-xs text-gray-400 mt-1.5">
              Add vendors you work with so you can assign them to maintenance requests.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {vendors.map((vendor) => (
              <VendorCard
                key={vendor.id}
                vendor={vendor}
                onEdit={() => handleOpenEdit(vendor)}
                onDelete={() => handleDelete(vendor.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
