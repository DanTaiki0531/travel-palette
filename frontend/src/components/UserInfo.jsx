import { useAuth } from '../contexts/AuthContext';
import '../styles/Auth.css';

const UserInfo = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const getInitials = (username) => {
    return username.charAt(0).toUpperCase();
  };

  return (
    <div className="user-info">
      <div className="user-avatar">
        {getInitials(user.username)}
      </div>
      <div className="user-details">
        <p className="user-name">{user.username}</p>
      </div>
      <button onClick={logout} className="logout-button">
        ログアウト
      </button>
    </div>
  );
};

export default UserInfo;
