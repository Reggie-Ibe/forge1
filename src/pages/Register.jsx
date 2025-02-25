// src/pages/Register.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'innovator', // Default role
    acceptTerms: false
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Valid email required';
    if (!formData.password || formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!formData.acceptTerms) newErrors.acceptTerms = 'You must accept the terms and conditions';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (!validateForm()) return;
    setIsSubmitting(true);
    
    try {
      navigate('/login', { state: { message: 'Registration successful! Check your email for verification instructions.' } });
    } catch (error) {
      console.error('Registration error:', error);
      setSubmitError('Registration failed. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100">
      <form className="bg-white p-8 shadow-md rounded" onSubmit={handleSubmit}>
        <h2 className="text-center text-xl font-bold">Create an Account</h2>
        <input type="text" name="firstName" placeholder="First Name" onChange={handleChange} className="input" />
        <input type="text" name="lastName" placeholder="Last Name" onChange={handleChange} className="input" />
        <input type="email" name="email" placeholder="Email" onChange={handleChange} className="input" />
        <input type="password" name="password" placeholder="Password" onChange={handleChange} className="input" />
        <input type="password" name="confirmPassword" placeholder="Confirm Password" onChange={handleChange} className="input" />
        <select name="role" onChange={handleChange} className="input">
          <option value="innovator">Innovator</option>
          <option value="investor">Investor</option>
        </select>
        <button type="submit" className="btn-primary w-full">Register</button>
      </form>
    </div>
  );
};

export default Register;

// src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await login(email, password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message);
    }
  };
  
  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100">
      <form className="bg-white p-8 shadow-md rounded" onSubmit={handleSubmit}>
        <h2 className="text-center text-xl font-bold">Sign in to your account</h2>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <input type="email" name="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} className="input" />
        <input type="password" name="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} className="input" />
        <button type="submit" className="btn-primary w-full">Sign In</button>
      </form>
    </div>
  );
}

export default Login;
