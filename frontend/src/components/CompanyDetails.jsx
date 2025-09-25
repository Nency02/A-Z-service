import React from 'react';

const CompanyDetails = ({ company }) => {
  if (!company) return null;

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={i} style={{ color: '#ffd700', fontSize: '16px' }}>★</span>);
    }
    
    if (hasHalfStar) {
      stars.push(<span key="half" style={{ color: '#ffd700', fontSize: '16px' }}>☆</span>);
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`empty-${i}`} style={{ color: '#ddd', fontSize: '16px' }}>☆</span>);
    }
    
    return stars;
  };

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
        Selected Company Details
      </h4>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#333', marginBottom: '4px' }}>
            {company.name}
          </div>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
            📍 {company.location}
          </div>
        </div>
        
        <div style={{ textAlign: 'right' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            {renderStars(company.rating)}
            <span style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>
              {company.rating}
            </span>
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            ({company.reviews} reviews)
          </div>
        </div>
      </div>
      
      <div style={{ fontSize: '14px', color: '#555', marginBottom: '12px' }}>
        {company.description}
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
        <div style={{ fontSize: '13px', color: '#666' }}>
          <strong>Price Range:</strong> {company.priceRange}
        </div>
        <div style={{ fontSize: '13px', color: '#666' }}>
          <strong>Response Time:</strong> {company.responseTime}
        </div>
        <div style={{ fontSize: '13px', color: '#666' }}>
          <strong>Experience:</strong> {company.yearsExperience} years
        </div>
        <div style={{ fontSize: '13px', color: '#666' }}>
          <strong>Status:</strong> {company.verified ? '✓ Verified' : 'Unverified'}
        </div>
      </div>
      
      <div>
        <div style={{ fontSize: '13px', color: '#666', marginBottom: '6px', fontWeight: '600' }}>
          Specialties:
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {company.specialties.map((specialty, index) => (
            <span
              key={index}
              style={{
                backgroundColor: '#e3f2fd',
                color: '#004aad',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '500'
              }}
            >
              {specialty}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CompanyDetails;
