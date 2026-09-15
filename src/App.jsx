import { Routes, Route } from "react-router-dom";

import ScrollToTop from "./components/ScrollToTop";
import PageLoader from "./components/PageLoader";
import InitialLoader from "./components/InitialLoader";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Farm from "./pages/Farm";
import Stay from "./pages/Stay";
import Shop from "./pages/Shop";
import Journal from "./pages/Journal";
import About from "./pages/About";
import Contact from "./pages/Contact";
import ProjectDetail from "./pages/ProjectDetail";
import ProductDetail from "./pages/ProductDetail";
import JournalDetail from "./pages/JournalDetail";
import StayDetail from "./pages/StayDetail";
import Gallery from "./pages/Gallery";
import NotFound from "./pages/NotFound";

import { Analytics } from "@vercel/analytics/react";

import { AuthProvider } from "./farm-os/context/AuthContext";
import ProtectedRoute from "./farm-os/components/ProtectedRoute";
import FarmOSLayout from "./farm-os/components/FarmOSLayout";
import FarmOSLogin from "./farm-os/pages/Login";
import FarmOSOverview from "./farm-os/pages/Overview";
import FarmOSSpecies from "./farm-os/pages/Species";
import FarmOSDailyLog from "./farm-os/pages/DailyLog";
// import FarmOSInventory from "./farm-os/pages/Inventory";

// The public marketing site — unchanged, still wrapped in its own Navbar/Footer.
function PublicSite() {
  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/farm" element={<Farm />} />
        <Route path="/farm/:slug" element={<ProjectDetail />} />

        <Route path="/stay" element={<Stay />} />
        <Route path="/stay/:slug" element={<StayDetail />} />

        <Route path="/shop" element={<Shop />} />
        <Route path="/shop/:slug" element={<ProductDetail />} />

        <Route path="/journal" element={<Journal />} />
        <Route path="/journal/:slug" element={<JournalDetail />} />

        <Route path="/gallery" element={<Gallery />} />

        <Route path="/about" element={<About />} />

        <Route path="/contact" element={<Contact />} />

        <Route path="*" element={<NotFound />} />
      </Routes>

      <Footer />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <ScrollToTop />
      <InitialLoader />
      <PageLoader />

      <Routes>
        {/* Farm OS — private, no public Navbar/Footer */}
        <Route path="/farm-os/login" element={<FarmOSLogin />} />
        <Route
          path="/farm-os/*"
          element={
            <ProtectedRoute>
              <FarmOSLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<FarmOSOverview />} />
          <Route path="species" element={<FarmOSSpecies />} />
          <Route path="daily-log" element={<FarmOSDailyLog />} />
          {/* <Route path="inventory" element={<FarmOSInventory />} /> */}
        </Route>

        {/* Public site handles everything else */}
        <Route path="/*" element={<PublicSite />} />
      </Routes>

      <Analytics />
    </AuthProvider>
  );
}

export default App;
