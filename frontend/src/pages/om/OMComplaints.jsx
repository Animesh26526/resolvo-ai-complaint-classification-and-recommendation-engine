import React from 'react';
import ComplaintsList from '../../components/complaints/ComplaintsList';

export default function OMComplaints() {
  return (
    <ComplaintsList 
      apiEndpoint="/complaints/staff"
      title="All System Complaints"
      subtitle="Comprehensive view of all customer complaints across the platform."
    />
  );
}
