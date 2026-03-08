import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/SignUp.css';
import { getAuthRedirectPath, logout, persistAuthSession, signUp, signUpWithGoogle } from '../services/authApi';
import { getGoogleIdToken } from '../services/googleAuth';

type SignUpFormData = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

function SignUp() {
  const [formData, setFormData] = useState<SignUpFormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const redirectPath = getAuthRedirectPath();

    if (token && redirectPath !== location.pathname) {
      navigate(redirectPath, { replace: true });
    }
  }, [location.pathname, navigate]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const fieldName = name as keyof SignUpFormData;

    setFormData((prev) => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    // Validate inputs
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (!emailPattern.test(formData.email.trim())) {
      setError('Please enter a valid email address (example: name@example.com)');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError('');

      const response = await signUp({
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password
      });

      persistAuthSession(response);
      alert('Account created successfully!');
      navigate(getAuthRedirectPath(), { replace: true });
    } catch (submitError: unknown) {
      const message = submitError instanceof Error ? submitError.message : 'Sign up failed';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      setIsSubmitting(true);
      setError('');

      const googleToken = await getGoogleIdToken(import.meta.env.VITE_GOOGLE_CLIENT_ID);
      const response = await signUpWithGoogle(googleToken);

      persistAuthSession(response);
      alert('Account created with Google successfully!');
      navigate(getAuthRedirectPath(), { replace: true });
    } catch (googleError: unknown) {
      const message = googleError instanceof Error ? googleError.message : 'Google sign up failed';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearSession = () => {
    logout();
    window.location.reload();
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <button 
          className="back-button" 
          onClick={() => navigate('/')}
        >
          ← Back
        </button>
        
        <div className="signup-content">
          <div className="signup-header">
            <div className="signup-icon">
              <img src="/beer-cheers.png" alt="BEERanking" className="beer-image" />
            </div>
            <h1 className="signup-title">Join BEERanking</h1>
            <p className="signup-subtitle">Start discovering and ranking amazing beers</p>
          </div>

          <form className="signup-form" onSubmit={handleSubmit} noValidate>
            {error && <div className="error-message">{error}</div>}
            
            <div className="form-group">
              <label htmlFor="username" className="form-label">Username</label>
              <input 
                id="username"
                name="username"
                type="text" 
                placeholder="Choose a username" 
                className="form-input"
                value={formData.username}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">Email</label>
              <input 
                id="email"
                name="email"
                type="email" 
                placeholder="Enter your email" 
                className="form-input"
                value={formData.email}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <input 
                id="password"
                name="password"
                type="password" 
                placeholder="Create a password (min. 6 characters)" 
                className="form-input"
                value={formData.password}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
              <input 
                id="confirmPassword"
                name="confirmPassword"
                type="password" 
                placeholder="Confirm your password" 
                className="form-input"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>
            
            <button type="submit" className="btn btn-signup" disabled={isSubmitting}>
              {isSubmitting ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="divider">
            <span>or sign up with</span>
          </div>

          <button 
            type="button" 
            className="btn btn-google"
            onClick={handleGoogleSignUp}
            disabled={isSubmitting}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
              <g fill="none" fillRule="evenodd">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                <path d="M9.003 18c2.43 0 4.467-.806 5.956-2.18L12.05 13.56c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332C2.438 15.983 5.482 18 9.003 18z" fill="#34A853"/>
                <path d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.96H.957C.347 6.175 0 7.55 0 9.002c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.426 0 9.003 0 5.482 0 2.438 2.017.96 4.958L3.967 7.29c.708-2.127 2.692-3.71 5.036-3.71z" fill="#EA4335"/>
              </g>
            </svg>
            Google
          </button>

          <div className="signup-footer">
            <p>Already have an account? <a href="/">Sign in</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignUp;
