import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';
import App from './App.jsx';
import { ToastContainer } from 'react-toastify';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <ToastContainer
      position="top-right"
      theme="dark"
      autoClose={4000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick={false}
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      closeButton
      toastClassName="gamilearn-toast"
      bodyClassName="gamilearn-toast-body"
      progressClassName="gamilearn-toast-progress"
      className="gamilearn-toast-container"
    />
  </StrictMode>
);
