import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import '../styles/MemoryManager.css';

const MemoryManager = ({ tripId, onClose }) => {
  const { token } = useAuth();
  const [memories, setMemories] = useState([]);
  const [selectedMemory, setSelectedMemory] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMemories();
  }, [tripId]);

  const fetchMemories = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/memories/trip/${tripId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMemories(data);
      } else {
        setError('思い出の取得に失敗しました');
      }
    } catch (error) {
      console.error('Fetch memories error:', error);
      setError('ネットワークエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredMemories = () => {
    if (filterType === 'all') return memories;
    return memories.filter(memory => {
      if (filterType === 'photos') return memory.media_type === 'image';
      if (filterType === 'videos') return memory.media_type === 'video';
      if (filterType === 'text') return !memory.media_file;
      return true;
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    });
  };

  const getEmotionEmoji = (emotion) => {
    const emotions = {
      happy: '😊',
      excited: '🤩',
      peaceful: '😌',
      surprised: '😲',
      grateful: '🙏',
      nostalgic: '😌',
      adventurous: '🚀'
    };
    return emotions[emotion] || '😊';
  };

  const getWeatherEmoji = (weather) => {
    const weathers = {
      sunny: '☀️',
      cloudy: '☁️',
      rainy: '🌧️',
      snowy: '❄️',
      windy: '💨'
    };
    return weathers[weather] || '☀️';
  };

  if (loading) {
    return (
      <div className="memory-manager-overlay">
        <div className="memory-manager-content">
          <div className="loading">思い出を読み込み中...</div>
        </div>
      </div>
    );
  }

  if (selectedMemory) {
    return (
      <MemoryDetail 
        memory={selectedMemory}
        onBack={() => setSelectedMemory(null)}
        onClose={onClose}
      />
    );
  }

  return (
    <div className="memory-manager-overlay">
      <div className="memory-manager-content">
        <div className="memory-manager-header">
          <h2>📸 思い出アルバム</h2>
          <div className="header-actions">
            <button 
              className="add-memory-btn"
              onClick={() => setShowAddForm(true)}
            >
              + 思い出追加
            </button>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* フィルター */}
        <div className="memory-filters">
          <div className="filter-tabs">
            <button 
              className={`filter-tab ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => setFilterType('all')}
            >
              すべて ({memories.length})
            </button>
            <button 
              className={`filter-tab ${filterType === 'photos' ? 'active' : ''}`}
              onClick={() => setFilterType('photos')}
            >
              📷 写真 ({memories.filter(m => m.media_type === 'image').length})
            </button>
            <button 
              className={`filter-tab ${filterType === 'videos' ? 'active' : ''}`}
              onClick={() => setFilterType('videos')}
            >
              🎥 動画 ({memories.filter(m => m.media_type === 'video').length})
            </button>
            <button 
              className={`filter-tab ${filterType === 'text' ? 'active' : ''}`}
              onClick={() => setFilterType('text')}
            >
              📝 日記 ({memories.filter(m => !m.media_file).length})
            </button>
          </div>
        </div>

        {/* 思い出グリッド */}
        <div className="memories-container">
          {getFilteredMemories().length === 0 ? (
            <div className="empty-memories">
              <div className="empty-icon">📸</div>
              <h3>まだ思い出がありません</h3>
              <p>素敵な瞬間を記録して、旅の思い出を残しましょう！</p>
              <button 
                className="add-first-memory-btn"
                onClick={() => setShowAddForm(true)}
              >
                最初の思い出を追加
              </button>
            </div>
          ) : (
            <div className="memories-grid">
              {getFilteredMemories()
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .map(memory => (
                  <div 
                    key={memory.id} 
                    className="memory-card"
                    onClick={() => setSelectedMemory(memory)}
                  >
                    {memory.media_file && (
                      <div className="memory-media">
                        {memory.media_type === 'image' ? (
                          <img 
                            src={`http://localhost:3001${memory.media_file}`} 
                            alt={memory.title}
                            className="memory-image"
                          />
                        ) : (
                          <video 
                            src={`http://localhost:3001${memory.media_file}`}
                            className="memory-video"
                            poster={memory.thumbnail}
                          />
                        )}
                        <div className="media-overlay">
                          {memory.media_type === 'video' && (
                            <div className="play-icon">▶️</div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="memory-content">
                      <h4 className="memory-title">{memory.title}</h4>
                      
                      <div className="memory-meta">
                        <span className="memory-date">
                          📅 {formatDate(memory.date)}
                        </span>
                        
                        {memory.emotion && (
                          <span className="memory-emotion">
                            {getEmotionEmoji(memory.emotion)}
                          </span>
                        )}
                        
                        {memory.weather && (
                          <span className="memory-weather">
                            {getWeatherEmoji(memory.weather)}
                          </span>
                        )}
                      </div>

                      {memory.content && (
                        <p className="memory-preview">
                          {memory.content.length > 100 
                            ? `${memory.content.substring(0, 100)}...`
                            : memory.content
                          }
                        </p>
                      )}

                      {memory.spot_name && (
                        <div className="memory-location">
                          📍 {memory.spot_name}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              }
            </div>
          )}
        </div>

        {showAddForm && (
          <AddMemoryForm
            tripId={tripId}
            onClose={() => setShowAddForm(false)}
            onSuccess={() => {
              setShowAddForm(false);
              fetchMemories();
            }}
          />
        )}
      </div>
    </div>
  );
};

