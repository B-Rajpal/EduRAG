import React from 'react';
import Chatbot from '../components/Chatbot';
import Dashboard from '../components/dashboard';
import Materialbox from '../components/Materialbox';

const Home = () => {
  return (
    <div className="webpage">
      <Chatbot/>
      <Materialbox/>
      <Dashboard/>
    </div>
  );
};

export default Home;
