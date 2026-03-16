import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export interface MaintenanceRequest {
  id: string
  landlord_id: string
  tenant_id: string | null
  unit_id: string | null
  description: string | null
  photo_url: string | null
  status: 'open' | 'assigned' | 'in_progress' | 'completed'
  vendor_id: string | null
  notes: string | null
  // Fields added for QR code / public tenant submission
  tenant_name: string | null
  tenant_phone: string | null
  category: string | null
  created_at: string
  updated_at: string
  // joined
  tenants?: { full_name: string; phone: string } | null
  units?: { unit_number: string } | null
}

export function useRealtime() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<MaintenanceRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    // Initial fetch — order by newest first
    supabase
      .from('maintenance_requests')
      .select(`
        *,
        tenants ( full_name, phone ),
        units ( unit_number )
      `)
      .eq('landlord_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) {
          setRequests(data as MaintenanceRequest[])
        }
        setLoading(false)
      })

    // Subscribe to real-time changes on maintenance_requests
    const channel = supabase
      .channel(`requests:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'maintenance_requests',
          filter: `landlord_id=eq.${user.id}`,
        },
        async (payload) => {
          // Fetch the full row with joins so we have tenant/unit names
          const { data } = await supabase
            .from('maintenance_requests')
            .select(`*, tenants ( full_name, phone ), units ( unit_number )`)
            .eq('id', payload.new.id)
            .single()

          if (data) {
            setRequests((prev) => [data as MaintenanceRequest, ...prev])
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'maintenance_requests',
          filter: `landlord_id=eq.${user.id}`,
        },
        async (payload) => {
          // Fetch updated row with joins
          const { data } = await supabase
            .from('maintenance_requests')
            .select(`*, tenants ( full_name, phone ), units ( unit_number )`)
            .eq('id', payload.new.id)
            .single()

          if (data) {
            setRequests((prev) =>
              prev.map((r) => (r.id === data.id ? (data as MaintenanceRequest) : r))
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  return { requests, loading }
}
