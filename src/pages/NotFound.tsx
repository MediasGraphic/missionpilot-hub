import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold text-foreground">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Page introuvable</p>
        <p className="mb-6 text-sm text-muted-foreground">
          La page <code className="px-1.5 py-0.5 rounded bg-secondary text-foreground text-xs">{location.pathname}</code> n'existe pas.
        </p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          Retour à l'accueil
        </a>
      </div>
    </div>
  );
};

export default NotFound;
