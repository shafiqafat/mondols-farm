import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/farm-os/lib/supabaseClient";
import {
  Building2,
  Boxes,
  CircleDollarSign,
  Shield,
  SlidersHorizontal,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function Settings() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState({
    name: "",
    location: "",
    contact_email: "",
    contact_phone: "",
    description: "",
  });

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  useEffect(() => {
    let cancelled = false;

    async function fetchProfile() {
      const { data, error } = await supabase
        .from("farm_profile")
        .select("id, name, location, contact_email, contact_phone, description")
        .limit(1)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        setProfileError(error.message);
        setLoadingProfile(false);
        return;
      }

      if (data) {
        setProfile({
          name: data.name ?? "",
          location: data.location ?? "",
          contact_email: data.contact_email ?? "",
          contact_phone: data.contact_phone ?? "",
          description: data.description ?? "",
        });
      }

      setLoadingProfile(false);
    }

    fetchProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSaveProfile(e) {
    e.preventDefault();

    if (!profile.name.trim()) {
      setProfileError("Farm name is required.");
      setProfileMessage("");
      return;
    }

    setSavingProfile(true);
    setProfileError("");
    setProfileMessage("");

    const { data: existing, error: findError } = await supabase
      .from("farm_profile")
      .select("id")
      .limit(1)
      .maybeSingle();

    if (findError) {
      setProfileError(findError.message);
      setSavingProfile(false);
      return;
    }

    const payload = {
      name: profile.name.trim(),
      location: profile.location.trim() || null,
      contact_email: profile.contact_email.trim() || null,
      contact_phone: profile.contact_phone.trim() || null,
      description: profile.description.trim() || null,
    };

    const { error } = existing
      ? await supabase
          .from("farm_profile")
          .update(payload)
          .eq("id", existing.id)
      : await supabase.from("farm_profile").insert(payload);

    setSavingProfile(false);

    if (error) {
      setProfileError(error.message);
      return;
    }

    setProfileMessage("Farm profile saved.");
  }

  const sections = [
    {
      title: "Farm Profile",
      description: "Basic information about your farm and organization.",
      icon: Building2,
      items: ["Farm name", "Location", "Contact information"],
    },
    {
      title: "Farm Configuration",
      description: "Configure how Farm OS understands your farm.",
      icon: SlidersHorizontal,
      items: ["Species & variants", "Tracking modes", "Event capabilities"],
      action: () => navigate("/species"),
    },
    {
      title: "Inventory",
      description: "Configure inventory and stock-management defaults.",
      icon: Boxes,
      items: ["Units", "Reorder settings", "Safety stock"],
      action: () => navigate("/inventory"),
    },
    {
      title: "Finance",
      description: "Configure financial defaults used throughout Farm OS.",
      icon: CircleDollarSign,
      items: ["Currency", "Expense categories", "Income categories"],
      action: () => navigate("/finance"),
    },
    {
      title: "Users & Access",
      description: "Manage Farm OS users and their permissions.",
      icon: Users,
      items: ["Users", "Roles", "Access control"],
    },
    {
      title: "System",
      description: "System information and administrative controls.",
      icon: Shield,
      items: ["Audit history", "Application information"],
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>

        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Configure Mondol&apos;s Farm OS and manage how the system operates.
        </p>
      </div>

      <div className="settings-grid grid gap-4 md:grid-cols-2">
        {sections.map((section) => {
          const Icon = section.icon;

          if (section.title === "Farm Profile") {
            return (
              <Card
                key={section.title}
                className="border-border/70 shadow-sm md:col-span-2"
              >
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-lg bg-primary/10 p-2.5">
                      <Building2 className="size-5 text-primary" />
                    </div>

                    <div>
                      <CardTitle>Farm Profile</CardTitle>
                      <CardDescription className="mt-1">
                        Basic information about your farm and organization.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {loadingProfile ? (
                    <p className="text-sm text-muted-foreground">
                      Loading farm profile…
                    </p>
                  ) : (
                    <form onSubmit={handleSaveProfile} className="space-y-5">
                      <div className="grid gap-5 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            Farm name
                          </label>

                          <input
                            value={profile.name}
                            onChange={(e) =>
                              setProfile((prev) => ({
                                ...prev,
                                name: e.target.value,
                              }))
                            }
                            placeholder="Mondol's Farm"
                            className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            Location
                          </label>

                          <input
                            value={profile.location}
                            onChange={(e) =>
                              setProfile((prev) => ({
                                ...prev,
                                location: e.target.value,
                              }))
                            }
                            placeholder="Dhamoirhat, Naogaon"
                            className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            Contact email
                          </label>

                          <input
                            type="email"
                            value={profile.contact_email}
                            onChange={(e) =>
                              setProfile((prev) => ({
                                ...prev,
                                contact_email: e.target.value,
                              }))
                            }
                            placeholder="farm@example.com"
                            className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            Contact phone
                          </label>

                          <input
                            value={profile.contact_phone}
                            onChange={(e) =>
                              setProfile((prev) => ({
                                ...prev,
                                contact_phone: e.target.value,
                              }))
                            }
                            placeholder="+880..."
                            className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Description
                        </label>

                        <textarea
                          value={profile.description}
                          onChange={(e) =>
                            setProfile((prev) => ({
                              ...prev,
                              description: e.target.value,
                            }))
                          }
                          rows={4}
                          placeholder="A short description of the farm..."
                          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>

                      {profileError && (
                        <p className="text-sm text-destructive">
                          {profileError}
                        </p>
                      )}

                      {profileMessage && (
                        <p className="text-sm text-muted-foreground">
                          {profileMessage}
                        </p>
                      )}

                      <Button type="submit" disabled={savingProfile}>
                        {savingProfile ? "Saving…" : "Save changes"}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            );
          }

          return (
            <Card
              key={section.title}
              className={`settings-card border-border/70 shadow-sm ${
                section.action
                  ? "cursor-pointer transition-colors hover:border-primary/30 hover:bg-muted/20"
                  : ""
              }`}
              onClick={section.action}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle>{section.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {section.description}
                    </CardDescription>
                  </div>

                  <div className="rounded-lg border bg-muted/30 p-2">
                    <Icon className="size-5 text-muted-foreground" />
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="divide-y rounded-lg border">
                  {section.items.map((item) => (
                    <div
                      key={item}
                      className="flex items-center justify-between px-3 py-2.5 text-sm"
                    >
                      <span className="text-muted-foreground">{item}</span>

                      {section.action && (
                        <span className="text-muted-foreground">→</span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default Settings;
