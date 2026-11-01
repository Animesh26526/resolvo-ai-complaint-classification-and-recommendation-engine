import React from 'react';
import ComplaintsList from '../../components/complaints/ComplaintsList';

export default function CustomerComplaints() {
  return (
    <ComplaintsList 
      apiEndpoint="/complaints"
      title="My Complaints"
      subtitle="Track the status and resolution of your submitted complaints."
    />
  );
}
