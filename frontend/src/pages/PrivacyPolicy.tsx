const sections = [
  {
    title: "1. Information We Collect",
    content: `We collect information you provide directly when using the CRM application:
• Account information: name, email address, and role assigned by your organization.
• Usage data: actions performed within the app such as creating leads, tasks, projects, and customer records.
• Device information: device type, operating system, and app version for diagnostic purposes.`,
  },
  {
    title: "2. How We Use Your Information",
    content: `We use the collected information solely to:
• Provide and operate the CRM features (leads, tasks, projects, customers, calendar).
• Send in-app and push notifications relevant to your work.
• Maintain activity logs for accountability within your organization.
• Improve app performance and fix issues.`,
  },
  {
    title: "3. Data Storage & Security",
    content: `All data is stored on your organization's private server. We implement industry-standard security measures including:
• JWT-based authentication with expiring tokens.
• Encrypted HTTPS communication between the app and server.
• Role-based access control — staff and users can only access data permitted by their role.`,
  },
  {
    title: "4. Data Sharing",
    content: `We do not sell, trade, or share your personal data with third parties. Data is only accessible to:
• Members of your organization with appropriate role permissions.
• System administrators managing the CRM instance.`,
  },
  {
    title: "5. Push Notifications",
    content: `If you grant notification permission, we use OneSignal to deliver push notifications about tasks, leads, and announcements. You can revoke notification permission at any time from your device settings. We do not use notification data for advertising.`,
  },
  {
    title: "6. Google Calendar Integration",
    content: `If you connect Google Calendar, we request access only to create and read calendar events related to your CRM meetings. We do not access, store, or share any other Google account data. You can disconnect Google Calendar at any time from the Settings page.`,
  },
  {
    title: "7. Data Retention",
    content: `Your data is retained as long as your account is active within the organization. When an account is removed by an administrator, associated personal data is deleted from the system. Activity logs may be retained for a period defined by your organization's administrator.`,
  },
  {
    title: "8. Your Rights",
    content: `You have the right to:
• Access the personal data stored about you.
• Request correction of inaccurate data.
• Request deletion of your account and associated data (contact your administrator).`,
  },
  {
    title: "9. Children's Privacy",
    content: `This application is intended for business use by adults. We do not knowingly collect data from anyone under the age of 18.`,
  },
  {
    title: "10. Changes to This Policy",
    content: `We may update this Privacy Policy from time to time. Any changes will be reflected with an updated effective date below. Continued use of the app after changes constitutes acceptance of the updated policy.`,
  },
  {
    title: "11. Contact",
    content: `If you have any questions about this Privacy Policy, please contact your organization's CRM administrator or reach us at:\n\nshop.rankkarlo.in`,
  },
];

const PrivacyPolicy = () => (
  <div className="min-h-screen bg-background">
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
            C
          </div>
          <span className="text-lg font-bold">CRM</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mt-1">Effective date: {new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</p>
        <p className="text-sm text-muted-foreground mt-3">
          This Privacy Policy describes how the CRM application collects, uses, and protects your information when you use our mobile or web application.
        </p>
      </div>

      {/* Sections */}
      <div className="space-y-6">
        {sections.map((s) => (
          <div key={s.title}>
            <h2 className="text-sm font-semibold mb-2">{s.title}</h2>
            <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{s.content}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 pt-6 border-t border-border text-xs text-muted-foreground text-center">
        © {new Date().getFullYear()} CRM by DBS. All rights reserved.
      </div>
    </div>
  </div>
);

export default PrivacyPolicy;
