import { apiClient } from './client'
import type {
  EmergenciesQuery,
  EmergenciesResponse,
  EmergencySession,
  CreateVenuePayload,
  OperatorWithStatus,
  Organization,
  OrganizationDetail,
  OrganizationMemberDetail,
  OrgMemberRole,
  OrganizationApplicationDetail,
  UpdateVenuePayload,
  VenueDetail,
  OrganizationApplicationStatus,
  OrganizationApplicationsResponse,
  OrganizationApplicationBranch,
  OrganizationType,
  SubscriptionRequestDetail,
  SubscriptionRequestStatus,
  SubscriptionRequestsResponse,
} from '../types/api'

export async function getEmergencies(params: EmergenciesQuery = {}): Promise<EmergenciesResponse> {
  const { data } = await apiClient.get<EmergenciesResponse>('/admin/emergencies', { params })
  return data
}

export async function getEmergencyById(id: string): Promise<EmergencySession> {
  const { data } = await apiClient.get<EmergencySession>(`/admin/emergencies/${id}`)
  return data
}

export async function assignEmergency(id: string, operatorId: string): Promise<EmergencySession> {
  const { data } = await apiClient.post<EmergencySession>(`/admin/emergencies/${id}/assign`, {
    operatorId,
  })
  return data
}

export async function reassignEmergency(id: string, operatorId: string): Promise<EmergencySession> {
  const { data } = await apiClient.post<EmergencySession>(`/admin/emergencies/${id}/reassign`, {
    operatorId,
  })
  return data
}

export async function unassignEmergency(id: string): Promise<EmergencySession> {
  const { data } = await apiClient.post<EmergencySession>(`/admin/emergencies/${id}/unassign`)
  return data
}

export async function closeEmergency(id: string, resolution?: string): Promise<EmergencySession> {
  const { data } = await apiClient.post<EmergencySession>(`/admin/emergencies/${id}/close`, {
    resolution,
  })
  return data
}

export async function getOperators(organizationId?: string): Promise<OperatorWithStatus[]> {
  const { data } = await apiClient.get<OperatorWithStatus[]>('/admin/operators', {
    params: organizationId ? { organizationId } : undefined,
  })
  return data
}

export async function getOrganizations(): Promise<Organization[]> {
  const { data } = await apiClient.get<Organization[]>('/admin/organizations')
  return data
}

export async function getOrganizationById(id: string): Promise<OrganizationDetail> {
  const { data } = await apiClient.get<OrganizationDetail>(`/admin/organizations/${id}`)
  return data
}

export async function createVenue(
  organizationId: string,
  payload: CreateVenuePayload,
): Promise<VenueDetail> {
  const { data } = await apiClient.post<VenueDetail>(
    `/admin/organizations/${organizationId}/venues`,
    payload,
  )
  return data
}

export async function updateVenue(
  venueId: string,
  payload: UpdateVenuePayload,
): Promise<VenueDetail> {
  const { data } = await apiClient.patch<VenueDetail>(`/admin/venues/${venueId}`, payload)
  return data
}

export async function deleteVenue(venueId: string): Promise<{ status: string }> {
  const { data } = await apiClient.delete<{ status: string }>(`/admin/venues/${venueId}`)
  return data
}

export async function removeOrganizationMember(
  memberId: string,
): Promise<{ status: string }> {
  const { data } = await apiClient.delete<{ status: string }>(
    `/admin/organization-members/${memberId}`,
  )
  return data
}

export async function updateOrganization(
  id: string,
  dto: { name?: string; type?: 'PERSONAL' | 'BUSINESS' },
): Promise<Organization> {
  const { data } = await apiClient.patch<Organization>(`/admin/organizations/${id}`, dto)
  return data
}

export async function deleteOrganization(id: string): Promise<{ id: string; deleted: boolean }> {
  const { data } = await apiClient.delete<{ id: string; deleted: boolean }>(
    `/admin/organizations/${id}`,
  )
  return data
}

export async function addOrganizationMember(
  organizationId: string,
  dto: { email: string; role: OrgMemberRole; venueId?: string },
): Promise<OrganizationMemberDetail> {
  const { data } = await apiClient.post<OrganizationMemberDetail>(
    `/admin/organizations/${organizationId}/members`,
    dto,
  )
  return data
}

