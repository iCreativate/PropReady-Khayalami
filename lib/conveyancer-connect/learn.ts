export interface LearnArticle {
    slug: string;
    title: string;
    summary: string;
    minutes: number;
    sections: Array<{ heading: string; body: string }>;
}

export const LEARN_ARTICLES: LearnArticle[] = [
    {
        slug: 'what-is-a-conveyancer',
        title: 'What is a conveyancer?',
        summary: 'Understand the attorney who legally transfers property ownership in South Africa.',
        minutes: 4,
        sections: [
            {
                heading: 'The short answer',
                body: 'A conveyancer is an attorney specially admitted to prepare and lodge deeds that transfer ownership of immovable property and register bonds at the Deeds Office.',
            },
            {
                heading: 'Why it matters',
                body: 'Your conveyancer coordinates FICA, guarantees, rates clearance, lodgement and registration — the legal path from offer accepted to keys and title.',
            },
        ],
    },
    {
        slug: 'transfer-process',
        title: 'The property transfer process',
        summary: 'A clear walkthrough from offer accepted to registration.',
        minutes: 6,
        sections: [
            {
                heading: 'Instruction to registration',
                body: 'After the offer is accepted, the transferring attorney is instructed, FICA is collected, documents are signed, the bond (if any) is approved, guarantees are issued, documents are lodged, and ownership registers.',
            },
            {
                heading: 'Typical duration',
                body: 'Many straightforward bonded residential transfers complete in roughly 8–12 weeks, depending on bank, municipality and Deeds Office turnaround.',
            },
        ],
    },
    {
        slug: 'transfer-costs',
        title: 'Transfer costs explained',
        summary: 'Transfer duty, attorney fees, disbursements and VAT — what you actually pay.',
        minutes: 5,
        sections: [
            {
                heading: 'Major cost buckets',
                body: 'Buyers usually budget for transfer duty (or VAT on new developments), conveyancer fees, Deeds Office charges, rates/levy clearances and related disbursements.',
            },
            {
                heading: 'Estimates vs invoices',
                body: 'PropReady fee estimates are illustrative. Always request a written quotation from your chosen firm before instruction.',
            },
        ],
    },
    {
        slug: 'bond-registration',
        title: 'Bond registration basics',
        summary: 'How bond attorneys, guarantees and registration fit the transfer timeline.',
        minutes: 5,
        sections: [
            {
                heading: 'Two attorney roles',
                body: 'The transferring conveyancer moves ownership. A bond attorney (often appointed by the bank) registers the mortgage bond that secures the loan.',
            },
            {
                heading: 'Guarantees',
                body: 'Once the bond is approved, guarantees secure the purchase price so lodgement can proceed.',
            },
        ],
    },
    {
        slug: 'transfer-timeline',
        title: 'Transfer timeline milestones',
        summary: 'What “on track” looks like week by week.',
        minutes: 4,
        sections: [
            {
                heading: 'Use a tracker',
                body: 'PropReady’s Transfer Tracker maps each milestone — FICA, bond approval, guarantees, lodgement and registration — so you always know who owns the next action.',
            },
        ],
    },
    {
        slug: 'common-mistakes',
        title: 'Common conveyancing mistakes',
        summary: 'Avoid delays caused by incomplete FICA, unclear instruction and fee surprises.',
        minutes: 4,
        sections: [
            {
                heading: 'Top pitfalls',
                body: 'Late FICA, unsigned OTP annexures, underestimating rates clearance, and choosing on price alone without checking response times or specialty fit.',
            },
        ],
    },
    {
        slug: 'faq',
        title: 'Frequently asked questions',
        summary: 'Quick answers buyers, sellers and agents ask most often.',
        minutes: 3,
        sections: [
            {
                heading: 'Can I choose my own conveyancer?',
                body: 'Usually yes — the purchaser typically nominates the transferring attorney, unless the offer specifies otherwise. Compare credentials and service levels before you decide.',
            },
            {
                heading: 'Is Conveyancer Connect a law firm?',
                body: 'No. PropReady helps you discover and compare verified conveyancers. Legal work is performed by the independent firm you instruct.',
            },
        ],
    },
];

export function getLearnArticle(slug: string): LearnArticle | undefined {
    return LEARN_ARTICLES.find((a) => a.slug === slug);
}
