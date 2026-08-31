import SectionHeading from "./SectionHeading";
import ProjectCard from "./ProjectCard";

import projects from "../data/projects";

import "./ProjectsSection.css";

function ProjectsSection() {
  return (
    <section className="projects section">
      <div className="container">
        <div className="projects__header">
          <SectionHeading
            eyebrow="O N &nbsp; T H E &nbsp; F A R M"
            title="What we're growing."
            description="A look at the projects, crops, and animals that are shaping life at Mondol's Farm."
          />

          <span className="projects__count">
            {projects.length} CURRENT PROJECTS
          </span>
        </div>

        <div className="projects__grid">
          {projects.map((project) => (
            <ProjectCard key={project.id} {...project} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default ProjectsSection;
