import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useNotification } from "../contexts/NotificationContext.jsx";
import "./Auth.css";

function Signup() {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    address: "",
    city: "",
    state: "Gujarat",
    pincode: "",
    // Provider specific fields
    companyName: "",
    companyAddress: "",
    serviceProvided: "",
    businessRegistration: "",
    experience: "",
    gstNumber: "",
    // Admin specific fields
    adminCode: "",
    department: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signup } = useAuth();
  const { showNotification } = useNotification();

  // Gujarat cities (fixed - no duplicates)
  const gujaratCities = [
    "Adalaj", "Ahmedabad", "Amreli", "Anand", "Ankleshwar", "Babra", "Bagasra", 
    "Bardoli", "Bavla", "Bharuch", "Bhavnagar", "Bhuj", "Bilimora", "Botad",
    "Chikhli", "Dahod", "Damnagar", "Deesa", "Dhandhuka", "Dharampur", "Dholka",
    "Dhrangadhra", "Dhoraji", "Gandhidham", "Godhra", "Gondal", "Halol",
    "Himmatnagar", "Idar", "Jamnagar", "Jetpur", "Junagadh", "Kadi", "Kalol",
    "Kapadvanj", "Kaprada", "Karjan", "Keshod", "Khambhalia", "Khambhat", "Kheda",
    "Khedbrahma", "Kosamba", "Limbdi", "Lunawada", "Mahuva", "Manavadar", "Mandvi",
    "Mangrol", "Mansa", "Modasa", "Morbi", "Morvi", "Nadiad", "Navsari",
    "Ode", "Okha", "Palanpur", "Palitana", "Padra", "Patan", "Petlad",
    "Porbandar", "Rajkot", "Rajula", "Salaya", "Sidhpur", "Sihor", "Surat",
    "Surendranagar", "Talaja", "Thangadh", "Umbergaon", "Umreth", "Una",
    "Unjha", "Upleta", "Vadodara", "Vallabh Vidyanagar", "Valsad", "Vapi",
    "Veraval", "Viramgam", "Visnagar", "Vyara", "Wadhwan", "Wankaner"
  ].sort();

  // Service categories
  const serviceCategories = [
    "House Cleaning", "Deep Cleaning", "Office Cleaning", "Carpet Cleaning",
    "Plumbing", "Electrical Work", "Carpentry", "Painting", "Waterproofing",
    "AC Service & Repair", "Refrigerator Repair", "Washing Machine Repair",
    "Microwave Repair", "Television Repair", "Home Appliance Repair",
    "Pest Control", "Termite Control", "Home Security Installation",
    "CCTV Installation", "Garden Maintenance", "Landscaping", "Tree Cutting",
    "Interior Design", "Home Renovation", "Tile Work", "Ceiling Work",
    "Moving & Packing", "Loading & Unloading", "Transportation",
    "Beauty Services", "Spa Services", "Massage Therapy", "Salon Services",
    "Tutoring", "Music Classes", "Dance Classes", "Yoga Classes",
    "Event Planning", "Catering", "Photography", "Videography",
    "Wedding Planning", "Birthday Party Planning", "Corporate Events",
    "Computer Repair", "Laptop Repair", "Mobile Repair", "Software Installation",
    "Web Development", "Digital Marketing", "Graphic Design",
    "Car Washing", "Car Repair", "Bike Repair", "Vehicle Servicing",
    "Laundry Services", "Dry Cleaning", "Ironing Services",
    "Elder Care", "Baby Care", "Pet Care", "House Sitting",
    "Other"
  ];

  // Admin departments
  const adminDepartments = [
    "Operations",
    "Customer Support",
    "Quality Assurance",
    "Marketing",
    "Finance",
    "Human Resources",
    "Technical Support",
    "Business Development",
    "Legal & Compliance",
    "Super Admin"
  ];

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setStep(2);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const validateForm = () => {
    // Basic validation
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return false;
    }
    if (!form.name.trim()) {
      setError("Name is required");
      return false;
    }
    if (!form.email.trim()) {
      setError("Email is required");
      return false;
    }
    if (!form.phone.trim()) {
      setError("Phone number is required");
      return false;
    }
    if (!/^[6-9]\d{9}$/.test(form.phone)) {
      setError("Please enter a valid 10-digit Indian mobile number");
      return false;
    }

    // Address validation (not required for admin)
    if (role !== "admin") {
      if (!form.address.trim()) {
        setError("Address is required");
        return false;
      }
      if (!form.city.trim()) {
        setError("City is required");
        return false;
      }
      if (!form.pincode.trim()) {
        setError("Pincode is required");
        return false;
      }
      if (!/^\d{6}$/.test(form.pincode)) {
        setError("Please enter a valid 6-digit pincode");
        return false;
      }
    }

    // Provider-specific validation
    if (role === "provider") {
      if (!form.companyName.trim()) {
        setError("Company/Business name is required");
        return false;
      }
      if (!form.companyAddress.trim()) {
        setError("Company address is required");
        return false;
      }
      if (!form.serviceProvided.trim()) {
        setError("Service category is required");
        return false;
      }
    }

    // Admin-specific validation
    if (role === "admin") {
      if (!form.adminCode.trim()) {
        setError("Admin authorization code is required");
        return false;
      }
      if (form.adminCode !== "AZ-ADMIN-2024") {
        setError("Invalid admin authorization code");
        return false;
      }
      if (!form.department.trim()) {
        setError("Department is required");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    console.log("🚀 Submitting form with data:", {
      ...form,
      password: form.password ? "[PROVIDED]" : "[MISSING]",
      adminCode: form.adminCode ? "[PROVIDED]" : "[MISSING]"
    });

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password.trim(),
        role: role,
        phone: form.phone.trim(),
        state: form.state || "Gujarat"
      };

      // Add address fields for customer and provider
      if (role !== "admin") {
        payload.address = form.address.trim();
        payload.city = form.city.trim();
        payload.pincode = form.pincode.trim();
      }

      // Add provider-specific fields
      if (role === "provider") {
        payload.companyName = form.companyName.trim();
        payload.companyAddress = form.companyAddress.trim();
        payload.serviceProvided = form.serviceProvided.trim();
        
        // Only add optional fields if they have values
        if (form.businessRegistration?.trim()) {
          payload.businessRegistration = form.businessRegistration.trim();
        }
        if (form.gstNumber?.trim()) {
          payload.gstNumber = form.gstNumber.trim();
        }
        if (form.experience?.trim()) {
          payload.experience = form.experience.trim();
        }
      }

      // Add admin-specific fields
      if (role === "admin") {
        payload.adminCode = form.adminCode.trim();
        payload.department = form.department.trim();
      }

      console.log("📤 Sending payload:", payload);

      const response = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log("📥 Response:", data);

      if (data.success) {
        showNotification(data.message, "success");
        navigate("/login");
      } else {
        setError(data.error || "Signup failed");
        showNotification(data.error || "Signup failed", "error");
      }
    } catch (err) {
      console.error("❌ Network error:", err);
      setError("Network error. Please check your connection.");
      showNotification("Network error. Please check your connection.", "error");
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    setStep(1);
    setRole("");
    setForm({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
      address: "",
      city: "",
      state: "Gujarat",
      pincode: "",
      companyName: "",
      companyAddress: "",
      serviceProvided: "",
      businessRegistration: "",
      experience: "",
      gstNumber: "",
      adminCode: "",
      department: ""
    });
    setError("");
  };

  return (
    <div className="auth-container">
      {step === 1 ? (
        <div className="auth-form role-selection">
          <div className="auth-header">
            <h2>Join A-Z Service Platform</h2>
            <p>Choose your account type to get started</p>
          </div>
          
          <div className="role-selection-container">
            <div className="role-card" onClick={() => handleRoleSelect("customer")}>
              <div className="role-icon">👤</div>
              <h3>Customer</h3>
              <p>Book services from trusted providers across Gujarat</p>
              <ul className="role-features">
                <li>✓ Browse & book services</li>
                <li>✓ Compare providers</li>
                <li>✓ Track bookings</li>
                <li>✓ Rate & review</li>
                <li>✓ 24/7 customer support</li>
              </ul>
              <button className="role-btn customer">Join as Customer</button>
            </div>

            <div className="role-card" onClick={() => handleRoleSelect("provider")}>
              <div className="role-icon">🏢</div>
              <h3>Service Provider</h3>
              <p>Grow your business across Gujarat</p>
              <ul className="role-features">
                <li>✓ List your services</li>
                <li>✓ Manage bookings</li>
                <li>✓ Build your team</li>
                <li>✓ Expand customer base</li>
                <li>✓ Increase your income</li>
              </ul>
              <button className="role-btn provider">Join as Provider</button>
            </div>

            <div className="role-card" onClick={() => handleRoleSelect("admin")}>
              <div className="role-icon">⚡</div>
              <h3>Admin</h3>
              <p>Manage platform operations and quality</p>
              <ul className="role-features">
                <li>✓ Manage all users</li>
                <li>✓ Approve providers</li>
                <li>✓ Monitor quality</li>
                <li>✓ Analytics & reports</li>
                <li>✓ Platform settings</li>
              </ul>
              <button className="role-btn admin">Join as Admin</button>
            </div>
          </div>

          <div className="auth-footer">
            <p>Already have an account? <Link to="/login">Login here</Link></p>
          </div>
        </div>
      ) : (
        <form className="auth-form signup-form" onSubmit={handleSubmit}>
          <div className="auth-header">
            <button type="button" className="back-btn" onClick={goBack}>
              ← Back
            </button>
            <h2>
              {role === "customer" && "Create Customer Account"}
              {role === "provider" && "Create Provider Account"}
              {role === "admin" && "Create Admin Account"}
            </h2>
            <p>
              {role === "customer" && "Join thousands of satisfied customers across Gujarat"}
              {role === "provider" && "Start your service business in Gujarat"}
              {role === "admin" && "Manage and grow the A-Z Service platform"}
            </p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="form-grid">
            {/* Personal Information */}
            <div className="form-section">
              <h3>Personal Information</h3>
              <div className="form-row">
                <input
                  type="text"
                  name="name"
                  placeholder={
                    role === "provider" ? "Owner/Manager Full Name" :
                    role === "admin" ? "Admin Full Name" :
                    "Full Name"
                  }
                  value={form.name}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="form-row">
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={form.email}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-row">
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone Number (10 digits)"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  maxLength="10"
                />
              </div>

              <div className="form-row">
                <input
                  type="password"
                  name="password"
                  placeholder="Password (min 6 characters)"
                  value={form.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-row">
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Address Information - Not required for admin */}
            {role !== "admin" && (
              <div className="form-section">
                <h3>{role === "provider" ? "Personal Address" : "Address Information"}</h3>
                <div className="form-row">
                  <textarea
                    name="address"
                    placeholder="Complete Address (House/Flat No, Street, Area)"
                    value={form.address}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    rows="3"
                  />
                </div>

                <div className="form-row">
                  <select
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  >
                    <option value="">Select City</option>
                    {gujaratCities.map((city, index) => (
                      <option key={`${city}-${index}`} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <input
                    type="text"
                    name="state"
                    value="Gujarat"
                    disabled
                    style={{ background: "#f0f0f0", color: "#666" }}
                  />
                </div>

                <div className="form-row">
                  <input
                    type="text"
                    name="pincode"
                    placeholder="Pincode (6 digits)"
                    value={form.pincode}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    maxLength="6"
                  />
                </div>
              </div>
            )}

            {/* Provider-specific fields */}
            {role === "provider" && (
              <>
                <div className="form-section">
                  <h3>Business Information</h3>
                  <div className="form-row">
                    <input
                      type="text"
                      name="companyName"
                      placeholder="Company/Business Name"
                      value={form.companyName}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="form-row">
                    <textarea
                      name="companyAddress"
                      placeholder="Business Address (if different from personal)"
                      value={form.companyAddress}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      rows="3"
                    />
                  </div>

                  <div className="form-row">
                    <input
                      type="text"
                      name="gstNumber"
                      placeholder="GST Number (Optional)"
                      value={form.gstNumber}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </div>

                  <div className="form-row">
                    <input
                      type="text"
                      name="businessRegistration"
                      placeholder="Business Registration Number (Optional)"
                      value={form.businessRegistration}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="form-section">
                  <h3>Service Information</h3>
                  <div className="form-row">
                    <select
                      name="serviceProvided"
                      value={form.serviceProvided}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    >
                      <option value="">Select Primary Service</option>
                      {serviceCategories.map((service, index) => (
                        <option key={`${service}-${index}`} value={service}>{service}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-row">
                    <select
                      name="experience"
                      value={form.experience}
                      onChange={handleChange}
                      disabled={loading}
                    >
                      <option value="">Years of Experience</option>
                      <option value="Less than 1 year">Less than 1 year</option>
                      <option value="1-2 years">1-2 years</option>
                      <option value="3-5 years">3-5 years</option>
                      <option value="5-10 years">5-10 years</option>
                      <option value="More than 10 years">More than 10 years</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Admin-specific fields */}
            {role === "admin" && (
              <div className="form-section">
                <h3>Admin Authorization</h3>
                <div className="form-row">
                  <input
                    type="password"
                    name="adminCode"
                    placeholder="Admin Authorization Code"
                    value={form.adminCode}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                  <small style={{ color: "#666", fontSize: "12px", marginTop: "4px", display: "block" }}>
                    Please contact system administrator for the authorization code
                  </small>
                </div>

                <div className="form-row">
                  <select
                    name="department"
                    value={form.department}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  >
                    <option value="">Select Department</option>
                    {adminDepartments.map((dept, index) => (
                      <option key={`${dept}-${index}`} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? (
                <span>
                  <span className="loading-spinner"></span>
                  Creating Account...
                </span>
              ) : (
                `Create ${role === "customer" ? "Customer" : role === "provider" ? "Provider" : "Admin"} Account`
              )}
            </button>
          </div>

          <div className="auth-footer">
            <p>Already have an account? <Link to="/login">Login here</Link></p>
          </div>
        </form>
      )}
    </div>
  );
}

export default Signup;