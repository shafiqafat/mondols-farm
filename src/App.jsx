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

function App() {
  return (
    <>
      <ScrollToTop />
      <InitialLoader />
      <PageLoader />

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

export default App;
