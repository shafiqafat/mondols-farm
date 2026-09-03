import { useEffect, useState } from "react";
import "./InitialLoader.css";

import loaderImage from "../assets/image/initial-loader.png";

function InitialLoader() {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const exitTimer = setTimeout(() => {
      setExiting(true);
    }, 1400);

    const hideTimer = setTimeout(() => {
      setVisible(false);
    }, 1900);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className={`initial-loader ${exiting ? "initial-loader--exit" : ""}`}>
      <div className="initial-loader__content">
        <div className="initial-loader__icon">
          <div className="initial-loader__icon">
            <img src={loaderImage} alt="Mondol's Farm" />
          </div>
        </div>

        <div className="initial-loader__brand">MONDOL'S FARM</div>

        <div className="initial-loader__line" />

        <p>GROWING WITH NATURE</p>
      </div>
    </div>
  );
}

export default InitialLoader;
