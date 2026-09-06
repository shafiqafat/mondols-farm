import SectionHeading from "./SectionHeading";
import ProjectCard from "./ProjectCard";

import { Link } from "react-router-dom";
import projects from "../data/projects";

import "./ProjectsSection.css";

function ProjectsSection() {
  const displayedProjects = projects.slice(0, 2); // Display only the first 2 projects

  return (
    <section className="projects section">
      <div className="container">
        <div className="projects__header">
          <SectionHeading
            eyebrow="O N &nbsp; T H E &nbsp; F A R M"
            title="What we're growing."
            description="A look at the projects, crops, and animals that are shaping life at Mondol's Farm."
          />

          {/* <span className="projects__count">
            {displayedProjects.length} CURRENT PROJECTS
          </span> */}
        </div>

        <div className="projects__grid">
          {displayedProjects.map((project) => (
            <ProjectCard key={project.id} {...project} />
          ))}
        </div>

        <div className="projects__footer">
          <Link to="/farm">
            Explore All Projects
            <span>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default ProjectsSection;