import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, Plus, Trash2, Pencil, X, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Unit {
  id: string
  unit_number: string
  property_id: string
}

interface Property {
  id: string
  name: string
  address: string
  landlord_id: string
  units: Unit[]
}

// ─── Shared input/button styles ───────────────────────────────────────────────

const inputCls =
  'w-full px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white'

// ─── Add Property inline form ─────────────────────────────────────────────────

function AddPropertyForm({
  onSave,
  onCancel,
}: {
  onSave: (name: string, address: string) => Promise<void>
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    await onSave(name.trim(), address.trim())
    setSaving(false)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6"
    >
      <h3 className="text-sm font-semibold text-gray-800 mb-4">New Property</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Property Name</label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Oak Street Apartments"
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. 123 Oak St, Chicago, IL"
            className={inputCls}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#0F172A] text-white text-sm font-medium rounded-lg hover:bg-[#1e293b] transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Check size={14} />
          )}
          Save Property
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

// ─── Add Unit inline form ─────────────────────────────────────────────────────

function AddUnitForm({
  onSave,
  onCancel,
}: {
  onSave: (unitNumber: string) => Promise<void>
  onCancel: () => void
}) {
  const [unitNumber, setUnitNumber] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!unitNumber.trim()) return
    setSaving(true)
    await onSave(unitNumber.trim())
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
      <input
        autoFocus
        value={unitNumber}
        onChange={(e) => setUnitNumber(e.target.value)}
        placeholder="Unit number, e.g. 1A"
        className="flex-1 px-3 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white"
      />
      <button
        type="submit"
        disabled={saving || !unitNumber.trim()}
        className="flex items-center gap-1 px-3 py-1.5 bg-[#0F172A] text-white text-sm font-medium rounded-lg hover:bg-[#1e293b] transition disabled:opacity-50"
      >
        {saving ? (
          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <Check size={13} />
        )}
        Add
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition"
      >
        <X size={13} />
      </button>
    </form>
  )
}

// ─── Property Card ─────────────────────────────────────────────────────────────

function PropertyCard({
  property,
  onDelete,
  onAddUnit,
  onDeleteUnit,
}: {
  property: Property
  onDelete: (id: string) => void
  onAddUnit: (propertyId: string, unitNumber: string) => Promise<void>
  onDeleteUnit: (unitId: string) => void
}) {
  const [expanded, setExpanded] = useState(true)
  const [showAddUnit, setShowAddUnit] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Property header */}
      <div className="flex items-center gap-3 px-5 py-4">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-gray-400 hover:text-gray-600 transition flex-shrink-0"
        >
          {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{property.name}</p>
          {property.address && (
            <p className="text-xs text-gray-500 truncate mt-0.5">{property.address}</p>
          )}
        </div>

        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full flex-shrink-0">
          {property.units.length} {property.units.length === 1 ? 'unit' : 'units'}
        </span>

        <button
          onClick={() => setShowAddUnit((v) => !v)}
          className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 px-2 py-1 rounded-lg hover:bg-blue-50 transition flex-shrink-0"
        >
          <Plus size={13} />
          Add Unit
        </button>

        {confirmDelete ? (
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-gray-500">Delete property?</span>
            <button
              onClick={() => onDelete(property.id)}
              className="text-xs font-medium text-red-600 hover:text-red-800 px-2 py-1 rounded-lg hover:bg-red-50 transition"
            >
              Yes
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-xs font-medium text-gray-500 hover:text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-100 transition"
            >
              No
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition flex-shrink-0"
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>

      {/* Expanded units section */}
      {expanded && (
        <div className="border-t border-gray-100 px-5 py-3">
          {property.units.length === 0 && !showAddUnit ? (
            <p className="text-xs text-gray-400 py-1">
              No units yet.{' '}
              <button
                onClick={() => setShowAddUnit(true)}
                className="text-blue-500 hover:underline"
              >
                Add the first unit.
              </button>
            </p>
          ) : (
            <ul className="space-y-1">
              {property.units.map((unit) => (
                <UnitRow key={unit.id} unit={unit} onDelete={onDeleteUnit} />
              ))}
            </ul>
          )}

          {showAddUnit && (
            <AddUnitForm
              onSave={async (unitNumber) => {
                await onAddUnit(property.id, unitNumber)
                setShowAddUnit(false)
              }}
              onCancel={() => setShowAddUnit(false)}
            />
          )}
        </div>
      )}
    </div>
  )
}

// ─── Unit Row ─────────────────────────────────────────────────────────────────

function UnitRow({ unit, onDelete }: { unit: Unit; onDelete: (id: string) => void }) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <li className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-gray-50 group">
      <span className="text-sm text-gray-700">Unit {unit.unit_number}</span>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {confirmDelete ? (
          <>
            <span className="text-xs text-gray-400 mr-1">Delete?</span>
            <button
              onClick={() => onDelete(unit.id)}
              className="text-xs font-medium text-red-600 hover:text-red-800 px-1.5 py-0.5 rounded hover:bg-red-50 transition"
            >
              Yes
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-xs font-medium text-gray-500 hover:text-gray-700 px-1.5 py-0.5 rounded hover:bg-gray-100 transition"
            >
              No
            </button>
          </>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </li>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Properties() {
  const { user } = useAuth()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddProperty, setShowAddProperty] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProperties = async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('properties')
      .select('*, units(*)')
      .eq('landlord_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      setError('Failed to load properties.')
    } else {
      setProperties(
        (data ?? []).map((p: any) => ({
          ...p,
          units: p.units ?? [],
        }))
      )
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchProperties()
  }, [user])

  const handleAddProperty = async (name: string, address: string) => {
    if (!user) return
    const { error } = await supabase
      .from('properties')
      .insert({ name, address, landlord_id: user.id })
    if (!error) {
      setShowAddProperty(false)
      fetchProperties()
    }
  }

  const handleDeleteProperty = async (id: string) => {
    const { error } = await supabase.from('properties').delete().eq('id', id)
    if (!error) fetchProperties()
  }

  const handleAddUnit = async (propertyId: string, unitNumber: string) => {
    const { error } = await supabase
      .from('units')
      .insert({ unit_number: unitNumber, property_id: propertyId })
    if (!error) fetchProperties()
  }

  const handleDeleteUnit = async (unitId: string) => {
    const { error } = await supabase.from('units').delete().eq('id', unitId)
    if (!error) fetchProperties()
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#0F172A]">Properties</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {properties.length} {properties.length === 1 ? 'property' : 'properties'}
            </p>
          </div>
          <button
            onClick={() => setShowAddProperty((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 bg-[#0F172A] text-white text-sm font-medium rounded-lg hover:bg-[#1e293b] transition"
          >
            <Plus size={16} />
            Add Property
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Inline add form */}
        {showAddProperty && (
          <AddPropertyForm
            onSave={handleAddProperty}
            onCancel={() => setShowAddProperty(false)}
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
        ) : properties.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-700">No properties yet</p>
            <p className="text-xs text-gray-400 mt-1.5">
              Add your first property to start managing units and tenants.
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-w-3xl">
            {properties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onDelete={handleDeleteProperty}
                onAddUnit={handleAddUnit}
                onDeleteUnit={handleDeleteUnit}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
