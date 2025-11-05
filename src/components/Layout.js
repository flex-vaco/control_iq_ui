import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
  return (
    <div className="app-layout">
      <div className="sidebar-wrapper">
        <Sidebar />
      </div>
      <main className="content-wrapper">
        <Outlet /> {/* This renders the active child route (Dashboard, RCM, etc.) */}
      </main>
    </div>
  );
};

export default Layout;