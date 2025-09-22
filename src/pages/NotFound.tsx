import React, { useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const NotFound = () => {
  const location = useLocation();
  const { user, loading } = useAuth();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-pulse">Loading...</div>
        </div>
      </div>
    );
  }

  const redirectPath = user ? "/dashboard" : "/";
  const linkText = user ? "Return to Dashboard" : "Return to Home";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold text-foreground">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        <Link 
          to={redirectPath} 
          className="text-primary underline hover:text-primary/80 transition-colors"
        >
          {linkText}
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
