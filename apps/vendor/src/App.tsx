import { AuthGate } from '@zaradrop/ui';
import VendorApp from './VendorApp.jsx';

export default function App() {
  return <AuthGate role="vendor"><VendorApp /></AuthGate>;
}
