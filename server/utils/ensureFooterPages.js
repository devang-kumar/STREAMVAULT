import FooterPage from '../models/FooterPage.js';
import logger from '../config/logger.js';

export async function ensureFooterPages() {
  try {
    const defaultPages = [
      {
        slug: 'about-us',
        title: 'About Us',
        lastUpdated: '22-06-2025',
        content: 'StreamVault brings cinematic originals, thrillers, anime-inspired stories, and premium episodic entertainment in one OTT home. Founded with a vision to redefine the streaming experience, we bring curated high-quality storytelling directly to your screens. Our dedicated team works around the clock to collaborate with award-winning creators, ensuring that every piece of content meets the highest standards of production and narrative depth.'
      },
      {
        slug: 'terms-of-service',
        title: 'Terms of Service',
        lastUpdated: '22-06-2025',
        content: 'Welcome to StreamVault. By accessing our platform, you agree to comply with and be bound by these Terms of Service. Please read them carefully before using our services. You must be at least 18 years of age, or have the consent of a parent or legal guardian, to create an account on our platform. All content provided is for personal, non-commercial use only, and account credentials should not be shared outside your household.'
      },
      {
        slug: 'privacy-policy',
        title: 'Privacy Policy',
        lastUpdated: '22-06-2025',
        content: 'Your privacy is important to us. It is StreamVault\'s policy to respect your privacy regarding any information we may collect from you across our website and other sites we own and operate. We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent. We also let you know why we are collecting it and how it will be used.'
      },
      {
        slug: 'cookie-policy',
        title: 'Cookie Policy',
        lastUpdated: '22-06-2025',
        content: 'This Cookie Policy explains how StreamVault uses cookies and similar technologies to recognize you when you visit our platform. It explains what these technologies are and why we use them, as well as your rights to control our use of them. Cookies help us understand how our site is being used, analyze trends, optimize content delivery, and provide personalized recommendations for movies and series.'
      },
      {
        slug: 'help-center',
        title: 'Help Center',
        lastUpdated: '22-06-2025',
        content: 'Welcome to the StreamVault Help Center. Find answers to frequently asked questions below or contact our support team for further assistance. We are here to help you get the most out of your streaming experience.',
        faqs: [
          { question: 'What is StreamVault?', answer: 'StreamVault is a premium streaming platform that offers cinematic originals, thrilling series, anime-inspired content, and diverse entertainment across all devices.' },
          { question: 'How much does StreamVault cost?', answer: 'We offer several subscription plans tailored to your needs, including Basic, Standard, and Premium tiers. Please check our Plans page for the latest pricing.' },
          { question: 'Can I watch StreamVault on my mobile phone?', answer: 'Yes, you can stream StreamVault on iOS, Android, tablets, and smart TVs via web browsers or native applications.' },
          { question: 'How do I cancel my subscription?', answer: 'You can cancel your subscription at any time by visiting your Profile settings page and clicking the \'Cancel Subscription\' button. There are no cancellation fees.' },
          { question: 'Are there any ads on StreamVault?', answer: 'Our premium plans are entirely ad-free. The basic tier might include minimal promotional content for upcoming features.' },
          { question: 'Can I download content to watch offline?', answer: 'Offline downloads are supported on mobile and tablet devices with active Premium subscriptions.' },
          { question: 'How often is new content added?', answer: 'We update our library weekly, adding new episodes of ongoing shows, exclusive film releases, and curated international titles.' },
          { question: 'Is content available in 4K Ultra HD?', answer: 'Yes, our Premium tier supports 4K Ultra HD streaming with HDR and Dolby Atmos where available.' },
          { question: 'How many screens can watch simultaneously?', answer: 'Simultaneous screens depend on your plan: Basic supports 1 screen, Standard supports 2, and Premium supports up to 4 screens at the same time.' },
          { question: 'What languages and subtitles are available?', answer: 'Most titles feature original audio alongside English subtitles. Select major releases also offer dubbed audio tracks in multiple languages.' },
          { question: 'Is StreamVault safe for children?', answer: 'Absolutely. You can set up parental controls and restricted viewing profiles in your Account Settings to ensure a safe viewing environment.' },
          { question: 'How do I resolve playback buffering?', answer: 'We recommend checking your internet connection, lowering the stream quality in player settings, or restarting your browser/device. A minimum of 5 Mbps is recommended for HD.' },
          { question: 'Can I share my account with family?', answer: 'Account sharing is permitted within a single household. Sharing credentials with people outside your household may result in temporary account lockouts.' },
          { question: 'Do you offer a free trial?', answer: 'We occasionally run promotional campaigns offering free trials. Please subscribe to our newsletter or check the Plans page for active offers.' },
          { question: 'What payment methods are accepted?', answer: 'We accept all major credit/debit cards, UPI, net banking, and popular mobile wallets through our secure payment gateway.' },
          { question: 'How do I update my payment details?', answer: 'Go to your Profile page, select the Billing tab, and update your card or UPI preferences securely.' },
          { question: 'Can I request a movie or TV show?', answer: 'We would love to hear your suggestions! Drop us a line using the Contact Us form, and our content acquisition team will look into it.' },
          { question: 'Why is a specific title not available in my region?', answer: 'Content availability varies by region due to licensing agreements. We work hard to secure global streaming rights for all our original titles.' },
          { question: 'How do I reach customer support?', answer: 'You can reach us by completing the form on our Contact Us page. Our support specialists typically respond within 24 hours.' }
        ]
      },
      {
        slug: 'contact-us',
        title: 'Contact Us',
        lastUpdated: '22-06-2025',
        content: 'Have questions, feedback, or need assistance? Fill out the form below, and our support team will get back to you as soon as possible. Our representatives are available 24/7 to resolve technical difficulties, answer plan queries, or hear your feedback.',
        settings: {
          contactEmail: 'xyz@domain.com'
        }
      },
      {
        slug: 'careers',
        title: 'Careers',
        lastUpdated: '22-06-2025',
        content: 'Join the StreamVault team and help shape the future of entertainment! We are always looking for passionate storytellers, engineers, and creators to help build a world-class OTT platform.',
        settings: {
          careersText: 'no job openings update soon.'
        }
      }
    ];

    for (const page of defaultPages) {
      const existing = await FooterPage.findOne({ slug: page.slug });
      if (!existing) {
        await FooterPage.create(page);
        logger.info(`Seeded default footer page: ${page.slug}`);
      }
    }
  } catch (error) {
    logger.error(`Error seeding default footer pages: ${error.message}`);
  }
}