/** Назначение роли OWNER переводит прежнего владельца в менеджеры — это делает бэкенд. */
export async function updateOrganizationMember(
  memberId: string,
  dto: { role?: OrgMemberRole; venueId?: string | null },
): Promise<OrganizationMemberDetail> {
  const { data } = await apiClient.patch<OrganizationMemberDetail>(
    `/admin/organization-members/${memberId}`,
    dto,
  )
  return data
}

export async function createOrganization(dto: {
  name: string
  type?: 'PERSONAL' | 'BUSINESS'
}): Promise<Organization> {
  const { data } = await apiClient.post<Organization>('/admin/organizations', dto)
  return data
}

export async function createOperator(dto: {
  email: string
  password: string
  organizationId?: string
}): Promise<{ id: string; email: string; role: string; createdAt: string }> {
  const { data } = await apiClient.post('/admin/users/create-operator', dto)
  return data
}

function normalizeApplicationBranches(raw: unknown): OrganizationApplicationBranch[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item) => {
      if (typeof item !== 'object' || item === null) return null
      const o = item as Record<string, unknown>
      const name = typeof o.name === 'string' ? o.name : ''
      const address = typeof o.address === 'string' ? o.address : ''
      if (!name.trim()) return null
      return { name: name.trim(), address }
    })
    .filter((b): b is OrganizationApplicationBranch => b !== null)
}

export async function getOrganizationApplications(params?: {
  status?: OrganizationApplicationStatus
  page?: number
  limit?: number
}): Promise<OrganizationApplicationsResponse> {
  const { data } = await apiClient.get<OrganizationApplicationsResponse>(
    '/admin/organization-applications',
    { params },
  )
  return data
}

export async function getOrganizationApplicationById(
  id: string,
): Promise<OrganizationApplicationDetail> {
  const { data } = await apiClient.get<OrganizationApplicationDetail>(
    `/admin/organization-applications/${id}`,
  )
  return {
    ...data,
    branches: normalizeApplicationBranches(
      (data as unknown as { branches: unknown }).branches,
    ),
  }
}

export async function approveOrganizationApplication(
  id: string,
  dto?: { organizationName?: string; organizationType?: OrganizationType },
): Promise<OrganizationApplicationDetail> {
  const { data } = await apiClient.post<OrganizationApplicationDetail>(
    `/admin/organization-applications/${id}/approve`,
    dto ?? {},
  )
  return {
    ...data,
    branches: normalizeApplicationBranches(
      (data as unknown as { branches: unknown }).branches,
    ),
  }
}

export async function rejectOrganizationApplication(
  id: string,
  reason?: string,
): Promise<OrganizationApplicationDetail> {
  const { data } = await apiClient.post<OrganizationApplicationDetail>(
    `/admin/organization-applications/${id}/reject`,
    { reason: reason?.trim() || undefined },
  )
  return {
    ...data,
    branches: normalizeApplicationBranches(
      (data as unknown as { branches: unknown }).branches,
    ),
  }
}

export async function getSubscriptionRequests(params?: {
  status?: SubscriptionRequestStatus
  page?: number
  limit?: number
}): Promise<SubscriptionRequestsResponse> {
  const { data } = await apiClient.get<SubscriptionRequestsResponse>(
    '/admin/subscription-requests',
    { params },
  )
  return data
}

export async function getSubscriptionRequestById(
  id: string,
): Promise<SubscriptionRequestDetail> {
  const { data } = await apiClient.get<SubscriptionRequestDetail>(
    `/admin/subscription-requests/${id}`,
  )
  return data
}

export async function approveSubscriptionRequest(
  id: string,
  dto?: { expiresAt?: string },
): Promise<SubscriptionRequestDetail> {
  const { data } = await apiClient.post<SubscriptionRequestDetail>(
    `/admin/subscription-requests/${id}/approve`,
    dto ?? {},
  )
  return data
}

export async function rejectSubscriptionRequest(
  id: string,
  rejectionReason?: string,
): Promise<SubscriptionRequestDetail> {
  const { data } = await apiClient.post<SubscriptionRequestDetail>(
    `/admin/subscription-requests/${id}/reject`,
    { rejectionReason: rejectionReason?.trim() || undefined },
  )
  return data
}
