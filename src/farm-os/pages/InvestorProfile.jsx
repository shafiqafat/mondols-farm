import { useState } from "react";
import { useInvestorProfile } from "../hooks/useInvestorProfile";

function InfoItem({ label, value }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-sm text-muted-foreground">{label}</p>

      <p className="mt-1 font-medium">{value || "—"}</p>
    </div>
  );
}

export default function InvestorProfile() {
  const { profile, loading, saving, error, reload, updateProfile } =
    useInvestorProfile();

  const [editing, setEditing] = useState(false);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const handleCancel = () => {
    setPhone(profile?.phone || "");
    setAddress(profile?.address || "");
    setEditing(false);
  };

  const handleSave = async (event) => {
    event.preventDefault();

    const updatedProfile = await updateProfile({
      phone,
      address,
    });

    if (updatedProfile) {
      setEditing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6">
        <p className="font-medium">Investor profile not found.</p>

        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

        <button
          type="button"
          onClick={reload}
          className="mt-4 text-sm font-medium underline underline-offset-4"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Account
        </p>

        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Profile</h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Your investor account information.
        </p>
      </section>

      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Investor Information</p>

            <p className="mt-1 text-sm text-muted-foreground">
              Information associated with your investor account.
            </p>
          </div>

          {!editing && (
            <button
              type="button"
              onClick={() => {
                setPhone(profile.phone || "");
                setAddress(profile.address || "");
                setEditing(true);
              }}
              className="rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              Edit Profile
            </button>
          )}
        </div>

        {error && (
          <div className="mt-5 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {editing ? (
          <form onSubmit={handleSave} className="mt-6 space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="rounded-lg border p-4">
                <label
                  htmlFor="investor-phone"
                  className="text-sm text-muted-foreground"
                >
                  Phone
                </label>

                <input
                  id="investor-phone"
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Enter phone number"
                />
              </div>

              <div className="rounded-lg border p-4">
                <label
                  htmlFor="investor-address"
                  className="text-sm text-muted-foreground"
                >
                  Address
                </label>

                <input
                  id="investor-address"
                  type="text"
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Enter address"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <InfoItem label="Name" value={profile.name} />

            <InfoItem label="Email" value={profile.email} />

            <InfoItem label="Phone" value={profile.phone} />

            <InfoItem label="Address" value={profile.address} />

            <InfoItem
              label="Account Status"
              value={
                profile.status
                  ? profile.status.charAt(0).toUpperCase() +
                    profile.status.slice(1)
                  : "—"
              }
            />
          </div>
        )}
      </section>
    </div>
  );
}
