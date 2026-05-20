import { useEffect } from 'react'
import { io } from 'socket.io-client'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../stores/authStore'
import { useAlarmStore } from '../stores/alarmStore'
import { ENV } from '../config/env'
import type { EmergencySession } from '../types/api'

const WS_NAMESPACE = '/ws'

const STATUS_EVENTS = [
  'emergency:assigned',
  'emergency:reassigned',
  'emergency:closed',
  'emergency:in_progress',
] as const

type SessionPayload = Partial<EmergencySession> & { id?: string }
type LocationUpdatePayload = {
  session?: SessionPayload
  location?: unknown
}

/**
 * Connects to backend WebSocket as admin, patches cached detail data directly
 * from pushed payloads, and force-refetches list queries so the UI updates
 * in real time.
 */
export function useEmergencySocket() {
  const queryClient = useQueryClient()
  const accessToken = useAuthStore((s) => s.accessToken)

  useEffect(() => {
    if (!accessToken) return

    const socket = io(ENV.apiBaseUrl + WS_NAMESPACE, {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
    })

    socket.on('connect', () => {
      console.info('[ws] connected', socket.id)
    })
    socket.on('disconnect', (reason) => {
      console.info('[ws] disconnected', reason)
    })
    socket.on('connect_error', (err) => {
      console.warn('[ws] connect_error', err.message)
    })

    const refetchLists = () => {
      void queryClient.invalidateQueries({
        queryKey: ['emergencies'],
        refetchType: 'active',
      })
    }

    const patchDetail = (session: SessionPayload) => {
      if (!session?.id) return
      // Only patch existing cache entries; never seed from a partial WS payload
      // (it may be missing arrays like `locations` and break consumers).
      queryClient.setQueryData<EmergencySession | undefined>(
        ['emergency', session.id],
        (prev) => (prev ? { ...prev, ...session } : prev),
      )
      void queryClient.invalidateQueries({
        queryKey: ['emergency', session.id],
        refetchType: 'active',
      })
    }

    const onNew = (payload: SessionPayload) => {
      console.info('[ws] emergency:new', payload?.id)
      refetchLists()
      patchDetail(payload)
      useAlarmStore.getState().trigger()
    }

    const onStatusChange = (event: string) => (payload: SessionPayload) => {
      console.info(`[ws] ${event}`, payload?.id, payload?.status)
      refetchLists()
      patchDetail(payload)
    }

    const onLocationUpdate = (payload: LocationUpdatePayload) => {
      const id = payload?.session?.id
      console.info('[ws] emergency:location_update', id)
      if (payload?.session) patchDetail(payload.session)
    }

    // REL-6: backend sends a snapshot of open sessions on (re)connect so we
    // recover any events emitted while we were offline.
    const onBootstrap = (payload: { sessions?: SessionPayload[] }) => {
      const count = payload?.sessions?.length ?? 0
      console.info('[ws] emergency:bootstrap', count)
      if (count > 0) refetchLists()
    }

    socket.on('emergency:new', onNew)
    socket.on('emergency:location_update', onLocationUpdate)
    socket.on('emergency:bootstrap', onBootstrap)
    const statusHandlers = STATUS_EVENTS.map(
      (event) => [event, onStatusChange(event)] as const,
    )
    statusHandlers.forEach(([event, handler]) => {
      socket.on(event, handler)
    })

    return () => {
      socket.off('emergency:new', onNew)
      socket.off('emergency:location_update', onLocationUpdate)
      socket.off('emergency:bootstrap', onBootstrap)
      statusHandlers.forEach(([event, handler]) => {
        socket.off(event, handler)
      })
      socket.disconnect()
    }
  }, [accessToken, queryClient])
}
