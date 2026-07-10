'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import '../signup/signup.css';

export default function RecoverPassword() {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState(1); // 1: Email, 2: Code, 3: New Password, 4: Success
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const rules = [
    { label: 'Mínimo 8 caracteres', satisfied: newPassword.length >= 8 },
    { label: 'Al menos una letra mayúscula', satisfied: /[A-Z]/.test(newPassword) },
    { label: 'Al menos una letra minúscula', satisfied: /[a-z]/.test(newPassword) },
    { label: 'Al menos un carácter especial', satisfied: /[^A-Za-z0-9]/.test(newPassword) },
  ];

  // Paso 1: Comprobar correo y enviar código
  const handleCheckEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, action: 'check' })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'El correo electrónico no existe');
        return;
      }

      setStep(2); // Ir al paso del código
    } catch (err) {
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  // Paso 2: Verificar código en el servidor
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verificationCode, action: 'verify' })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'El código de verificación ingresado no es correcto');
        return;
      }

      setStep(3); // Ir al cambio de contraseña
    } catch (err) {
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  // Paso 3: Restablecer contraseña en el servidor
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    // Validar fuerza de contraseña en el cliente
    const hasMinLength = newPassword.length >= 8;
    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasLowercase = /[a-z]/.test(newPassword);
    const hasSpecialChar = /[^A-Za-z0-9]/.test(newPassword);

    if (!hasMinLength || !hasUppercase || !hasLowercase || !hasSpecialChar) {
      setError('La contraseña debe cumplir con todos los requisitos solicitados.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword, code: verificationCode, action: 'reset' })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al restablecer la contraseña');
        return;
      }

      setStep(4); // Completado con éxito
    } catch (err) {
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-wrapper">
      {/* Cabecera */}
      <header className="signup-header">
        <Link href="/" className="logo-text">INNOVA<span>CV</span></Link>
        <div className="header-actions">
          <Link href="/signin" className="btn-signin">Sign in</Link>
          <Link href="/signup" className="btn-signup-header">Sign Up</Link>
        </div>
      </header>

      {/* Área Principal */}
      <main className="signup-main">
        <h1 className="signup-title">Recuperar Contraseña</h1>

        <div className="signup-card">
          {error && (
            <div className="error-message" style={{ color: '#ef4444', marginBottom: '15px', fontSize: '14px', textAlign: 'center' }}>
              {error}
            </div>
          )}

          {/* PASO 1: Ingreso de correo electrónico */}
          {step === 1 && (
            <form onSubmit={handleCheckEmail}>
              <p style={{ fontSize: '14px', color: '#718096', marginBottom: '20px', textAlign: 'center', lineHeight: '1.5' }}>
                Ingresa el correo electrónico asociado a tu cuenta y te enviaremos las instrucciones de recuperación.
              </p>
              
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? 'Verificando...' : 'Continuar'}
              </button>
            </form>
          )}

          {/* PASO 2: Ingreso de código enviado */}
          {step === 2 && (
            <form onSubmit={handleVerifyCode}>
              <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.05)', border: '1px dashed #10b981', borderRadius: '10px', padding: '15px', marginBottom: '20px', textAlign: 'center' }}>
                <p style={{ fontSize: '13px', color: '#10b981', fontWeight: 600, margin: 0 }}>
                  📩 Código de verificación enviado
                </p>
                <p style={{ fontSize: '13px', color: '#718096', marginTop: '6px', marginBottom: 0 }}>
                  Hemos enviado un código a <strong style={{ color: '#1B2559' }}>{email}</strong>. Por favor, revisa tu bandeja de entrada y spam.
                </p>
              </div>

              <p style={{ fontSize: '14px', color: '#718096', marginBottom: '20px', textAlign: 'center' }}>
                Ingresa el código de 6 dígitos enviado a tu correo.
              </p>

              <div className="form-group">
                <label htmlFor="code">Código de Verificación</label>
                <input
                  type="text"
                  id="code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Ej: 123456"
                  required
                />
              </div>

              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? 'Verificando...' : 'Verificar Código'}
              </button>
            </form>
          )}

          {/* PASO 3: Nueva contraseña con checklist */}
          {step === 3 && (
            <form onSubmit={handleResetPassword}>
              <p style={{ fontSize: '14px', color: '#718096', marginBottom: '25px', textAlign: 'center' }}>
                Crea una nueva contraseña segura para tu cuenta.
              </p>

              {/* Nueva Contraseña */}
              <div className="form-group">
                <label htmlFor="newPassword">Nueva Contraseña</label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <div className={`password-rules-container ${newPassword ? 'visible' : ''}`}>
                  {rules.map((rule, idx) => (
                    <div key={idx} className={`password-rule-item ${rule.satisfied ? 'satisfied' : ''}`}>
                      {rule.satisfied ? (
                        <svg className="rule-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <svg className="rule-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                        </svg>
                      )}
                      <span>{rule.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Repetir Nueva Contraseña */}
              <div className="form-group">
                <label htmlFor="confirmPassword">Repetir Nueva Contraseña</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? 'Guardando...' : 'Restablecer'}
              </button>
            </form>
          )}

          {/* PASO 4: Éxito */}
          {step === 4 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '60px', height: '60px', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>

              <h2 style={{ fontSize: '20px', color: '#1B2559', fontWeight: 700, marginBottom: '10px' }}>
                ¡Restablecida con éxito!
              </h2>
              
              <p style={{ fontSize: '14px', color: '#718096', marginBottom: '25px', lineHeight: '1.5' }}>
                Tu contraseña ha sido actualizada. Ya puedes iniciar sesión con tus nuevas credenciales.
              </p>

              <Link href="/signin" className="btn-submit" style={{ textDecoration: 'none', textAlign: 'center', lineHeight: '1.2' }}>
                Iniciar Sesión
              </Link>
            </div>
          )}

          {/* Footer de retorno */}
          {step !== 4 && (
            <div className="footer-text" style={{ marginTop: '20px' }}>
              ¿Recordaste tu contraseña? <Link href="/signin">Volver a Sign In</Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
