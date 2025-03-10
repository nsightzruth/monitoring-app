import { useState } from 'react';
import { authService } from '../../services/supabase';
import { useForm } from '../../hooks/useForm';
import { createValidator, isEmpty, isValidEmail } from '../../utils/validation';
import Form, { FormGroup, FormActions, FormMessage } from '../common/Form';
import Input from '../common/Input';
import Button from '../common/Button';
import '../../styles/components/Auth.css';

// Create a validator for login form
const loginValidator = createValidator({
  email: [
    { test: isEmpty, message: 'Email is required' },
    { test: isValidEmail, message: 'Please enter a valid email address' }
  ],
  password: [
    { test: isEmpty, message: 'Password is required' }
  ]
});

const Auth = ({ onLogin }) => {
  const [serverError, setServerError] = useState(null);
  
  // Use our form hook
  const { 
    values, 
    errors, 
    touched,
    isSubmitting,
    handleChange, 
    handleBlur, 
    handleSubmit 
  } = useForm(
    // Initial values
    { email: '', password: '' },
    // Validation function
    loginValidator,
    // Submit handler
    async (formData) => {
      try {
        setServerError(null);
        const user = await authService.login(formData.email, formData.password);
        if (onLogin) {
          onLogin(user);
        }
      } catch (error) {
        console.error('Error logging in:', error);
        setServerError(error.message);
        throw error; // Re-throw to let the form hook know there was an error
      }
    }
  );

  return (
    <div className="auth-container">
      {serverError && (
        <FormMessage type="error">
          {serverError}
        </FormMessage>
      )}
      
      <Form onSubmit={handleSubmit} className="auth-form">
        <FormGroup>
          <Input
            id="email"
            type="email"
            label="Email"
            value={values.email}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.email && !!errors.email}
            errorMessage={errors.email}
            disabled={isSubmitting}
            required
            placeholder="Enter your email"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
            }
          />
        </FormGroup>
        
        <FormGroup>
          <Input
            id="password"
            type="password"
            label="Password"
            value={values.password}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.password && !!errors.password}
            errorMessage={errors.password}
            disabled={isSubmitting}
            required
            placeholder="Enter your password"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            }
          />
        </FormGroup>
        
        <FormActions>
          <Button 
            type="submit" 
            variant="primary" 
            isLoading={isSubmitting}
            disabled={isSubmitting}
            className="submit-button"
          >
            {isSubmitting ? 'Logging in...' : 'Login'}
          </Button>
        </FormActions>
      </Form>
    </div>
  );
};

export default Auth;