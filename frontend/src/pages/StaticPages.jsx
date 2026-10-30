function Wrap({ title, children }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-2xl font-semibold">{title}</h1>
      <div className="prose-sm mt-4 space-y-4 text-sm leading-relaxed text-ink-soft">{children}</div>
    </div>
  );
}

export function About() {
  return (
    <Wrap title="About CampusBazaar">
      <p>
        CampusBazaar started with a simple observation: every semester, students throw away or
        abandon perfectly good items - textbooks, calculators, furniture, cycles - simply because
        there was no easy way to pass them on to someone who could actually use them.
      </p>
      <p>
        We built a marketplace made specifically for campus life: buy what you need, sell what you
        don't, rent things you'll only use for a semester, and swap items directly with other
        students. BazaarBuddy, our built-in pricing assistant, helps keep listings fair by comparing
        them against similar items already on the platform.
      </p>
      <p>CampusBazaar is run by students and built for students - no ads, no middlemen, just a better way to trade on campus.</p>
    </Wrap>
  );
}

export function Help() {
  return (
    <Wrap title="Help & contact">
      <p><strong>How do I list an item?</strong><br />Go to "Sell" in the navigation, fill in the details, and publish. It takes about two minutes.</p>
      <p><strong>How does BazaarBuddy decide if a price is fair?</strong><br />It compares your listing's price against similar active listings in the same category and condition band. It never guesses facts about your item.</p>
      <p><strong>I have an issue with another user.</strong><br />Use the "Report" option on their listing or profile, and our moderation team will review it.</p>
      <p><strong>Still stuck?</strong><br />Email us at support@campusbazaar.edu.</p>
    </Wrap>
  );
}

export function Terms() {
  return (
    <Wrap title="Terms of use">
      <p>By using CampusBazaar, you agree to list items honestly, complete transactions in good faith, and treat other students respectfully.</p>
      <p>CampusBazaar is a platform connecting students directly - we are not a party to any sale, rental, or exchange, and are not responsible for the condition, safety, or legality of items listed.</p>
      <p>Listings that are fraudulent, misleading, or involve prohibited items may be removed, and repeat offenders may be suspended.</p>
    </Wrap>
  );
}

export function Privacy() {
  return (
    <Wrap title="Privacy policy">
      <p>We collect the information you provide when creating an account and listings - your name, campus email, and campus - to operate the marketplace.</p>
      <p>Your contact details are only shared with another user once you start a conversation with them. We do not sell your data to third parties.</p>
      <p>You can request account deletion at any time from your profile settings or by contacting support.</p>
    </Wrap>
  );
}

export function Safety() {
  return (
    <Wrap title="Trust & safety">
      <p><strong>Meet in public campus spots</strong> - libraries, cafeterias, or common rooms are safer than isolated locations.</p>
      <p><strong>Inspect before you pay</strong> - check electronics power on, books have all pages, and furniture matches the photos.</p>
      <p><strong>Use in-app messaging</strong> - it keeps a record of your conversation in case of a dispute.</p>
      <p><strong>Report anything suspicious</strong> - use the report button on any listing or profile. Verified sellers have completed campus email verification.</p>
    </Wrap>
  );
}
