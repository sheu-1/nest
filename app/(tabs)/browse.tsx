import React from 'react';
import { useAuth } from '../../src/context/AuthContext';
import LandlordDashboard from './dashboard';
import BrowseTenant from '../(tenant)/browse';

/**
 * Browse tab — renders different content based on user role.
 * Landlords see their Dashboard; Tenants see the listing feed.
 */
export default function BrowseScreen() {
  const { role } = useAuth();
  if (role === 'landlord') return <LandlordDashboard />;
  return <BrowseTenant />;
}
