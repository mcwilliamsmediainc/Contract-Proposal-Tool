import { useParams } from "wouter";
import { useGetOnboardingForm, useSaveOnboardingForm } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2, Upload, Globe, Link2, Check } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

type GeneralData = {
  websiteUrl: string;
  pocEmail: string;
  standardDiscounts: string;
  seasonalDiscounts: string;
  leadMagnets: string;
  logoFilesUrl: string;
  brandImagesUrl: string;
  facebookUrl: string;
  instagramUrl: string;
  linkedinUrl: string;
  otherSocialUrl: string;
};

type GoogleAdsData = {
  articlesOfCorpUrl: string;
  driversLicenseUrl: string;
  hasGoogleLsa: boolean;
  lsaArticlesOfCorpUrl: string;
  lsaDriversLicenseUrl: string;
  lsaBusinessInsuranceUrl: string;
  lsaLicenseNumber: string;
  lsaLeadsyLink: string;
  lsaSetupOption: "option1" | "option2" | "";
};

type SocialMediaData = {
  graphicStyles: string[];
  postTypes: string[];
  inspirationalAccount1: string;
  inspirationalAccount2: string;
};

type MetaAdsData = {
  hasRunMetaAds: boolean | null;
  metaBusinessManagerName: string;
  facebookAdAccountName: string;
  hasLandingPage: boolean | null;
  instagramConnected: boolean;
  identityConfirmed: boolean;
  paymentAdded: boolean;
  phoneVerified: boolean;
};

type EmailData = {
  emailContactListUrl: string;
  hasDoneEmailMarketing: boolean | null;
  emailPlatform: string;
  mailchimpAccessGranted: boolean;
  emailListSize: string;
};

type FormResponses = {
  general: GeneralData;
  googleAds: GoogleAdsData;
  socialMedia: SocialMediaData;
  metaAds: MetaAdsData;
  email: EmailData;
};

const BLANK: FormResponses = {
  general: {
    websiteUrl: "", pocEmail: "", standardDiscounts: "", seasonalDiscounts: "",
    leadMagnets: "", logoFilesUrl: "", brandImagesUrl: "",
    facebookUrl: "", instagramUrl: "", linkedinUrl: "", otherSocialUrl: "",
  },
  googleAds: {
    articlesOfCorpUrl: "", driversLicenseUrl: "", hasGoogleLsa: false,
    lsaArticlesOfCorpUrl: "", lsaDriversLicenseUrl: "", lsaBusinessInsuranceUrl: "",
    lsaLicenseNumber: "", lsaLeadsyLink: "", lsaSetupOption: "",
  },
  socialMedia: { graphicStyles: [], postTypes: [], inspirationalAccount1: "", inspirationalAccount2: "" },
  metaAds: {
    hasRunMetaAds: null, metaBusinessManagerName: "", facebookAdAccountName: "",
    hasLandingPage: null, instagramConnected: false, identityConfirmed: false,
    paymentAdded: false, phoneVerified: false,
  },
  email: { emailContactListUrl: "", hasDoneEmailMarketing: null, emailPlatform: "", mailchimpAccessGranted: false, emailListSize: "" },
};

// ── Step definitions ─────────────────────────────────────────────────────────

type StepId = "welcome" | "general" | "google_ads" | "social_media" | "meta_ads" | "email" | "review";

function buildSteps(services: string[]): StepId[] {
  const steps: StepId[] = ["welcome", "general"];
  if (services.includes("marketing.google_ads")) steps.push("google_ads");
  if (services.includes("marketing.social_media_posting")) steps.push("social_media");
  if (services.includes("marketing.social_media_ads")) steps.push("meta_ads");
  if (services.includes("marketing.newsletter")) steps.push("email");
  steps.push("review");
  return steps;
}

const STEP_LABELS: Record<StepId, string> = {
  welcome:      "Welcome",
  general:      "General Info",
  google_ads:   "Google Ads",
  social_media: "Social Media",
  meta_ads:     "Meta Ads",
  email:        "Email Marketing",
  review:       "Review & Submit",
};

// ── Small helpers ────────────────────────────────────────────────────────────

