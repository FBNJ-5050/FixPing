import { useState, useEffect } from 'react'
import { X, Image } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useRealtime, MaintenanceRequest } from '../hooks/useRealtime'
import { formatDistanceToNow } from '../lib/formatTime'

// ─── Types ────────────────────────────────────────────────────────────────────

type StatusFilter = 'all' | 'open' | 'assigned' | 'in_progress' | 'completed'

interface Vendor {
  id: string
  name: string
  specialty: string
}

// ─── Status helpers ────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  completed: 'Completed',
}

const STATUS_BADGE: Record<string, string> = {
  open: 'bg-red-100 text-red-700',
  assigned: 'bg-amber-100 text-amber-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[status] ?? 'bg-gray-100 text-gray-600'}`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}

// ─── Category badge ────────────────────────────────────────────────────────────

const CATEGORY_BADGE: Record<string, string> = {
  Plumbing:      'bg-blue-100 text-blue-700',
  Electrical:    'bg-yellow-100 text-yellow-700',
  HVAC:          'bg-green-100 text-green-700',
  Appliance:     'bg-purple-100 text-purple-700',
  Structural:    'bg-orange-100 text-orange-700',
  'Pest Control':'bg-red-100 text-red-700',
  Other:         'bg-gray-100 text-gray-600',
}

function CategoryBadge({ category }: { category: string | null }) {
  if (!category) return null
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_BADGE[category] ?? 'bg-gray-100 text-gray-600'}`}
    >
      {category}
    </span>
  )
}

// ─── Request Card ─────────────────────────────────────────────────────────────

function RequestCard({
  request,
  selected,
  onClick,
}: {
  request: MaintenanceRequest
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border transition-all ${
        selected
          ? 'border-blue-500 bg-blue-50 shadow-sm'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <StatusBadge status={request.status} />
          <CategoryBadge category={request.category} />
        </div>
        <span className="text-xs text-gray-400 flex-shrink-0">
          {formatDistanceToNow(request.created_at)}
        </span>
      </div>

      <div className="flex gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {request.tenants?.full_name ?? request.tenant_name ?? 'Unknown tenant'}
            {request.units?.unit_number ? (
              <span className="text-gray-500 font-normal"> · {request.units.unit_number}</span>
            ) : null}
          </p>
          <p className="mt-1 text-sm text-gray-500 line-clamp-2">
            {request.description ?? 'No description'}
          </p>
        </div>

        {request.photo_url && (
          <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
            <img
              src={request.photo_url}
              alt="Request photo"
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>
    </button>
  )
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

function DetailPanel({
  request,
  vendors,
  onClose,
  onUpdate,
}: {
  request: MaintenanceRequest
  vendors: Vendor[]
  onClose: () => void
  onUpdate: (updated: MaintenanceRequest) => void
}) {
  const [selectedVendorId, setSelectedVendorId] = useState(request.vendor_id ?? '')
  const [selectedStatus, setSelectedStatus] = useState(request.status)
  const [notes, setNotes] = useState(request.notes ?? '')
  const [assignLoading, setAssignLoading] = useState(false)
  const [statusLoading, setStatusLoading] = useState(false)
  const [notesLoading, setNotesLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Sync when a different request is selected
  useEffect(() => {
    setSelectedVendorId(request.vendor_id ?? '')
    setSelectedStatus(request.status)
    setNotes(request.notes ?? '')
    setSuccessMsg(null)
  }, [request.id])

  const flash = (msg: string) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(null), 2500)
  }

  const handleAssign = async () => {
    if (!selectedVendorId) return
    setAssignLoading(true)
    const { data, error } = await supabase
      .from('maintenance_requests')
      .update({ vendor_id: selectedVendorId, status: 'assigned' })
      .eq('id', request.id)
      .select(`*, tenants ( full_name, phone ), units ( unit_number )`)
      .single()
    setAssignLoading(false)
    if (!error && data) { onUpdate(data as MaintenanceRequest); flash('Vendor assigned') }
  }

  const handleStatusUpdate = async () => {
    setStatusLoading(true)
    const { data, error } = await supabase
      .from('maintenance_requests')
      .update({ status: selectedStatus })
      .eq('id', request.id)
      .select(`*, tenants ( full_name, phone ), units ( unit_number )`)
      .single()
    setStatusLoading(false)
    if (!error && data) { onUpdate(data as MaintenanceRequest); flash('Status updated') }
  }

  const handleSaveNotes = async () => {
    setNotesLoading(true)
    const { data, error } = await supabase
      .from('maintenance_requests')
      .update({ notes })
      .eq('id', request.id)
      .select(`*, tenants ( full_name, phone ), units ( unit_number )`)
      .single()
    setNotesLoading(false)
    if (!error && data) { onUpdate(data as MaintenanceRequest); flash('Notes saved') }
  }

  const inputCls =
    'w-full px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition'

  const btnSmall =
    'text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed'

  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-3">
          <StatusBadge status={request.status} />
          <span className="text-xs text-gray-400">{formatDistanceToNow(request.created_at)}</span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
        >
          <X size={18} />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
        {/* Success flash */}
        {successMsg && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-2.5">
            {successMsg}
          </div>
        )}

        {/* Photo */}
        {request.photo_url ? (
          <div className="rounded-xl overflow-hidden bg-gray-100">
            <img src={request.photo_url} alt="Maintenance request" className="w-full object-cover max-h-56" />
          </div>
        ) : (
          <div className="rounded-xl bg-gray-50 border border-gray-200 flex flex-col items-center justify-center py-8 text-gray-300">
            <Image size={28} />
            <span className="text-xs mt-1.5">No photo</span>
          </div>
        )}

        {/* Description */}
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Description
          </h3>
          <p className="text-sm text-gray-800 leading-relaxed">
            {request.description ?? 'No description provided.'}
          </p>
        </div>

        {/* Category */}
        {request.category && (
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Category
            </h3>
            <CategoryBadge category={request.category} />
          </div>
        )}

        {/* Tenant info */}
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Tenant
          </h3>
          <div className="bg-gray-50 rounded-xl p-4 space-y-1">
            <p className="text-sm font-medium text-gray-900">
              {request.tenants?.full_name ?? request.tenant_name ?? '—'}
            </p>
            {(request.tenants?.phone || request.tenant_phone) && (
              <p className="text-sm text-gray-500">
                {request.tenants?.phone ?? request.tenant_phone}
              </p>
            )}
            {request.units?.unit_number && (
              <p className="text-sm text-gray-500">{request.units.unit_number}</p>
            )}
            {/* Badge to flag QR-submitted requests */}
            {!request.tenant_id && request.tenant_name && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 mt-1">
                Via QR code
              </span>
            )}
          </div>
        </div>

        {/* Assign vendor */}
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Assign Vendor
          </h3>
          <div className="flex gap-2">
            <select
              value={selectedVendorId}
              onChange={(e) => setSelectedVendorId(e.target.value)}
              className={`${inputCls} flex-1`}
            >
              <option value="">— Select vendor —</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.specialty})
                </option>
              ))}
            </select>
            <button
              onClick={handleAssign}
              disabled={!selectedVendorId || assignLoading}
              className={`${btnSmall} bg-[#0F172A] text-white hover:bg-[#1e293b] flex items-center gap-1.5`}
            >
              {assignLoading ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Assign'
              )}
            </button>
          </div>
        </div>

        {/* Status */}
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Update Status
          </h3>
          <div className="flex gap-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as MaintenanceRequest['status'])}
              className={`${inputCls} flex-1`}
            >
              <option value="open">Open</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
            <button
              onClick={handleStatusUpdate}
              disabled={statusLoading}
              className={`${btnSmall} bg-[#0F172A] text-white hover:bg-[#1e293b] flex items-center gap-1.5`}
            >
              {statusLoading ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Update'
              )}
            </button>
          </div>
        </div>

        {/* Notes */}
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Notes
          </h3>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className={`${inputCls} resize-none`}
            placeholder="Add internal notes about this request..."
          />
          <button
            onClick={handleSaveNotes}
            disabled={notesLoading}
            className={`mt-2 ${btnSmall} bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center gap-1.5`}
          >
            {notesLoading ? (
              <div className="w-3.5 h-3.5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              'Save Notes'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user } = useAuth()
  const { requests, loading } = useRealtime()
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [vendors, setVendors] = useState<Vendor[]>([])

  // Load vendors once
  useEffect(() => {
    if (!user) return
    supabase
      .from('vendors')
      .select('id, name, specialty')
      .eq('landlord_id', user.id)
      .then(({ data }) => {
        if (data) setVendors(data)
      })
  }, [user])

  // When a request is updated from the detail panel, sync it into local state
  const handleUpdate = (updated: MaintenanceRequest) => {
    // The realtime hook will eventually catch the UPDATE event,
    // but we also update locally for instant UI feedback
    setSelectedId(updated.id)
  }

  // Filter counts
  const counts: Record<StatusFilter, number> = {
    all: requests.length,
    open: requests.filter((r) => r.status === 'open').length,
    assigned: requests.filter((r) => r.status === 'assigned').length,
    in_progress: requests.filter((r) => r.status === 'in_progress').length,
    completed: requests.filter((r) => r.status === 'completed').length,
  }

  const filtered =
    activeFilter === 'all' ? requests : requests.filter((r) => r.status === activeFilter)

  const selectedRequest = requests.find((r) => r.id === selectedId) ?? null

  const filters: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'open', label: 'Open' },
    { key: 'assigned', label: 'Assigned' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'completed', label: 'Completed' },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#0F172A]">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">Maintenance requests</p>
          </div>
          {/* Live indicator */}
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-3 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-xs font-medium text-gray-600">Live</span>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 mt-4 overflow-x-auto pb-0.5">
          {filters.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition flex-shrink-0 ${
                activeFilter === key
                  ? 'bg-[#0F172A] text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {label}
              <span
                className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs ${
                  activeFilter === key
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {counts[key]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Body: split view */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: request list */}
        <div
          className={`flex flex-col overflow-hidden transition-all ${
            selectedRequest ? 'w-80 flex-shrink-0' : 'flex-1'
          }`}
        >
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-700">No maintenance requests yet</p>
                <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                  When a tenant texts your FixPing number, requests will appear here instantly.
                </p>
              </div>
            ) : (
              filtered.map((r) => (
                <RequestCard
                  key={r.id}
                  request={r}
                  selected={selectedId === r.id}
                  onClick={() => setSelectedId(selectedId === r.id ? null : r.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Right: detail panel */}
        {selectedRequest && (
          <div className="flex-1 overflow-hidden">
            <DetailPanel
              request={selectedRequest}
              vendors={vendors}
              onClose={() => setSelectedId(null)}
              onUpdate={handleUpdate}
            />
          </div>
        )}
      </div>
    </div>
  )
}
