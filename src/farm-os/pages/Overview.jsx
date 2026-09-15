import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import "./Overview.css";

function Overview() {
  const [species, setSpecies] = useState([]);
  const [entityCount, setEntityCount] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");

      const [speciesRes, entitiesRes] = await Promise.all([
        supabase.from("species_config").select("id, name, category").order("name"),
        supabase.from("farm_entities").select("id", { count: "exact", head: true }),
      ]);

      if (speciesRes.error) {
        setError(speciesRes.error.message);
      } else {
        setSpecies(speciesRes.data ?? []);
      }

      if (!entitiesRes.error) {
        setEntityCount(entitiesRes.count ?? 0);
      }

      setLoading(false);
    }

    load();
  }, []);

  return (
    <div className="farmos-overview">
      <h1 className="farmos-overview__title">Overview</h1>
      <p className="farmos-overview__intro">
        This is the foundation slice — auth, database, and navigation are wired up.
        Daily Log, Inventory, and the rest come next.
      </p>

      {error && <p className="farmos-overview__error">{error}</p>}

      {loading ? (
        <p className="farmos-overview__loading">Loading farm data…</p>
      ) : (
        <>
          <section className="farmos-overview__cards">
            <div className="farmos-card">
              <span className="farmos-card__label">Configured species/crops</span>
              <span className="farmos-card__value">{species.length}</span>
            </div>
            <div className="farmos-card">
              <span className="farmos-card__label">Farm entities recorded</span>
              <span className="farmos-card__value">{entityCount ?? "—"}</span>
            </div>
          </section>

          <section className="farmos-overview__section">
            <h2 className="farmos-overview__section-title">Species configuration</h2>
            {species.length === 0 ? (
              <p className="farmos-overview__empty">
                No species configured yet — this will be seeded from the initial migration.
              </p>
            ) : (
              <ul className="farmos-overview__species-list">
                {species.map((s) => (
                  <li key={s.id} className="farmos-overview__species-item">
                    <span className="farmos-overview__species-name">{s.name}</span>
                    <span className="farmos-overview__species-category">{s.category}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {entityCount === 0 && (
            <section className="farmos-overview__section">
              <h2 className="farmos-overview__section-title">No farm entities yet</h2>
              <p className="farmos-overview__empty">
                Once Daily Log is built, this is where you'll register your actual quail,
                goat, and crop plots against the species above.
              </p>
            </section>
          )}
        </>
      )}
    </div>
  );
}

export default Overview;
