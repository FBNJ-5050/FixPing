import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, X, Check, Users } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

// ─── Types ────────────────────────────────────────────────────────────────────

interface UnitOption {
  id: string
  unit_number: string
  property_name: string
  property_address: string
}

interface Tenant {
  id: string
  full_name: string
  phone: string
  email: string | null
  unit_id: string | null
  units: { unit_number: string; properties: { name: string } | null } | null
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputCls =
  'w-full px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white'

const labelCls = 'block text-xs font-medium text-gray-600 mb-1'

// ─── Tenant Form (add/edit) ───────────────────────────────────────────────────

function TenantForm({
  initial,
  unitOptions,
  onSave,
  onCancel,
}: {
  initial?: Partial<Tenant>
  unitOptions: UnitOption[]
  onSave: (data: {
    full_name: string
    phone: string
    email: string
    unit_id: string | null
  }) => Promise<void>
  onCancel: () => void
}) {
  const [fullName, setFullName] = useState(initial?.full_name ?? '')
  const [phone, setPhone] = useState(initial?.phone ?? '')
  const [email, setEmail] = useState(initial?.email ?? '')
  const [unitId, setUnitId] = useState<string>(initial?.unit_id ?? '')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim() || !phone.trim()) return
    setSaving(true)
    await onSave({
      full_name: fullName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      unit_id: unitId || null,
    })
    setSaving(false)
  }

  // Group unit options by property
  const grouped = unitOptions.reduce<Record<string, UnitOption[]>>((acc, u) => {
    const key = `${u.property_name}${u.property_address ? ' — ' + u.property_address : ''}`
    if (!acc[key]) acc[key] = []
    acc[key].push(u)
    return acc
  }, {})

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6"
    >
      <h3 className="text-sm font-semibold text-gray-800 mb-4">
        {initial?.id ? 'Edit Tenant' : 'New Tenant'}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div>
          <label className={labelCls}>Full Name *</label>
          <input
            autoFocus
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Jane Smith"
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
          <label className={labelCls}>Email (optional)</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane@example.com"
            type="email"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Unit (optional)</label>
          <select
            value={unitId}
            onChange={(e) => setUnitId(e.target.value)}
            className={inputCls}
          >
            <option value="">— No unit assigned —</option>
            {Object.entries(grouped).map(([propertyLabel, units]) => (
              <optgroup key={propertyLabel} label={propertyLabel}>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    Unit {u.unit_number}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving || !fullName.trim() || !phone.trim()}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#0F172A] text-white text-sm font-medium rounded-lg hover:bg-[#1e293b] transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Check size={14} />
          )}
          {initial?.id ? 'Save Changes' : 'Add Tenant'}
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

// ─── Tenant Row ───────────────────────────────────────────────────────────────

function TenantRow({
  tenant,
  onEdit,
  onDelete,
}: {
  tenant: Tenant
  onEdit: () => void
  onDelete: () => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  const unitLabel = tenant.units
    ? `${tenant.units.properties?.name ?? ''} › Unit ${tenant.units.unit_number}`.trim()
    : '—'

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
      <td className="px-5 py-3.5">
        <p className="text-sm font-medium text-gray-900">{tenant.full_name}</p>
      </td>
      <td className="px-5 py-3.5">
        <p className="text-sm text-gray-600">{tenant.phone}</p>
      </td>
      <td className="px-5 py-3.5">
        <p className="text-sm text-gray-500">{tenant.email || '—'}</p>
      </td>
      <td className="px-5 py-3.5">
        <p className="text-sm text-gray-600">{unitLabel}</p>
      </td>
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
          >
            <Pencil size={14} />
          </button>
          {confirmDelete ? (
            <div className="flex items-center gap-1.5 ml-1">
              <span className="text-xs text-gray-500">Delete?</span>
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
      </td>
    </tr>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Tenants() {
  const { user } = useAuth()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [unitOptions, setUnitOptions] = useState<UnitOption[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    if (!user) return
    setLoading(true)

    // Fetch tenants
    const { data: tenantData, error: tenantError } = await supabase
      .from('tenants')
      .select('*, units(unit_number, properties(name))')
      .eq('landlord_id', user.id)
      .order('full_name', { ascending: true })

    // Fetch units for dropdown
    const { data: unitData } = await supabase
      .from('units')
      .select('id, unit_number, properties(id, name, address)')
      .eq('properties.landlord_id', user.id)

    if (tenantError) {
      setError('Failed to load tenants.')
    } else {
      setTenants((tenantData ?? []) as Tenant[])
    }

    if (unitData) {
      const opts: UnitOption[] = unitData
        .filter((u: any) => u.properties)
        .map((u: any) => ({
          id: u.id,
          unit_number: u.unit_number,
          property_name: u.properties?.name ?? '',
          property_address: u.properties?.address ?? '',
        }))
      setUnitOptions(opts)
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [user])

  const handleAdd = async (data: {
    full_name: string
    phone: string
    email: string
    unit_id: string | null
  }) => {
    if (!user) return
    const { error } = await supabase
      .from('tenants')
      .insert({ ...data, landlord_id: user.id })
    if (!error) {
      setShowForm(false)
      fetchData()
    }
  }

  const handleEdit = async (data: {
    full_name: string
    phone: string
    email: string
    unit_id: string | null
  }) => {
    if (!editingTenant) return
    const { error } = await supabase
      .from('tenants')
      .update(data)
      .eq('id', editingTenant.id)
    if (!error) {
      setEditingTenant(null)
      fetchData()
    }
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('tenants').delete().eq('id', id)
    if (!error) fetchData()
  }

  const handleOpenEdit = (tenant: Tenant) => {
    setShowForm(false)
    setEditingTenant(tenant)
  }

  const handleOpenAdd = () => {
    setEditingTenant(null)
    setShowForm(true)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#0F172A]">Tenants</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {tenants.length} {tenants.length === 1 ? 'tenant' : 'tenants'}
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 bg-[#0F172A] text-white text-sm font-medium rounded-lg hover:bg-[#1e293b] transition"
          >
            <Plus size={16} />
            Add Tenant
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Add/Edit form */}
        {showForm && (
          <TenantForm
            unitOptions={unitOptions}
            onSave={handleAdd}
            onCancel={() => setShowForm(false)}
          />
        )}
        {editingTenant && (
          <TenantForm
            initial={editingTenant}
            unitOptions={unitOptions}
            onSave={handleEdit}
            onCancel={() => setEditingTenant(null)}
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
        ) : tenants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Users size={24} className="text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-700">No tenants yet</p>
            <p className="text-xs text-gray-400 mt-1.5">
              Add your first tenant to get started.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Name
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Phone
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Email
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Unit / Property
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant) => (
                  <TenantRow
                    key={tenant.id}
                    tenant={tenant}
                    onEdit={() => handleOpenEdit(tenant)}
                    onDelete={() => handleDelete(tenant.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
