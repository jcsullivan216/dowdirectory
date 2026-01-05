import { useState } from 'react';
import { DataProvider } from './hooks/useData';
import { Sidebar, type View } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Dashboard } from './components/analytics/Dashboard';
import { PeopleDirectory } from './components/people/PeopleDirectory';
import { OrgExplorer } from './components/org/OrgExplorer';
import { GlobalSearch } from './components/search/GlobalSearch';
import type { Person } from './types';

function AppContent() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const handlePersonSelect = (_person: Person) => {
    setCurrentView('people');
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'search':
        return (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-semibold text-slate-900 mb-6">Search Directory</h2>
            <GlobalSearch onSelect={handlePersonSelect} />
            <div className="mt-8 text-center text-slate-400">
              <p>Use the search bar above to find people, organizations, or programs.</p>
              <p className="mt-2 text-sm">Press <kbd className="px-2 py-1 bg-slate-100 rounded text-slate-600">Cmd+K</kbd> to search from anywhere.</p>
            </div>
          </div>
        );
      case 'people':
        return <PeopleDirectory />;
      case 'orgs':
        return <OrgExplorer />;
      case 'settings':
        return <Dashboard />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-100">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onPersonSelect={handlePersonSelect} />
        <main className="flex-1 overflow-auto p-6">
          {renderView()}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
}

export default App;
