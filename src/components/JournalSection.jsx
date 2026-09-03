import SectionHeading from "./SectionHeading";
import JournalCard from "./JournalCard";
import journalPosts from "../data/journal";
import "./JournalSection.css";
import { Link } from "react-router-dom";

function JournalSection() {
  // Use the marked featured post.
  // If none exists, use the first post as the featured article.
  const featuredPost =
    journalPosts.find((post) => post.featured) || journalPosts[0];

  // Remove the featured post from the regular cards
  const regularPosts = journalPosts.filter(
    (post) => post.id !== featuredPost?.id,
  );

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
          {/* Featured article */}
          {featuredPost && <JournalCard {...featuredPost} featured />}

          {/* Two regular articles */}
          {regularPosts.slice(0, 2).map((post) => (
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
