import React, { useState } from 'react';
import { getCompaniesForService, getTopRatedCompany, getRecommendedCompanies } from '../data/serviceCompanies';

const CompanySelector = ({ serviceName, selectedCompany, onCompanySelect }) => {
  const [showAll, setShowAll] = useState(false);
  
  const companies = getCompaniesForService(serviceName);
  const topRated = getTopRatedCompany(serviceName);
  const recommended = getRecommendedCompanies(serviceName);
  
  const displayCompanies = showAll ? companies : recommended;

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={i} style={{ color: '#ffd700' }}>★</span>);
    }
    
    if (hasHalfStar) {
      stars.push(<span key="half" style={{ color: '#ffd700' }}>☆</span>);
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`empty-${i}`} style={{ color: '#ddd' }}>☆</span>);
    }
    
    return stars;
  };

  if (companies.length === 0) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center', 
        color: '#666',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        margin: '16px 0'
      }}>
        No companies available for this service yet.
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '20px' }}>
      <h3 style={{ 
        marginBottom: '16px', 
        color: '#004aad', 
        fontSize: '18px',
        fontWeight: '600'
      }}>
        Choose Your Preferred Service Company
      </h3>
      
      {topRated && (
        <div style={{
          backgroundColor: '#e8f4fd',
          border: '2px solid #004aad',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '16px'
        }}>
          <div style={{ 
            fontSize: '14px', 
            fontWeight: '600', 
            color: '#004aad',
            marginBottom: '4px'
          }}>
            ⭐ RECOMMENDED
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            Top-rated company for {serviceName}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {displayCompanies.map((company) => (
          <div
            key={company.id}
            onClick={() => onCompanySelect(company)}
            style={{
              border: selectedCompany?.id === company.id ? '2px solid #004aad' : '1px solid #ddd',
              borderRadius: '8px',
              padding: '16px',
              cursor: 'pointer',
              backgroundColor: selectedCompany?.id === company.id ? '#f0f7ff' : '#fff',
              transition: 'all 0.3s ease',
              position: 'relative'
            }}
          >
            {company.verified && (
              <div style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                backgroundColor: '#10b981',
                color: 'white',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: '600'
              }}>
                ✓ VERIFIED
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div>
                <h4 style={{ 
                  margin: '0 0 4px 0', 
                  fontSize: '16px', 
                  fontWeight: '600',
                  color: '#333'
                }}>
                  {company.name}
                </h4>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                  📍 {company.location}
                </div>
              </div>
              
              <div style={{ textAlign: 'right' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                  {renderStars(company.rating)}
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>
                    {company.rating}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: '#666' }}>
                  ({company.reviews} reviews)
                </div>
              </div>
            </div>
            
            <div style={{ fontSize: '13px', color: '#555', marginBottom: '8px' }}>
              {company.description}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#666' }}>
                <span>💰 {company.priceRange}</span>
                <span>⏱️ {company.responseTime}</span>
                <span>🏆 {company.yearsExperience} years exp</span>
              </div>
              
              {selectedCompany?.id === company.id && (
                <div style={{ 
                  color: '#004aad', 
                  fontSize: '12px', 
                  fontWeight: '600' 
                }}>
                  ✓ SELECTED
                </div>
              )}
            </div>
            
            <div style={{ marginTop: '8px' }}>
              <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>
                Specialties:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {company.specialties.slice(0, 3).map((specialty, index) => (
                  <span
                    key={index}
                    style={{
                      backgroundColor: '#f0f7ff',
                      color: '#004aad',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: '500'
                    }}
                  >
                    {specialty}
                  </span>
                ))}
                {company.specialties.length > 3 && (
                  <span style={{ fontSize: '10px', color: '#666' }}>
                    +{company.specialties.length - 3} more
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {companies.length > 2 && (
        <button
          type="button"
          onClick={() => setShowAll(!showAll)}
          style={{
            width: '100%',
            padding: '8px',
            backgroundColor: 'transparent',
            border: '1px solid #004aad',
            color: '#004aad',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            marginTop: '12px'
          }}
        >
          {showAll ? 'Show Less' : `View All ${companies.length} Companies`}
        </button>
      )}
    </div>
  );
};

export default CompanySelector;
