import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Auth.css';

const Register = ({ onSwitchToLogin }) => {
  const { register, checkUsernameAvailability } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState('');
  const [checkingUsername, setCheckingUsername] = useState(false);

  // ユーザー名の可用性をチェック
  useEffect(() => {
    const checkUsername = async () => {
      if (formData.username.length >= 3) {
        setCheckingUsername(true);
        try {
          const available = await checkUsernameAvailability(formData.username);
          if (available) {
            setUsernameStatus('利用可能');
          } else {
            setUsernameStatus('このユーザー名は既に使用されています');
          }
        } catch (error) {
          // サーバーに接続できない場合は警告表示
          setUsernameStatus('サーバーに接続できません。後で再試行してください。');
        }
        setCheckingUsername(false);
      } else {
        setUsernameStatus('');
      }
    };

    if (formData.username.length >= 3) {
      const timeoutId = setTimeout(checkUsername, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [formData.username, checkUsernameAvailability]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // バリデーション
    if (!formData.username || !formData.password || !formData.confirmPassword) {
      setError('すべてのフィールドを入力してください');
      setLoading(false);
      return;
    }

    if (formData.username.length < 3 || formData.username.length > 20) {
      setError('ユーザー名は3文字以上20文字以下で入力してください');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('パスワードは6文字以上で入力してください');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('パスワードが一致しません');
      setLoading(false);
      return;
    }

    // サーバーに接続できない場合でも登録を許可
    if (usernameStatus !== '利用可能' && usernameStatus !== 'サーバーに接続できません。後で再試行してください。') {
      setError('使用できないユーザー名です');
      setLoading(false);
      return;
    }

    const result = await register(formData.username, formData.password);
    
    if (!result.success) {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>新規登録</h2>
          <p>旅の想い出を記録するアカウントを作成</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="username">ユーザー名</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="3〜20文字のユーザー名"
              required
              autoComplete="username"
            />
            {formData.username.length >= 3 && (
              <div className={`username-status ${
                usernameStatus === '利用可能' ? 'available' : 
                usernameStatus.includes('サーバーに接続できません') ? 'warning' : 
                'unavailable'
              }`}>
                {checkingUsername ? 'チェック中...' : usernameStatus}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">パスワード</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="6文字以上のパスワード"
              required
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">パスワード確認</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="パスワードを再入力"
              required
              autoComplete="new-password"
            />
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? '登録中...' : 'アカウント作成'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            既にアカウントをお持ちの方は{' '}
            <button 
              type="button" 
              className="link-button" 
              onClick={onSwitchToLogin}
            >
              ログイン
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
