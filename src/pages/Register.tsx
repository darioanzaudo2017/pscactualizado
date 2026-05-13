import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '../lib/supabase';

const registerSchema = z.object({
  fullName: z.string().min(3, { message: "El nombre es muy corto" }),
  email: z.string().email({ message: "Correo electrónico inválido" }),
  dni: z.string().min(7, { message: "DNI inválido" }),
  role: z.string().min(1, { message: "Seleccione un rol válido" }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setLoading(true);
    setError(null);
    try {
      // 1. Sign up user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // Simple name split
        const nameParts = data.fullName.trim().split(' ');
        const nombre = nameParts[0];
        const apellido = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

        // 2. Create profile in v2.t_usuarios
        const { error: profileError } = await supabase
          .from('t_usuarios')
          .insert({
            id: authData.user.id,
            nombre,
            apellido,
            email: data.email,
            dni: data.dni,
            rol: data.role,
            activo: true
          });

        if (profileError) throw profileError;
        
        setSuccess(true);
        setTimeout(() => navigate('/login'), 3000);
      }
    } catch (err: any) {
      setError(err.message || "Error al registrar usuario");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-bright p-6">
        <div className="max-w-md w-full bg-surface-container-lowest p-10 rounded-2xl shadow-xl text-center border border-outline-variant/10">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-primary text-5xl">check_circle</span>
          </div>
          <h2 className="text-3xl font-black text-primary mb-4 font-headline tracking-tight">¡Registro Exitoso!</h2>
          <p className="text-on-surface-variant font-medium leading-relaxed">
            Su cuenta ha sido creada correctamente. Redirigiendo al inicio de sesión...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface text-on-surface font-body min-h-screen flex flex-col">
      <header className="bg-slate-50 flex justify-between items-center w-full px-6 py-4 max-w-7xl mx-auto bg-transparent">
        <div className="flex items-center gap-2">
          <span className="text-xl font-black tracking-tight text-primary font-headline uppercase tracking-widest">Civic Harmony</span>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center px-4 py-12 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-3xl"></div>
        
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden rounded-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-outline-variant/10 bg-surface-container-lowest z-10">
          <div className="lg:col-span-5 relative hidden lg:flex flex-col justify-end p-12 overflow-hidden bg-primary">
            <img
              alt="Professional collaboration"
              className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-30"
              src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=1000"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/50 to-transparent"></div>
            <div className="relative z-10 text-white">
              <span className="inline-block px-3 py-1 bg-white/10 text-white rounded-full text-[10px] font-black tracking-widest uppercase mb-4 backdrop-blur-sm border border-white/20">
                Gestión Social
              </span>
              <h1 className="font-headline text-4xl font-extrabold leading-tight mb-6 tracking-tight">
                Fortaleciendo la <br />
                <span className="text-blue-200">Armonía Cívica.</span>
              </h1>
              <p className="text-blue-100/80 text-lg font-medium leading-relaxed max-w-md">
                Únase a la red de administradores dedicados a transformar la asistencia social con eficiencia.
              </p>
            </div>
          </div>

          <div className="lg:col-span-7 p-8 md:p-12">
            <div className="max-w-md mx-auto">
              <div className="mb-10">
                <h2 className="font-headline text-3xl font-black text-on-surface mb-2 tracking-tight">Crear cuenta</h2>
                <p className="text-on-surface-variant text-sm font-medium">Portal administrativo de gestión social.</p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-error-container text-on-error-container rounded-xl text-xs font-bold flex items-center gap-2 border border-error/20">
                  <span className="material-symbols-outlined text-sm">error</span>
                  {error}
                </div>
              )}

              <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-1.5 ml-1" htmlFor="fullName">
                      Nombre Completo
                    </label>
                    <div className="relative group">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-xl group-focus-within:text-primary transition-colors">person</span>
                      <input
                        {...register('fullName')}
                        className={`w-full pl-12 pr-4 py-3.5 bg-surface-container-high border-none rounded-xl focus:ring-2 focus:ring-primary/20 transition-all text-on-surface font-medium outline-none ${errors.fullName ? 'ring-2 ring-error/20' : ''}`}
                        id="fullName"
                        placeholder="Ej. Ana García"
                        type="text"
                      />
                    </div>
                    {errors.fullName && <p className="text-[10px] text-error font-bold mt-1 ml-1">{errors.fullName.message}</p>}
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-1.5 ml-1" htmlFor="email">
                      Correo Electrónico
                    </label>
                    <div className="relative group">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-xl group-focus-within:text-primary transition-colors">mail</span>
                      <input
                        {...register('email')}
                        className={`w-full pl-12 pr-4 py-3.5 bg-surface-container-high border-none rounded-xl focus:ring-2 focus:ring-primary/20 transition-all text-on-surface font-medium outline-none ${errors.email ? 'ring-2 ring-error/20' : ''}`}
                        id="email"
                        placeholder="usuario@civicharmony.gov"
                        type="email"
                      />
                    </div>
                    {errors.email && <p className="text-[10px] text-error font-bold mt-1 ml-1">{errors.email.message}</p>}
                  </div>

                  <div className="col-span-1">
                    <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-1.5 ml-1" htmlFor="dni">
                      DNI
                    </label>
                    <div className="relative group">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-xl group-focus-within:text-primary transition-colors">badge</span>
                      <input
                        {...register('dni')}
                        className={`w-full pl-12 pr-4 py-3.5 bg-surface-container-high border-none rounded-xl focus:ring-2 focus:ring-primary/20 transition-all text-on-surface font-medium outline-none ${errors.dni ? 'ring-2 ring-error/20' : ''}`}
                        id="dni"
                        placeholder="00.000.000"
                        type="text"
                      />
                    </div>
                    {errors.dni && <p className="text-[10px] text-error font-bold mt-1 ml-1">{errors.dni.message}</p>}
                  </div>

                  <div className="col-span-1">
                    <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-1.5 ml-1" htmlFor="role">
                      Rol
                    </label>
                    <div className="relative group">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-xl group-focus-within:text-primary transition-colors">work</span>
                      <select
                        {...register('role')}
                        className={`w-full pl-12 pr-4 py-3.5 bg-surface-container-high border-none rounded-xl focus:ring-2 focus:ring-primary/20 transition-all text-on-surface font-medium appearance-none outline-none ${errors.role ? 'ring-2 ring-error/20' : ''}`}
                        id="role"
                        defaultValue=""
                      >
                        <option disabled value="">Seleccionar</option>
                        <option value="operador">Operador Social</option>
                        <option value="admin">Administrador</option>
                        <option value="auditor">Auditor</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_more</span>
                    </div>
                    {errors.role && <p className="text-[10px] text-error font-bold mt-1 ml-1">{errors.role.message}</p>}
                  </div>

                  <div className="col-span-1">
                    <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-1.5 ml-1" htmlFor="password">
                      Contraseña
                    </label>
                    <div className="relative group">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-xl group-focus-within:text-primary transition-colors">lock</span>
                      <input
                        {...register('password')}
                        className={`w-full pl-12 pr-4 py-3.5 bg-surface-container-high border-none rounded-xl focus:ring-2 focus:ring-primary/20 transition-all text-on-surface font-medium outline-none ${errors.password ? 'ring-2 ring-error/20' : ''}`}
                        id="password"
                        placeholder="••••••••"
                        type="password"
                      />
                    </div>
                    {errors.password && <p className="text-[10px] text-error font-bold mt-1 ml-1">{errors.password.message}</p>}
                  </div>

                  <div className="col-span-1">
                    <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-1.5 ml-1" htmlFor="confirmPassword">
                      Confirmar
                    </label>
                    <div className="relative group">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-xl group-focus-within:text-primary transition-colors">lock_reset</span>
                      <input
                        {...register('confirmPassword')}
                        className={`w-full pl-12 pr-4 py-3.5 bg-surface-container-high border-none rounded-xl focus:ring-2 focus:ring-primary/20 transition-all text-on-surface font-medium outline-none ${errors.confirmPassword ? 'ring-2 ring-error/20' : ''}`}
                        id="confirmPassword"
                        placeholder="••••••••"
                        type="password"
                      />
                    </div>
                    {errors.confirmPassword && <p className="text-[10px] text-error font-bold mt-1 ml-1">{errors.confirmPassword.message}</p>}
                  </div>
                </div>

                <div className="pt-6">
                  <button
                    disabled={loading}
                    className="w-full primary-gradient text-on-primary font-bold py-4 rounded-xl shadow-[0_12px_24px_rgba(0,62,111,0.2)] hover:shadow-[0_16px_32px_rgba(0,62,111,0.3)] transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:pointer-events-none"
                    type="submit"
                  >
                    {loading ? (
                      <span className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></span>
                    ) : (
                      <>
                        <span>Crear Cuenta Administrativa</span>
                        <span className="material-symbols-outlined text-xl">arrow_forward</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex flex-col items-center gap-4 mt-8">
                  <div className="w-full h-px bg-outline-variant/10"></div>
                  <p className="text-sm text-on-surface-variant font-medium">
                    ¿Ya tiene una cuenta?
                    <Link to="/login" className="text-primary font-black hover:underline ml-1">Volver al inicio</Link>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-8 flex items-center justify-center opacity-40">
        <p className="text-[10px] font-black tracking-[0.3em] uppercase">© 2024 Civic Harmony Social Management</p>
      </footer>
    </div>
  );
};

export default Register;
