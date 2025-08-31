import { useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import Header from './components/Header.jsx';
import Itinerary from './components/Itinerary.jsx';
import MapView from './components/MapView.jsx';
import Navigation from './components/Navigation.jsx';
import TripPlanner from './components/TripPlanner.jsx';

function App() {
  const [activeTab, setActiveTab] = useState('planner');

  return (
    <Router>
      <div className="App">
        <Header />
        <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <main className="container">
          {activeTab === 'planner' && <TripPlanner />}
          {activeTab === 'map' && <MapView />}
          {activeTab === 'itinerary' && <Itinerary />}
        </main>
      </div>
    </Router>
  );
}

export default App;
