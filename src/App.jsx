import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";

import ScrollToTop from "./components/ScrollToTop";
import PageLoader from "./components/PageLoader";
import InitialLoader from "./components/InitialLoader";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

const Home = lazy(() => import("./pages/Home"));
const Farm = lazy(() => import("./pages/Farm"));
const Stay = lazy(() => import("./pages/Stay"));
const Shop = lazy(() => import("./pages/Shop"));
const Journal = lazy(() => import("./pages/Journal"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const ProjectDetail = lazy(() => import("./pages/ProjectDetail"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const JournalDetail = lazy(() => import("./pages/JournalDetail"));
const StayDetail = lazy(() => import("./pages/StayDetail"));
const Gallery = lazy(() => import("./pages/Gallery"));
const Invest = lazy(() => import("./pages/Invest"));
const InvestmentDetail = lazy(() => import("./pages/InvestmentDetail"));
const NotFound = lazy(() => import("./pages/NotFound"));

import { Analytics } from "@vercel/analytics/react";

import { AuthProvider } from "./farm-os/context/AuthContext";
import ProtectedRoute from "./farm-os/components/ProtectedRoute";
import FarmOSLayout from "./farm-os/components/FarmOSLayout";
const FarmOSLogin = lazy(() => import("./farm-os/pages/Login"));
const FarmOSOverview = lazy(() => import("./farm-os/pages/Overview"));
const FarmOSSpecies = lazy(() => import("./farm-os/pages/Species"));
const FarmOSEntityDetail = lazy(() => import("./farm-os/pages/EntityDetail"));
const FarmOSFinance = lazy(() => import("./farm-os/pages/Finance"));
const FarmOSCapacity = lazy(() => import("./farm-os/pages/Capacity"));
const FarmOSScenario = lazy(() => import("./farm-os/pages/Scenario"));
const FarmOSContentJournal = lazy(() => import("./farm-os/pages/ContentJournal"));
const FarmOSTasks = lazy(() => import("./farm-os/pages/Tasks"));
const FarmOSDailyLog = lazy(() => import("./farm-os/pages/DailyLog"));
const FarmOSInventory = lazy(() => import("./farm-os/pages/Inventory"));
const FarmOSSettings = lazy(() => import("./farm-os/pages/Settings"));

// The public marketing site — unchanged, still wrapped in its own Navbar/Footer.
function PublicSite() {
  return (
    <>
      <Navbar />

      <Suspense fallback={<div className="farmos-loading">Loading…</div>}>
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

        <Route path="/invest" element={<Invest />} />
        <Route path="/invest/:slug" element={<InvestmentDetail />} />

        <Route path="/about" element={<About />} />

        <Route path="/contact" element={<Contact />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
      </Suspense>

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

      <Suspense fallback={<div className="farmos-loading">Loading…</div>}>
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
            <Route path="entities/:id" element={<FarmOSEntityDetail />} />
            <Route path="finance" element={<FarmOSFinance />} />
            <Route path="capacity" element={<FarmOSCapacity />} />
            <Route path="scenario" element={<FarmOSScenario />} />
            <Route path="content" element={<FarmOSContentJournal />} />
            <Route path="tasks" element={<FarmOSTasks />} />
            <Route path="daily-log" element={<FarmOSDailyLog />} />
            <Route path="inventory" element={<FarmOSInventory />} />
            <Route path="settings" element={<FarmOSSettings />} />
          </Route>

          {/* Public site handles everything else */}
          <Route path="/*" element={<PublicSite />} />
        </Routes>
      </Suspense>

      <Analytics />
    </AuthProvider>
  );
}

export default App;
