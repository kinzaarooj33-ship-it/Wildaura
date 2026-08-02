import React from 'react';
import { useNavigate } from 'react-router-dom';


const exploreItems = [
  { title: 'Species Info',   description: 'Explore wildlife species and their details', icon: '🦁', link: '/guider/species-info' },
  { title: 'Weapon Info',    description: 'Browse hunting weapons and equipment',        icon: '🔫', link: '/guider/weapon-info' },
  { title: 'Hunting Laws',   description: 'Know the rules and regulations',              icon: '⚖️', link: '/guider/hunting-laws' },
  { title: 'Hunting Areas',  description: 'Discover the best hunting locations',         icon: '🗺️', link: '/guider/hunting-areas' },
  { title: 'Resorts Info',   description: 'Find resorts near hunting zones',             icon: '🏕️', link: '/guider/resort' },
];

const GuiderExplore = () => {
  const navigate = useNavigate();

  return (
    <div className="main-wrapper">
      <h1 className="welcome-text">Explore 🧭</h1>
      <div className="explore-container">
        <h2 className="explore-container-title">What would you like to explore?</h2>
        <div className="explore-grid">
          {exploreItems.map((item, i) => (
            <div key={i} className="explore-card" onClick={() => navigate(item.link)}>
              <div className="explore-icon">{item.icon}</div>
              <div className="explore-title">{item.title}</div>
              <div className="explore-desc">{item.description}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GuiderExplore;