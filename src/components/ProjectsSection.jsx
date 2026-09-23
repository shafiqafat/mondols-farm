import SectionHeading from "./SectionHeading";
import ProjectCard from "./ProjectCard";

import { Link } from "react-router-dom";
import projects from "../data/projects";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import "./ProjectsSection.css";

gsap.registerPlugin(ScrollTrigger);

function ProjectsSection() {
  const displayedProjects = projects.slice(0, 2); // Display only the first 2 projects
  const projectsRef = useRef(null);

  useEffect(() => {
    const section = projectsRef.current;

    if (!section) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) return;

    const cards = section.querySelectorAll(".project-card");
    const header = section.querySelector(".projects__header");

    const ctx = gsap.context(() => {
      gsap.set(header, {
        opacity: 0,
        y: 25,
      });

      gsap.set(cards, {
        opacity: 0,
        y: 45,
      });

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top 75%",
          once: true,
        },
        defaults: {
          ease: "power3.out",
        },
      });

      timeline
        .to(header, {
          opacity: 1,
          y: 0,
          duration: 0.7,
        })
        .to(
          cards,
          {
            opacity: 1,
            y: 0,
            duration: 0.75,
            stagger: 0.12,
          },
          0.25,
        );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={projectsRef} className="projects section">
      <div className="container">
        <div className="projects__header">
          <SectionHeading
            eyebrow="O N &nbsp; T H E &nbsp; F A R M"
            title="What we're growing."
            description="A look at the projects, crops, and animals that are shaping life at Mondol's Farm."
          />
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