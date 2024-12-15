import React from 'react';
import Chatbot from '../components/Chatbot';
import Dashboard from '../components/dashboard';
import FileUpload from '../components/Fileupload';

const Home = () => {
  return (
    <div className="webpage">
      <Chatbot/>
      <FileUpload/>
      <Dashboard/>
    </div>
  );
};

export default Home;
