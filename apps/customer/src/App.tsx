import { AuthGate } from '@zaradrop/ui';
import CustomerApp from './CustomerApp.jsx';

export default function App() {
  return <AuthGate role="customer" allowSignUp><CustomerApp /></AuthGate>;
}
