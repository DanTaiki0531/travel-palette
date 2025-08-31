import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import '../styles/TripDetail.css';
import Itinerary from './Itinerary';
import SpotManager from './SpotManager';

const TripDetail = ({ trip, onBack }) => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [tripData, setTripData] = useState(trip);
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTripDetails();
  }, [trip.id]);

  const fetchTripDetails = async () => {
    setLoading(true);
    try {
      await fetchSpots();
    } catch (error) {
      console.error('Fetch trip details error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSpots = async () => {
    try {
      const response = await fetch(`http://localhost:3002/api/trip-spots/trip/${trip.id}`, {
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateDuration = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const tabs = [
    { id: 'overview', label: '概要', icon: '📋' },
    { id: 'itinerary', label: '旅行しおり', icon: '📖' },
    { id: 'spots', label: 'スポット', icon: '📍' }
  ];

  return (
    <div className="trip-detail-container">
      <div className="trip-detail-header">
        <button onClick={onBack} className="back-btn">← 戻る</button>
        <div className="trip-title-section">
          <h1>{tripData.title}</h1>
          <div className="trip-subtitle">
            <span className="destination">📍 {tripData.destination}</span>
            <span className="dates">📅 {formatDate(tripData.start_date)} 〜 {formatDate(tripData.end_date)}</span>
          </div>
        </div>
      </div>

      {tripData.cover_image && (
        <div className="trip-hero-image">
          <img src={`http://localhost:3002${tripData.cover_image}`} alt={tripData.title} />
        </div>
      )}

      <div className="trip-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="trip-content">
        {loading && <div className="loading">読み込み中...</div>}

        {activeTab === 'overview' && (
          <OverviewTab trip={tripData} spots={spots} />
        )}

        {activeTab === 'itinerary' && (
          <Itinerary tripId={trip.id} tripData={tripData} />
        )}

        {activeTab === 'spots' && (
          <SpotsTab tripId={trip.id} spots={spots} onUpdate={fetchSpots} />
        )}
      </div>
    </div>
  );
};

// 概要タブ
const OverviewTab = ({ trip, spots }) => {
  const calculateDuration = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  return (
    <div className="overview-tab">
      <div className="overview-grid">
        <div className="overview-card">
          <h3>📊 旅行統計</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-number">{calculateDuration(trip.start_date, trip.end_date)}</span>
              <span className="stat-label">日間</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{spots.length}</span>
              <span className="stat-label">スポット</span>
            </div>
          </div>
        </div>

        {trip.description && (
          <div className="overview-card description-card">
            <h3>📝 旅行について</h3>
            <p>{trip.description}</p>
          </div>
        )}

        <div className="overview-card">
          <h3>📅 最近の活動</h3>
          <div className="activity-list">
            {/* 最新の活動を表示する実装は今後予定 */}
            <p className="no-activity">活動履歴は今後実装予定</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// スポットタブ
const SpotsTab = ({ tripId, spots, onUpdate }) => {
  const [showSpotManager, setShowSpotManager] = useState(false);

  return (
    <div className="spots-tab">
      <div className="tab-header">
        <h3>📍 訪問スポット</h3>
        <button 
          className="add-btn"
          onClick={() => setShowSpotManager(true)}
        >
          スポット管理
        </button>
      </div>
      
      {spots.length === 0 ? (
        <div className="empty-state">
          <p>まだスポットが追加されていません</p>
          <button 
            className="add-first-spot-btn"
            onClick={() => setShowSpotManager(true)}
          >
            最初のスポットを追加
          </button>
        </div>
      ) : (
        <div className="spots-list">
          {spots.map(spot => (
            <div key={spot.id} className="spot-card">
              <div className="spot-header">
                <h4>{spot.name}</h4>
                {spot.visit_status === 'visited' && (
                  <span className="status-badge visited">訪問済み</span>
                )}
              </div>
              {spot.description && <p>{spot.description}</p>}
              {spot.address && (
                <div className="spot-address">📍 {spot.address}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {showSpotManager && (
        <SpotManager
          tripId={tripId}
          onClose={() => setShowSpotManager(false)}
        />
      )}
    </div>
  );
};

// 支出タブ（今後実装予定）
// const ExpensesTab = ({ tripId, expenses, onUpdate, budget }) => { ... };

// 思い出タブ（今後実装予定）  
// const MemoriesTab = ({ tripId, memories, onUpdate }) => { ... };

export default TripDetail;
