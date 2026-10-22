import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initBrandIntegrityGuard } from './constants/branding';

// Initialize immutable authorship and branding integrity guard
initBrandIntegrityGuard();

createRoot(document.getElementById('root')!).render(<App />);
