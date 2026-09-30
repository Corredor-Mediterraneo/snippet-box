import { createRoot } from 'react-dom/client';
import './styles/style.scss';
import { App } from './App';

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
