import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import "./PageLoader.css";

function PageLoader() {
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Schedule state changes outside the effect's synchronous phase so route
    // transitions do not trigger a cascading render under React 19.
    const startTimer = setTimeout(() => setLoading(true), 0);

    const timer = setTimeout(() => {
      setLoading(false);
    }, 600);

    return () => {
      clearTimeout(startTimer);
      clearTimeout(timer);
    };
  }, [location.pathname]);

  if (!loading) return null;

  return <div className="page-loader" />;
}

export default PageLoader;
