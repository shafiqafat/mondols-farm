import { useEffect, useState } from "react";
import { ArrowLeft, Leaf, Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { supabase } from "../lib/supabaseClient";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function NewRotationRule() {
  const navigate = useNavigate();

  const [speciesList, setSpeciesList] = useState([]);
  const [loadingSpecies, setLoadingSpecies] = useState(true);
  const [pageError, setPageError] = useState("");
  const [savingRule, setSavingRule] = useState(false);

  const [newRule, setNewRule] = useState({
    fromSpeciesId: "",
    toSpeciesId: "",
    reason: "",
  });

  useEffect(() => {
    async function loadSpecies() {
      setLoadingSpecies(true);
      setPageError("");

      const { data, error } = await supabase
        .from("species_config")
        .select("id, name, category")
        .order("name");

      if (error) {
        setPageError(error.message);
        setLoadingSpecies(false);
        return;
      }

      setSpeciesList(data ?? []);
      setLoadingSpecies(false);
    }

    loadSpecies();
  }, []);

  async function handleAddRule(e) {
    e.preventDefault();

    if (
      !newRule.fromSpeciesId ||
      !newRule.toSpeciesId ||
      !newRule.reason.trim()
    ) {
      return;
    }

    setSavingRule(true);
    setPageError("");

    const { error } = await supabase.from("crop_rotation_rules").insert({
      from_species_id: newRule.fromSpeciesId,
      to_species_id: newRule.toSpeciesId,
      reason: newRule.reason.trim(),
    });

    setSavingRule(false);

    if (error) {
      setPageError(error.message);
      return;
    }

    navigate("/farm-os/species");
  }

  const cropSpecies = speciesList.filter(
    (species) => species.category === "crop" || species.category === "fodder",
  );

  return (
    <div className="space-y-7">
      {/* Page Header */}
      <div className="flex flex-col gap-5 border-b border-border/60 pb-7">
        <div className="w-fit">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="!inline-flex !w-fit !flex-row !items-center !justify-start gap-2 whitespace-nowrap px-2"
          >
            <Link
              to="/farm-os/species"
              className="!inline-flex !w-fit !flex-row !items-center gap-2 whitespace-nowrap"
            >
              <ArrowLeft className="size-4 shrink-0" />
              <span className="whitespace-nowrap">
                Back to Species & Entities
              </span>
            </Link>
          </Button>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
            <Leaf className="size-4 text-primary" />
            <span>Farm configuration</span>
          </div>

          <div>
            <h1 className="text-4xl font-semibold tracking-[-0.03em] text-foreground sm:text-5xl">
              Add rotation rule
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Define which crop can reasonably follow another and why.
            </p>
          </div>
        </div>
      </div>

      {pageError && (
        <Card className="border-destructive/30 bg-destructive/[0.03]">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-destructive">{pageError}</p>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="border-b border-border/50 bg-muted/[0.18] px-5 py-4 sm:px-6">
          <CardTitle className="text-base">Crop rotation rule</CardTitle>

          <CardDescription>
            Explain what should follow a crop and why.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-5 sm:p-6">
          <form onSubmit={handleAddRule} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="rotation-from" className="text-sm font-medium">
                  After this crop
                </label>

                <select
                  id="rotation-from"
                  value={newRule.fromSpeciesId}
                  onChange={(e) =>
                    setNewRule((prev) => ({
                      ...prev,
                      fromSpeciesId: e.target.value,
                    }))
                  }
                  required
                  disabled={loadingSpecies}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">
                    {loadingSpecies ? "Loading crops…" : "Select crop…"}
                  </option>

                  {cropSpecies.map((species) => (
                    <option key={species.id} value={species.id}>
                      {species.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="rotation-to" className="text-sm font-medium">
                  Suggest this crop
                </label>

                <select
                  id="rotation-to"
                  value={newRule.toSpeciesId}
                  onChange={(e) =>
                    setNewRule((prev) => ({
                      ...prev,
                      toSpeciesId: e.target.value,
                    }))
                  }
                  required
                  disabled={loadingSpecies}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">
                    {loadingSpecies ? "Loading crops…" : "Select crop…"}
                  </option>

                  {cropSpecies.map((species) => (
                    <option key={species.id} value={species.id}>
                      {species.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="rotation-reason" className="text-sm font-medium">
                Reason
              </label>

              <Input
                id="rotation-reason"
                type="text"
                placeholder="e.g. Legume replenishes nitrogen after a heavy feeder"
                value={newRule.reason}
                onChange={(e) =>
                  setNewRule((prev) => ({
                    ...prev,
                    reason: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="submit"
                disabled={
                  savingRule ||
                  loadingSpecies ||
                  !newRule.fromSpeciesId ||
                  !newRule.toSpeciesId ||
                  !newRule.reason.trim()
                }
                className="flex-row items-center gap-2 rounded-[12px]"
              >
                <Plus className="size-4" />
                {savingRule ? "Adding…" : "Add rule"}
              </Button>

              <Button
                asChild
                type="button"
                variant="outline"
                disabled={savingRule}
              >
                <Link to="/farm-os/species">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default NewRotationRule;
