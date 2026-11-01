import React from 'react';
import ComplaintsList from '../../components/complaints/ComplaintsList';

export default function CSEComplaints() {
  return (
    <ComplaintsList 
      apiEndpoint="/complaints/staff"
      title="My Assigned Cases"
      subtitle="Complaints currently assigned to you for resolution."
    />
  );
}
