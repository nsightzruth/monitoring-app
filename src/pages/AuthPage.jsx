import Auth from '../components/Auth';
import '../styles/AuthPage.css';

const AuthPage = ({ onLogin }) => {
  return (
    <section className="auth-section">
      <h2>Login Here</h2>
      <p>Please log in to use the Intervention Monitoring App.</p>
      <Auth onLogin={onLogin} />
    </section>
  );
};

export default AuthPage;