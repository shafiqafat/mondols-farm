import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function RotationRules({ rules }) {
  const sectionRef = useRef(null);
  useEffect(() => {
    const element = sectionRef.current;
    if (!element) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      element.classList.add("species-rotation-section-visible");
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          element.classList.add("species-rotation-section-visible");
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="species-rotation-section space-y-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Crop rotation rules
          </h2>

          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
            Define which crop can reasonably follow another and why. These
            rules can later be used as suggestions after a crop is harvested.
          </p>
        </div>

        <Button
          asChild
          size="sm"
          className="!inline-flex !w-fit !flex-row !items-center !justify-center gap-2 rounded-[12px] whitespace-nowrap px-3.5"
        >
          <Link
            to="/farm-os/species/rotation/new"
            className="!inline-flex !w-fit !flex-row !items-center gap-2 whitespace-nowrap"
          >
            <Plus className="size-4 shrink-0" />
            <span className="whitespace-nowrap">Add New Rule</span>
          </Link>
        </Button>
      </div>

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="border-b border-border/50 bg-muted/[0.18] px-5 py-4 sm:px-6">
          <CardTitle className="text-base">Existing rules</CardTitle>
          <CardDescription>
            Crop sequence recommendations configured for the farm.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {rules.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No rotation rules yet.
            </p>
          ) : (
            <div className="grid gap-3">
              {rules.map((rule, index) => (
                <div
                  key={rule.id}
                  className="species-rotation-rule-card species-rotation-rule-card-visible rounded-xl border border-border/70 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                  style={{ "--delay": `${index * 80}ms` }}
                >
                  <p className="text-sm font-medium">
                    {rule.from_species?.name} → {rule.to_species?.name}
                  </p>

                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {rule.reason}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

export default RotationRules;
