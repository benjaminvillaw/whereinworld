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
  const [verifiedUser, setVerifiedUser] = useState(null);

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
        const result = await api.sendOtp(phone);
        if (result.demoMode) {
          setStep('name');
        } else {
          setStep('otp');
          startResendTimer();
        }
      } else if (step === 'otp') {
        const code = otp.join('');
        if (code.length !== 6) {
          setError('Please enter the 6-digit code');
          setLoading(false);
          return;
        }

        const user = await api.verifyOtp(phone, code);
        if (user.displayName) {
          onAuthenticated(user);
        } else {
          setVerifiedUser(user);
          setStep('name');
        }
      } else if (step === 'name') {
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
      <div className="auth-card animate-slide-up">
        {/* Logo */}
        <div className="auth-logo">
          <div className="logo-icon">
            <span className="material-symbols-outlined" style={{ fontSize: '4rem', color: 'var(--primary)' }}>
              public
            </span>
          </div>
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
                className="btn btn-primary"
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
                <p className="form-hint" style={{ marginBottom: '1rem' }}>
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
                className="btn btn-primary"
                disabled={loading || otp.join('').length !== 6}
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={handleResend}
                disabled={loading || resendTimer > 0}
              >
                {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend code'}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
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
                className="btn btn-primary"
                disabled={loading || !name.trim()}
              >
                {loading ? 'Setting up...' : 'Get Started'}
              </button>
            </>
          )}

          {error && (
            <div className="error-message">
              <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>error</span>
              {error}
            </div>
          )}
        </form>

        {/* Demo mode notice */}
        {isDemoMode() && (
          <div className="demo-notice">
            <span className="badge-primary">Demo Mode</span>
            <span className="text-muted text-sm">No real SMS verification</span>
          </div>
        )}
      </div>

      {/* Features */}
      <div className="auth-features animate-fade-in">
        <div className="feature">
          <span className="material-symbols-outlined feature-icon">lock</span>
          <span>Privacy-first: Only city-level location</span>
        </div>
        <div className="feature">
          <span className="material-symbols-outlined feature-icon">group</span>
          <span>Connect with existing contacts</span>
        </div>
        <div className="feature">
          <span className="material-symbols-outlined feature-icon">location_on</span>
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
          padding: 2.5rem 1.5rem;
          background: var(--background-dark);
        }
        
        .auth-card {
          width: 100%;
          max-width: 24rem;
          padding: 2.5rem;
          background: var(--surface-dark);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: var(--radius-3xl);
        }
        
        .auth-logo {
          text-align: center;
          margin-bottom: 2rem;
        }
        
        .logo-icon {
          margin-bottom: 1rem;
          animation: float 3s ease-in-out infinite;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        
        .logo-text {
          font-size: 1.75rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: -0.02em;
          color: var(--text-primary);
          margin: 0 0 0.5rem 0;
        }
        
        .logo-tagline {
          color: var(--text-secondary);
          font-weight: 500;
          margin: 0;
        }
        
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .form-label {
          font-weight: 700;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-primary);
        }
        
        .form-hint {
          font-size: 0.8125rem;
          color: var(--text-muted);
          margin: 0;
        }
        
        .error-message {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: rgba(239, 68, 68, 0.1);
          border: 2px solid rgba(239, 68, 68, 0.3);
          border-radius: var(--radius-xl);
          color: var(--danger);
          font-size: 0.875rem;
          font-weight: 600;
        }
        
        .demo-notice {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(255,255,255,0.1);
        }
        
        .auth-features {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-top: 2rem;
          max-width: 24rem;
        }
        
        .feature {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: var(--text-secondary);
          font-size: 0.875rem;
          font-weight: 500;
        }
        
        .feature-icon {
          font-size: 1.25rem;
          color: var(--accent-mint);
        }
        
        .otp-inputs {
          display: flex;
          gap: 0.5rem;
          justify-content: center;
        }
        
        .otp-input {
          width: 3rem;
          height: 3.5rem;
          text-align: center;
          font-size: 1.5rem;
          font-weight: 800;
          border: 2px solid var(--surface-border);
          border-radius: var(--radius-lg);
          background: var(--background-dark);
          color: var(--text-primary);
          transition: all var(--transition-fast);
        }
        
        .otp-input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: var(--shadow-glow-primary);
        }
        
        .otp-input:hover:not(:focus) {
          border-color: var(--text-muted);
        }

        .btn {
          width: 100%;
        }
      `}</style>
    </div>
  );
}
