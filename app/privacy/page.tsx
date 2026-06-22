export default function PrivacyPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#08080e", padding: "60px 24px", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(126,200,227,0.5)", marginBottom: 12 }}>
          Simple Window Cleaning
        </div>
        <h1 style={{ color: "rgba(255,255,255,0.92)", fontSize: 28, fontWeight: 800, marginBottom: 32, letterSpacing: "-0.02em" }}>
          Privacy Policy
        </h1>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Information We Collect</h2>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 14, lineHeight: 1.7 }}>
            When you book a service we collect your name, service address, email address, and mobile phone number. We also collect notes you provide about your property (gate codes, access instructions, etc.).
          </p>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>How We Use It</h2>
          <ul style={{ color: "rgba(255,255,255,0.55)", fontSize: 14, lineHeight: 1.8, paddingLeft: 20 }}>
            <li>To schedule and fulfill your window cleaning service</li>
            <li>To send dispatch notifications via SMS (if you provide a mobile number)</li>
            <li>To send a post-service review request</li>
            <li>To contact you about your booking if needed</li>
          </ul>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>SMS</h2>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 14, lineHeight: 1.7 }}>
            Mobile numbers are used only for service-related notifications. We do not send marketing messages. We do not share or sell your mobile number to third parties. Reply STOP at any time to opt out.
          </p>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Data Sharing</h2>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 14, lineHeight: 1.7 }}>
            We do not sell or share your personal information with third parties for marketing purposes. Your data is stored securely and used solely to operate your service.
          </p>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Contact</h2>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 14, lineHeight: 1.7 }}>
            Questions about your data: <a href="mailto:simplewindowcleaning@gmail.com" style={{ color: "rgba(126,200,227,0.8)" }}>simplewindowcleaning@gmail.com</a>
          </p>
        </section>

        <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 11 }}>Last updated: June 2026</p>
      </div>
    </div>
  );
}
