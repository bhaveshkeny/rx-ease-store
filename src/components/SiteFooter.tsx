import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border bg-card">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3">
        <div>
          <h3 className="text-base font-semibold">MediCare Pharmacy</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Licensed online pharmacy dispensing prescription and over-the-counter medicines with
            pharmacist review on every order.
          </p>
        </div>
        <div className="text-sm">
          <h4 className="font-semibold">Shop</h4>
          <ul className="mt-2 space-y-1.5 text-muted-foreground">
            <li>
              <Link to="/shop" className="hover:text-foreground">
                All medicines
              </Link>
            </li>
            <li>
              <Link to="/prescriptions" className="hover:text-foreground">
                Upload a prescription
              </Link>
            </li>
            <li>
              <Link to="/orders" className="hover:text-foreground">
                Order history
              </Link>
            </li>
          </ul>
        </div>
        <div className="text-sm text-muted-foreground">
          <h4 className="font-semibold text-foreground">Safety</h4>
          <p className="mt-2">
            Prescription-only items are dispensed after a registered pharmacist verifies your
            prescription. Always read the label. This demo store does not replace medical advice.
          </p>
        </div>
      </div>
      <div className="border-t border-border px-4 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} MediCare Pharmacy. All rights reserved.
      </div>
    </footer>
  );
}
