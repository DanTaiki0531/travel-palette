
const Navigation = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'planner', label: '旅行プランナー', icon: '📋' },
    { id: 'map', label: 'わくわくマップ', icon: '🗺️' }
  ];

  return (
    <nav className="nav">
      <div className="container">
        <ul className="nav-list">
          {navItems.map(item => (
            <li
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span style={{ marginRight: '0.5rem' }}>{item.icon}</span>
              {item.label}
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default Navigation;
