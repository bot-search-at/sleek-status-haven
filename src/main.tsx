
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Use strict mode to catch potential issues during development
const root = createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
