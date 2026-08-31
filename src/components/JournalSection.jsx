import SectionHeading from "./SectionHeading";
import JournalCard from "./JournalCard";

import journalPosts from "../data/journal";

import "./JournalSection.css";
import { Link } from "react-router-dom";

function JournalSection() {
  const featuredPost = journalPosts.find((post) => post.featured);

  const regularPosts = journalPosts.filter((post) => !post.featured);

  return (
    <section className="journal-section section">
      <div className="container">
        <div className="journal-section__header">
          <SectionHeading
            eyebrow="F R O M &nbsp; T H E &nbsp; J O U R N A L"
            title="Stories from the farm."
            description="Notes on farming, food, rural life, and the changing seasons."
          />
        </div>

        <div className="journal-section__grid">
          {featuredPost && <JournalCard {...featuredPost} />}

          {regularPosts.map((post) => (
            <JournalCard key={post.id} {...post} />
          ))}
        </div>

        <div className="journal-section__footer">
          <Link to="/journal">
            Explore Journal
            <span>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default JournalSection;
