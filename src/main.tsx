
import React from 'react';
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Create root element
const root = createRoot(document.getElementById("root")!);

// Render app without strict mode to prevent double rendering
root.render(<App />);
