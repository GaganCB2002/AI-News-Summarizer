import type React from 'react';
import { Outlet } from 'react-router-dom';
import './AuthLayout.css';

const AuthLayout: React.FC = () => {
  return (
    <div className="auth-layout">
      <div className="auth-left">
        <div className="auth-left-content">
          <h1 className="auth-title">
            Intelligence,<br/>Distilled.
          </h1>
          <p className="auth-subtitle">
            Join thousands of professionals who start their day with BrieflyAI—the world's most precise neural news summarizer.
          </p>
          
          <div className="auth-testimonial glass-panel">
            <div className="stars">★★★★★</div>
            <p className="testimonial-text">
              "The most efficient way to stay informed without the noise of typical social feeds."
            </p>
            <div className="testimonial-author">
              <div className="author-avatar"></div>
              <div className="author-info">
                <span className="author-name">Sarah Chen</span>
                <span className="author-role">Product Lead</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="auth-right">
        <div className="auth-right-content">
          <Outlet />
          
          <div className="auth-footer">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Help Center</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
