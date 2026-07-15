import AgentLearnCallout from '@/components/AgentLearnCallout';
import AgentLearnSection, {
    AgentLearnBullets,
    AgentLearnDoDont,
    AgentLearnHighlight,
    AgentLearnInfo,
    AgentLearnSteps,
    AgentLearnSubhead,
} from '@/components/AgentLearnSection';
import { BOND_ORIGINATORS, formatBondOriginatorList } from '@/lib/bond-originators';

export const COMPLIANCE_LEARN_ARTICLES: Record<
    string,
    { title: string; icon: string; content: React.ReactNode }
> = {
    'understanding-homeloans': {
        title: 'Understanding Home Loans for Agents',
        icon: 'Home',
        content: (
            <div className="contents">
                <p>
                    Buyers rarely separate the property from the finance. Agents who understand home loans
                    close more deals, set realistic expectations, and stay within EAAB boundaries — you
                    facilitate the transaction; you do not give financial advice unless you are licensed to
                    do so.
                </p>

                <AgentLearnSection title="How a South African home loan works">
                    <p>
                        Most buyers use a bond registered over the property as security. The bank lends a
                        percentage of the purchase price (loan-to-value); the buyer repays capital plus
                        interest over 20–30 years.
                    </p>
                    <AgentLearnSteps
                        items={[
                            'Buyer applies to a bank or bond originator with income, expenses, and credit profile.',
                            'Bank grants approval in principle (AIP) or final grant — subject to property valuation.',
                            'Attorney registers the bond at the Deeds Office after transfer; bank pays purchase price on registration.',
                        ]}
                    />
                </AgentLearnSection>

                <AgentLearnSection title="Pre-approval vs final grant — know the difference">
                    <p>
                        PropReady prequalification and bank pre-approval are not the same as a final grant.
                        Teach buyers the gap so offers are not lost to finance fall-through.
                    </p>
                    <div className="learn-highlight-row">
                        <AgentLearnHighlight
                            label="Pre-approval / AIP"
                            value="Indicative"
                            detail="Based on income & credit — property not yet assessed"
                            tone="blue"
                        />
                        <AgentLearnHighlight
                            label="Final grant"
                            value="Binding"
                            detail="After valuation, FICA, and full credit assessment"
                            tone="emerald"
                        />
                        <AgentLearnHighlight
                            label="Typical LTV"
                            value="80–100%"
                            detail="Varies by profile, bank, and property type"
                            tone="amber"
                        />
                    </div>
                </AgentLearnSection>

                <AgentLearnSection title="Affordability — what buyers must budget for">
                    <p>
                        The bond instalment is only part of the cost. Agents who explain the full picture
                        build trust and reduce fall-through after OTP.
                    </p>
                    <AgentLearnSubhead>Cost breakdown</AgentLearnSubhead>
                    <AgentLearnBullets
                        variant="tip"
                        items={[
                            { text: <><strong>Bond repayment</strong> — capital + interest (use bank calculators for estimates only).</> },
                            { text: <><strong>Transfer duty</strong> — government tax on property value (exemptions for first-time buyers under thresholds).</> },
                            { text: <><strong>Transfer & bond registration costs</strong> — attorney fees, deeds office, bank initiation.</> },
                            { text: <><strong>Insurance</strong> — building insurance often required; life cover may be ceded to the bank.</> },
                            { text: <><strong>Rates, levies, utilities</strong> — ongoing costs from occupation date.</> },
                        ]}
                    />
                </AgentLearnSection>

                <AgentLearnSection title="The bond timeline agents should track">
                    <AgentLearnSteps
                        items={[
                            'OTP signed with finance clause and clear deadline (typically 7–21 days).',
                            'Buyer submits full application immediately — delays here kill deals.',
                            'Valuation instructed; price vs valuation mismatch must be resolved early.',
                            'Grant issued; buyer accepts; attorney receives instructions.',
                            'Registration on transfer — agent coordinates access for valuers and snag lists.',
                        ]}
                    />
                </AgentLearnSection>

                <AgentLearnSection title="EAAB-aligned do&apos;s and don&apos;ts">
                    <AgentLearnDoDont
                        doItems={[
                            'Ask if the buyer is pre-approved and which originator or bank they use.',
                            'Refer to a registered bond originator or the buyer\'s bank for quotes.',
                        ]}
                        dontItems={[
                            'Guarantee approval, quote interest rates as certain, or complete bond applications unless your brokerage policy allows it.',
                            'Receive commission from a bank for referring a buyer unless disclosed and permitted under EAAB rules.',
                        ]}
                    />
                    <AgentLearnInfo variant="eaab" title="EAAB boundary">
                        <p>
                            You facilitate the property transaction — you do not provide financial advice unless
                            you are licensed to do so.
                        </p>
                    </AgentLearnInfo>
                </AgentLearnSection>

                <AgentLearnCallout title="PropReady tip">
                    <p>
                        Capture bond status on every buyer lead: pre-qualified, in application, granted, or
                        cash. Deals with confirmed finance close faster — prioritise them in your pipeline.
                    </p>
                </AgentLearnCallout>
            </div>
        ),
    },
    'bond-origination': {
        title: 'Bond Origination: A Guide for Estate Agents',
        icon: 'Landmark',
        content: (
            <div className="contents">
                <p>
                    Bond originators shop a buyer&apos;s application across multiple banks to secure
                    competitive terms. For agents, they are partners who speed up finance — not competitors.
                    Used correctly, originators reduce failed OTPs and keep you EAAB-compliant.
                </p>

                <AgentLearnSection title="What bond originators do">
                    <p>
                        Originators are intermediaries between the buyer and banks. They assess affordability,
                        package the application, submit to several lenders, and help the buyer accept the best
                        offer. They earn a fee from the bank — not from the buyer in most models.
                    </p>
                    <p>
                        Major SA originators include {formatBondOriginatorList()}. PropReady lets you note which
                        originator a lead uses so follow-up stays coordinated.
                    </p>
                    <AgentLearnBullets
                        variant="check"
                        items={BOND_ORIGINATORS.map((o, index) => ({
                            text: (
                                <>
                                    <strong>{o.name}</strong>
                                    {index === 0 ? ' — primary partner for competitive specialist home loans.' : ` — ${o.description}.`}
                                </>
                            ),
                        }))}
                    />
                </AgentLearnSection>

                <AgentLearnSection title="When to introduce an originator">
                    <AgentLearnSteps
                        items={[
                            'At first serious enquiry — before viewings on properties above their stated budget.',
                            'When OTP is imminent and buyer has no pre-approval or is unsure which bank to use.',
                            'When a bank declines or valuation comes in low — originator may place with another lender.',
                            'When buyer is self-employed or has a complex credit profile needing specialist packaging.',
                        ]}
                    />
                </AgentLearnSection>

                <AgentLearnSection title="The agent&apos;s role (stay in your lane)">
                    <AgentLearnBullets
                        variant="check"
                        items={[
                            { text: <><strong>Connect</strong> — warm intro to a trusted originator; share property price and OTP timeline.</> },
                            { text: <><strong>Coordinate</strong> — ensure valuation access and keep seller informed of finance progress.</> },
                        ]}
                    />
                    <AgentLearnInfo variant="warning">
                        <p>
                            Do not fill in bond forms as the originator, promise rates, or pressure buyers to
                            use your preferred partner without disclosure.
                        </p>
                    </AgentLearnInfo>
                </AgentLearnSection>

                <AgentLearnSection title="EAAB & referral ethics">
                    <p>
                        The EAAB Code of Conduct requires honesty, disclosure of conflicts, and acting in the
                        client&apos;s interest. If you receive any referral fee, kickback, or material benefit
                        from an originator, you must disclose it to the client in writing before they commit.
                        Many agencies prohibit referral fees entirely — know your brokerage policy.
                    </p>
                    <div className="learn-highlight-row">
                        <AgentLearnHighlight
                            label="Best practice"
                            value="Disclose"
                            detail="Any financial relationship with an originator"
                            tone="emerald"
                        />
                        <AgentLearnHighlight
                            label="OTP clause"
                            value="Finance deadline"
                            detail="Align with realistic originator turnaround"
                            tone="blue"
                        />
                    </div>
                </AgentLearnSection>

                <AgentLearnSection title="Working the deal together">
                    <AgentLearnBullets
                        items={[
                            'Share OTP copy and suspensive conditions with the originator the same day.',
                            'Chase grant status every 48 hours until issued — silence causes seller anxiety.',
                            'If grant fails, renegotiate price or extend deadline before cancelling OTP.',
                            'Cash buyers: still verify proof of funds — EAAB expects you to act with due care.',
                        ]}
                    />
                </AgentLearnSection>

                <AgentLearnCallout title="Winning habit">
                    <p>
                        Build a short list of two originators you trust and introduce them by name on every
                        buyer call. Consistent partnerships mean faster turnarounds when deadlines matter.
                    </p>
                </AgentLearnCallout>
            </div>
        ),
    },
    'eaab-mandates-and-commission': {
        title: 'EAAB: Mandates, Commission & Disclosure',
        icon: 'FileText',
        content: (
            <div className="contents">
                <p>
                    Your mandate is the legal foundation of your listing. EAAB rules and the Consumer
                    Protection Act (CPA) require clear written terms — vague or verbal agreements are where
                    disputes and disciplinary complaints begin.
                </p>

                <AgentLearnSection title="Types of mandates">
                    <AgentLearnBullets
                        variant="compliance"
                        items={[
                            { text: <><strong>Open mandate</strong> — Multiple agents may market; commission to whoever introduces the buyer.</> },
                            { text: <><strong>Sole mandate</strong> — Only you market for a fixed period; read private-sale wording carefully.</> },
                            { text: <><strong>Exclusive mandate</strong> — You earn commission even if the seller finds the buyer (strongest agent protection).</> },
                        ]}
                    />
                    <AgentLearnInfo variant="important">
                        <p>
                            Always use your principal&apos;s EAAB-compliant mandate template. Never sign a mandate
                            you have not read line by line with the seller.
                        </p>
                    </AgentLearnInfo>
                </AgentLearnSection>

                <AgentLearnSection title="What must be in writing">
                    <AgentLearnSteps
                        items={[
                            'Commission rate or fixed fee and when it becomes payable (usually on registration).',
                            'Mandate period — start and end dates.',
                            'Marketing plan and estimated asking price / price range.',
                            'Who pays for advertising, if applicable.',
                            'Cancellation terms and notice periods.',
                            'Your FFC number and firm details.',
                        ]}
                    />
                </AgentLearnSection>

                <AgentLearnSection title="Mandatory disclosure (EAAB)">
                    <AgentLearnBullets
                        variant="compliance"
                        items={[
                            'Disclose that you are a registered estate agent in all marketing and negotiations.',
                            'Disclose if you, your family, or your firm has an interest in the property being sold.',
                            'Disclose dual agency situations — informed consent required; often restricted by your firm.',
                            'Do not withhold material defects you know or ought to know about the property.',
                        ]}
                    />
                </AgentLearnSection>

                <AgentLearnSection title="Commission disputes — prevention">
                    <p>
                        Most commission fights come from unclear mandates or buyer introduction proof. Log every
                        showing, enquiry source, and offer in PropReady or your CRM from day one.
                    </p>
                </AgentLearnSection>

                <AgentLearnInfo variant="warning" title="Red flag">
                    <p>
                        Never market a property without a signed mandate. Operating without authority exposes
                        you to EAAB disciplinary action and unpaid commission claims.
                    </p>
                </AgentLearnInfo>
            </div>
        ),
    },
    'eaab-fidelity-fund-cpd': {
        title: 'EAAB: FFC, Fidelity Fund & CPD',
        icon: 'BadgeCheck',
        content: (
            <div className="contents">
                <p>
                    You cannot practise without a valid Fidelity Fund Certificate (FFC). The EAAB uses the
                    fidelity fund to protect the public, and Continuing Professional Development (CPD) keeps
                    your registration active. PropReady PPRA verification aligns with these requirements.
                </p>

                <AgentLearnSection title="Fidelity Fund Certificate (FFC)">
                    <p>
                        The FFC proves you have paid into the Estate Agents Fidelity Fund and are registered.
                        It must be renewed annually. Display it at your place of business as required and
                        quote your FFC number on mandates and material documents.
                    </p>
                    <div className="learn-highlight-row">
                        <AgentLearnHighlight
                            label="FFC format"
                            value="15 digits"
                            detail="Starts with 20 — verify on EAAB portal"
                            tone="violet"
                        />
                        <AgentLearnHighlight
                            label="PPRA number"
                            value="7 digits"
                            detail="Practitioner registration — separate from FFC"
                            tone="sky"
                        />
                    </div>
                </AgentLearnSection>

                <AgentLearnSection title="What the fidelity fund covers">
                    <p>
                        The fund compensates members of the public who suffer financial loss due to theft or
                        failure to account for trust money by a registered estate agent. This is why trust
                        account rules are non-negotiable — your compliance protects the whole profession.
                    </p>
                </AgentLearnSection>

                <AgentLearnSection title="CPD requirements">
                    <p>
                        Registered estate agents must complete EAAB-approved CPD activities each year. Points
                        are earned through courses, seminars, and accredited content. Failure to comply can
                        block FFC renewal.
                    </p>
                    <AgentLearnSteps
                        items={[
                            'Track CPD points from 1 January — do not leave it to November.',
                            'Use EAAB-accredited providers; keep certificates on file.',
                            'Assign a calendar reminder 60 days before FFC expiry.',
                            'Upload your FFC to PropReady verification so buyers see you as trusted.',
                        ]}
                    />
                </AgentLearnSection>

                <AgentLearnSection title="Interns and non-principals">
                    <p>
                        If you are an intern estate agent, you practise under a principal&apos;s FFC. You
                        still have personal duties under the Code of Conduct. Principals must supervise
                        interns — know where your firm draws that line.
                    </p>
                </AgentLearnSection>

                <AgentLearnCallout title="Action item">
                    <p>
                        Check your FFC expiry today. If it lapses, you must stop practising immediately until
                        renewed — marketing or negotiating while lapsed is a serious EAAB offence.
                    </p>
                </AgentLearnCallout>
            </div>
        ),
    },
    'eaab-trust-money': {
        title: 'EAAB: Trust Money & Record-Keeping',
        icon: 'Vault',
        content: (
            <div className="contents">
                <p>
                    Mishandling trust money is the fastest route to EAAB suspension. Deposits, rental
                    held in trust, and other client funds must never touch your operating account. Auditors
                    and the EAAB inspect trust accounts — your records must reconcile to the cent.
                </p>

                <AgentLearnSection title="What counts as trust money">
                    <AgentLearnBullets
                        variant="warning"
                        items={[
                            'Deposits paid under an OTP pending transfer.',
                            'Rental received if you manage property (where authorised).',
                            'Any funds held on behalf of a client, not yours.',
                        ]}
                    />
                </AgentLearnSection>

                <AgentLearnSection title="Golden rules">
                    <AgentLearnSteps
                        items={[
                            'Deposit into the firm’s designated trust account only — same day or next banking day.',
                            'Never use trust money to pay office rent, commissions, or personal expenses.',
                            'Issue trust receipts and match bank statements monthly.',
                            'Pay out only on written instruction — OTP conditions met, transfer registered, or agreed release.',
                            'Retain records for the period required by EAAB (typically 5+ years).',
                        ]}
                    />
                </AgentLearnSection>

                <AgentLearnSection title="Agent responsibilities vs principal">
                    <p>
                        Even if you do not sign trust cheques, you may collect deposits. Hand them to your
                        principal&apos;s trust account immediately with proper documentation. Never hold cash
                        or EFT in your personal account &quot;until Monday.&quot;
                    </p>
                </AgentLearnSection>

                <AgentLearnSection title="FICA at deposit stage">
                    <p>
                        When accepting deposits, your firm must FICA the parties. Ensure ID and proof of
                        address are collected before or at deposit. This aligns with FIC Act duties and
                        protects against money laundering risk.
                    </p>
                </AgentLearnSection>

                <AgentLearnCallout title="Disciplinary reality">
                    <p>
                        Trust account offences can result in removal from the register, criminal referral,
                        and fidelity fund claims. If you are unsure whether a payment is trust money, treat
                        it as trust money and ask your principal.
                    </p>
                </AgentLearnCallout>
            </div>
        ),
    },
    'eaab-code-of-conduct': {
        title: 'EAAB Code of Conduct: Essentials',
        icon: 'BookMarked',
        content: (
            <div className="contents">
                <p>
                    The EAAB Code of Conduct is your professional rulebook. It sits alongside the Estate
                    Agency Affairs Act, CPA, POPIA, and FICA. Breaches can mean fines, suspension, or
                    removal from the register — regardless of how many deals you close.
                </p>

                <AgentLearnSection title="Core duties to clients">
                    <AgentLearnBullets
                        variant="compliance"
                        items={[
                            'Act honestly, with integrity, and in the best interest of your client.',
                            'Exercise skill, care, and diligence — know the property and the transaction.',
                            'Keep client information confidential unless disclosure is required by law.',
                            'Account for all money and property received on behalf of others.',
                        ]}
                    />
                </AgentLearnSection>

                <AgentLearnSection title="Marketing & property information">
                    <AgentLearnSteps
                        items={[
                            'Do not publish false or misleading descriptions or photos.',
                            'Do not advertise properties you have no mandate to market.',
                            'Disclose known defects that a reasonable buyer would consider material.',
                            'Display your status as an estate agent and firm name on marketing material.',
                        ]}
                    />
                </AgentLearnSection>

                <AgentLearnSection title="Conflicts of interest & referrals">
                    <p>
                        You must avoid conflicts where possible. Where unavoidable, disclose them in writing
                        before the client proceeds. This includes referral arrangements with bond originators,
                        attorneys, builders, or anyone from whom you receive a benefit.
                    </p>
                </AgentLearnSection>

                <AgentLearnSection title="Consumer Protection Act (CPA)">
                    <p>
                        Estate agency services fall under the CPA. Sellers and buyers have rights to clear
                        information, fair terms, and protection against misleading conduct. Mandates and
                        marketing must be transparent — no hidden fees or bait-and-switch pricing.
                    </p>
                </AgentLearnSection>

                <AgentLearnSection title="POPIA in practice">
                    <AgentLearnBullets
                        variant="tip"
                        items={[
                            'Collect only personal information needed for the transaction.',
                            'Secure storage — no client IDs in WhatsApp groups or personal email forever.',
                            'Respond to access and deletion requests via your firm\'s POPIA process.',
                        ]}
                    />
                </AgentLearnSection>

                <AgentLearnCallout title="When in doubt">
                    <p>
                        Ask your principal or compliance officer before a grey-area decision. Document the
                        advice. The EAAB investigates complaints from buyers, sellers, and competing agents —
                        professionalism is your best defence.
                    </p>
                </AgentLearnCallout>
            </div>
        ),
    },
    'transfer-and-registration': {
        title: 'Transfer, Bond Registration & Timelines',
        icon: 'ScrollText',
        content: (
            <div className="contents">
                <p>
                    After OTP, the attorney drives transfer and bond registration. Agents who understand
                    this pipeline manage seller and buyer expectations, chase delays, and look professional
                    — all within EAAB expectations of due care.
                </p>

                <AgentLearnSection title="Key role-players">
                    <AgentLearnBullets
                        items={[
                            { text: <><strong>Transfer attorney</strong> — Usually appointed by seller; handles deeds, rates clearance, transfer duty.</> },
                            { text: <><strong>Bond attorney</strong> — Instructed by the bank; registers bond simultaneously with transfer.</> },
                            { text: <><strong>Bank</strong> — Issues grant, instructs bond attorney, pays on registration.</> },
                            { text: <><strong>Deeds Office</strong> — Registers transfer and bond; timing varies by region.</> },
                        ]}
                    />
                </AgentLearnSection>

                <AgentLearnSection title="Typical timeline (varies)">
                    <AgentLearnSteps
                        items={[
                            'Week 0–1: OTP signed; deposit to trust; bond application submitted.',
                            'Week 1–3: Bond grant; attorneys open files; FICA and compliance documents.',
                            'Week 2–6: Rates clearance, transfer duty receipt, bond documents signed.',
                            'Week 4–10: Lodgement at Deeds Office; registration and funds paid.',
                        ]}
                    />
                    <p>
                        Cash deals can be faster; complex estates or levy disputes add weeks. Never promise
                        a registration date you cannot control — give ranges and update weekly.
                    </p>
                </AgentLearnSection>

                <AgentLearnSection title="Agent checklist after OTP">
                    <AgentLearnBullets
                        variant="check"
                        items={[
                            'Confirm deposit received in trust — get written confirmation from principal.',
                            'Introduce buyer, seller, and attorneys if your firm allows.',
                            'Schedule snag list and final inspection before occupation.',
                            'Track bond grant and lodgement dates in your CRM.',
                            'Commission invoice only when mandate terms trigger payment — usually registration.',
                        ]}
                    />
                </AgentLearnSection>

                <AgentLearnInfo variant="eaab">
                    <p>
                        You may recommend attorneys but must disclose any referral benefit. Many firms use
                        a panel — follow your principal&apos;s policy to stay compliant.
                    </p>
                </AgentLearnInfo>
            </div>
        ),
    },
};
