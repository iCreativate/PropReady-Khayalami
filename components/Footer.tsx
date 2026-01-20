import Link from 'next/link';
import { Home, Mail, Phone, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-white border-t border-charcoal/10 mt-auto">
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
                    {/* Brand Section */}
                    <div>
                        <Link href="/" className="flex items-center space-x-2 mb-4">
                            <div className="w-10 h-10 bg-gold rounded-lg flex items-center justify-center">
                                <Home className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-charcoal text-xl font-bold">PropReady</span>
                        </Link>
                        <p className="text-charcoal/60 text-sm mb-4">
                            Your Home. Ready. 100% Free for buyers and Sellers - Get pre-qualified for a home loan in minutes.
                        </p>
                        <div className="flex items-center space-x-4">
                            <a
                                href="#"
                                className="w-8 h-8 rounded-full bg-charcoal/5 flex items-center justify-center text-charcoal/60 hover:text-gold hover:bg-gold/10 transition"
                                aria-label="Facebook"
                            >
                                <Facebook className="w-4 h-4" />
                            </a>
                            <a
                                href="#"
                                className="w-8 h-8 rounded-full bg-charcoal/5 flex items-center justify-center text-charcoal/60 hover:text-gold hover:bg-gold/10 transition"
                                aria-label="Twitter"
                            >
                                <Twitter className="w-4 h-4" />
                            </a>
                            <a
                                href="#"
                                className="w-8 h-8 rounded-full bg-charcoal/5 flex items-center justify-center text-charcoal/60 hover:text-gold hover:bg-gold/10 transition"
                                aria-label="Instagram"
                            >
                                <Instagram className="w-4 h-4" />
                            </a>
                            <a
                                href="#"
                                className="w-8 h-8 rounded-full bg-charcoal/5 flex items-center justify-center text-charcoal/60 hover:text-gold hover:bg-gold/10 transition"
                                aria-label="LinkedIn"
                            >
                                <Linkedin className="w-4 h-4" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-charcoal font-bold text-lg mb-4">Quick Links</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/learn" className="text-charcoal/60 hover:text-gold transition text-sm">
                                    Learning Center for Buyers
                                </Link>
                            </li>
                            <li>
                                <Link href="/sellers" className="text-charcoal/60 hover:text-gold transition text-sm">
                                    For Sellers
                                </Link>
                            </li>
                            <li>
                                <Link href="/search" className="text-charcoal/60 hover:text-gold transition text-sm">
                                    Properties
                                </Link>
                            </li>
                            <li>
                                <Link href="/calculator" className="text-charcoal/60 hover:text-gold transition text-sm">
                                    Bond Calculator
                                </Link>
                            </li>
                            <li>
                                <Link href="/dashboard" className="text-charcoal/60 hover:text-gold transition text-sm">
                                    Dashboard
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Resources */}
                    <div>
                        <h3 className="text-charcoal font-bold text-lg mb-4">Resources</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/learn" className="text-charcoal/60 hover:text-gold transition text-sm">
                                    Home Buying Guide
                                </Link>
                            </li>
                            <li>
                                <Link href="/sellers" className="text-charcoal/60 hover:text-gold transition text-sm">
                                    Selling Guide
                                </Link>
                            </li>
                            <li>
                                <Link href="/calculator" className="text-charcoal/60 hover:text-gold transition text-sm">
                                    Transfer Costs
                                </Link>
                            </li>
                            <li>
                                <Link href="/quiz" className="text-charcoal/60 hover:text-gold transition text-sm">
                                    PropReady Quiz
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="text-charcoal font-bold text-lg mb-4">Contact Us</h3>
                        <ul className="space-y-3">
                            <li className="flex items-center space-x-2 text-charcoal/60 text-sm">
                                <Phone className="w-4 h-4 text-gold" />
                                <a href="tel:+27123456789" className="hover:text-gold transition">
                                    +27 12 345 6789
                                </a>
                            </li>
                            <li className="flex items-center space-x-2 text-charcoal/60 text-sm">
                                <Mail className="w-4 h-4 text-gold" />
                                <a href="mailto:info@propready.co.za" className="hover:text-gold transition">
                                    info@propready.co.za
                                </a>
                            </li>
                        </ul>
                        <div className="mt-6">
                            <Link
                                href="/agents/login"
                                className="inline-block px-4 py-2 bg-gold text-white font-semibold rounded-lg hover:bg-gold-600 transition text-sm"
                            >
                                Agent Login
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-charcoal/10 pt-8 mt-8">
                    <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                        <p className="text-charcoal/50 text-sm text-center md:text-left">
                            © {new Date().getFullYear()} PropReady-iKhayalami. All rights reserved.
                        </p>
                        <div className="flex items-center space-x-6 text-sm">
                            <Link href="#" className="text-charcoal/50 hover:text-gold transition">
                                Privacy Policy
                            </Link>
                            <Link href="#" className="text-charcoal/50 hover:text-gold transition">
                                Terms of Service
                            </Link>
                            <Link href="#" className="text-charcoal/50 hover:text-gold transition">
                                Cookie Policy
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}







