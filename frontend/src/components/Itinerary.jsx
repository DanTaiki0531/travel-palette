import { useState } from 'react';

const Itinerary = () => {
  const [currentDay, setCurrentDay] = useState(1);
  const [tripDays] = useState(3); // 3日間の旅行例
  
  // サンプルの旅行スケジュール
  const sampleItinerary = [
    // 1日目
    { id: '1', day: 1, time: '09:00', activity: '東京駅出発', location: '東京駅', notes: '新幹線で移動' },
    { id: '2', day: 1, time: '12:00', activity: 'ランチ', location: '築地市場', notes: '新鮮な海鮮丼' },
    { id: '3', day: 1, time: '14:00', activity: '観光', location: '浅草寺', notes: '雷門で写真撮影' },
    { id: '4', day: 1, time: '16:00', activity: 'カフェタイム', location: '浅草のカフェ', notes: 'お土産購入も' },
    { id: '5', day: 1, time: '18:00', activity: 'ホテルチェックイン', location: '上野のホテル', notes: '' },
    
    // 2日目
    { id: '6', day: 2, time: '09:00', activity: '朝食', location: 'ホテル', notes: 'バイキング' },
    { id: '7', day: 2, time: '10:30', activity: '観光', location: '東京タワー', notes: '展望台からの景色' },
    { id: '8', day: 2, time: '13:00', activity: 'ランチ', location: '六本木', notes: 'おしゃれなレストラン' },
    { id: '9', day: 2, time: '15:00', activity: 'ショッピング', location: '表参道', notes: 'お土産選び' },
    { id: '10', day: 2, time: '19:00', activity: 'ディナー', location: '新宿', notes: '居酒屋で乾杯' },
    
    // 3日目
    { id: '11', day: 3, time: '10:00', activity: 'チェックアウト', location: 'ホテル', notes: '荷物をコインロッカーへ' },
    { id: '12', day: 3, time: '11:00', activity: '最後の観光', location: '皇居外苑', notes: '散歩とお花見' },
    { id: '13', day: 3, time: '14:00', activity: '東京駅で昼食', location: '東京駅', notes: '駅弁購入' },
    { id: '14', day: 3, time: '15:30', activity: '帰路', location: '東京駅', notes: '新幹線で帰宅' }
  ];

  const currentDayItems = sampleItinerary.filter(item => item.day === currentDay);
  
  const getTimeColor = (time) => {
    const hour = parseInt(time.split(':')[0]);
    if (hour < 12) return 'var(--accent-orange)'; // 午前
    if (hour < 17) return 'var(--primary-brown)'; // 午後
    return 'var(--dark-brown)'; // 夕方以降
  };

  const generatePDF = () => {
    alert('PDFしおり生成機能は開発中です！');
  };

  return (
    <div className="itinerary">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2>📖 旅のしおり</h2>
          <button className="btn btn-primary" onClick={generatePDF}>
            PDFで保存 📄
          </button>
        </div>
        
        <p style={{ color: 'var(--text-light)', marginBottom: '1.5rem' }}>
          確定したスケジュールから自動生成されたしおりです。印刷して持ち歩けます！
        </p>

        {/* 日付選択 */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', justifyContent: 'center' }}>
          {Array.from({ length: tripDays }, (_, i) => i + 1).map(day => (
            <button
              key={day}
              className={`btn ${currentDay === day ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setCurrentDay(day)}
            >
              {day}日目
            </button>
          ))}
        </div>
      </div>

      {/* 現在の日のスケジュール */}
      <div className="card">
        <h3 style={{ color: 'var(--primary-brown)', marginBottom: '1.5rem', textAlign: 'center' }}>
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
            backgroundColor: 'var(--light-brown)'
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
              
              {/* タイムラインドット */}
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: getTimeColor(item.time),
                marginTop: '4px',
                zIndex: 1,
                position: 'relative'
              }} />
              
              {/* 内容 */}
              <div style={{
                flex: 1,
                paddingLeft: '15px'
              }}>
                <div style={{
                  backgroundColor: 'var(--warm-white)',
                  padding: '1rem',
                  borderRadius: '8px',
                  border: `1px solid ${getTimeColor(item.time)}`,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <h4 style={{ 
                    color: getTimeColor(item.time),
                    marginBottom: '0.5rem',
                    fontSize: '1.1rem'
                  }}>
                    {item.activity}
                  </h4>
                  <p style={{ 
                    color: 'var(--text-dark)',
                    marginBottom: '0.5rem',
                    fontWeight: '500'
                  }}>
                    📍 {item.location}
                  </p>
                  {item.notes && (
                    <p style={{ 
                      color: 'var(--text-light)',
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

      {/* 持ち物リスト */}
      <div className="card">
        <h3 style={{ color: 'var(--primary-brown)', marginBottom: '1rem' }}>
          🎒 持ち物チェックリスト
        </h3>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1rem' 
        }}>
          <div>
            <h4 style={{ color: 'var(--accent-orange)', marginBottom: '0.5rem' }}>必需品</h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {['財布・現金', 'スマートフォン', '充電器', '身分証明書', '切符・チケット'].map(item => (
                <li key={item} style={{ 
                  padding: '0.25rem 0',
                  color: 'var(--text-dark)'
                }}>
                  ☐ {item}
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 style={{ color: 'var(--accent-orange)', marginBottom: '0.5rem' }}>衣類</h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {['着替え', '下着', '靴下', 'パジャマ', '上着'].map(item => (
                <li key={item} style={{ 
                  padding: '0.25rem 0',
                  color: 'var(--text-dark)'
                }}>
                  ☐ {item}
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 style={{ color: 'var(--accent-orange)', marginBottom: '0.5rem' }}>その他</h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {['カメラ', '日焼け止め', '薬', 'お土産用バッグ', 'ガイドブック'].map(item => (
                <li key={item} style={{ 
                  padding: '0.25rem 0',
                  color: 'var(--text-dark)'
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
