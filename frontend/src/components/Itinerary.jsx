import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Itinerary = ({ tripId, tripData }) => {
  const { token } = useAuth();
  const [currentDay, setCurrentDay] = useState(1);
  const [itineraryItems, setItineraryItems] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // 旅行期間を計算
  const calculateTripDays = () => {
    if (!tripData?.start_date || !tripData?.end_date) return 1;
    const start = new Date(tripData.start_date);
    const end = new Date(tripData.end_date);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const tripDays = calculateTripDays();

  useEffect(() => {
    if (tripId) {
      fetchItineraryData();
    }
  }, [tripId]);

  const fetchItineraryData = async () => {
    setLoading(true);
    try {
      // スポットデータから旁E�Eしおりを生�E
      const response = await fetch(`http://localhost:3002/api/trip-spots/trip/${tripId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const spots = await response.json();
        generateItineraryFromSpots(spots);
      }
    } catch (error) {
      console.error('Fetch itinerary data error:', error);
      // エラーの場合�EサンプルチE�Eタを使用
      setItineraryItems(getSampleItinerary());
    } finally {
      setLoading(false);
    }
  };

  const generateItineraryFromSpots = (spots) => {
    // スポットデータを日付�E時間頁E��ソートして旁E�Eしおりを生�E
    const sortedSpots = spots.sort((a, b) => {
      const dateA = new Date(`${a.visit_date} ${a.planned_time || '09:00'}`);
      const dateB = new Date(`${b.visit_date} ${b.planned_time || '09:00'}`);
      return dateA - dateB;
    });

    const itinerary = sortedSpots.map((spot, index) => ({
      id: spot.id.toString(),
      day: calculateDayNumber(spot.visit_date),
      time: spot.planned_time || '未定',
      activity: spot.activity_type || '観光',
      location: spot.name,
      notes: spot.notes || ''
    }));

    setItineraryItems(itinerary);
  };

  const calculateDayNumber = (visitDate) => {
    if (!tripData?.start_date) return 1;
    const startDate = new Date(tripData.start_date);
    const currentDate = new Date(visitDate);
    const diffTime = currentDate - startDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, diffDays);
  };

  const getSampleItinerary = () => {
    // スポットデータがない場合のサンプル
    return [
      { id: '1', day: 1, time: '09:00', activity: '出発', location: tripData?.destination || '目的地', notes: '旅行開始！' },
      { id: '2', day: 1, time: '12:00', activity: 'ランチ', location: '現地レストラン', notes: 'ご当地グルメを楽しもう' },
      { id: '3', day: 1, time: '14:00', activity: '観光', location: '観光スポット', notes: '写真撮影も忘れずに' },
      { id: '4', day: 1, time: '18:00', activity: 'ホテルチェックイン', location: '宿泊施設', notes: '荷物を置いて一休み' }
    ];
  };

  const currentDayItems = itineraryItems.filter(item => item.day === currentDay);
  
  const getTimeColor = (time) => {
    if (time === '未定') return '#e67e33';
    const hour = parseInt(time.split(':')[0]);
    if (hour < 12) return '#e67e33'; // 午前
    if (hour < 17) return '#d4621c'; // 午後
    return '#c55a1a'; // 夕方以降
  };

  const generatePDF = () => {
    alert('PDFしおり生成機能は開発中です！');
  };

  const formatTripTitle = () => {
    if (!tripData) return '旅行しおり';
    return `${tripData.title} - 旅行しおり`;
  };

  const formatTripPeriod = () => {
    if (!tripData?.start_date || !tripData?.end_date) return '';
    const start = new Date(tripData.start_date);
    const end = new Date(tripData.end_date);
    return `${start.toLocaleDateString('ja-JP')} 、E${end.toLocaleDateString('ja-JP')}`;
  };

  return (
    <div className="itinerary">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h2>📖 {formatTripTitle()}</h2>
            {tripData && (
              <p style={{ color: '#666', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                📍 {tripData.destination} | 📅 {formatTripPeriod()}
              </p>
            )}
          </div>
          <button className="btn btn-primary" onClick={generatePDF}>
            PDFで保存📄
          </button>
        </div>
        
        <p style={{ color: '#999', marginBottom: '1.5rem' }}>
          {currentDayItems.length > 0 
            ? 'スポット情報から自動生成されたしおりです。印刷して持ち歩けます！'
            : 'スポットを追加すると、ここに旅行しおりが表示されます。'}
        </p>

        {loading && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#e67e33' }}>
            読み込み中...
          </div>
        )}

        {/* 日付選抁E*/}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {Array.from({ length: tripDays }, (_, i) => i + 1).map(day => (
            <button
              key={day}
              className={`btn ${currentDay === day ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setCurrentDay(day)}
              style={{ minWidth: '80px' }}
            >
              {day}日目
            </button>
          ))}
        </div>
      </div>

      {/* 現在の日のスケジュール */}
      {currentDayItems.length > 0 ? (
        <div className="card">
          <h3 style={{ color: '#e67e33', marginBottom: '1.5rem', textAlign: 'center' }}>
            🗓️ {currentDay}日目のスケジュール
          </h3>
          
          <div style={{ position: 'relative' }}>
            {/* タイムライン */}
            <div style={{
              position: 'absolute',
              left: '60px',
              top: '0',
              bottom: '0',
              width: '2px',
              backgroundColor: 'rgba(230, 126, 51, 0.3)'
            }} />
            
            {currentDayItems.map((item, index) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  marginBottom: '2rem',
                  position: 'relative'
                }}
              >
                {/* 時刻 */}
                <div style={{
                  width: '50px',
                  textAlign: 'right',
                  paddingRight: '15px',
                  color: getTimeColor(item.time),
                  fontWeight: 'bold',
                  fontSize: '0.9rem'
                }}>
                  {item.time}
                </div>
                
                {/* タイムラインドッチE*/}
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: getTimeColor(item.time),
                  marginTop: '4px',
                  zIndex: 1,
                  position: 'relative'
                }} />
                
                {/* 冁E�� */}
                <div style={{
                  flex: 1,
                  paddingLeft: '15px'
                }}>
                  <div style={{
                    backgroundColor: 'white',
                    padding: '1rem',
                    borderRadius: '12px',
                    border: `1px solid ${getTimeColor(item.time)}`,
                    boxShadow: '0 2px 8px rgba(230, 126, 51, 0.1)'
                  }}>
                    <h4 style={{ 
                      color: getTimeColor(item.time),
                      marginBottom: '0.5rem',
                      fontSize: '1.1rem'
                    }}>
                      {item.activity}
                    </h4>
                    <p style={{ 
                      color: '#2c2c2c',
                      marginBottom: '0.5rem',
                      fontWeight: '500'
                    }}>
                      📍 {item.location}
                    </p>
                    {item.notes && (
                      <p style={{ 
                        color: '#666',
                        fontSize: '0.9rem',
                        fontStyle: 'italic'
                      }}>
                        💡 {item.notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card">
          <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📝</div>
            <h3 style={{ marginBottom: '1rem' }}>{currentDay}日目のスケジュール</h3>
            <p>この日のスポットはまだ追加されていません。</p>
            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
              「スポット」タブからスポットを追加すると、ここに表示されます。
            </p>
          </div>
        </div>
      )}

      {/* 持ち物リスト */}
      <div className="card">
        <h3 style={{ color: '#e67e33', marginBottom: '1rem' }}>
          🎒 持ち物チェックリスト
        </h3>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1rem' 
        }}>
          <div>
            <h4 style={{ color: '#e67e33', marginBottom: '0.5rem' }}>必需品</h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {['財布・現金', 'スマートフォン', '充電器', '身分証明書', '切符・チケット'].map(item => (
                <li key={item} style={{ 
                  padding: '0.25rem 0',
                  color: '#2c2c2c'
                }}>
                  ☐ {item}
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 style={{ color: '#e67e33', marginBottom: '0.5rem' }}>衣類</h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {['着替え', '下着', '靴下', 'パジャマ', '上着'].map(item => (
                <li key={item} style={{ 
                  padding: '0.25rem 0',
                  color: '#2c2c2c'
                }}>
                  ☐ {item}
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 style={{ color: '#e67e33', marginBottom: '0.5rem' }}>その他</h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {['カメラ', '日焼け止め', '薬', 'お土産用バッグ', 'ガイドブック'].map(item => (
                <li key={item} style={{ 
                  padding: '0.25rem 0',
                  color: '#2c2c2c'
                }}>
                  ☐ {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Itinerary;
