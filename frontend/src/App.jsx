import './App.css';
import { Router } from './Router.tsx';
import { RecordsProvider } from './store/RecordsProvider.tsx';

function App() {
  return (
    <>
      <RecordsProvider>
        <Router />
      </RecordsProvider>
    </>
  );
}

export default App;
