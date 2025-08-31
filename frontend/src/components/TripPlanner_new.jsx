import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import '../styles/TripPlanner.css';
import TripDetail from './TripDetail';

const TripPlanner = () => {
  const { token } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      // tokenが存在しない場合はログインページにリダイレクト
      if (!token) {
        setError('ログインが必要です');
        setLoading(false);
        return;
      }

      console.log('Fetching trips with token:', token);
      const response = await fetch('http://localhost:3002/api/trips', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Trips data:', data);
        setTrips(data);
        setError('');
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('API error:', response.status, errorData);
        setError(`旅行プランの取得に失敗しました (${response.status}): ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Fetch trips error:', error);
      setError(`ネットワークエラーが発生しました: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTripClick = (trip) => {
    setSelectedTrip(trip);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      planning: { label: '計画中', class: 'planning' },
      ongoing: { label: '旅行中', class: 'ongoing' },
      completed: { label: '完了', class: 'completed' },
      cancelled: { label: 'キャンセル', class: 'cancelled' }
    };
    
    const statusInfo = statusMap[status] || statusMap.planning;
    return (
      <span className={`status-badge ${statusInfo.class}`}>
        {statusInfo.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateDuration = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return `${diffDays}日間`;
  };

  if (loading) {
    return (
      <div className="trip-planner-container">
        <div className="loading">旅行プランを読み込み中...</div>
      </div>
    );
  }

  if (selectedTrip) {
    return <TripDetail trip={selectedTrip} onBack={() => setSelectedTrip(null)} />;
  }

  return (
    <div className="trip-planner-container">
      <div className="trip-planner-header">
        <h2>旅のしおり</h2>
        <button 
          className="create-trip-btn"
          onClick={() => setShowCreateForm(true)}
        >
          ＋ 新しい旅行を計画
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showCreateForm && (
        <CreateTripForm 
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            fetchTrips();
          }}
        />
      )}

      <div className="trips-grid">
        {trips.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✈️</div>
            <h3>まだ旅行プランがありません</h3>
            <p>新しい旅行を計画して、素敵な思い出を作りましょう！</p>
            <button 
              className="create-first-trip-btn"
              onClick={() => setShowCreateForm(true)}
            >
              最初の旅行を計画する
            </button>
          </div>
        ) : (
          trips.map(trip => (
            <div 
              key={trip.id} 
              className="trip-card"
              onClick={() => handleTripClick(trip)}
            >
              <div className="trip-content">
                <div className="trip-header">
                  <h3 className="trip-title">{trip.title}</h3>
                  {getStatusBadge(trip.status)}
                </div>
                
                <div className="trip-destination">
                  <span className="icon">📍</span>
                  {trip.destination}
                </div>
                
                <div className="trip-dates">
                  <span className="icon">📅</span>
                  <span className="date-text">
                    {formatDate(trip.start_date)}〜{formatDate(trip.end_date)} ({calculateDuration(trip.start_date, trip.end_date)})
                  </span>
                </div>

                <div className="trip-budget">
                  <span className="icon">💰</span>
                  予算: {trip.budget ? `¥${Number(trip.budget).toLocaleString()}` : '未設定'}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// 旅行作成フォームコンポーネント
const CreateTripForm = ({ onClose, onSuccess }) => {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    destination: '',
    start_date: '',
    end_date: '',
    budget: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3002/api/trips', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        onSuccess();
      } else {
        const data = await response.json();
        setError(data.error || '旅行プランの作成に失敗しました');
      }
    } catch (error) {
      console.error('Create trip error:', error);
      setError('ネットワークエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>新しい旅行プラン</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="create-trip-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="title">旅行タイトル *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="例：春の京都旅行"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="destination">目的地 *</label>
            <input
              type="text"
              id="destination"
              name="destination"
              value={formData.destination}
              onChange={handleChange}
              placeholder="例：京都府京都市"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="start_date">開始日 *</label>
              <input
                type="date"
                id="start_date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="end_date">終了日 *</label>
              <input
                type="date"
                id="end_date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                min={formData.start_date}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="budget">予算 *</label>
            <input
              type="number"
              id="budget"
              name="budget"
              value={formData.budget}
              onChange={handleChange}
              placeholder="例：50000"
              min="0"
              required
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              キャンセル
            </button>
            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? '作成中...' : '作成する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TripPlanner;
