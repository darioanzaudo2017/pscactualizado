import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '../lib/supabase';

const loginSchema = z.object({
  email: z.string().email({ message: "Correo electrónico inválido" }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    setError(null);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) throw authError;
      navigate('/dashboard');
    } catch (err: any) {
      if (err.message === 'Invalid login credentials') {
        setError('Credenciales inválidas. Por favor verifique su correo y contraseña.');
      } else {
        setError(err.message || "Error al iniciar sesión");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-grow flex items-center justify-center p-6 relative overflow-hidden bg-login-gradient min-h-screen">
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[30%] bg-secondary/5 rounded-full blur-3xl"></div>
      
      <div className="w-full max-w-[440px] z-10">
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-16 h-16 bg-primary-container rounded-xl flex items-center justify-center mb-4 shadow-sm">
            <span className="material-symbols-outlined text-primary text-4xl">account_balance</span>
          </div>
          <h1 className="font-headline text-3xl font-extrabold tracking-tight text-primary">Civic Harmony</h1>
          <p className="font-label text-sm font-medium text-on-surface-variant mt-1 uppercase tracking-widest">Gestión Social</p>
        </div>

        <div className="bg-surface-container-lowest rounded-xl shadow-[0_24px_48px_-12px_rgba(24,28,32,0.06)] p-8 md:p-10 border-outline-variant/10 border">
          <div className="mb-8">
            <h2 className="font-headline text-2xl font-bold text-on-surface">Bienvenido</h2>
            <p className="text-on-surface-variant text-sm mt-1">Ingrese sus credenciales para acceder al portal seguro.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-error-container text-on-error-container rounded-xl text-xs font-bold flex items-center gap-2 border border-error/20 animate-in fade-in slide-in-from-top-2 duration-300">
              <span className="material-symbols-outlined text-sm">error</span>
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider ml-1" htmlFor="email">
                Usuario/Email
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-outline text-xl group-focus-within:text-primary transition-colors">person</span>
                </div>
                <input
                  {...register('email')}
                  className={`block w-full pl-11 pr-4 py-3.5 bg-surface-container-high border-none rounded-lg focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all placeholder:text-outline outline-none ${errors.email ? 'ring-2 ring-error/20' : ''}`}
                  id="email"
                  placeholder="nombre.apellido@portal.gob"
                  type="email"
                />
                <div className={`absolute bottom-0 left-0 h-[2px] transition-all duration-300 ${errors.email ? 'w-full bg-error' : 'w-0 group-focus-within:w-full bg-primary'}`}></div>
              </div>
              {errors.email && <p className="text-[10px] text-error font-bold ml-1">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider" htmlFor="password">
                  Contraseña
                </label>
                <a className="text-xs font-semibold text-primary hover:text-primary-container transition-colors" href="#">¿Olvidó su contraseña?</a>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-outline text-xl group-focus-within:text-primary transition-colors">lock</span>
                </div>
                <input
                  {...register('password')}
                  className={`block w-full pl-11 pr-12 py-3.5 bg-surface-container-high border-none rounded-lg focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all placeholder:text-outline outline-none ${errors.password ? 'ring-2 ring-error/20' : ''}`}
                  id="password"
                  placeholder="••••••••"
                  type={showPassword ? 'text' : 'password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-outline hover:text-on-surface transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
                <div className={`absolute bottom-0 left-0 h-[2px] transition-all duration-300 ${errors.password ? 'w-full bg-error' : 'w-0 group-focus-within:w-full bg-primary'}`}></div>
              </div>
              {errors.password && <p className="text-[10px] text-error font-bold ml-1">{errors.password.message}</p>}
            </div>

            <div className="pt-2">
              <button
                disabled={loading}
                className="w-full primary-gradient text-on-primary font-semibold py-4 rounded-lg shadow-[0_8px_24px_rgba(0,62,111,0.15)] hover:shadow-[0_12px_32px_rgba(0,62,111,0.25)] transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:pointer-events-none"
                type="submit"
              >
                {loading ? (
                  <span className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></span>
                ) : (
                  <>
                    <span>Iniciar Sesión</span>
                    <span className="material-symbols-outlined text-xl">arrow_forward</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center gap-4 py-2">
              <div className="h-px flex-grow bg-outline-variant/20"></div>
              <span className="text-[10px] font-bold text-outline-variant uppercase tracking-[0.2em]">Otras Opciones</span>
              <div className="h-px flex-grow bg-outline-variant/20"></div>
            </div>

            <button className="w-full bg-surface-container-low text-primary font-medium py-3.5 rounded-lg border border-transparent hover:bg-surface-container-high transition-all flex items-center justify-center gap-2 disabled:opacity-50" type="button" disabled={loading}>
              <span className="material-symbols-outlined text-xl">badge</span>
              <span>Acceso con Certificado Digital</span>
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-outline-variant/10 text-center">
            <p className="text-sm text-on-surface-variant font-medium">
              ¿No tiene una cuenta administrativa?{' '}
              <Link to="/register" className="text-primary font-black hover:underline ml-1">Regístrese aquí</Link>
            </p>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-6 opacity-60">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">verified_user</span>
            <span className="text-[10px] font-bold uppercase tracking-wider">Conexión Segura SSL</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">gpp_maybe</span>
            <span className="text-[10px] font-bold uppercase tracking-wider">Privacidad Protegida</span>
          </div>
        </div>
      </div>

      <footer className="absolute bottom-0 left-0 right-0 py-8 flex items-center justify-center bg-transparent pointer-events-none">
        <p className="text-[10px] font-bold tracking-[0.2em] text-outline/40 uppercase">© 2024 Civic Harmony Social Management</p>
      </footer>
    </main>
  );
};

export default Login;
