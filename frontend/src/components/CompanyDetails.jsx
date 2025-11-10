import React from 'react';

const CompanyDetails = ({ company }) => {
  if (!company) return null;

  return (
    <div style={{
      backgroundColor: '#f8f9fa',
      border: '1px solid #e9ecef',
      borderRadius: '8px',
      padding: '16px',
      marginTop: '16px'
    }}>
      <h4 style={{ 
        margin: '0 0 12px 0', 
        color: '#004aad', 
        fontSize: '16px',
        fontWeight: '600'
      }}>
        Selected Service Details
      </h4>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#333', marginBottom: '4px' }}>
            {company.serviceTitle || company.name}
          </div>
          <div style={{ fontSize: '14px', color: '#004aad', marginBottom: '4px' }}>
            by {company.name}
          </div>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
            📍 {company.location}
          </div>
        </div>
        
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '20px', fontWeight: '600', color: '#004aad' }}>
            ₹{company.price}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            per service
          </div>
        </div>
      </div>
      
      <div style={{ fontSize: '14px', color: '#555', marginBottom: '12px' }}>
        {company.description}
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
        <div style={{ fontSize: '13px', color: '#666' }}>
          <strong>Service Price:</strong> ₹{company.price}
        </div>
        <div style={{ fontSize: '13px', color: '#666' }}>
          <strong>Location:</strong> {company.location}
        </div>
        <div style={{ fontSize: '13px', color: '#666' }}>
          <strong>Provider:</strong> {company.name}
        </div>
        <div style={{ fontSize: '13px', color: '#666' }}>
          <strong>Status:</strong> ✓ Verified Service
        </div>
      </div>
    </div>
  );
};

export default CompanyDetails;
