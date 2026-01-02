import { ArrowLeft } from 'lucide-react';

interface TermsOfServiceProps {
  onBack?: () => void;
}

export function TermsOfService({ onBack }: TermsOfServiceProps) {
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

          <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
          <p className="text-sm text-gray-500 mb-8">Last updated: {lastUpdated}</p>

          <div className="prose prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">1. Agreement to Terms</h2>
              <p className="text-gray-300 mb-4">
                By accessing or using Next Tale ("the Service"), you agree to be bound by these Terms of Service ("Terms").
                If you disagree with any part of these terms, you do not have permission to access the Service.
              </p>
              <p className="text-gray-300">
                Next Tale is an AI-powered interactive fiction platform designed for adults (18+).
                By using our Service, you confirm that you are at least 18 years old.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">2. Age Requirement</h2>
              <p className="text-gray-300 mb-4">
                <strong className="text-purple-400">You must be at least 18 years of age to use Next Tale.</strong> By creating
                an account or using the Service, you represent and warrant that you meet this age requirement.
              </p>
              <p className="text-gray-300">
                We reserve the right to terminate accounts if we have reason to believe a user is under 18 years of age.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">3. Description of Service</h2>
              <p className="text-gray-300 mb-4">
                Next Tale provides an AI-powered interactive fiction platform that allows users to:
              </p>
              <ul className="list-disc pl-6 text-gray-300 space-y-2">
                <li>Create personalized interactive stories across various genres</li>
                <li>Read and interact with stories through meaningful choices</li>
                <li>Generate AI-created cinematic illustrations for stories</li>
                <li>Use professional voice narration features</li>
                <li>Share stories with the community</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">4. User Accounts</h2>
              <p className="text-gray-300 mb-4">
                To access certain features of the Service, you must create an account. You agree to:
              </p>
              <ul className="list-disc pl-6 text-gray-300 space-y-2">
                <li>Provide accurate, current, and complete information during registration</li>
                <li>Maintain the security of your password and account</li>
                <li>Accept responsibility for all activities that occur under your account</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
              </ul>
              <p className="text-gray-300 mt-4">
                We reserve the right to suspend or terminate accounts that violate these Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">5. Content Guidelines</h2>
              <p className="text-gray-300 mb-4">
                While Next Tale allows mature themes appropriate for adult fiction, you agree not to create,
                upload, or share content that:
              </p>
              <ul className="list-disc pl-6 text-gray-300 space-y-2">
                <li>Contains explicit sexual content or pornography</li>
                <li>Promotes real-world violence or illegal activities</li>
                <li>Contains hate speech or discrimination</li>
                <li>Depicts minors in inappropriate situations</li>
                <li>Infringes on intellectual property rights</li>
                <li>Is misleading, fraudulent, or deceptive</li>
                <li>Violates any applicable laws or regulations</li>
              </ul>
              <p className="text-gray-300 mt-4">
                We reserve the right to remove any content that violates these guidelines without prior notice.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">6. Intellectual Property</h2>
              <h3 className="text-lg font-medium text-gray-200 mb-2">Our Content</h3>
              <p className="text-gray-300 mb-4">
                The Service and its original content (excluding user-generated content), features, and functionality
                are owned by Next Tale and are protected by international copyright, trademark, and other intellectual
                property laws.
              </p>
              <h3 className="text-lg font-medium text-gray-200 mb-2">Your Content</h3>
              <p className="text-gray-300 mb-4">
                You retain ownership of the stories and content you create using our Service. By making content public,
                you grant Next Tale a non-exclusive, worldwide, royalty-free license to display, distribute, and promote
                your content within the Service.
              </p>
              <h3 className="text-lg font-medium text-gray-200 mb-2">AI-Generated Content</h3>
              <p className="text-gray-300">
                Stories and images generated by our AI are provided for your personal use. You may use AI-generated
                content for non-commercial purposes. Commercial use requires prior written permission.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">7. Subscription and Payments</h2>
              <p className="text-gray-300 mb-4">
                Next Tale offers both free and premium subscription tiers:
              </p>
              <ul className="list-disc pl-6 text-gray-300 space-y-2">
                <li><strong className="text-gray-200">Free Tier:</strong> Limited to 2 stories per day with access to core features</li>
                <li><strong className="text-gray-200">Pro Tier:</strong> Unlimited story creation with premium features at $15/month</li>
              </ul>
              <p className="text-gray-300 mt-4">
                Subscriptions are billed through Stripe. By subscribing, you authorize us to charge your payment
                method on a recurring basis. You may cancel your subscription at any time.
              </p>
              <p className="text-gray-300 mt-4">
                We offer a 30-day money-back guarantee. Contact support@nexttale.app for refund requests.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">8. Limitation of Liability</h2>
              <p className="text-gray-300 mb-4">
                To the maximum extent permitted by law, Next Tale and its affiliates shall not be liable for any
                indirect, incidental, special, consequential, or punitive damages resulting from:
              </p>
              <ul className="list-disc pl-6 text-gray-300 space-y-2">
                <li>Your use or inability to use the Service</li>
                <li>Any unauthorized access to your account or data</li>
                <li>Content generated by AI systems</li>
                <li>Any third-party content or services</li>
              </ul>
              <p className="text-gray-300 mt-4">
                Our total liability shall not exceed the amount you paid for the Service in the past 12 months.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">9. Disclaimer of Warranties</h2>
              <p className="text-gray-300">
                The Service is provided "as is" and "as available" without warranties of any kind, either express
                or implied. We do not warrant that the Service will be uninterrupted, secure, or error-free.
                AI-generated content may occasionally produce unexpected results.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">10. Modifications to Service and Terms</h2>
              <p className="text-gray-300 mb-4">
                We reserve the right to modify or discontinue the Service at any time without notice. We may also
                update these Terms from time to time. Changes will be effective immediately upon posting.
              </p>
              <p className="text-gray-300">
                Your continued use of the Service after changes constitutes acceptance of the modified Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">11. Termination</h2>
              <p className="text-gray-300">
                We may terminate or suspend your account and access to the Service immediately, without prior
                notice or liability, for any reason, including breach of these Terms. Upon termination, your
                right to use the Service will cease immediately.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">12. Governing Law</h2>
              <p className="text-gray-300">
                These Terms shall be governed by and construed in accordance with the laws of the jurisdiction
                in which Next Tale operates. For users in the European Union, nothing in these Terms affects
                your statutory rights under applicable consumer protection laws.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">13. Contact Us</h2>
              <p className="text-gray-300 mb-4">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <ul className="list-none text-gray-300 space-y-2">
                <li><strong className="text-gray-200">Email:</strong> legal@nexttale.app</li>
                <li><strong className="text-gray-200">Support:</strong> support@nexttale.app</li>
                <li><strong className="text-gray-200">Website:</strong> https://nexttale.app</li>
              </ul>
            </section>

            <div className="mt-8 pt-8 border-t border-gray-800">
              <p className="text-sm text-gray-500 text-center">
                By using Next Tale, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
