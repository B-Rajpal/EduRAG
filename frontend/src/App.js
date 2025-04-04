import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import {Home }from './pages/Home';
import "./App.css"

import ClassDetails from "./pages/ClassDetails";
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import CreateClass from './pages/CreateClass';
import QuizGeneration from './components/QuizGeneration';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/class/:id" element={<ClassDetails />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/form" element={<CreateClass />} />
        <Route path="/quiz" element={<QuizGeneration/>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
