import { AuthGate } from '@zaradrop/ui';
import RiderApp from './RiderApp.jsx';

export default function App() {
  return <AuthGate role="rider"><RiderApp /></AuthGate>;
}
