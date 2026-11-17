import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import * as P from './pages';
import './style.css';
import './advanced.css';
import './global-search.css';
import { AdvancedChat, AdvancedBuddies, AdvancedProfile, AdvancedAdmin } from './pages/Advanced';
const routes = {
  '/': P.Dashboard,
  '/log': P.LogWorkout,
  '/workouts': P.Workouts,
  '/progress': P.Progress,
  '/food': P.Food,
  '/coach': P.Coach,
  '/challenges': P.Challenges,
  '/buddies': AdvancedBuddies,
  '/chat': AdvancedChat,
  '/chat/:id': AdvancedChat,
  '/measure': P.Measurements,
  '/transform': P.Transformation,
  '/formcheck': P.FormCheck,
  '/profile': AdvancedProfile,
  '/programs': P.Programs,
  '/diet': P.Diet,
  '/admin': AdvancedAdmin,
  '/status': P.Buddies
};
function Layout() {
  const path = useLocation().pathname;
  const guest = ['/login', '/register'].includes(path);
  return <>{!guest && <Navbar />}<main className={guest ? 'guest' : 'main'}><Routes><Route path='/login' element={<P.Login />} /><Route path='/register' element={<P.Login register />} />{Object.entries(routes).map(([path, Page]) => <Route key={path} path={path} element={<ProtectedRoute admin={path === '/admin'}><Page /></ProtectedRoute>} />)}</Routes></main></>;
}
export default function App() {
  return <BrowserRouter><AuthProvider><Layout /></AuthProvider></BrowserRouter>;
}