function FieldLabel({ children, optional }: { children: React.ReactNode; optional?: boolean }) {
  return (
    <Label className="text-sm font-medium text-foreground">
      {children}
      {optional && <span className="ml-1 text-xs text-muted-foreground font-normal">(optional)</span>}
    </Label>
  );
}

function FieldNote({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-muted-foreground mt-0.5 mb-1.5">{children}</p>;
}

function UrlInput({
  value, onChange, placeholder
}: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "https://"}
        className="pl-9"
      />
    </div>
  );
}

function FileInput({
  value, onChange, label
}: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <div className="space-y-1.5">
      <FieldLabel>{label}</FieldLabel>
      <FieldNote>
        <Upload className="inline w-3 h-3 mr-1" />
        Please upload to Google Drive or Dropbox and paste the share link below.
      </FieldNote>
      <UrlInput value={value} onChange={onChange} placeholder="Paste your file share link…" />
    </div>
  );
}

function YesNo({ value, onChange }: { value: boolean | null; onChange: (v: boolean) => void }) {
  return (
    <div className="flex gap-2">
      {([true, false] as const).map((v) => (
        <button
          key={String(v)}
          type="button"
          onClick={() => onChange(v)}
          className={cn(
            "px-4 py-1.5 rounded-full border text-sm font-medium transition-all",
            value === v
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
          )}
        >
          {v ? "Yes" : "No"}
        </button>
      ))}
    </div>
  );
}

function MultiSelect({
  options, selected, onChange, max
}: { options: string[]; selected: string[]; onChange: (v: string[]) => void; max?: number }) {
  const toggle = (opt: string) => {
    if (selected.includes(opt)) {
      onChange(selected.filter((s) => s !== opt));
    } else if (!max || selected.length < max) {
      onChange([...selected, opt]);
    }
  };
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = selected.includes(opt);
        const disabled = !active && !!max && selected.length >= max;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => !disabled && toggle(opt)}
            className={cn(
              "px-3 py-1.5 rounded-full border text-sm transition-all",
              active
                ? "bg-primary text-primary-foreground border-primary"
                : disabled
                  ? "border-border text-muted-foreground/40 cursor-not-allowed"
                  : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
            )}
          >
            {active && <Check className="inline w-3 h-3 mr-1" />}
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function CheckItem({
  checked, onChange, children, link, linkText
}: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode; link?: string; linkText?: string }) {
  return (
    <label className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary/30 transition-colors cursor-pointer">
      <div
        className={cn(
          "mt-0.5 w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border-2 transition-colors",
          checked ? "bg-primary border-primary" : "border-border bg-background"
        )}
        onClick={() => onChange(!checked)}
      >
        {checked && <Check className="w-3 h-3 text-primary-foreground" />}
      </div>
      <div className="flex-1 text-sm">
        <span className="text-foreground">{children}</span>
        {link && (
          <a
            href={link}
            target="_blank"
            rel="noreferrer"
            className="ml-2 text-primary underline text-xs hover:opacity-80"
            onClick={(e) => e.stopPropagation()}
          >
            {linkText ?? "View steps →"}
          </a>
        )}
      </div>
    </label>
  );
}

// ── Step components ───────────────────────────────────────────────────────────

function WelcomeStep({ clientName, businessName, services }: { clientName: string; businessName: string; services: string[] }) {
  const SERVICE_LABELS: Record<string, string> = {
    website: "Website", print: "Print", marketing: "Marketing",
    "marketing.seo": "SEO", "marketing.google_ads": "Google Ads",
    "marketing.social_media_ads": "Meta Ads", "marketing.social_media_posting": "Social Media",
    "marketing.newsletter": "Email Marketing",
  };
  return (
    <div className="text-center space-y-6 py-4">
      <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
        <div className="text-primary font-mono font-bold text-2xl">M</div>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-foreground">Welcome, {clientName}!</h2>
        <p className="text-muted-foreground mt-1">Let's get {businessName} set up for success.</p>
      </div>
      <div className="bg-muted/40 rounded-xl p-5 text-left space-y-3 max-w-md mx-auto">
        <p className="text-sm font-semibold text-foreground">Your services include:</p>
        <div className="flex flex-wrap gap-2">
          {services.map((s) => (
            <span key={s} className="text-xs font-medium bg-primary/10 text-primary px-2.5 py-1 rounded-full">
              {SERVICE_LABELS[s] ?? s}
            </span>
          ))}
        </div>
        <p className="text-sm text-muted-foreground pt-2">
          This form collects the information we need before your kickoff call. Most questions are optional — just fill in what you have and we'll handle the rest together.
        </p>
      </div>
    </div>
  );
}

