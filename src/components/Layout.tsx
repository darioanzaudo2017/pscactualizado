import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="bg-surface text-on-surface flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-64 min-h-screen flex flex-col">
        <Header />
        {children}
        
        <footer className="mt-auto p-8 border-t border-surface-container-low text-center">
          <p className="text-outline-variant text-xs">
            © 2024 Secretaría de Políticas Sociales, Inclusión y Convivencia. Todos los derechos reservados.
          </p>
        </footer>
      </main>
    </div>
  );
};

export default Layout;
