import Hero from "../components/Hero";
import IntroSection from "../components/IntroSection";
import ProjectsSection from "../components/ProjectsSection";
import ProduceSection from "../components/ProduceSection";
import StaySection from "../components/StaySection";
import ExperiencesSection from "../components/ExperiencesSection";
import JournalSection from "../components/JournalSection";
import FinalCTA from "../components/FinalCTA";
import GallerySection from "../components/GallerySection";


function Home() {
  return (
    <main>
      <Hero />

      <IntroSection />

      <ProjectsSection />

      <ProduceSection />

      <StaySection home />

      <ExperiencesSection />

      <GallerySection home />

      <JournalSection />

      <FinalCTA />
    </main>
  );
}

export default Home;
