import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import '../styles/SpotManager.css';

const SpotManager = ({ tripId, onClose }) => {
  const { token } = useAuth();
  const [spots, setSpots] = useState([]);
  const [tripDays, setTripDays] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, [tripId]);

  const fetchData = async () => {
    try {
      await Promise.all([
        fetchSpots(),
        fetchTripDays()
      ]);
    } catch (error) {
      console.error('Fetch data error:', error);
      setError('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const fetchSpots = async () => {
    try {
      const response = await fetch(`http://localhost:3002/api/trip-spots/trip/${tripId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSpots(data);
      }
    } catch (error) {
      console.error('Fetch spots error:', error);
    }
  };

  const fetchTripDays = async () => {
    try {
      const response = await fetch(`http://localhost:3002/api/trips/${tripId}/days`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTripDays(data);
        if (data.length > 0) {
          setSelectedDay(data[0].day_number);
        }
      }
    } catch (error) {
      console.error('Fetch trip days error:', error);
    }
  };

  const getSpotsByDay = (dayNumber) => {
    return spots.filter(spot => spot.day_number === dayNumber)
                .sort((a, b) => a.order_index - b.order_index);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    });
  };

  const getCategoryIcon = (category) => {
    const icons = {
      restaurant: '🍽️',
      attraction: '🏛️',
      hotel: '🏨',
      shopping: '🛍️',
      nature: '🌿',
      culture: '🎭',
      other: '📍'
    };
    return icons[category] || icons.other;
  };

  const handleSpotVisit = async (spotId, visited) => {
    try {
      const response = await fetch(`http://localhost:3002/api/trip-spots/${spotId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ visited })
      });

      if (response.ok) {
        fetchSpots();
      }
    } catch (error) {
      console.error('Update spot visit error:', error);
    }
  };

  if (loading) {
    return (
      <div className="spot-manager-overlay">
        <div className="spot-manager-content">
          <div className="loading">スポット情報を読み込み中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="spot-manager-overlay">
      <div className="spot-manager-content">
        <div className="spot-manager-header">
          <h2>📍 スポット管理</h2>
          <div className="header-actions">
            <button 
              className="add-spot-btn"
              onClick={() => setShowAddForm(true)}
            >
              + スポット追加
            </button>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="day-tabs">
          {tripDays.map(day => (
            <button
              key={day.day_number}
              className={`day-tab ${selectedDay === day.day_number ? 'active' : ''}`}
              onClick={() => setSelectedDay(day.day_number)}
            >
              <div className="day-number">Day {day.day_number}</div>
              <div className="day-date">{formatDate(day.date)}</div>
              <div className="day-count">{getSpotsByDay(day.day_number).length}件</div>
            </button>
          ))}
        </div>

        <div className="spots-container">
          {selectedDay && (
            <div className="spots-list">
              <h3>Day {selectedDay} のスポット</h3>
              
              {getSpotsByDay(selectedDay).length === 0 ? (
                <div className="empty-spots">
                  <p>まだスポットが追加されていません</p>
                  <button 
                    className="add-first-spot-btn"
                    onClick={() => setShowAddForm(true)}
                  >
                    最初のスポットを追加
                  </button>
                </div>
              ) : (
                getSpotsByDay(selectedDay).map((spot, index) => (
                  <div key={spot.id} className="spot-item">
                    <div className="spot-order">{index + 1}</div>
                    
                    <div className="spot-content">
                      <div className="spot-header">
                        <div className="spot-info">
                          <span className="spot-category">{getCategoryIcon(spot.category)}</span>
                          <h4 className="spot-name">{spot.name}</h4>
                          <div className="spot-badges">
                            {spot.visit_status === 'visited' && (
                              <span className="badge visited">訪問済み</span>
                            )}
                            {spot.visit_status === 'skipped' && (
                              <span className="badge skipped">スキップ</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="spot-actions">
                          <button 
                            className={`visit-btn ${spot.visit_status === 'visited' ? 'visited' : ''}`}
                            onClick={() => handleSpotVisit(spot.id, spot.visit_status !== 'visited')}
                          >
                            {spot.visit_status === 'visited' ? '✅' : '◯'}
                          </button>
                        </div>
                      </div>

                      {spot.description && (
                        <p className="spot-description">{spot.description}</p>
                      )}

                      {spot.address && (
                        <div className="spot-address">
                          📍 {spot.address}
                        </div>
                      )}

                      <div className="spot-details">
                        {spot.planned_duration && (
                          <div className="detail-item">
                            <span className="detail-label">滞在予定時間</span>
                            <span className="detail-value">{spot.planned_duration}時間</span>
                          </div>
                        )}
                        
                        {spot.estimated_cost && (
                          <div className="detail-item">
                            <span className="detail-label">予算</span>
                            <span className="detail-value">¥{spot.estimated_cost.toLocaleString()}</span>
                          </div>
                        )}
                      </div>

                      {spot.notes && (
                        <div className="spot-notes">
                          <strong>メモ:</strong> {spot.notes}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {showAddForm && (
          <AddSpotForm
            tripId={tripId}
            dayNumber={selectedDay}
            onClose={() => setShowAddForm(false)}
            onSuccess={() => {
              setShowAddForm(false);
              fetchSpots();
            }}
          />
        )}
      </div>
    </div>
  );
};

// スポット追加フォーム
const AddSpotForm = ({ tripId, dayNumber, onClose, onSuccess }) => {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    category: 'attraction',
    description: '',
    address: '',
    planned_duration: '',
    estimated_cost: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3002/api/trip-spots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          trip_id: tripId,
          day_number: dayNumber,
          planned_duration: formData.planned_duration ? parseInt(formData.planned_duration) : null,
          estimated_cost: formData.estimated_cost ? parseFloat(formData.estimated_cost) : null
        })
      });

      if (response.ok) {
        onSuccess();
      } else {
        const data = await response.json();
        setError(data.error || 'スポットの追加に失敗しました');
      }
    } catch (error) {
      console.error('Add spot error:', error);
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
    <div className="add-form-overlay">
      <div className="add-form-content">
        <div className="add-form-header">
          <h3>新しいスポット追加 - Day {dayNumber}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="add-spot-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="name">スポット名 *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="例：東京タワー"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">カテゴリ *</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="attraction">観光地</option>
              <option value="restaurant">レストラン</option>
              <option value="hotel">宿泊施設</option>
              <option value="shopping">ショッピング</option>
              <option value="nature">自然・公園</option>
              <option value="culture">文化・博物館</option>
              <option value="other">その他</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="address">住所</label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="例：東京都港区芝公園4-2-8"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="planned_duration">滞在予定時間（時間）</label>
              <input
                type="number"
                id="planned_duration"
                name="planned_duration"
                value={formData.planned_duration}
                onChange={handleChange}
                placeholder="例：2"
                min="0"
              />
            </div>
            <div className="form-group">
              <label htmlFor="estimated_cost">予算</label>
              <input
                type="number"
                id="estimated_cost"
                name="estimated_cost"
                value={formData.estimated_cost}
                onChange={handleChange}
                placeholder="例：1500"
                min="0"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">説明</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="このスポットについて..."
              rows="3"
            />
          </div>

          <div className="form-group">
            <label htmlFor="notes">メモ</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="注意事項や特記事項など..."
              rows="2"
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              キャンセル
            </button>
            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? '追加中...' : 'スポット追加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SpotManager;
