import { AdminLayout } from "@/components/layout/admin-layout";
import { useState } from "react";
import { CreditCard, Copy, Check, ExternalLink, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const PUBLIC_PATH = "/update-payment";

export default function PaymentLink() {
  const [copied, setCopied] = useState(false);

  const publicUrl = `${window.location.origin}${PUBLIC_PATH}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AdminLayout>
      <div className="max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <CreditCard className="w-6 h-6 text-[#061e57]" />
            Update Payment Info
          </h1>
          <p className="text-gray-500 mt-1.5 text-sm">
            Send this link to existing clients who need to submit new or updated payment information.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-[#061e57] px-6 py-4 text-white flex items-center gap-2">
            <Link2 className="w-4 h-4" />
            <span className="font-semibold text-sm uppercase tracking-wide">Client-Facing Link</span>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <p className="text-sm text-gray-600 mb-3">
                Share this link with any client to let them securely submit updated ACH or credit card details. No login required.
              </p>

              <div className="flex items-center gap-2">
                <div className="flex-1 bg-[#eef4f9] border border-[#b3cee1] rounded-lg px-4 py-3 font-mono text-sm text-[#061e57] select-all truncate">
                  {publicUrl}
                </div>
                <Button
                  onClick={handleCopy}
                  className={`shrink-0 transition-colors ${copied ? "bg-green-600 hover:bg-green-600" : "bg-[#061e57] hover:bg-[#0a2a6e]"} text-white`}
                >
                  {copied ? (
                    <><Check className="w-4 h-4 mr-1.5" /> Copied!</>
                  ) : (
                    <><Copy className="w-4 h-4 mr-1.5" /> Copy Link</>
                  )}
                </Button>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">What clients will see</p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#061e57] mt-2 shrink-0" />
                  A secure form to submit either <strong>ACH bank transfer</strong> or <strong>credit card</strong> details
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#061e57] mt-2 shrink-0" />
                  Full security &amp; compliance disclosures (SSL/TLS, data never stored, NACHA rules)
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#061e57] mt-2 shrink-0" />
                  Required authorization checkbox before submitting
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#061e57] mt-2 shrink-0" />
                  Submitted details are emailed to <strong>info@mcwilliamsmedia.com</strong> and never stored in the database
                </li>
              </ul>
            </div>

            <div className="border-t border-gray-100 pt-5 flex items-center justify-between">
              <p className="text-xs text-gray-400">Preview the form before sending it to a client</p>
              <a
                href={PUBLIC_PATH}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-[#061e57] hover:underline font-medium"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Preview Form
              </a>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
