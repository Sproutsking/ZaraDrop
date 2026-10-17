import { AuthGate } from '@zaradrop/ui';
import OpsApp from './OpsApp.jsx';

export default function App() {
  return <AuthGate role="ops"><OpsApp /></AuthGate>;
}
