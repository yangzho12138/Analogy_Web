import React from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import './LoadingOverlay.css'; // You can create a CSS file for styling

const LoadingOverlay = ({ loading }) => {
  return loading ? (
    <div className="loading-overlay">
      <CircularProgress size={100} />
    </div>
  ) : null;
};

export default LoadingOverlay;