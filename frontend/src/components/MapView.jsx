import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';

// Leafletのデフォルトアイコンの問題を修正
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapView = () => {
  // サンプルの観光スポットデータ
  const sampleSpots = [
    {
      id: '1',
      name: '東京タワー',
      description: '東京のシンボル的存在',
      latitude: 35.6586,
      longitude: 139.7454,
      category: 'attraction',
      reactions: ['👍', '❤️', '🔥']
    },
    {
      id: '2',
      name: '浅草寺',
      description: '歴史ある古いお寺',
      latitude: 35.7148,
      longitude: 139.7967,
      category: 'attraction',
      reactions: ['✨', '👍']
    },
    {
      id: '3',
      name: '築地市場',
      description: '新鮮な海鮮グルメの宝庫',
      latitude: 35.6654,
      longitude: 139.7707,
      category: 'restaurant',
      reactions: ['🍣', '👍', '❤️']
    }
  ];

  const getCategoryColor = (category) => {
    switch (category) {
      case 'restaurant': return '#FF6B6B';
      case 'attraction': return '#4ECDC4';
      case 'hotel': return '#45B7D1';
      default: return '#96CEB4';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'restaurant': return '🍽️';
      case 'attraction': return '🏛️';
      case 'hotel': return '🏨';
      default: return '📍';
    }
  };

  return (
    <div className="map-view">
      <div className="card">
        <h2>🗺️ わくわくマップ</h2>
        <p style={{ color: 'var(--text-light)', marginBottom: '1rem' }}>
          みんなが追加したスポットを地図で確認できます。気になるスポットにリアクションしてみましょう！
        </p>
        
        <div className="map-container">
          <MapContainer
            center={[35.6762, 139.6503]} // 東京の座標
            zoom={12}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            
            {sampleSpots.map(spot => (
              <Marker
                key={spot.id}
                position={[spot.latitude, spot.longitude]}
              >
                <Popup>
                  <div style={{ minWidth: '200px' }}>
                    <h3 style={{ 
                      color: getCategoryColor(spot.category),
                      marginBottom: '0.5rem',
                      fontSize: '1.1rem'
                    }}>
                      {getCategoryIcon(spot.category)} {spot.name}
                    </h3>
                    <p style={{ 
                      marginBottom: '0.5rem',
                      color: '#666'
                    }}>
                      {spot.description}
                    </p>
                    <div style={{ 
                      fontSize: '1.2rem',
                      marginBottom: '0.5rem'
                    }}>
                      {spot.reactions.join(' ')}
                    </div>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      {['👍', '❤️', '🔥', '✨'].map(emoji => (
                        <button
                          key={emoji}
                          style={{
                            border: 'none',
                            background: 'var(--light-brown)',
                            borderRadius: '4px',
                            padding: '0.25rem',
                            cursor: 'pointer',
                            fontSize: '1rem'
                          }}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      <div className="card">
        <h3>📍 スポット一覧</h3>
        <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
          {sampleSpots.map(spot => (
            <div
              key={spot.id}
              style={{
                padding: '1rem',
                border: `2px solid ${getCategoryColor(spot.category)}`,
                borderRadius: '8px',
                backgroundColor: 'var(--warm-white)'
              }}
            >
              <h4 style={{ color: getCategoryColor(spot.category), marginBottom: '0.5rem' }}>
                {getCategoryIcon(spot.category)} {spot.name}
              </h4>
              <p style={{ color: 'var(--text-light)', marginBottom: '0.5rem' }}>
                {spot.description}
              </p>
              <div style={{ fontSize: '1.2rem' }}>
                {spot.reactions.join(' ')}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MapView;