function GeneralStep({ data, onChange }: { data: GeneralData; onChange: (d: GeneralData) => void }) {
  const set = (key: keyof GeneralData) => (v: string) => onChange({ ...data, [key]: v });
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <FieldLabel>Company Website</FieldLabel>
        <UrlInput value={data.websiteUrl} onChange={set("websiteUrl")} />
      </div>

      <div className="space-y-1.5">
        <FieldLabel>Primary Point of Contact Email</FieldLabel>
        <FieldNote>Who on your team should we reach out to day-to-day?</FieldNote>
        <Input
          type="email"
          value={data.pocEmail}
          onChange={(e) => set("pocEmail")(e.target.value)}
          placeholder="name@company.com"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <FieldLabel optional>Standard Discounts / Promotions</FieldLabel>
          <Textarea value={data.standardDiscounts} onChange={(e) => set("standardDiscounts")(e.target.value)} placeholder="e.g. 10% off for first-time customers…" rows={3} />
        </div>
        <div className="space-y-1.5">
          <FieldLabel optional>Seasonal Discounts / Promotions</FieldLabel>
          <Textarea value={data.seasonalDiscounts} onChange={(e) => set("seasonalDiscounts")(e.target.value)} placeholder="e.g. Holiday sale — 25% off in December…" rows={3} />
        </div>
      </div>

      <div className="space-y-1.5">
        <FieldLabel optional>Freebies / Lead Magnets</FieldLabel>
        <Textarea value={data.leadMagnets} onChange={(e) => set("leadMagnets")(e.target.value)} placeholder="e.g. Free consultation, Free ebook…" rows={2} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FileInput value={data.logoFilesUrl} onChange={set("logoFilesUrl")} label="Company Logo Files" />
        <FileInput value={data.brandImagesUrl} onChange={set("brandImagesUrl")} label="Company Brand Images" />
      </div>

      <div>
        <p className="text-sm font-semibold text-foreground mb-3">Social Media Pages</p>
        <div className="space-y-3">
          {([
            ["facebookUrl",   "Facebook"],
            ["instagramUrl",  "Instagram"],
            ["linkedinUrl",   "LinkedIn"],
            ["otherSocialUrl","Other"],
          ] as [keyof GeneralData, string][]).map(([key, label]) => (
            <div key={key} className="space-y-1">
              <Label className="text-xs text-muted-foreground">{label}</Label>
              <UrlInput value={data[key] as string} onChange={set(key)} placeholder={`https://www.${label.toLowerCase()}.com/yourpage`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GoogleAdsStep({ data, onChange }: { data: GoogleAdsData; onChange: (d: GoogleAdsData) => void }) {
  const set = <K extends keyof GoogleAdsData>(key: K) => (v: GoogleAdsData[K]) =>
    onChange({ ...data, [key]: v });
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <p className="font-semibold mb-1">Google Ads Setup</p>
        <p>We need a couple of documents to get your campaigns up and running. Please share secure links (e.g. Google Drive) to your files.</p>
      </div>

      <FileInput value={data.articlesOfCorpUrl} onChange={(v) => set("articlesOfCorpUrl")(v)} label="Articles of Incorporation" />
      <FileInput value={data.driversLicenseUrl} onChange={(v) => set("driversLicenseUrl")(v)} label="Driver's License (Front & Back)" />

      <div className="border-t border-border pt-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Are you signing up for Google LSA?</p>
            <p className="text-xs text-muted-foreground">Local Services Ads require a few extra steps</p>
          </div>
          <YesNo value={data.hasGoogleLsa} onChange={(v) => set("hasGoogleLsa")(v)} />
        </div>

        {data.hasGoogleLsa && (
          <div className="space-y-4 pl-4 border-l-2 border-primary/30">
            <FileInput value={data.lsaArticlesOfCorpUrl} onChange={(v) => set("lsaArticlesOfCorpUrl")(v)} label="Articles of Incorporation (LSA)" />
            <FileInput value={data.lsaDriversLicenseUrl} onChange={(v) => set("lsaDriversLicenseUrl")(v)} label="Driver's License Front & Back (LSA)" />
            <FileInput value={data.lsaBusinessInsuranceUrl} onChange={(v) => set("lsaBusinessInsuranceUrl")(v)} label="Business Insurance" />

            <div className="space-y-1.5">
              <FieldLabel optional>License Number or Bar Association Number</FieldLabel>
              <Input value={data.lsaLicenseNumber} onChange={(e) => set("lsaLicenseNumber")(e.target.value)} placeholder="License #" />
            </div>

            <div className="space-y-1.5">
              <FieldLabel optional>Leadsy Link (Google Business Profile Access)</FieldLabel>
              <UrlInput value={data.lsaLeadsyLink} onChange={(v) => set("lsaLeadsyLink")(v)} />
            </div>

            <div className="space-y-2">
              <FieldLabel>Google LSA Account Setup Preference</FieldLabel>
              <div className="space-y-2">
                {([
                  ["option1", "Option 1 — I'll complete setup today on my own"],
                  ["option2", "Option 2 — We'll complete setup together at the kickoff meeting"],
                ] as const).map(([val, label]) => (
                  <label key={val} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/30 transition-colors cursor-pointer">
                    <div className={cn(
                      "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors",
                      data.lsaSetupOption === val ? "border-primary bg-primary" : "border-border"
                    )}>
                      {data.lsaSetupOption === val && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <span className="text-sm text-foreground">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const GRAPHIC_STYLES = ["Modern", "Minimalistic", "Rustic", "Vibrant", "Upscale", "Youthful", "Feminine", "Masculine", "Elegant", "Economical", "Sophisticated", "Laidback", "Fun", "Trendy"];
const POST_TYPES = ["Humorous", "Informative", "Trendy", "Engaging", "Interactive", "Inspirational", "Promotional", "Conversational", "Educational", "Casual", "Relaxed"];

function SocialMediaStep({ data, onChange }: { data: SocialMediaData; onChange: (d: SocialMediaData) => void }) {
  const set = <K extends keyof SocialMediaData>(key: K) => (v: SocialMediaData[K]) =>
    onChange({ ...data, [key]: v });
  return (
    <div className="space-y-6">
      <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 text-sm text-violet-800">
        <p>Please make sure your Instagram Business Account is connected to your Facebook Business Page before your kickoff call.{" "}
          <a href="https://www.facebook.com/business/help/connect-instagram-to-page" target="_blank" rel="noreferrer" className="underline font-medium">View steps →</a>
        </p>
      </div>

      <div className="space-y-3">
        <FieldLabel>What graphic style best fits your brand? <span className="text-xs font-normal text-muted-foreground">(select up to 3)</span></FieldLabel>
        <MultiSelect options={GRAPHIC_STYLES} selected={data.graphicStyles} onChange={(v) => set("graphicStyles")(v)} max={3} />
      </div>

      <div className="space-y-3">
        <FieldLabel>What type of content do you want? <span className="text-xs font-normal text-muted-foreground">(select up to 3)</span></FieldLabel>
        <MultiSelect options={POST_TYPES} selected={data.postTypes} onChange={(v) => set("postTypes")(v)} max={3} />
      </div>

      <div className="space-y-3">
        <FieldLabel optional>Inspirational Social Media Accounts</FieldLabel>
        <FieldNote>Link two accounts in your industry that you admire — "this looks and sounds good!"</FieldNote>
        <UrlInput value={data.inspirationalAccount1} onChange={(v) => set("inspirationalAccount1")(v)} placeholder="Account 1 URL" />
        <UrlInput value={data.inspirationalAccount2} onChange={(v) => set("inspirationalAccount2")(v)} placeholder="Account 2 URL" />
      </div>
    </div>
  );
}

function MetaAdsStep({ data, onChange }: { data: MetaAdsData; onChange: (d: MetaAdsData) => void }) {
  const set = <K extends keyof MetaAdsData>(key: K) => (v: MetaAdsData[K]) =>
    onChange({ ...data, [key]: v });
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <FieldLabel>Have you run Meta (Facebook/Instagram) Ads before?</FieldLabel>
        <YesNo value={data.hasRunMetaAds} onChange={(v) => set("hasRunMetaAds")(v)} />
      </div>

      {data.hasRunMetaAds && (
        <div className="space-y-4 pl-4 border-l-2 border-primary/30">
          <div className="space-y-1.5">
            <FieldLabel optional>Meta Business Manager Name</FieldLabel>
            <Input value={data.metaBusinessManagerName} onChange={(e) => set("metaBusinessManagerName")(e.target.value)} placeholder="Your Business Manager name" />
          </div>
          <div className="space-y-1.5">
            <FieldLabel optional>Facebook Ad Account Name</FieldLabel>
            <Input value={data.facebookAdAccountName} onChange={(e) => set("facebookAdAccountName")(e.target.value)} placeholder="Your Ad Account name" />
          </div>
          <div className="space-y-2">
            <FieldLabel>Do you have a landing page for your ads?</FieldLabel>
            <YesNo value={data.hasLandingPage} onChange={(v) => set("hasLandingPage")(v)} />
          </div>
        </div>
      )}

      <div className="border-t border-border pt-5 space-y-3">
        <p className="text-sm font-semibold text-foreground">Setup Checklist</p>
        <p className="text-xs text-muted-foreground">Please complete these steps before your kickoff call. Check each one off as you go.</p>
        <div className="space-y-2">
          <CheckItem
            checked={data.instagramConnected}
            onChange={(v) => set("instagramConnected")(v)}
            link="https://www.facebook.com/business/help/connect-instagram-to-page"
            linkText="View steps →"
          >
            Connect Instagram to your Facebook Business Page
          </CheckItem>
          <CheckItem
            checked={data.identityConfirmed}
            onChange={(v) => set("identityConfirmed")(v)}
            link="https://www.facebook.com/business/help/2992964394067299?id=288762101909005"
            linkText="View steps →"
          >
            Confirm your identity on your personal Facebook profile
          </CheckItem>
          <CheckItem
            checked={data.paymentAdded}
            onChange={(v) => set("paymentAdded")(v)}
            link="https://www.facebook.com/business/help/132073386867900?id=160022731342707"
            linkText="View steps →"
          >
            Add a payment method to your Meta Ad Account
          </CheckItem>
          <CheckItem
            checked={data.phoneVerified}
            onChange={(v) => set("phoneVerified")(v)}
            link="https://www.facebook.com/business/help/1064155054687612"
            linkText="View steps →"
          >
            Verify your phone number on your Meta Ad Account
          </CheckItem>
        </div>
      </div>
    </div>
  );
}

function EmailStep({ data, onChange }: { data: EmailData; onChange: (d: EmailData) => void }) {
  const set = <K extends keyof EmailData>(key: K) => (v: EmailData[K]) =>
    onChange({ ...data, [key]: v });
  return (
    <div className="space-y-6">
      <FileInput value={data.emailContactListUrl} onChange={(v) => set("emailContactListUrl")(v)} label="Current Email Contact List" />

      <div className="space-y-2">
        <FieldLabel>Have you done email marketing before?</FieldLabel>
        <YesNo value={data.hasDoneEmailMarketing} onChange={(v) => set("hasDoneEmailMarketing")(v)} />
      </div>

      {data.hasDoneEmailMarketing && (
        <div className="space-y-4 pl-4 border-l-2 border-primary/30">
          <div className="space-y-1.5">
            <FieldLabel optional>What platform do you use?</FieldLabel>
            <Input value={data.emailPlatform} onChange={(e) => set("emailPlatform")(e.target.value)} placeholder="e.g. Mailchimp, Klaviyo, ActiveCampaign…" />
          </div>
          {data.emailPlatform.toLowerCase().includes("mailchimp") && (
            <CheckItem
              checked={data.mailchimpAccessGranted}
              onChange={(v) => set("mailchimpAccessGranted")(v)}
              link="https://docs.google.com/document/d/1TsrdAwDSDCb6evIImgsmSkv2WW0cMCZ10l9D1PRmug4/edit?usp=sharing"
              linkText="View steps →"
            >
              Grant McWilliams Media access to your Mailchimp account
            </CheckItem>
          )}
        </div>
      )}

      <div className="space-y-1.5">
        <FieldLabel optional>Current Email List Size</FieldLabel>
        <Input value={data.emailListSize} onChange={(e) => set("emailListSize")(e.target.value)} placeholder="e.g. ~2,500 subscribers" />
      </div>
    </div>
  );
}

function ReviewStep({ responses, services }: { responses: FormResponses; services: string[] }) {
  const g = responses.general;
  const rows: { label: string; value: string }[] = [
    { label: "Website", value: g.websiteUrl },
    { label: "Point of Contact Email", value: g.pocEmail },
    { label: "Logo Files", value: g.logoFilesUrl },
    { label: "Brand Images", value: g.brandImagesUrl },
    { label: "Facebook", value: g.facebookUrl },
    { label: "Instagram", value: g.instagramUrl },
  ].filter((r) => r.value);

  return (
    <div className="space-y-5">
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
        <p className="text-sm text-foreground font-medium">Almost done! Please review your information before submitting.</p>
        <p className="text-xs text-muted-foreground mt-1">You can always go back to make changes. Once submitted, your strategist will review everything before your kickoff call.</p>
      </div>

      {rows.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">General</p>
          {rows.map(({ label, value }) => (
            <div key={label} className="flex items-start justify-between gap-3 text-sm py-1 border-b border-border/50">
              <span className="text-muted-foreground shrink-0">{label}</span>
              <span className="text-foreground text-right break-all">{value}</span>
            </div>
          ))}
        </div>
      )}

      {services.includes("marketing.social_media_posting") && responses.socialMedia.graphicStyles.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Social Media</p>
          <div className="text-sm py-1 border-b border-border/50 flex items-start justify-between gap-3">
            <span className="text-muted-foreground">Graphic Styles</span>
            <span className="text-foreground text-right">{responses.socialMedia.graphicStyles.join(", ")}</span>
          </div>
          <div className="text-sm py-1 border-b border-border/50 flex items-start justify-between gap-3">
            <span className="text-muted-foreground">Post Types</span>
            <span className="text-foreground text-right">{responses.socialMedia.postTypes.join(", ")}</span>
          </div>
        </div>
      )}

      <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
        <CheckCircle2 className="inline w-4 h-4 mr-1" />
        Once you submit, your strategist at McWilliams Media will review everything and follow up before your kickoff call.
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function OnboardingFormPage() {
  const { id } = useParams<{ id: string }>();
  const { data: formState, isLoading } = useGetOnboardingForm(id!);
  const saveForm = useSaveOnboardingForm();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [responses, setResponses] = useState<FormResponses>(BLANK);

  // Hydrate from server state
  useEffect(() => {
    if (formState) {
      if (formState.status === "submitted") setSubmitted(true);
      const r = formState.responses as Partial<FormResponses>;
      setResponses({
        general:     { ...BLANK.general,     ...(r.general     ?? {}) },
        googleAds:   { ...BLANK.googleAds,   ...(r.googleAds   ?? {}) },
        socialMedia: { ...BLANK.socialMedia, ...(r.socialMedia ?? {}) },
        metaAds:     { ...BLANK.metaAds,     ...(r.metaAds     ?? {}) },
        email:       { ...BLANK.email,       ...(r.email       ?? {}) },
      });
    }
  }, [formState]);

  const services = formState?.services ?? [];
  const steps = buildSteps(services);
  const currentStep = steps[step] as StepId;
  const isFirst = step === 0;
  const isLast = step === steps.length - 1;

  const save = useCallback(async (submit = false) => {
    if (!id) return;
    setSaving(true);
    try {
      await saveForm.mutateAsync({ id, data: { responses: responses as Record<string, unknown>, submitted: submit } });
      if (submit) setSubmitted(true);
    } finally {
      setSaving(false);
    }
  }, [id, responses, saveForm]);

  const handleNext = async () => {
    await save(false);
    if (isLast) {
      await save(true);
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => setStep((s) => Math.max(0, s - 1));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!formState) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-center p-6">
        <div>
          <p className="text-lg font-semibold text-foreground">Form not found</p>
          <p className="text-sm text-muted-foreground mt-1">This onboarding link may be invalid or expired.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mb-6">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">You're all set!</h1>
        <p className="text-muted-foreground mt-2 max-w-sm">
          Thank you for completing your intake form, {formState.clientName}. Your strategist at McWilliams Media will review everything and reach out before your kickoff call.
        </p>
        <div className="mt-8 flex items-center gap-2 text-xs text-muted-foreground font-mono">
          <div className="w-6 h-6 bg-primary rounded flex items-center justify-center text-primary-foreground font-bold text-sm">M</div>
          McWilliams Media
        </div>
      </div>
    );
  }

  // Progress bar (skip welcome step from count)
  const contentSteps = steps.filter((s): s is Exclude<StepId, "welcome"> => s !== "welcome");
  const currentContentIndex = currentStep === "welcome" ? -1 : contentSteps.indexOf(currentStep as Exclude<StepId, "welcome">);
  const progressPct = currentStep === "welcome" ? 0 : Math.round(((currentContentIndex + 1) / contentSteps.length) * 100);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-primary rounded flex items-center justify-center text-primary-foreground font-mono font-bold text-sm">M</div>
            <span className="font-bold text-sm tracking-tight">McWilliams Media</span>
          </div>
          <div className="text-xs font-mono text-muted-foreground">{STEP_LABELS[currentStep]}</div>
        </div>
        {/* Progress bar */}
        {currentStep !== "welcome" && (
          <div className="h-0.5 bg-muted/60">
            <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progressPct}%` }} />
          </div>
        )}
      </header>

      {/* Step nav dots (non-welcome) */}
      {currentStep !== "welcome" && (
        <div className="max-w-2xl mx-auto px-5 pt-4 flex items-center gap-1.5">
          {contentSteps.map((s, i) => (
            <div
              key={s}
              className={cn(
                "h-1 rounded-full flex-1 transition-all",
                i < currentContentIndex ? "bg-primary/50" : i === currentContentIndex ? "bg-primary" : "bg-border"
              )}
            />
          ))}
        </div>
      )}

      {/* Body */}
      <main className="max-w-2xl mx-auto px-5 py-8">
        {currentStep !== "welcome" && (
          <h2 className="text-xl font-bold text-foreground mb-1">{STEP_LABELS[currentStep]}</h2>
        )}

        <div className="mt-2">
          {currentStep === "welcome" && (
            <WelcomeStep clientName={formState.clientName} businessName={formState.businessName} services={services} />
          )}
          {currentStep === "general" && (
            <GeneralStep data={responses.general} onChange={(d) => setResponses((r) => ({ ...r, general: d }))} />
          )}
          {currentStep === "google_ads" && (
            <GoogleAdsStep data={responses.googleAds} onChange={(d) => setResponses((r) => ({ ...r, googleAds: d }))} />
          )}
          {currentStep === "social_media" && (
            <SocialMediaStep data={responses.socialMedia} onChange={(d) => setResponses((r) => ({ ...r, socialMedia: d }))} />
          )}
          {currentStep === "meta_ads" && (
            <MetaAdsStep data={responses.metaAds} onChange={(d) => setResponses((r) => ({ ...r, metaAds: d }))} />
          )}
          {currentStep === "email" && (
            <EmailStep data={responses.email} onChange={(d) => setResponses((r) => ({ ...r, email: d }))} />
          )}
          {currentStep === "review" && (
            <ReviewStep responses={responses} services={services} />
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-10 pt-6 border-t border-border">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={isFirst || saving}
            className="gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>
          <Button onClick={handleNext} disabled={saving} className="gap-1 min-w-32">
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
            ) : isLast ? (
              <><CheckCircle2 className="w-4 h-4" /> Submit Form</>
            ) : currentStep === "welcome" ? (
              <>Get Started <ChevronRight className="w-4 h-4" /></>
            ) : (
              <>Continue <ChevronRight className="w-4 h-4" /></>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
}
