import { useState } from "react";
import {
  Archive,
  Leaf,
  Pencil,
  RotateCcw,
  Trash2,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function createCapabilitySet(capabilityOptions, capabilities = {}) {
  return capabilityOptions.reduce(
    (acc, capability) => ({
      ...acc,
      [capability.key]: Boolean(capabilities[capability.key]),
    }),
    {},
  );
}

function SpeciesConfigCard({
  species,
  index,
  visible,
  capabilityOptions,
  actionLoading,
  onSaveCapabilities,
  onArchive,
  onRestore,
  onDelete,
}) {
  const [editing, setEditing] = useState(false);
  const [editingCapabilities, setEditingCapabilities] = useState(() =>
    createCapabilitySet(capabilityOptions, species.capabilities),
  );
  const [saving, setSaving] = useState(false);

  function startEditing() {
    setEditingCapabilities(
      createCapabilitySet(capabilityOptions, species.capabilities),
    );
    setEditing(true);
  }

  async function handleSave() {
    setSaving(true);

    const saved = await onSaveCapabilities(species, editingCapabilities);

    setSaving(false);

    if (saved) {
      setEditing(false);
    }
  }

  function cancelEditing() {
    setEditing(false);
    setEditingCapabilities(
      createCapabilitySet(capabilityOptions, species.capabilities),
    );
  }

  return (
    <Card
      className={`species-config-card ${
        visible ? "species-config-card-visible" : ""
      } border-border/70 bg-card shadow-sm`}
      style={{ "--delay": `${index * 80}ms` }}
    >
      <CardHeader className="border-b border-border/50 bg-muted/[0.18] px-5 py-4 sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Leaf className="size-4" />
            </div>

            <div className="min-w-0">
              <CardTitle className="truncate text-base">
                {species.name}
              </CardTitle>

              <CardDescription className="mt-1 capitalize">
                {species.category}
              </CardDescription>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Badge variant="secondary" className="capitalize">
              {species.category}
            </Badge>

            {species.archived_at ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 px-2.5"
                  disabled={actionLoading}
                  onClick={() => onRestore(species)}
                >
                  <RotateCcw className="size-3.5" />
                  <span>{actionLoading ? "Restoring…" : "Restore"}</span>
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 px-2.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={actionLoading}
                  onClick={() => onDelete(species)}
                >
                  <Trash2 className="size-3.5" />
                  <span>Delete</span>
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 px-2.5"
                  onClick={startEditing}
                  disabled={saving}
                >
                  <Pencil className="size-3.5" />
                  <span>Edit</span>
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 px-2.5"
                  disabled={actionLoading}
                  onClick={() => onArchive(species)}
                >
                  <Archive className="size-3.5" />
                  <span>{actionLoading ? "Archiving…" : "Archive"}</span>
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 px-2.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={actionLoading}
                  onClick={() => onDelete(species)}
                >
                  <Trash2 className="size-3.5" />
                  <span>Delete</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>

      {editing ? (
        <CardContent className="species-edit-panel pt-1">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium">Capabilities</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Select the capabilities this species or crop should support.
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {capabilityOptions.map((capability) => (
                <label
                  key={capability.key}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-border/70 px-3 py-2.5 text-sm transition-colors hover:bg-muted/50"
                >
                  <input
                    type="checkbox"
                    checked={!!editingCapabilities[capability.key]}
                    onChange={() =>
                      setEditingCapabilities((prev) => ({
                        ...prev,
                        [capability.key]: !prev[capability.key],
                      }))
                    }
                    className="size-4 accent-primary"
                  />
                  <span>{capability.label}</span>
                </label>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving…" : "Save changes"}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={cancelEditing}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          </div>
        </CardContent>
      ) : (
        <CardContent className="pt-1 pb-4">
          <div className="flex flex-wrap gap-2">
            {Object.keys(species.capabilities ?? {}).length === 0 ? (
              <span className="text-sm text-muted-foreground">
                No capabilities set
              </span>
            ) : (
              Object.keys(species.capabilities).map((key, capabilityIndex) => (
                <Badge
                  key={key}
                  variant="outline"
                  className="species-capability-badge font-normal"
                  style={{ "--delay": `${capabilityIndex * 60}ms` }}
                >
                  {capabilityOptions.find((item) => item.key === key)?.label ??
                    key}
                </Badge>
              ))
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default SpeciesConfigCard;
