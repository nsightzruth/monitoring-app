import { useState } from 'react';
import { authService } from '../../services/supabase';
import { useForm } from '../../hooks/useForm';
import { createValidator, isEmpty, isValidEmail } from '../../utils/validation';
import Form, { FormGroup, FormActions, FormMessage } from '../common/Form';
import FormField from '../common/FormField';
import Button from '../common/Button';
import '../../styles/components/Form.css';
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
          <FormField
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
          />
        </FormGroup>
        
        <FormGroup>
          <FormField
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