import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Alert, Button, Card, Form } from 'react-bootstrap';
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
    <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center app-auth-page px-3 py-4">
      <Card className="shadow-lg border-0" style={{ maxWidth: '500px', width: '100%' }}>
        <Card.Body className="p-4">
          <Button
            variant="link"
            className="text-decoration-none p-0 mb-3"
            onClick={() => navigate('/')}
          >
            ← Back
          </Button>
          
          <div className="text-center mb-4">
            <h1 className="h2 fw-bold">Join BEERanking</h1>
            <p className="text-muted">Start discovering and ranking amazing beers</p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {error ? <Alert variant="danger">{error}</Alert> : null}
            
            <div className="mb-3">
              <Form.Label htmlFor="username">Username</Form.Label>
              <Form.Control
                id="username"
                name="username"
                type="text" 
                placeholder="Choose a username" 
                value={formData.username}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>

            <div className="mb-3">
              <Form.Label htmlFor="email">Email</Form.Label>
              <Form.Control
                id="email"
                name="email"
                type="email" 
                placeholder="Enter your email" 
                value={formData.email}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>

            <div className="mb-3">
              <Form.Label htmlFor="password">Password</Form.Label>
              <Form.Control
                id="password"
                name="password"
                type="password" 
                placeholder="Create a password (min. 6 characters)" 
                value={formData.password}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>

            <div className="mb-3">
              <Form.Label htmlFor="confirmPassword">Confirm Password</Form.Label>
              <Form.Control
                id="confirmPassword"
                name="confirmPassword"
                type="password" 
                placeholder="Confirm your password" 
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>
            
            <Button type="submit" variant="warning" className="w-100 mb-3 text-white fw-semibold border-0" disabled={isSubmitting}>
              {isSubmitting ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <div className="text-center my-3">
            <span className="text-muted">or sign up with</span>
          </div>

          <Button
            type="button" 
            variant="outline-secondary"
            className="w-100 d-flex align-items-center justify-content-center gap-2 mb-3"
            onClick={handleGoogleSignUp}
            disabled={isSubmitting}
          >
            <img src={GoogleLogo} alt="Google" width="18" height="18" />
            Google
          </Button>

          <div className="text-center">
            <p className="text-muted mb-0">Already have an account? <a href="/" className="text-decoration-none">Sign in</a></p>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}

export default SignUp;
