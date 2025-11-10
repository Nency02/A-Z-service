import React, { useState, useEffect } from 'react';

const CompanySelector = ({ serviceName, selectedCompany, onCompanySelect }) => {
  const [showAll, setShowAll] = useState(false);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Fetch real services from database
  useEffect(() => {
    if (!serviceName) return;
    
    setLoading(true);
    fetch(`http://localhost:5000/api/service/category/${serviceName}`)
      .then(res => res.json())
      .then(data => {
        console.log(`Fetched ${data.services?.length || 0} services for ${serviceName}`);
        setServices(data.services || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching services:", err);
        setServices([]);
        setLoading(false);
      });
  }, [serviceName]);
  
  const displayServices = showAll ? services : services.slice(0, 2);



  if (loading) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center', 
        color: '#666',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        margin: '16px 0'
      }}>
        Loading services...
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center', 
        color: '#666',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        margin: '16px 0'
      }}>
        No services available for this category yet.
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
        Choose Your Preferred Service Provider
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {displayServices.map((service) => (
          <div
            key={service._id}
            onClick={() => onCompanySelect({
              id: service._id,
              name: service.provider?.name || 'Service Provider',
              serviceTitle: service.title,
              price: service.price,
              location: service.location,
              description: service.description
            })}
            style={{
              border: selectedCompany?.id === service._id ? '2px solid #004aad' : '1px solid #ddd',
              borderRadius: '8px',
              padding: '16px',
              cursor: 'pointer',
              backgroundColor: selectedCompany?.id === service._id ? '#f0f7ff' : '#fff',
              transition: 'all 0.3s ease',
              position: 'relative'
            }}
          >
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
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div>
                <h4 style={{ 
                  margin: '0 0 4px 0', 
                  fontSize: '16px', 
                  fontWeight: '600',
                  color: '#333'
                }}>
                  {service.title}
                </h4>
                <div style={{ fontSize: '14px', color: '#004aad', marginBottom: '4px' }}>
                  by {service.provider?.name || 'Service Provider'}
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                  📍 {service.location}
                </div>
              </div>
              
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>
                  ₹{service.price}
                </div>
                <div style={{ fontSize: '11px', color: '#666' }}>
                  per service
                </div>
              </div>
            </div>
            
            <div style={{ fontSize: '13px', color: '#555', marginBottom: '8px' }}>
              {service.description}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#666' }}>
                <span>💰 ₹{service.price}</span>
                <span>📋 {service.category}</span>
              </div>
              
              {selectedCompany?.id === service._id && (
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
                Provider Contact:
              </div>
              <div style={{ fontSize: '12px', color: '#555' }}>
                📧 {service.provider?.email || 'Contact via platform'}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {services.length > 2 && (
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
          {showAll ? 'Show Less' : `View All ${services.length} Services`}
        </button>
      )}
    </div>
  );
};

export default CompanySelector;
