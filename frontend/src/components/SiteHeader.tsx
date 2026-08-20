import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, Pill, ShoppingCart, User } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/hooks/useAuth";

const links = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/prescriptions", label: "Prescriptions" },
  { to: "/orders", label: "My orders" },
   { to: "/support", label: "Customer Support" },
] as const;

export function SiteHeader() {
  const { count } = useCart();
  const { user, signOut } = useAuth();

  const displayName =
    user?.full_name?.trim() || user?.email?.split("@")[0] || "My account";
  const userInitial = displayName.charAt(0).toUpperCase();

  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Pill className="size-5" />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">
            MediCare <span className="text-primary">Pharmacy</span>
          </span>
        </Link>

        <nav className="ml-6 hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              activeOptions={{ exact: link.to === "/" }}
              activeProps={{ className: "bg-secondary text-secondary-foreground" }}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button asChild variant="ghost" size="icon" className="relative" aria-label="Cart">
            <Link to="/cart">
              <ShoppingCart className="size-5" />
              {count > 0 && (
                <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-semibold text-accent-foreground">
                  {count}
                </span>
              )}
            </Link>
          </Button>

          {user ? (
            <div className="hidden items-center gap-2 md:flex">
              <div className="flex min-w-0 items-center gap-2">
                <span
                  aria-hidden="true"
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground"
                >
                  {userInitial}
                </span>
                <span className="max-w-[180px] truncate text-sm font-semibold text-foreground">
                  {displayName}
                </span>
              </div>

              <Button
                variant="default"
                size="sm"
                onClick={handleSignOut}
                className="bg-primary text-primary-foreground hover:bg-orange-500"
              >
                Sign out
              </Button>
            </div>
          ) : (
            <Button asChild size="sm" className="hidden md:inline-flex">
              <Link to="/auth">
                <User className="mr-1.5 size-4" /> Sign in
              </Link>
            </Button>
          )}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <nav className="mt-8 flex flex-col gap-1">
                {links.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
                  >
                    {link.label}
                  </Link>
                ))}

                {user ? (
                  <div className="mt-4 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground"
                      >
                        {userInitial}
                      </span>
                      <span className="max-w-[220px] break-words text-sm font-semibold text-foreground">
                        {displayName}
                      </span>
                    </div>

                    <Button
                      variant="default"
                      onClick={handleSignOut}
                      className="w-full bg-primary text-primary-foreground hover:bg-orange-500"
                    >
                      Sign out
                    </Button>
                  </div>
                ) : (
                  <Button asChild className="mt-4">
                    <Link to="/auth" onClick={() => setOpen(false)}>
                      Sign in
                    </Link>
                  </Button>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}