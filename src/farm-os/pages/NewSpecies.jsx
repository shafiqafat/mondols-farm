import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Leaf, Plus } from "lucide-react";

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

const CAPABILITY_OPTIONS = [
  { key: "feed", label: "Feed" },
  { key: "health", label: "Health" },
  { key: "weight", label: "Weight" },
  { key: "egg", label: "Egg production" },
  { key: "breeding", label: "Breeding" },
  { key: "milk", label: "Milk" },
  { key: "harvest", label: "Harvest" },
];

const CATEGORY_OPTIONS = ["poultry", "livestock", "crop", "fodder"];

function emptyCapabilitySet() {
  return CAPABILITY_OPTIONS.reduce(
    (acc, capability) => ({
      ...acc,
      [capability.key]: false,
    }),
    {},
  );
}

function NewSpecies() {
  const navigate = useNavigate();

  const [newSpecies, setNewSpecies] = useState({
    name: "",
    category: "poultry",
    capabilities: emptyCapabilitySet(),
    spaceUnit: "",
    feedUnit: "",
  });

  const [savingSpecies, setSavingSpecies] = useState(false);
  const [pageError, setPageError] = useState("");

  function toggleCapability(key) {
    setNewSpecies((prev) => ({
      ...prev,
      capabilities: {
        ...prev.capabilities,
        [key]: !prev.capabilities[key],
      },
    }));
  }

  function capabilitiesToPayload(capMap) {
    const payload = {};

    for (const key of Object.keys(capMap)) {
      if (capMap[key]) {
        payload[key] = {};
      }
    }

    return payload;
  }

  async function handleAddSpecies(e) {
    e.preventDefault();

    if (!newSpecies.name.trim()) {
      return;
    }

    setSavingSpecies(true);
    setPageError("");

    const { error } = await supabase.from("species_config").insert({
      name: newSpecies.name.trim(),
      category: newSpecies.category,
      capabilities: capabilitiesToPayload(newSpecies.capabilities),
      space_unit: newSpecies.spaceUnit || null,
      feed_unit: newSpecies.feedUnit || null,
    });

    setSavingSpecies(false);

    if (error) {
      setPageError(error.message);
      return;
    }

    navigate("/farm-os/species");
  }

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-5 border-b border-border/60 pb-7">
        <div className="flex items-center gap-2">
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
        </div>
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
            <Leaf className="size-4 text-primary" />
            <span>Farm configuration</span>
          </div>

          <div>
            <h1 className="text-4xl font-semibold tracking-[-0.03em] text-foreground sm:text-5xl">
              Add species or crop
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Create a reusable configuration for a new animal, crop, or fodder
              type.
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
          <CardTitle className="text-base">
            Species / crop configuration
          </CardTitle>

          <CardDescription>
            Define the capabilities Farm OS should support for this type.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-5 sm:p-6">
          <form onSubmit={handleAddSpecies} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="species-name" className="text-sm font-medium">
                  Name
                </label>

                <Input
                  id="species-name"
                  type="text"
                  placeholder="e.g. Cow"
                  value={newSpecies.name}
                  onChange={(e) =>
                    setNewSpecies((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="species-category"
                  className="text-sm font-medium"
                >
                  Category
                </label>

                <select
                  id="species-category"
                  value={newSpecies.category}
                  onChange={(e) =>
                    setNewSpecies((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {CATEGORY_OPTIONS.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="species-space-unit"
                  className="text-sm font-medium"
                >
                  Space unit
                </label>

                <Input
                  id="species-space-unit"
                  type="text"
                  placeholder="e.g. sq ft"
                  value={newSpecies.spaceUnit}
                  onChange={(e) =>
                    setNewSpecies((prev) => ({
                      ...prev,
                      spaceUnit: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="species-feed-unit"
                  className="text-sm font-medium"
                >
                  Feed unit
                </label>

                <Input
                  id="species-feed-unit"
                  type="text"
                  placeholder="e.g. kg/day"
                  value={newSpecies.feedUnit}
                  onChange={(e) =>
                    setNewSpecies((prev) => ({
                      ...prev,
                      feedUnit: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium">Capabilities</p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Choose which farm operations this species or crop supports.
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {CAPABILITY_OPTIONS.map((capability) => (
                  <label
                    key={capability.key}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-border/70 px-3 py-2.5 text-sm transition-colors hover:bg-muted/50"
                  >
                    <input
                      type="checkbox"
                      checked={newSpecies.capabilities[capability.key]}
                      onChange={() => toggleCapability(capability.key)}
                      className="size-4 accent-primary"
                    />

                    <span>{capability.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="submit"
                disabled={savingSpecies || !newSpecies.name.trim()}
                className="gap-2"
              >
                <Plus className="size-4" />

                {savingSpecies ? "Adding…" : "Add species"}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/farm-os/species")}
                disabled={savingSpecies}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default NewSpecies;
