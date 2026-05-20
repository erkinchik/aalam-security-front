import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { Layout } from './layout'
import { LoginPage } from '../pages/LoginPage'
import { DashboardPage } from '../pages/DashboardPage'
import { EmergenciesListPage } from '../pages/emergencies/EmergenciesListPage'
import { EmergencyDetailPage } from '../pages/emergencies/EmergencyDetailPage'
import { OperatorsPage } from '../pages/operators/OperatorsPage'
import { CreateOperatorPage } from '../pages/operators/CreateOperatorPage'
import { OrganizationsPage } from '../pages/organizations/OrganizationsPage'
import { OrganizationApplicationsListPage } from '../pages/organization-applications/OrganizationApplicationsListPage'
import { OrganizationApplicationDetailPage } from '../pages/organization-applications/OrganizationApplicationDetailPage'
import { SubscriptionRequestsListPage } from '../pages/subscription-requests/SubscriptionRequestsListPage'
import { SubscriptionRequestDetailPage } from '../pages/subscription-requests/SubscriptionRequestDetailPage'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'emergencies', element: <EmergenciesListPage /> },
      { path: 'emergencies/:id', element: <EmergencyDetailPage /> },
      { path: 'operators', element: <OperatorsPage /> },
      { path: 'operators/new', element: <CreateOperatorPage /> },
      { path: 'organizations', element: <OrganizationsPage /> },
      {
        path: 'organization-applications',
        element: <OrganizationApplicationsListPage />,
      },
      {
        path: 'organization-applications/:id',
        element: <OrganizationApplicationDetailPage />,
      },
      {
        path: 'subscription-requests',
        element: <SubscriptionRequestsListPage />,
      },
      {
        path: 'subscription-requests/:id',
        element: <SubscriptionRequestDetailPage />,
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
