import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getAuthRedirectPath, persistAuthSession, signUp, signUpWithGoogle } from '../api/authApi';
import { getGoogleIdToken } from '../api/googleAuth';
import GoogleLogo from '../../../shared/assets/google-logo.svg';

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
      navigate(getAuthRedirectPath(), { replace: true });
    } catch (googleError: unknown) {
      const message = googleError instanceof Error ? googleError.message : 'Google sign up failed';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card shadow-lg" style={{ maxWidth: '500px', width: '100%' }}>
        <div className="card-body p-4">
          <button 
            className="btn btn-link text-decoration-none p-0 mb-3" 
            onClick={() => navigate('/')}
          >
            ← Back
          </button>
          
          <div className="text-center mb-4">
            <h1 className="h2 fw-bold">Join BEERanking</h1>
            <p className="text-muted">Start discovering and ranking amazing beers</p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {error && <div className="alert alert-danger" role="alert">{error}</div>}
            
            <div className="mb-3">
              <label htmlFor="username" className="form-label">Username</label>
              <input 
                id="username"
                name="username"
                type="text" 
                placeholder="Choose a username" 
                className="form-control"
                value={formData.username}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>

            <div className="mb-3">
              <label htmlFor="email" className="form-label">Email</label>
              <input 
                id="email"
                name="email"
                type="email" 
                placeholder="Enter your email" 
                className="form-control"
                value={formData.email}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>

            <div className="mb-3">
              <label htmlFor="password" className="form-label">Password</label>
              <input 
                id="password"
                name="password"
                type="password" 
                placeholder="Create a password (min. 6 characters)" 
                className="form-control"
                value={formData.password}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>

            <div className="mb-3">
              <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
              <input 
                id="confirmPassword"
                name="confirmPassword"
                type="password" 
                placeholder="Confirm your password" 
                className="form-control"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>
            
            <button type="submit" className="btn btn-primary w-100 mb-3" disabled={isSubmitting}>
              {isSubmitting ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="text-center my-3">
            <span className="text-muted">or sign up with</span>
          </div>

          <button 
            type="button" 
            className="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-2 mb-3"
            onClick={handleGoogleSignUp}
            disabled={isSubmitting}
          >
            <img src={GoogleLogo} alt="Google" width="18" height="18" />
            Google
          </button>

          <div className="text-center">
            <p className="text-muted mb-0">Already have an account? <a href="/" className="text-decoration-none">Sign in</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignUp;
