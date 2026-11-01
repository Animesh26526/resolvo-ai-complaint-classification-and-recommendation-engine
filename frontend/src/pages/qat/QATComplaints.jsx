import React from 'react';
import ComplaintsList from '../../components/complaints/ComplaintsList';

export default function QATComplaints() {
  return (
    <ComplaintsList 
      apiEndpoint="/complaints/staff"
      title="QA Complaint View"
      subtitle="View all complaints for QA monitoring and re-review."
    />
  );
}
