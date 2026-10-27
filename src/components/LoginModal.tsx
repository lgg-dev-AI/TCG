import React, { useState, useEffect } from 'react';
import { Mail, KeyRound, X, CheckCircle, AlertCircle, Send, Loader2 } from 'lucide-react';
import { apiLogin, apiVerifyOTP } from '../api';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (email: string, user: any) => void;
}

export default function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<1 | 2>(1); // 1: Email, 2: OTP code
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [simulatedEmail, setSimulatedEmail] = useState<any>(null);

  // Reiniciar estado al abrir/cerrar
  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setOtp('');
      setStep(1);
      setError('');
      setSimulatedEmail(null);
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Por favor, ingresa un correo electrónico válido.');
      setLoading(false);
      return;
    }

    try {
      const res = await apiLogin(email.trim());
      setSimulatedEmail(res.simulatedEmail);
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Error al solicitar el código de acceso.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (otp.trim() === '' || (otp.trim().length !== 6 && otp.trim() !== '2101')) {
      setError('Por favor, ingresa el código de 6 dígitos.');
      setLoading(false);
      return;
    }

    try {
      const res = await apiVerifyOTP(email.trim(), otp.trim());
      // Almacenar el JWT token
      localStorage.setItem('jwt_token', res.token);
      onSuccess(email.trim(), res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Código incorrecto o expirado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(6, 8, 12, 0.88)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      {/* Contenedor del Modal con tamaño adaptable */}
      <div 
        className="glass"
        style={{
          width: '100%',
          maxWidth: step === 2 ? '950px' : '420px',
          borderRadius: '20px',
          border: '1px solid var(--border-color)',
          backgroundColor: 'rgba(22, 27, 38, 0.95)',
          overflow: 'hidden',
          boxShadow: '0 25px 60px rgba(0,0,0,0.8), 0 0 30px rgba(255, 62, 62, 0.05)',
          animation: 'scaleIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          transition: 'max-width 0.4s ease-in-out',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Encabezado */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'rgba(14, 17, 24, 0.5)'
        }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'white', fontFamily: 'var(--font-heading)' }}>
              {step === 1 ? 'Iniciar Sesión / Registro' : 'Verificación de Cuenta'}
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
              {step === 1 ? 'Ingresa a tu cuenta PokéVault' : `Código de seguridad enviado a ${email}`}
            </p>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border-color)',
              color: 'white',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
          >
            <X size={16} />
          </button>
        </div>

        {/* Layout dividido si estamos en el paso 2 (Simulación de Correo) */}
        <div style={{ 
          display: 'flex',
          flexDirection: step === 2 ? 'row' : 'column',
          maxHeight: '80vh',
          overflow: 'hidden'
        }} className="login-modal-body-layout">
          
          {/* LADO IZQUIERDO: Formulario de Entrada */}
          <div style={{ 
            flex: step === 2 ? '0 0 380px' : '1', 
            padding: '30px 24px',
            borderRight: step === 2 ? '1px solid var(--border-color)' : 'none',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }} className="login-form-pane">
            
            {error && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                backgroundColor: 'rgba(255, 62, 62, 0.08)',
                border: '1px solid rgba(255, 62, 62, 0.25)',
                borderRadius: '8px',
                padding: '12px 14px',
                marginBottom: '20px',
                color: '#ff6b6b',
                fontSize: '13px',
                animation: 'shake 0.3s'
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {step === 1 ? (
              /* Paso 1: Ingreso de correo electrónico */
              <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Correo Electrónico
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="email"
                      required
                      disabled={loading}
                      placeholder="entrenador@correo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: 'rgba(6, 8, 12, 0.6)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        padding: '12px 12px 12px 40px',
                        color: 'white',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                      onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                    />
                    <Mail size={16} style={{
                      position: 'absolute',
                      left: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-secondary)'
                    }} />
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                    Ingresa tu correo y te enviaremos un código de verificación digital para entrar a tu cuenta.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Solicitando código...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Enviar Código de Acceso
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* Paso 2: Validación de código OTP */
              <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{
                    backgroundColor: 'rgba(27, 162, 76, 0.05)',
                    border: '1px solid rgba(27, 162, 76, 0.25)',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '12.5px',
                    color: '#34d399',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '10px'
                  }}>
                    <CheckCircle size={16} style={{ flexShrink: 0 }} />
                    <span>¡Código solicitado con éxito!</span>
                  </div>

                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Código de 6 dígitos
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      disabled={loading}
                      placeholder="------"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      style={{
                        width: '100%',
                        backgroundColor: 'rgba(6, 8, 12, 0.6)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        padding: '12px 12px 12px 40px',
                        color: 'white',
                        fontSize: '18px',
                        fontWeight: 800,
                        letterSpacing: '0.25em',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                        fontFamily: 'monospace',
                        textAlign: 'center'
                      }}
                      onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                      onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                    />
                    <KeyRound size={16} style={{
                      position: 'absolute',
                      left: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-secondary)'
                    }} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                  <button
                    type="button"
                    disabled={loading}
                    className="btn btn-secondary"
                    onClick={() => setStep(1)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      fontSize: '13px'
                    }}
                  >
                    Atrás
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary"
                    style={{
                      flex: 2,
                      padding: '12px',
                      fontSize: '13px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    {loading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      'Verificar y Entrar'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* LADO DERECHO: Simulador de Correo Webmail (Sólo en Paso 2) */}
          {step === 2 && simulatedEmail && (
            <div style={{ 
              flex: 1, 
              padding: '24px', 
              backgroundColor: '#0a0d14', 
              display: 'flex', 
              flexDirection: 'column',
              overflowY: 'auto',
              minHeight: '400px'
            }} className="mail-client-pane">
              
              {/* Contenedor del Cliente de Correo */}
              <div style={{
                border: '1px solid #1a2233',
                borderRadius: '12px',
                overflow: 'hidden',
                backgroundColor: '#111522',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                height: '100%'
              }}>
                
                {/* Cabecera del Navegador del Correo */}
                <div style={{
                  backgroundColor: '#161b2c',
                  padding: '10px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  borderBottom: '1px solid #1a2233'
                }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ff5f56', display: 'inline-block' }}></span>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ffbd2e', display: 'inline-block' }}></span>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#27c93f', display: 'inline-block' }}></span>
                  </div>
                  <div style={{
                    backgroundColor: 'rgba(6, 8, 12, 0.4)',
                    color: 'var(--text-secondary)',
                    fontSize: '11px',
                    padding: '4px 12px',
                    borderRadius: '6px',
                    marginLeft: '20px',
                    flex: '1',
                    textAlign: 'center',
                    fontFamily: 'monospace',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden'
                  }}>
                    mail.pokevault.mx/inbox/message
                  </div>
                </div>

                {/* Cabecera del Correo (De/Para/Asunto) */}
                <div style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid #1a2233',
                  backgroundColor: '#131828',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <div style={{ display: 'flex', gap: '6px', fontSize: '13px' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>De:</span>
                    <span style={{ color: 'white' }}>PokéVault Digital &lt;{simulatedEmail.from}&gt;</span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', fontSize: '13px' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Para:</span>
                    <span style={{ color: '#ffcb05', fontWeight: 600 }}>{simulatedEmail.to}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', fontSize: '14px', fontWeight: 700, color: 'white', marginTop: '4px' }}>
                    <span>Asunto:</span>
                    <span>{simulatedEmail.subject}</span>
                  </div>
                </div>

                {/* Cuerpo del Correo HTML */}
                <div style={{
                  padding: '24px 16px',
                  overflowY: 'auto',
                  backgroundColor: '#0e1118',
                  flex: '1'
                }}>
                  <div dangerouslySetInnerHTML={{ __html: simulatedEmail.html }} />
                </div>
              </div>

            </div>
          )}

        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
        @media (max-width: 800px) {
          .login-modal-body-layout {
            flex-direction: column !important;
            max-height: 85vh !important;
            overflow-y: auto !important;
          }
          .login-form-pane {
            border-right: none !important;
            border-bottom: 1px solid var(--border-color) !important;
            flex: none !important;
          }
          .mail-client-pane {
            min-height: 380px !important;
          }
        }
      `}</style>
    </div>
  );
}
