export type EmergencyStatus = 'NEW' | 'ASSIGNED' | 'IN_PROGRESS' | 'CLOSED'
export type OrganizationType = 'PERSONAL' | 'BUSINESS'

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface UserRef {
  id: string
  email: string
  role: string
}

export interface OrganizationRef {
  id: string
  name: string
}

export interface VenueRef {
  id: string
  name: string
  // Ниже — поля, которые API реально присылает в тревогах (см. include в
  // getEmergencies), но в типе их не было. Из-за этого координаты объекта
  // были недоступны коду, хотя лежали в ответе.
  address?: string | null
  apartment?: string | null
  floor?: string | null
  entrance?: string | null
  doorCode?: string | null
  addressNotes?: string | null
  latitude?: number | null
  longitude?: number | null
}

export interface EmergencyLocation {
  id: string
  sessionId: string
  latitude: number
  longitude: number
  accuracy: number
  createdAt: string
}

export interface EmergencySession {
  id: string
  userId: string
  organizationId: string | null
  venueId: string | null
  status: EmergencyStatus
  assignedOperatorId: string | null
  createdAt: string
  closedAt: string | null
  resolution: string | null
  user: UserRef
  organization: OrganizationRef | null
  venue: VenueRef | null
  assignedOperator: UserRef | null
  locations: EmergencyLocation[]
}

export interface EmergenciesResponse {
  data: EmergencySession[]
  total: number
  page: number
  limit: number
}

export interface EmergenciesQuery {
  status?: EmergencyStatus
  organizationId?: string
  assigned?: boolean
  from?: string
  to?: string
  page?: number
  limit?: number
}

export interface OperatorWithStatus {
  id: string
  email: string
  orgMemberships: Array<{
    organization: { id: string; name: string }
    role: string
  }>
  isOnline: boolean
  lastHeartbeatAt: string | null
  activeSessionCount: number
}

export interface Organization {
  id: string
  name: string
  slug: string
  type: OrganizationType
}

export type OrgMemberRole = 'OWNER' | 'MANAGER' | 'OPERATOR' | 'MEMBER'

export interface VenueDetail {
  id: string
  name: string
  address: string | null
  apartment: string | null
  floor: string | null
  entrance: string | null
  doorCode: string | null
  addressNotes: string | null
  latitude: number | null
  longitude: number | null
  inviteCode: string
  createdAt: string
}

export interface OrganizationMemberDetail {
  id: string
  role: OrgMemberRole
  createdAt: string
  user: { id: string; email: string; role: string }
  venue: { id: string; name: string } | null
}

export interface OrganizationDetail extends Organization {
  inviteCode: string | null
  createdAt: string
  venues: VenueDetail[]
  members: OrganizationMemberDetail[]
}

export interface CreateVenuePayload {
  name: string
  address?: string
  apartment?: string
  floor?: string
  entrance?: string
  doorCode?: string
  addressNotes?: string
  latitude?: number
  longitude?: number
}

export type UpdateVenuePayload = Partial<CreateVenuePayload>

export type OrganizationApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface OrganizationApplicationBranch {
  name: string
  address: string
}

export interface OrganizationApplicationAttachment {
  id: string
  applicationId: string
  fileName: string
  mimeType: string
  sizeBytes: number | null
  storageKey: string | null
  createdAt: string
}

export interface OrganizationApplicationListItem {
  id: string
  userId: string
  organizationName: string
  organizationType: string
  contactEmail: string
  contactPhone: string
  status: OrganizationApplicationStatus
  rejectionReason: string | null
  approvedOrganizationId: string | null
  createdAt: string
  updatedAt: string
  user: { id: string; email: string }
  approvedOrganization: { id: string; name: string; slug: string } | null
}

export interface OrganizationApplicationDetail {
  id: string
  userId: string
  organizationName: string
  organizationType: string
  branches: OrganizationApplicationBranch[]
  contactEmail: string
  contactPhone: string
  description: string | null
  status: OrganizationApplicationStatus
  rejectionReason: string | null
  approvedOrganizationId: string | null
  createdAt: string
  updatedAt: string
  user: { id: string; email: string }
  attachments: OrganizationApplicationAttachment[]
  approvedOrganization: {
    id: string
    name: string
    slug: string
    type: OrganizationType
  } | null
}

export interface OrganizationApplicationsResponse {
  data: OrganizationApplicationListItem[]
  total: number
  page: number
  limit: number
}

export type SubscriptionRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface SubscriptionRequestUserRef {
  id: string
  email: string
  phone: string | null
  displayName: string | null
}

export interface SubscriptionRequestListItem {
  id: string
  userId: string
  comment: string | null
  status: SubscriptionRequestStatus
  rejectionReason: string | null
  approvedBy: string | null
  approvedAt: string | null
  expiresAt: string | null
  createdAt: string
  updatedAt: string
  user: SubscriptionRequestUserRef
}

export interface SubscriptionRequestDetail extends SubscriptionRequestListItem {
  approvedByUser: { id: string; email: string } | null
}

export interface SubscriptionRequestsResponse {
  data: SubscriptionRequestListItem[]
  total: number
  page: number
  limit: number
}
