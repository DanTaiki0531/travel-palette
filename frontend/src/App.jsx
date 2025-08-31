import { useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AuthScreen from './components/AuthScreen.jsx';
import Header from './components/Header.jsx';
import Itinerary from './components/Itinerary.jsx';
import MapView from './components/MapView.jsx';
import Navigation from './components/Navigation.jsx';
import TripPlanner from './components/TripPlanner.jsx';
import UserInfo from './components/UserInfo.jsx';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import './styles/App.css';

const AppContent = () => {
  const [activeTab, setActiveTab] = useState('planner');
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>読み込み中...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return (
    <div className="App">
      <Header />
      <UserInfo />
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="container">
        {activeTab === 'planner' && <TripPlanner />}
        {activeTab === 'map' && <MapView />}
        {activeTab === 'itinerary' && <Itinerary />}
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
