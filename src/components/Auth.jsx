import { useState, useRef } from 'react';
import { api, isDemoMode } from '../lib/supabase';

export function Auth({ onAuthenticated }) {
  const [step, setStep] = useState('phone'); // 'phone', 'otp', 'name'
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [verifiedUser, setVerifiedUser] = useState(null); // Store user after OTP success

  const otpRefs = useRef([]);

  // Handle OTP input change
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  // Handle OTP paste
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      const newOtp = [...otp];
      for (let i = 0; i < pasted.length; i++) {
        newOtp[i] = pasted[i];
      }
      setOtp(newOtp);
      // Focus last filled input or submit
      const nextIndex = Math.min(pasted.length, 5);
      otpRefs.current[nextIndex]?.focus();
    }
  };

  // Handle OTP keydown for backspace
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // Start resend timer
  const startResendTimer = () => {
    setResendTimer(30);
    const interval = setInterval(() => {
      setResendTimer(t => {
        if (t <= 1) {
          clearInterval(interval);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  // Resend OTP
  const handleResend = async () => {
    setError('');
    setLoading(true);
    try {
      await api.sendOtp(phone);
      startResendTimer();
    } catch (err) {
      setError(err.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (step === 'phone') {
        // Send OTP
        const result = await api.sendOtp(phone);

        if (result.demoMode) {
          // Demo mode: skip OTP, go to name step
          setStep('name');
        } else {
          // Real mode: proceed to OTP entry
          setStep('otp');
          startResendTimer();
        }
      } else if (step === 'otp') {
        // Verify OTP
        const code = otp.join('');
        if (code.length !== 6) {
          setError('Please enter the 6-digit code');
          setLoading(false);
          return;
        }

        // Verify OTP and get/create user
        const user = await api.verifyOtp(phone, code);
        if (user.displayName) {
          // Existing user with name, log them in
          onAuthenticated(user);
        } else {
          // New user without name, save user and ask for name
          setVerifiedUser(user);
          setStep('name');
        }
      } else if (step === 'name') {
        // Update user with their name
        const updatedUser = await api.updateUserName(verifiedUser.id, name);
        onAuthenticated(updatedUser);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card glass-card slide-up">
        {/* Logo */}
        <div className="auth-logo">
          <div className="logo-icon">🌍</div>
          <h1 className="logo-text">Where In World</h1>
          <p className="logo-tagline">See where your friends are</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {step === 'phone' && (
            <>
              <div className="form-group">
                <label className="form-label">Your phone number</label>
                <input
                  type="tel"
                  className="input"
                  placeholder="+1 (555) 123-4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  autoFocus
                />
                <p className="form-hint">
                  We use your phone number to connect you with friends
                </p>
              </div>
              <button
                type="submit"
                className="btn btn-primary full-width"
                disabled={loading || !phone.trim()}
              >
                {loading ? 'Sending...' : 'Continue'}
              </button>
            </>
          )}

          {step === 'otp' && (
            <>
              <div className="form-group">
                <label className="form-label">Enter verification code</label>
                <p className="form-hint" style={{ marginBottom: '16px' }}>
                  We sent a 6-digit code to {phone}
                </p>
                <div className="otp-inputs" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => otpRefs.current[i] = el}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      className="otp-input"
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      autoFocus={i === 0}
                    />
                  ))}
                </div>
              </div>
              <button
                type="submit"
                className="btn btn-primary full-width"
                disabled={loading || otp.join('').length !== 6}
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>
              <button
                type="button"
                className="btn btn-ghost full-width"
                onClick={handleResend}
                disabled={loading || resendTimer > 0}
              >
                {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend code'}
              </button>
              <button
                type="button"
                className="btn btn-ghost full-width"
                onClick={() => { setStep('phone'); setOtp(['', '', '', '', '', '']); }}
              >
                Change number
              </button>
            </>
          )}

          {step === 'name' && (
            <>
              <div className="form-group">
                <label className="form-label">What should we call you?</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                />
                <p className="form-hint">
                  This is how you'll appear to friends
                </p>
              </div>
              <button
                type="submit"
                className="btn btn-primary full-width"
                disabled={loading || !name.trim()}
              >
                {loading ? 'Setting up...' : 'Get Started'}
              </button>
            </>
          )}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </form>

        {/* Demo mode notice */}
        {isDemoMode() && (
          <div className="demo-notice">
            <span className="demo-badge">Demo Mode</span>
            <span className="text-muted text-sm">No real SMS verification</span>
          </div>
        )}
      </div>

      {/* Features */}
      <div className="auth-features fade-in">
        <div className="feature">
          <span className="feature-icon">🔒</span>
          <span>Privacy-first: Only city-level location</span>
        </div>
        <div className="feature">
          <span className="feature-icon">👥</span>
          <span>Connect with existing contacts</span>
        </div>
        <div className="feature">
          <span className="feature-icon">📍</span>
          <span>Know when friends are nearby</span>
        </div>
      </div>

      <style>{`
        .auth-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          background: 
            radial-gradient(ellipse at top, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at bottom, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
            var(--bg-primary);
        }
        
        .auth-card {
          width: 100%;
          max-width: 400px;
          padding: 40px;
        }
        
        .auth-logo {
          text-align: center;
          margin-bottom: 32px;
        }
        
        .logo-icon {
          font-size: 56px;
          margin-bottom: 16px;
          animation: float 3s ease-in-out infinite;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        
        .logo-text {
          font-size: 28px;
          font-weight: 800;
          background: var(--accent-gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0 0 8px 0;
        }
        
        .logo-tagline {
          color: var(--text-secondary);
          margin: 0;
        }
        
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .form-label {
          font-weight: 600;
          color: var(--text-primary);
        }
        
        .form-hint {
          font-size: 13px;
          color: var(--text-muted);
          margin: 0;
        }
        
        .full-width {
          width: 100%;
        }
        
        .verify-message {
          text-align: center;
          padding: 20px 0;
        }
        
        .verify-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }
        
        .error-message {
          padding: 12px 16px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: var(--radius-md);
          color: var(--danger);
          font-size: 14px;
        }
        
        .demo-notice {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid var(--border-subtle);
        }
        
        .demo-badge {
          background: var(--accent-gradient);
          color: white;
          padding: 4px 10px;
          border-radius: var(--radius-full);
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
        }
        
        .auth-features {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 32px;
          max-width: 400px;
        }
        
        .feature {
          display: flex;
          align-items: center;
          gap: 12px;
          color: var(--text-secondary);
          font-size: 14px;
        }
        
        .feature-icon {
          font-size: 20px;
        }
        
        .otp-inputs {
          display: flex;
          gap: 8px;
          justify-content: center;
        }
        
        .otp-input {
          width: 48px;
          height: 56px;
          text-align: center;
          font-size: 24px;
          font-weight: 700;
          border: 2px solid var(--border-subtle);
          border-radius: var(--radius-md);
          background: var(--bg-secondary);
          color: var(--text-primary);
          transition: all var(--transition-fast);
        }
        
        .otp-input:focus {
          outline: none;
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
        }
        
        .otp-input:hover:not(:focus) {
          border-color: var(--text-muted);
        }
      `}</style>
    </div>
  );
}
