'use client';

import Link from 'next/link';

export default function CcTrustSection() {
    return (
        <section className="cc-mp-trust" aria-labelledby="cc-trust-heading">
            <div className="cc-mp-trust-head">
                <h2 id="cc-trust-heading">Know who you&apos;re choosing.</h2>
                <p>
                    Every conveyancer listed on PropReady goes through a verification process so
                    you can make a more informed decision.
                </p>
            </div>
            <div className="cc-mp-trust-grid">
                <article className="cc-mp-trust-card">
                    <h3>Verified professionals</h3>
                    <p>Identity and professional information verified.</p>
                </article>
                <article className="cc-mp-trust-card">
                    <h3>Real client feedback</h3>
                    <p>Ratings and reviews help you understand previous client experiences.</p>
                </article>
                <article className="cc-mp-trust-card">
                    <h3>Transparent comparison</h3>
                    <p>
                        Compare experience, services, availability and quotes before making a
                        decision.
                    </p>
                </article>
            </div>
        </section>
    );
}

export function CcHowItWorks() {
    return (
        <section className="cc-mp-steps" aria-label="How Conveyancer Connect works">
            <article className="cc-mp-step">
                <span className="cc-mp-step-num">01</span>
                <h3>Search</h3>
                <p>Find conveyancers based on your location and transfer needs.</p>
            </article>
            <article className="cc-mp-step">
                <span className="cc-mp-step-num">02</span>
                <h3>Compare</h3>
                <p>Review ratings, experience, services and fees.</p>
            </article>
            <article className="cc-mp-step">
                <span className="cc-mp-step-num">03</span>
                <h3>Choose</h3>
                <p>Request a quote and instruct the conveyancer you trust.</p>
            </article>
        </section>
    );
}

export function CcFinalCta() {
    return (
        <section className="cc-mp-final" aria-labelledby="cc-final-heading">
            <div className="cc-mp-final-copy">
                <p className="cc-mp-final-kicker">Ready to instruct?</p>
                <h2 id="cc-final-heading">
                    Your property transfer starts with the right professional.
                </h2>
                <p className="cc-mp-final-lead">
                    Compare trusted conveyancers and move forward with confidence.
                </p>
            </div>
            <div className="cc-mp-final-actions">
                <a href="#cc-results" className="cc-mp-final-primary">
                    Find a Conveyancer
                </a>
                <Link href="/conveyancers/learn" className="cc-mp-final-secondary">
                    How conveyancing works
                </Link>
            </div>
        </section>
    );
}
