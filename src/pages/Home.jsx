import Hero from "../components/Hero";
import IntroSection from "../components/IntroSection";
import ProjectsSection from "../components/ProjectsSection";
import ProduceSection from "../components/ProduceSection";
import StaySection from "../components/StaySection";
import ExperiencesSection from "../components/ExperiencesSection";
import JournalSection from "../components/JournalSection";
import FinalCTA from "../components/FinalCTA";
import GallerySection from "../components/GallerySection";
import PageMeta from "../components/PageMeta";


function Home() {
  return (
    <main>
      <PageMeta
        title="Growing With Nature"
        description="A small countryside farm in Naogaon, Bangladesh, growing seasonal produce, raising animals, and creating simple rural stays."
      />
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
