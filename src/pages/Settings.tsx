import { useState, useEffect, useRef } from 'react'
import { Check, Copy, LogOut, Download, QrCode } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputCls =
  'w-full px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed'

const labelCls = 'block text-xs font-medium text-gray-600 mb-1.5'

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Settings() {
  const { user, signOut } = useAuth()
  const [fullName, setFullName] = useState('')
  const [fixPingNumber, setFixPingNumber] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copiedQR, setCopiedQR] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const qrRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!user) return

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, telnyx_phone')
        .eq('id', user.id)
        .single()

      if (!error && data) {
        setFullName(data.full_name ?? '')
        setFixPingNumber(data.telnyx_phone ?? null)
      }
      setLoading(false)
    }

    fetchProfile()
  }, [user])

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    setError(null)

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim() })
      .eq('id', user.id)

    setSaving(false)

    if (error) {
      setError('Failed to save. Please try again.')
    } else {
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2500)
    }
  }

  const handleCopy = () => {
    if (!fixPingNumber) return
    navigator.clipboard.writeText(fixPingNumber).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const submissionUrl = user
    ? `${window.location.origin}/submit/${user.id}`
    : ''

  const handleCopyQRLink = () => {
    if (!submissionUrl) return
    navigator.clipboard.writeText(submissionUrl).then(() => {
      setCopiedQR(true)
      setTimeout(() => setCopiedQR(false), 2000)
    })
  }

  const handleDownloadQR = () => {
    if (!qrRef.current) return
    const svg = qrRef.current
    const serializer = new XMLSerializer()
    const svgStr = serializer.serializeToString(svg)

    const canvas = document.createElement('canvas')
    const size = 400
    canvas.width = size
    canvas.height = size

    const img = new Image()
    const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)

    img.onload = () => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      // White background so the QR prints cleanly
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, size, size)
      ctx.drawImage(img, 0, 0, size, size)
      URL.revokeObjectURL(url)

      const link = document.createElement('a')
      link.download = 'fixping-qr.png'
      link.href = canvas.toDataURL('image/png')
      link.click()
    }

    img.src = url
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <h1 className="text-xl font-bold text-[#0F172A]">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your account and FixPing configuration</p>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-6 max-w-xl">
            {/* Account section */}
            <Section
              title="Account"
              description="Update your display name"
            >
              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                  {error}
                </div>
              )}
              {saveSuccess && (
                <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 flex items-center gap-2">
                  <Check size={14} />
                  Changes saved
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Full Name</label>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your name"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Email</label>
                  <input
                    value={user?.email ?? ''}
                    disabled
                    className={inputCls}
                  />
                  <p className="text-xs text-gray-400 mt-1">Email cannot be changed here.</p>
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#0F172A] text-white text-sm font-medium rounded-lg hover:bg-[#1e293b] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check size={14} />
                  )}
                  Save
                </button>
              </div>
            </Section>

            {/* FixPing number section */}
            <Section
              title="Your FixPing Number"
              description="Share this number with your tenants so they can submit maintenance requests by text."
            >
              {fixPingNumber ? (
                <div className="flex items-center gap-3">
                  <div className="flex-1 px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm font-mono font-medium text-gray-900">
                    {fixPingNumber}
                  </div>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition flex-shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check size={14} className="text-green-600" />
                        <span className="text-green-600">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="px-4 py-3 rounded-lg bg-amber-50 border border-amber-200">
                  <p className="text-sm text-amber-700 font-medium">Not yet assigned</p>
                  <p className="text-xs text-amber-600 mt-0.5">
                    Your FixPing number will appear here once your account is activated.
                  </p>
                </div>
              )}
              <p className="text-xs text-gray-400 mt-3">
                When a tenant texts this number, their message is automatically logged as a maintenance request in your dashboard.
              </p>
            </Section>

            {/* QR Code section */}
            <Section
              title="Tenant Submission QR Code"
              description="Tenants scan this to submit maintenance requests directly to your dashboard — no app needed."
            >
              <div className="space-y-4">
                {/* QR code display */}
                <div className="flex justify-center p-5 bg-white border border-gray-200 rounded-xl">
                  <QRCodeSVG
                    ref={qrRef}
                    value={submissionUrl}
                    size={200}
                    bgColor="#ffffff"
                    fgColor="#0F172A"
                    level="M"
                  />
                </div>

                {/* URL display */}
                <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                  <QrCode size={13} className="text-gray-400 flex-shrink-0" />
                  <span className="text-xs text-gray-600 truncate flex-1 font-mono">
                    {submissionUrl}
                  </span>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyQRLink}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition"
                  >
                    {copiedQR ? (
                      <>
                        <Check size={14} className="text-green-600" />
                        <span className="text-green-600">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        Copy Link
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleDownloadQR}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[#0F172A] text-white text-sm font-medium rounded-lg hover:bg-[#1e293b] transition"
                  >
                    <Download size={14} />
                    Download QR
                  </button>
                </div>

                {/* Instructions */}
                <p className="text-xs text-gray-500 leading-relaxed border-t border-gray-100 pt-4">
                  Print this QR code and place it in your units. Tenants scan it to submit maintenance requests directly to your dashboard.
                </p>
              </div>
            </Section>

            {/* Danger zone */}
            <Section
              title="Danger Zone"
            >
              <p className="text-sm text-gray-500 mb-4">
                Signing out will end your current session on this device.
              </p>
              <button
                onClick={signOut}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-red-300 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition"
              >
                <LogOut size={15} />
                Sign out
              </button>
            </Section>
          </div>
        )}
      </div>
    </div>
  )
}
