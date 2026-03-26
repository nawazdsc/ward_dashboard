import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import TreatmentSheet from './components/TreatmentSheet';
import PrintCaseSheet from './components/PrintCaseSheet';
import DischargeCard from './components/DischargeCard';
import ProgressNote from './components/ProgressNote';
import LabChart from './components/LabChart';
import ShiftHandover from './components/ShiftHandover';
import Notifications from './components/Notifications';
import FileUpload from './components/FileUpload';
import './App.css';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function App() {
  const [activeTab, setActiveTab] = useState('notifications');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data: fetchedData, error } = await supabase
          .from('ward_data')
          .select('*')
          .limit(100);

        if (error) throw error;
        setData(fetchedData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const tabs = [
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'treatment', label: 'Treatment', icon: '💊' },
    { id: 'progress', label: 'Progress Note', icon: '📝' },
    { id: 'labs', label: 'Lab Results', icon: '🧪' },
    { id: 'handover', label: 'Shift Handover', icon: '🤝' },
    { id: 'discharge', label: 'Discharge', icon: '🏥' },
    { id: 'print', label: 'Print Case', icon: '🖨️' },
    { id: 'upload', label: 'Upload Files', icon: '📤' },
  ];

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Ward Dashboard</h1>
        <p className="subtitle">Patient Management System</p>
      </header>

      <nav className="tab-navigation">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            aria-selected={activeTab === tab.id}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </nav>

      <main className="tab-content">
        {loading && <div className="loading">Loading data...</div>}

        {!loading && (
          <>
            {activeTab === 'notifications' && (
              <Notifications data={data} />
            )}

            {activeTab === 'treatment' && (
              <TreatmentSheet data={data} />
            )}

            {activeTab === 'progress' && (
              <ProgressNote data={data} />
            )}

            {activeTab === 'labs' && (
              <LabChart data={data} />
            )}

            {activeTab === 'handover' && (
              <ShiftHandover data={data} />
            )}

            {activeTab === 'discharge' && (
              <DischargeCard data={data} />
            )}

            {activeTab === 'print' && (
              <PrintCaseSheet data={data} />
            )}

            {activeTab === 'upload' && (
              <FileUpload supabase={supabase} />
            )}
          </>
        )}
      </main>

      <footer className="app-footer">
        <p>&copy; 2025 Ward Dashboard. All rights reserved.</p>
      </footer>
    </div>
  );
}