// 思い出詳細表示
const MemoryDetail = ({ memory, onBack, onClose }) => {
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEmotionLabel = (emotion) => {
    const labels = {
      happy: '嬉しい',
      excited: 'ワクワク',
      peaceful: '穏やか',
      surprised: '驚き',
      grateful: '感謝',
      nostalgic: '懐かしい',
      adventurous: '冒険的'
    };
    return labels[emotion] || emotion;
  };

  const getWeatherLabel = (weather) => {
    const labels = {
      sunny: '晴れ',
      cloudy: '曇り',
      rainy: '雨',
      snowy: '雪',
      windy: '風強い'
    };
    return labels[weather] || weather;
  };

  return (
    <div className="memory-detail-overlay">
      <div className="memory-detail-content">
        <div className="memory-detail-header">
          <button onClick={onBack} className="back-btn">← 戻る</button>
          <h2>{memory.title}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="memory-detail-body">
          {memory.media_file && (
            <div className="memory-media-large">
              {memory.media_type === 'image' ? (
                <img 
                  src={`http://localhost:3001${memory.media_file}`} 
                  alt={memory.title}
                  className="memory-image-large"
                />
              ) : (
                <video 
                  src={`http://localhost:3001${memory.media_file}`}
                  className="memory-video-large"
                  controls
                  poster={memory.thumbnail}
                />
              )}
            </div>
          )}

          <div className="memory-info">
            <div className="memory-meta-detail">
              <div className="meta-item">
                <span className="meta-label">日時:</span>
                <span className="meta-value">{formatDateTime(memory.date)}</span>
              </div>
              
              {memory.emotion && (
                <div className="meta-item">
                  <span className="meta-label">気分:</span>
                  <span className="meta-value">{getEmotionLabel(memory.emotion)}</span>
                </div>
              )}
              
              {memory.weather && (
                <div className="meta-item">
                  <span className="meta-label">天気:</span>
                  <span className="meta-value">{getWeatherLabel(memory.weather)}</span>
                </div>
              )}
              
              {memory.spot_name && (
                <div className="meta-item">
                  <span className="meta-label">場所:</span>
                  <span className="meta-value">{memory.spot_name}</span>
                </div>
              )}
            </div>

            {memory.content && (
              <div className="memory-content-detail">
                <h3>思い出の記録</h3>
                <p>{memory.content}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// 思い出追加フォーム
const AddMemoryForm = ({ tripId, onClose, onSuccess }) => {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    date: new Date().toISOString().split('T')[0],
    emotion: '',
    weather: '',
    spot_id: ''
  });
  const [mediaFile, setMediaFile] = useState(null);
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSpots();
  }, []);

  const fetchSpots = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/trip-spots/trip/${tripId}`, {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          formDataToSend.append(key, formData[key]);
        }
      });
      
      formDataToSend.append('trip_id', tripId);
      
      if (mediaFile) {
        formDataToSend.append('media_file', mediaFile);
      }

      const response = await fetch('http://localhost:3001/api/memories', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      if (response.ok) {
        onSuccess();
      } else {
        const data = await response.json();
        setError(data.error || '思い出の追加に失敗しました');
      }
    } catch (error) {
      console.error('Add memory error:', error);
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
          <h3>新しい思い出を追加</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="add-memory-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="title">タイトル *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="例：美しい夕日、おいしいランチ"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="date">日付 *</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="emotion">気分</label>
              <select
                id="emotion"
                name="emotion"
                value={formData.emotion}
                onChange={handleChange}
              >
                <option value="">選択してください</option>
                <option value="happy">😊 嬉しい</option>
                <option value="excited">🤩 ワクワク</option>
                <option value="peaceful">😌 穏やか</option>
                <option value="surprised">😲 驚き</option>
                <option value="grateful">🙏 感謝</option>
                <option value="nostalgic">😌 懐かしい</option>
                <option value="adventurous">🚀 冒険的</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="weather">天気</label>
              <select
                id="weather"
                name="weather"
                value={formData.weather}
                onChange={handleChange}
              >
                <option value="">選択してください</option>
                <option value="sunny">☀️ 晴れ</option>
                <option value="cloudy">☁️ 曇り</option>
                <option value="rainy">🌧️ 雨</option>
                <option value="snowy">❄️ 雪</option>
                <option value="windy">💨 風強い</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="spot_id">関連スポット</label>
            <select
              id="spot_id"
              name="spot_id"
              value={formData.spot_id}
              onChange={handleChange}
            >
              <option value="">スポットを選択</option>
              {spots.map(spot => (
                <option key={spot.id} value={spot.id}>
                  {spot.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="content">思い出の内容</label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="この瞬間の思い出を詳しく書いてみましょう..."
              rows="4"
            />
          </div>

          <div className="form-group">
            <label htmlFor="media_file">写真・動画</label>
            <input
              type="file"
              id="media_file"
              accept="image/*,video/*"
              onChange={(e) => setMediaFile(e.target.files[0])}
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              キャンセル
            </button>
            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? '追加中...' : '思い出を追加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MemoryManager;
