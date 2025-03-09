import Auth from '../components/Auth';
import '../styles/AuthPage.css';

const AuthPage = ({ onLogin }) => {
  return (
    <div className="login-container">
      <section className="auth-section">
        <div className="auth-logo">
          <img src="/nsightz-logo.png" alt="Nsightz Logo" />
        </div>
        <h2>Welcome Back</h2>
        <p>Please log in to continue</p>
        <Auth onLogin={onLogin} />
      </section>
    </div>
  );
};

export default AuthPage;