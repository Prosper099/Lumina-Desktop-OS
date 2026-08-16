import { OSProvider } from './context/OSContext';
import { Desktop } from './components/Desktop';

export default function App() {
  return (
    <OSProvider>
      <Desktop />
    </OSProvider>
  );
}
