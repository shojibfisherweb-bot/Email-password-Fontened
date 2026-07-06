// app/page.js
"use client";

import React from "react";
import Link from "next/link";

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-white font-sans text-[#202124]">

            {/* ===== HEADER ===== */}
            <header className="border-b border-[#dadce0] bg-white sticky top-0 z-50">
                <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-3 flex flex-col md:flex-row justify-between items-center gap-3">
                    {/* Logo */}
                    <p className="flex items-center gap-1">
                        <span className="text-2xl font-medium tracking-tight">
                            <span className="text-[#4285f4]">G</span>
                            <span className="text-[#ea4335]">o</span>
                            <span className="text-[#fbbc05]">o</span>
                            <span className="text-[#4285f4]">g</span>
                            <span className="text-[#34a853]">l</span>
                            <span className="text-[#ea4335]">e</span>
                        </span>
                        <span className="text-lg font-normal ml-2 hidden sm:inline">About</span>
                    </p>

                    {/* Navigation */}
                    <nav className="flex items-center gap-4 md:gap-6">
                        <p className="text-sm font-medium text-[#202124] relative after:content-[''] after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-[2px] after:bg-[#1a73e8]">
                            About
                        </p>
                        <p className="text-sm font-medium text-[#5f6368] hover:text-[#202124] transition-colors">
                            Products
                        </p>
                        <p className="text-sm font-medium text-[#5f6368] hover:text-[#202124] transition-colors">
                            Company Info
                        </p>
                        <a
                            href="https://blog.google"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-[#5f6368] hover:text-[#202124] transition-colors flex items-center gap-1"
                        >
                            News
                            <svg className="w-4 h-4 fill-[#5f6368]" viewBox="0 0 24 24">
                                <path d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
                            </svg>
                        </a>
                    </nav>
                </div>
            </header>

            {/* ===== HERO SECTION ===== */}
            <section className="bg-black text-white py-12 md:py-16">
                <div className="max-w-[1200px] mx-auto px-4 md:px-6 grid md:grid-cols-2 gap-8 items-center">
                    <div className="space-y-4 md:space-y-6">
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-light leading-tight">
                            Build with Nano Banana 2 Lite and Gemini Omni Flash
                        </h1>
                        <p className="text-base md:text-lg text-white/85 leading-relaxed">
                            Whether you're generating thousands of images or editing multi-turn video sequences,
                            now you can build faster and bring your creative vision to life.
                        </p>
                        <a
                            href="https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-omni-flash-nano-banana-2-lite/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block bg-white text-[#202124] px-6 md:px-8 py-3 rounded font-medium hover:bg-[#e8eaed] transition-colors"
                        >
                            Try for yourself
                        </a>
                    </div>
                    <div className="flex justify-center">
                        <img
                            src="https://www.gstatic.com/marketing-cms/assets/images/b0/e9/051fab3645c58a40e8de9d3fba6c/omni-2up.webp"
                            alt="Gemini Omni Flash and Nano Banana 2 Lite"
                            className="max-w-full rounded-lg"
                        />
                    </div>
                </div>
            </section>

            {/* ===== CARDS SECTION ===== */}
            <section className="py-8 md:py-12">
                <div className="max-w-[1200px] mx-auto px-4 md:px-6">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Card 1 */}
                        <a
                            href="https://about.google/products/"
                            className="group bg-white border border-[#dadce0] rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                        >
                            <div className="aspect-video overflow-hidden">
                                <img
                                    src="https://www.gstatic.com/marketing-cms/assets/images/75/98/d7a4a1254760b96d76382879c575/products-homepage-card.png"
                                    alt="Google Products"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                            </div>
                            <div className="p-4 md:p-5 flex justify-between items-start gap-4">
                                <h3 className="text-base font-medium text-[#202124] flex-1 leading-snug">
                                    Explore our products and features across Search, Google Workspace and more
                                </h3>
                                <span className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-full bg-[#f1f3f4] group-hover:bg-[#e8eaed] transition-colors">
                                    <svg className="w-4 h-4 fill-[#5f6368]" viewBox="0 0 24 24">
                                        <path d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
                                    </svg>
                                </span>
                            </div>
                        </a>

                        {/* Card 2 */}
                        <a
                            href="https://deepmind.google/models/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group bg-white border border-[#dadce0] rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                        >
                            <div className="aspect-video overflow-hidden">
                                <img
                                    src="https://www.gstatic.com/marketing-cms/assets/images/9d/f8/6ff52e274df88a0dcb150746f9f9/about-3up-gdm.webp"
                                    alt="Google DeepMind"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                            </div>
                            <div className="p-4 md:p-5 flex justify-between items-start gap-4">
                                <h3 className="text-base font-medium text-[#202124] flex-1 leading-snug">
                                    Learn all about our leading AI models — and discover their capabilities
                                </h3>
                                <span className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-full bg-[#f1f3f4] group-hover:bg-[#e8eaed] transition-colors">
                                    <svg className="w-4 h-4 fill-[#5f6368]" viewBox="0 0 24 24">
                                        <path d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
                                    </svg>
                                </span>
                            </div>
                        </a>

                        {/* Card 3 */}
                        <a
                            href="https://ai.google/research/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group bg-white border border-[#dadce0] rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                        >
                            <div className="aspect-video overflow-hidden">
                                <img
                                    src="https://www.gstatic.com/marketing-cms/assets/images/34/4a/c86092bf4ee49037af1b1f7db46f/about-google-homepage-research.jpeg"
                                    alt="Google Research"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                            </div>
                            <div className="p-4 md:p-5 flex justify-between items-start gap-4">
                                <h3 className="text-base font-medium text-[#202124] flex-1 leading-snug">
                                    See how we're tackling some of the most challenging problems in computer science
                                </h3>
                                <span className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-full bg-[#f1f3f4] group-hover:bg-[#e8eaed] transition-colors">
                                    <svg className="w-4 h-4 fill-[#5f6368]" viewBox="0 0 24 24">
                                        <path d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
                                    </svg>
                                </span>
                            </div>
                        </a>
                    </div>
                </div>
            </section>

            {/* ===== PROMO SECTION ===== */}
            <section className="py-8 md:py-12">
                <div className="max-w-[800px] mx-auto px-4 text-center">
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-light mb-3">Gemini Spark updates</h2>
                    <p className="text-base md:text-lg text-[#5f6368] leading-relaxed mb-6">
                        Gemini Spark is getting even more helpful, from a new desktop experience to deeper connections with your favorite apps.
                    </p>
                    <a
                        href="https://blog.google/innovation-and-ai/products/gemini-app/gemini-spark-updates-june-2026/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block bg-[#1a73e8] text-white px-8 py-3 rounded font-medium hover:bg-[#1557b0] transition-colors"
                    >
                        See what's new
                    </a>
                </div>
            </section>

            {/* ===== VIDEO SECTION ===== */}
            <section className="pb-6 md:pb-8">
                <div className="max-w-[1200px] mx-auto px-4 md:px-6">
                    <div className="rounded-xl overflow-hidden bg-black">
                        <video
                            className="w-full block"
                            muted
                            loop
                            playsInline
                            autoPlay
                            poster="https://www.gstatic.com/marketing-cms/assets/images/2e/64/87d0abee45689a02b43ba4904250/spark.webp"
                        >
                            <source
                                src="https://www.gstatic.com/marketing-cms/53/8f/1650bbc0405997cb77309078a5ee/spark-about.mp4"
                                type="video/mp4"
                            />
                        </video>
                    </div>
                </div>
            </section>

            {/* ===== FEATURE PROMO ===== */}
            <section className="py-12 md:py-16 bg-[#f3f5fb]">
                <div className="max-w-[1200px] mx-auto px-4 md:px-6">
                    <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
                        <div>
                            <img
                                src="https://www.gstatic.com/marketing-cms/assets/images/8c/bc/0c3db6f24c66826dce0376d78111/floodalert.webp"
                                alt="Flood Alert"
                                className="w-full rounded-lg"
                            />
                        </div>
                        <div className="space-y-4">
                            <h2 className="text-2xl md:text-3xl lg:text-4xl font-light leading-tight">
                                Working towards a world where no one is surprised by a natural disaster
                            </h2>
                            <p className="text-base md:text-lg text-[#5f6368] leading-relaxed">
                                Learn how we're using AI-powered tools and insights to make reliable information available
                                to people at times of crises — when they need it most.
                            </p>
                            <a
                                href="https://blog.google/innovation-and-ai/technology/research/helping-communities-prepare-for-natural-disasters/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block bg-[#1a73e8] text-white px-8 py-3 rounded font-medium hover:bg-[#1557b0] transition-colors"
                            >
                                Read more
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== GLOBAL PROMO ===== */}
            <section className="py-10 md:py-14">
                <div className="max-w-[800px] mx-auto px-4 text-center">
                    <div className="mb-4">
                        <img
                            src="https://www.gstatic.com/marketing-cms/assets/images/5b/b0/3a62c7b4486e943fceeeb3fe90df/g-about-gatg.png"
                            alt="Google"
                            className="w-16 h-16 mx-auto"
                            width="64"
                            height="64"
                        />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-light mb-2">Google around the globe</h2>
                    <p className="text-base md:text-lg text-[#5f6368] mb-6">Learn about Google's work and impact around the world.</p>
                    <a
                        href="https://about.google/around-the-globe/"
                        className="inline-block bg-[#1a73e8] text-white px-8 py-3 rounded font-medium hover:bg-[#1557b0] transition-colors"
                    >
                        Explore
                    </a>
                </div>
            </section>

            {/* ===== CTA SECTION ===== */}
            <section className="py-10 md:py-14">
                <div className="max-w-[800px] mx-auto px-4">
                    <div className="bg-[#f2f5fa] rounded-[32px] p-8 md:p-12 text-center">
                        <h3 className="text-xl md:text-2xl font-light mb-2">Get the latest news from Google in your inbox</h3>
                        <p className="text-base md:text-lg text-[#5f6368] mb-6">
                            Sign up to receive top stories from the week — from product announcements, to everyday tips.
                        </p>
                        <a
                            href="https://blog.google/newsletter-subscribe/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block bg-[#e8eaed] text-[#202124] px-8 py-3 rounded font-medium hover:bg-[#dadce0] transition-colors"
                        >
                            Subscribe
                        </a>
                    </div>
                </div>
            </section>

            {/* ===== FOOTER ===== */}
            <footer className="bg-[#f8f9fa] border-t border-[#dadce0] pt-8 md:pt-12 pb-6">
                <div className="max-w-[1200px] mx-auto px-4 md:px-6">

                    {/* Footer Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 pb-8 border-b border-[#dadce0]">
                        {/* Column 1 */}
                        <div>
                            <h4 className="text-sm font-medium text-[#202124] mb-3">Resources</h4>
                            <ul className="space-y-2 text-sm text-[#5f6368]">
                                <li><a href="https://www.blog.google/" target="_blank" rel="noopener noreferrer" className="hover:text-[#202124] transition-colors">Blog</a></li>
                                <li><a href="https://about.google/brand-resource-center/" className="hover:text-[#202124] transition-colors">Brand Resource Center</a></li>
                                <li><a href="https://careers.google.com/" target="_blank" rel="noopener noreferrer" className="hover:text-[#202124] transition-colors">Careers</a></li>
                                <li><a href="https://about.google/company-info/contact-google/" className="hover:text-[#202124] transition-colors">Contact us</a></li>
                                <li><a href="https://support.google.com/" target="_blank" rel="noopener noreferrer" className="hover:text-[#202124] transition-colors">Help Center</a></li>
                                <li><a href="https://abc.xyz/investor/" target="_blank" rel="noopener noreferrer" className="hover:text-[#202124] transition-colors">Investor Relations</a></li>
                                <li><a href="https://about.google/company-info/locations/" className="hover:text-[#202124] transition-colors">Locations</a></li>
                                <li><a href="https://www.blog.google/press/" target="_blank" rel="noopener noreferrer" className="hover:text-[#202124] transition-colors">Press resources</a></li>
                            </ul>
                        </div>

                        {/* Column 2 */}
                        <div>
                            <h4 className="text-sm font-medium text-[#202124] mb-3">Outreach and initiatives</h4>
                            <ul className="space-y-2 text-sm text-[#5f6368]">
                                <li><a href="https://google.com/accessibility" target="_blank" rel="noopener noreferrer" className="hover:text-[#202124] transition-colors">Accessibility</a></li>
                                <li><a href="https://crisisresponse.google/" target="_blank" rel="noopener noreferrer" className="hover:text-[#202124] transition-colors">Crisis Response</a></li>
                                <li><a href="https://www.google.org/" target="_blank" rel="noopener noreferrer" className="hover:text-[#202124] transition-colors">Google.org</a></li>
                                <li><a href="https://health.google/" target="_blank" rel="noopener noreferrer" className="hover:text-[#202124] transition-colors">Google for Health</a></li>
                                <li><a href="https://grow.google/" target="_blank" rel="noopener noreferrer" className="hover:text-[#202124] transition-colors">Grow with Google</a></li>
                                <li><a href="https://learning.google/" target="_blank" rel="noopener noreferrer" className="hover:text-[#202124] transition-colors">Learning</a></li>
                                <li><a href="https://publicpolicy.google/" target="_blank" rel="noopener noreferrer" className="hover:text-[#202124] transition-colors">Public Policy</a></li>
                                <li><a href="https://sustainability.google/" target="_blank" rel="noopener noreferrer" className="hover:text-[#202124] transition-colors">Sustainability</a></li>
                            </ul>
                        </div>

                        {/* Column 3 */}
                        <div>
                            <h4 className="text-sm font-medium text-[#202124] mb-3">Research and technology</h4>
                            <ul className="space-y-2 text-sm text-[#5f6368]">
                                <li><a href="https://ai.google/" target="_blank" rel="noopener noreferrer" className="hover:text-[#202124] transition-colors">Google AI</a></li>
                                <li><a href="https://cloud.google.com/" target="_blank" rel="noopener noreferrer" className="hover:text-[#202124] transition-colors">Google Cloud</a></li>
                                <li><a href="https://deepmind.google/" target="_blank" rel="noopener noreferrer" className="hover:text-[#202124] transition-colors">Google DeepMind</a></li>
                                <li><a href="https://developers.google.com/" target="_blank" rel="noopener noreferrer" className="hover:text-[#202124] transition-colors">Google for Developers</a></li>
                                <li><a href="https://labs.google/" target="_blank" rel="noopener noreferrer" className="hover:text-[#202124] transition-colors">Google Labs</a></li>
                                <li><a href="https://research.google/" target="_blank" rel="noopener noreferrer" className="hover:text-[#202124] transition-colors">Google Research</a></li>
                            </ul>
                        </div>

                        {/* Column 4 */}
                        <div>
                            <h4 className="text-sm font-medium text-[#202124] mb-3">More about us</h4>
                            <ul className="space-y-2 text-sm text-[#5f6368]">
                                <li><a href="https://about.google/around-the-globe/" className="hover:text-[#202124] transition-colors">Around the globe</a></li>
                                <li><a href="https://about.google/company-info/human-rights/" className="hover:text-[#202124] transition-colors">Human rights</a></li>
                                <li><a href="https://safety.google/" target="_blank" rel="noopener noreferrer" className="hover:text-[#202124] transition-colors">Safety Center</a></li>
                                <li><a href="https://sustainability.google/progress/supplier-responsibility/" target="_blank" rel="noopener noreferrer" className="hover:text-[#202124] transition-colors">Supplier responsibility</a></li>
                                <li><a href="https://transparency.google/" target="_blank" rel="noopener noreferrer" className="hover:text-[#202124] transition-colors">Transparency Center</a></li>
                                <li><a href="https://transparencyreport.google.com/" target="_blank" rel="noopener noreferrer" className="hover:text-[#202124] transition-colors">Transparency Report</a></li>
                            </ul>
                        </div>
                    </div>

                    {/* Footer Bottom */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-6">
                        <div>
                            <img
                                src="https://www.gstatic.com/marketing-cms/assets/images/b3/a5/529a3d3047d18be9a5f3547ad7e3/google-logo-footer.svg"
                                alt="Google"
                                className="h-6 w-auto"
                            />
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-[#5f6368]">
                            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-[#202124] transition-colors">Privacy</a>
                            <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="hover:text-[#202124] transition-colors">Terms</a>
                            <button className="bg-transparent border-none text-[#5f6368] text-sm font-inherit cursor-pointer hover:text-[#202124] transition-colors">
                                Cookies management controls
                            </button>
                        </div>
                    </div>
                </div>
            </footer>

        </div>
    );
}