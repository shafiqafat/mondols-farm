import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import "./PageLoader.css";

function PageLoader() {
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // This effect exists specifically to flash a loader on every route
    // change — the setState-on-mount here is the intended behavior, not
    // an anti-pattern to refactor away.
    // eslint-disable-next-line react-hooks/set-state-in-effect
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