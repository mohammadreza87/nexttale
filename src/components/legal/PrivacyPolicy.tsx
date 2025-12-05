import { ArrowLeft } from 'lucide-react';

interface PrivacyPolicyProps {
  onBack?: () => void;
}

export function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
  const lastUpdated = "December 4, 2025";

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
        )}

        <div className="bg-gray-900 rounded-3xl shadow-xl p-8 border border-gray-800">
          <div className="flex items-center gap-3 mb-6">
            <img src="/nexttale-logo.png" alt="Next Tale" className="w-10 h-10" />
            <span className="font-bold text-xl bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              NEXT TALE
            </span>
          </div>

          <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
          <p className="text-sm text-gray-500 mb-8">Last updated: {lastUpdated}</p>

          <div className="prose prose-invert max-w-none">
            {/* GDPR Notice */}
            <div className="bg-purple-900/30 border border-purple-500/30 rounded-2xl p-6 mb-8">
              <h3 className="text-lg font-semibold text-purple-300 mb-2">Your Privacy Rights</h3>
              <p className="text-purple-200 text-sm">
                Next Tale is committed to protecting your privacy and complying with the General Data Protection
                Regulation (GDPR) and other applicable privacy laws. You have the right to access, correct, delete,
                and port your personal data at any time.
              </p>
            </div>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">1. Introduction</h2>
              <p className="text-gray-300 mb-4">
                Welcome to Next Tale ("we," "our," or "us"). We are committed to protecting your privacy.
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information
                when you use our AI-powered interactive fiction platform.
              </p>
              <p className="text-gray-300">
                Please read this Privacy Policy carefully. By using Next Tale, you consent to the data practices
                described in this policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">2. Information We Collect</h2>

              <h3 className="text-lg font-medium text-gray-200 mb-2">2.1 Information You Provide</h3>
              <ul className="list-disc pl-6 text-gray-300 space-y-2 mb-4">
                <li><strong className="text-gray-200">Account Information:</strong> Email address, display name, and profile picture (optional)</li>
                <li><strong className="text-gray-200">Authentication Data:</strong> Information from third-party login providers (Google) if you choose</li>
                <li><strong className="text-gray-200">User Content:</strong> Stories you create, choices you make, and any comments</li>
                <li><strong className="text-gray-200">Payment Information:</strong> Processed securely by Stripe; we do not store your full payment card details</li>
                <li><strong className="text-gray-200">Communications:</strong> Any messages or feedback you send us</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-200 mb-2">2.2 Information Collected Automatically</h3>
              <ul className="list-disc pl-6 text-gray-300 space-y-2 mb-4">
                <li><strong className="text-gray-200">Usage Data:</strong> Pages visited, features used, stories read, and interactions</li>
                <li><strong className="text-gray-200">Device Information:</strong> Browser type, operating system, device type</li>
                <li><strong className="text-gray-200">Log Data:</strong> IP address, access times, and referring URLs</li>
                <li><strong className="text-gray-200">Cookies:</strong> Essential cookies for authentication and preferences</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-200 mb-2">2.3 Information from Third Parties</h3>
              <ul className="list-disc pl-6 text-gray-300 space-y-2">
                <li><strong className="text-gray-200">Google Sign-In:</strong> Basic profile information if you choose to sign in with Google</li>
                <li><strong className="text-gray-200">Payment Processor:</strong> Transaction status and subscription information from Stripe</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-300 mb-4">We use the information we collect to:</p>
              <ul className="list-disc pl-6 text-gray-300 space-y-2">
                <li>Provide, maintain, and improve the Service</li>
                <li>Create and manage your account</li>
                <li>Process transactions and send related information</li>
                <li>Generate personalized stories and recommendations</li>
                <li>Save your story progress and preferences</li>
                <li>Communicate with you about updates and support</li>
                <li>Monitor and analyze usage trends to improve user experience</li>
                <li>Detect, prevent, and address technical issues and security threats</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">4. Legal Basis for Processing (GDPR)</h2>
              <p className="text-gray-300 mb-4">
                For users in the European Economic Area (EEA), we process your personal data based on:
              </p>
              <ul className="list-disc pl-6 text-gray-300 space-y-2">
                <li><strong className="text-gray-200">Contract Performance:</strong> Processing necessary to provide the Service</li>
                <li><strong className="text-gray-200">Legitimate Interests:</strong> Improving our Service, security, and fraud prevention</li>
                <li><strong className="text-gray-200">Consent:</strong> Marketing communications and optional features</li>
                <li><strong className="text-gray-200">Legal Obligation:</strong> Compliance with applicable laws</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">5. Data Sharing and Disclosure</h2>
              <p className="text-gray-300 mb-4">
                We do not sell your personal information. We may share your information in these circumstances:
              </p>

              <h3 className="text-lg font-medium text-gray-200 mb-2">5.1 Service Providers</h3>
              <ul className="list-disc pl-6 text-gray-300 space-y-2 mb-4">
                <li><strong className="text-gray-200">Supabase:</strong> Database and authentication services</li>
                <li><strong className="text-gray-200">Google Cloud / Gemini AI:</strong> AI story generation</li>
                <li><strong className="text-gray-200">Leonardo AI:</strong> Image generation</li>
                <li><strong className="text-gray-200">ElevenLabs:</strong> Voice narration services</li>
                <li><strong className="text-gray-200">Stripe:</strong> Payment processing (PCI-DSS compliant)</li>
                <li><strong className="text-gray-200">Vercel:</strong> Hosting and content delivery</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-200 mb-2">5.2 Other Disclosures</h3>
              <ul className="list-disc pl-6 text-gray-300 space-y-2">
                <li><strong className="text-gray-200">Public Content:</strong> Stories you choose to make public are visible to other users</li>
                <li><strong className="text-gray-200">Legal Requirements:</strong> When required by law or to protect our rights</li>
                <li><strong className="text-gray-200">Business Transfers:</strong> In connection with a merger, acquisition, or sale</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">6. Your Rights (GDPR)</h2>
              <p className="text-gray-300 mb-4">
                If you are located in the European Economic Area, you have these rights:
              </p>
              <ul className="list-disc pl-6 text-gray-300 space-y-2">
                <li><strong className="text-gray-200">Right to Access:</strong> Request a copy of your personal data</li>
                <li><strong className="text-gray-200">Right to Rectification:</strong> Correct inaccurate or incomplete data</li>
                <li><strong className="text-gray-200">Right to Erasure:</strong> Request deletion ("right to be forgotten")</li>
                <li><strong className="text-gray-200">Right to Restriction:</strong> Limit processing in certain circumstances</li>
                <li><strong className="text-gray-200">Right to Data Portability:</strong> Receive your data in a machine-readable format</li>
                <li><strong className="text-gray-200">Right to Object:</strong> Object to processing for marketing purposes</li>
                <li><strong className="text-gray-200">Right to Withdraw Consent:</strong> Withdraw consent at any time</li>
              </ul>
              <p className="text-gray-300 mt-4">
                To exercise these rights, contact us at privacy@nexttale.app. We will respond within 30 days.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">7. Age Restriction</h2>
              <div className="bg-red-900/30 border border-red-500/30 rounded-2xl p-6 mb-4">
                <h3 className="text-lg font-semibold text-red-300 mb-2">Adults Only (18+)</h3>
                <p className="text-red-200 text-sm">
                  Next Tale is designed exclusively for adults aged 18 and over. We do not knowingly collect
                  personal information from anyone under 18 years of age.
                </p>
              </div>
              <p className="text-gray-300">
                If you believe we have collected information from someone under 18, please contact us
                immediately at privacy@nexttale.app and we will delete that information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">8. Cookies and Tracking</h2>
              <p className="text-gray-300 mb-4">
                We use cookies and similar technologies to operate the Service:
              </p>

              <h3 className="text-lg font-medium text-gray-200 mb-2">Essential Cookies</h3>
              <ul className="list-disc pl-6 text-gray-300 space-y-2 mb-4">
                <li>Authentication tokens to keep you signed in</li>
                <li>Session identifiers</li>
                <li>Security cookies</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-200 mb-2">Preference Cookies</h3>
              <ul className="list-disc pl-6 text-gray-300 space-y-2 mb-4">
                <li>Language preferences</li>
                <li>Auto-narration settings</li>
                <li>Display preferences</li>
              </ul>

              <p className="text-gray-300">
                We do not use third-party advertising cookies. You can manage cookies through your browser settings.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">9. Data Security</h2>
              <p className="text-gray-300 mb-4">
                We implement appropriate technical and organizational measures to protect your data:
              </p>
              <ul className="list-disc pl-6 text-gray-300 space-y-2">
                <li>Encryption in transit (TLS/SSL) and at rest</li>
                <li>Secure authentication with industry-standard protocols</li>
                <li>Regular security assessments and updates</li>
                <li>Access controls and audit logging</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">10. Data Retention</h2>
              <p className="text-gray-300 mb-4">
                We retain your personal data only as long as necessary:
              </p>
              <ul className="list-disc pl-6 text-gray-300 space-y-2">
                <li><strong className="text-gray-200">Account Data:</strong> Until you delete your account</li>
                <li><strong className="text-gray-200">User Content:</strong> Until you delete it or your account</li>
                <li><strong className="text-gray-200">Usage Logs:</strong> Up to 90 days</li>
                <li><strong className="text-gray-200">Payment Records:</strong> As required by law (typically 7 years)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">11. International Data Transfers</h2>
              <p className="text-gray-300 mb-4">
                Your information may be transferred to and processed in countries other than your own.
                When we transfer data outside the EEA, we ensure appropriate safeguards:
              </p>
              <ul className="list-disc pl-6 text-gray-300 space-y-2">
                <li>Standard Contractual Clauses approved by the European Commission</li>
                <li>Adequacy decisions for countries with equivalent data protection</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">12. California Privacy Rights (CCPA)</h2>
              <p className="text-gray-300 mb-4">
                California residents have additional rights:
              </p>
              <ul className="list-disc pl-6 text-gray-300 space-y-2">
                <li>Right to know what personal information is collected</li>
                <li>Right to delete personal information</li>
                <li>Right to opt-out of the sale of personal information (we do not sell your data)</li>
                <li>Right to non-discrimination for exercising privacy rights</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">13. Changes to This Policy</h2>
              <p className="text-gray-300">
                We may update this Privacy Policy from time to time. We will notify you of material changes
                by posting the new policy and updating the "Last updated" date. For significant changes,
                we will provide additional notice via email or in-app message.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">14. Contact Us</h2>
              <p className="text-gray-300 mb-4">
                If you have questions about this Privacy Policy, please contact us:
              </p>
              <ul className="list-none text-gray-300 space-y-2">
                <li><strong className="text-gray-200">Privacy Inquiries:</strong> privacy@nexttale.app</li>
                <li><strong className="text-gray-200">General Support:</strong> support@nexttale.app</li>
                <li><strong className="text-gray-200">Website:</strong> https://nexttale.app</li>
              </ul>
            </section>

            <div className="mt-8 pt-8 border-t border-gray-800">
              <p className="text-sm text-gray-500 text-center">
                By using Next Tale, you acknowledge that you have read and understood this Privacy Policy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
