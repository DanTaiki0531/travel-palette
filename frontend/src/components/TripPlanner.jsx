import { useState } from 'react';

const TripPlanner = () => {
  const [destinations, setDestinations] = useState([]);
  const [newDestination, setNewDestination] = useState({
    name: '',
    description: '',
    category: 'attraction'
  });

  const handleAddDestination = () => {
    if (newDestination.name.trim()) {
      const destination = {
        id: Date.now().toString(),
        name: newDestination.name,
        description: newDestination.description,
        latitude: 35.6762 + (Math.random() - 0.5) * 0.1, // 東京周辺のランダム座標
        longitude: 139.6503 + (Math.random() - 0.5) * 0.1,
        category: newDestination.category,
        reactions: []
      };
      
      setDestinations([...destinations, destination]);
      setNewDestination({ name: '', description: '', category: 'attraction' });
    }
  };

  const addReaction = (destId, reaction) => {
    setDestinations(destinations.map(dest => 
      dest.id === destId 
        ? { ...dest, reactions: [...dest.reactions, reaction] }
        : dest
    ));
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
    <div className="trip-planner">
      <div className="card">
        <h2>🌟 新しいスポットを追加</h2>
        
        <div className="form-group">
          <label className="form-label">スポット名</label>
          <input
            type="text"
            className="form-input"
            value={newDestination.name}
            onChange={(e) => setNewDestination({...newDestination, name: e.target.value})}
            placeholder="例: 東京タワー"
          />
        </div>

        <div className="form-group">
          <label className="form-label">説明・コメント</label>
          <input
            type="text"
            className="form-input"
            value={newDestination.description}
            onChange={(e) => setNewDestination({...newDestination, description: e.target.value})}
            placeholder="なぜここに行きたいか、どんなところか..."
          />
        </div>

        <div className="form-group">
          <label className="form-label">カテゴリ</label>
          <select
            className="form-input"
            value={newDestination.category}
            onChange={(e) => setNewDestination({...newDestination, category: e.target.value})}
          >
            <option value="attraction">観光スポット</option>
            <option value="restaurant">レストラン・グルメ</option>
            <option value="hotel">宿泊施設</option>
            <option value="other">その他</option>
          </select>
        </div>

        <button className="btn btn-primary" onClick={handleAddDestination}>
          スポットを追加 ✨
        </button>
      </div>

      <div className="destinations-list">
        <h2>🗺️ 追加されたスポット ({destinations.length}件)</h2>
        
        {destinations.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', color: '#999' }}>
            まだスポットが追加されていません。<br />
            上のフォームから気になるスポットを追加してみましょう！
          </div>
        ) : (
          destinations.map(dest => (
            <div key={dest.id} className="card destination-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ color: 'var(--primary-brown)', marginBottom: '0.5rem' }}>
                    {getCategoryIcon(dest.category)} {dest.name}
                  </h3>
                  <p style={{ color: 'var(--text-light)', marginBottom: '1rem' }}>
                    {dest.description}
                  </p>
                  
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                    {['👍', '❤️', '🔥', '✨'].map(emoji => (
                      <button
                        key={emoji}
                        className="btn btn-secondary"
                        style={{ fontSize: '1.2rem', padding: '0.5rem' }}
                        onClick={() => addReaction(dest.id, emoji)}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  
                  {dest.reactions.length > 0 && (
                    <div style={{ fontSize: '1.5rem' }}>
                      {dest.reactions.join(' ')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TripPlanner;
