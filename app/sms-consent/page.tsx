export default function SMSConsentPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#08080e", padding: "60px 24px", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>

        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(126,200,227,0.5)", marginBottom: 12 }}>
          Simple Window Cleaning
        </div>
        <h1 style={{ color: "rgba(255,255,255,0.92)", fontSize: 28, fontWeight: 800, marginBottom: 32, letterSpacing: "-0.02em" }}>
          SMS Opt-In Policy
        </h1>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>How We Collect Consent</h2>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 14, lineHeight: 1.7 }}>
            Customers provide their mobile phone number during the booking process at{" "}
            <a href="https://www.ladderlesswindows.com" style={{ color: "rgba(126,200,227,0.8)" }}>ladderlesswindows.com</a>.
            At the point of number entry, customers are shown the following disclosure:
          </p>
          <div style={{ margin: "16px 0", padding: "16px 20px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10 }}>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, lineHeight: 1.7, margin: 0, fontStyle: "italic" }}>
              "By providing your mobile number you agree to receive service notifications via SMS (dispatch updates, arrival alerts, job-complete confirmations). Msg &amp; data rates may apply. Reply STOP to opt out at any time."
            </p>
          </div>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Message Types</h2>
          <ul style={{ color: "rgba(255,255,255,0.55)", fontSize: 14, lineHeight: 1.8, paddingLeft: 20 }}>
            <li>Crew en-route notification when a technician is on the way</li>
            <li>Arrival notification when the crew reaches the property</li>
            <li>Job-complete confirmation with a link to leave a review</li>
          </ul>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Opt-Out</h2>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 14, lineHeight: 1.7 }}>
            Customers may reply <strong style={{ color: "rgba(255,255,255,0.75)" }}>STOP</strong> to any message at any time to unsubscribe. No further messages will be sent.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Sender</h2>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 14, lineHeight: 1.7 }}>
            Messages are sent from Simple Window Cleaning, 325 Soquel Ave, Santa Cruz CA 95062.<br />
            Questions: <a href="mailto:simplewindowcleaning@gmail.com" style={{ color: "rgba(126,200,227,0.8)" }}>simplewindowcleaning@gmail.com</a>
          </p>
        </section>

        <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 11, marginBottom: 16 }}>
          Last updated: June 2026
        </p>
        <div style={{ display: "flex", gap: 20 }}>
          <a href="/privacy" style={{ color: "rgba(126,200,227,0.5)", fontSize: 12 }}>Privacy Policy</a>
          <a href="/terms" style={{ color: "rgba(126,200,227,0.5)", fontSize: 12 }}>Terms of Service</a>
        </div>
      </div>
    </div>
  );
}
