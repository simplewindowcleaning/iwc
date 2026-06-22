export default function TermsPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#08080e", padding: "60px 24px", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(126,200,227,0.5)", marginBottom: 12 }}>
          Simple Window Cleaning
        </div>
        <h1 style={{ color: "rgba(255,255,255,0.92)", fontSize: 28, fontWeight: 800, marginBottom: 32, letterSpacing: "-0.02em" }}>
          Terms of Service
        </h1>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Service</h2>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 14, lineHeight: 1.7 }}>
            Simple Window Cleaning provides residential and commercial window cleaning services in Santa Cruz County, CA. Booking through this site constitutes a service request, not a guaranteed reservation, until confirmed by Simple Window Cleaning.
          </p>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Pricing & Payment</h2>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 14, lineHeight: 1.7 }}>
            Pricing is per window as displayed at the time of booking. Payment is due upon completion of service via Venmo. Window minimums vary by service area.
          </p>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Cancellations</h2>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 14, lineHeight: 1.7 }}>
            Please cancel or reschedule at least 24 hours before your scheduled service. Late cancellations may result in a trip fee.
          </p>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>SMS Notifications</h2>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 14, lineHeight: 1.7 }}>
            By providing a mobile number you agree to receive service notifications via SMS. Message frequency varies per visit. Msg & data rates may apply. Reply STOP to opt out. See our{" "}
            <a href="/sms-consent" style={{ color: "rgba(126,200,227,0.8)" }}>SMS consent policy</a> for full details.
          </p>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Liability</h2>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 14, lineHeight: 1.7 }}>
            Simple Window Cleaning is fully insured. Any damage claims must be reported within 24 hours of service completion.
          </p>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Contact</h2>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 14, lineHeight: 1.7 }}>
            <a href="mailto:simplewindowcleaning@gmail.com" style={{ color: "rgba(126,200,227,0.8)" }}>simplewindowcleaning@gmail.com</a><br />
            325 Soquel Ave, Santa Cruz CA 95062
          </p>
        </section>

        <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 11 }}>Last updated: June 2026</p>
      </div>
    </div>
  );
}
