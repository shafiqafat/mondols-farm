import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import "./PageLoader.css";

function PageLoader() {
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);

    const timer = setTimeout(() => {
      setLoading(false);
    }, 350);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  if (!loading) return null;

  return <div className="page-loader" />;
}

export default PageLoader;