import React from "react";

export default function ContactUs() {
  return (
    <section className="w-full max-w-3xl mx-auto bg-white border border-[#e5e7eb] rounded-xl px-6 md:px-12 py-16 mt-16 shadow-lg flex flex-col items-center justify-center">
      <h1 className="text-4xl sm:text-5xl font-extrabold text-[#5b5be6] mb-10 text-center">Contact Us</h1>
      <div className="flex flex-col md:flex-row gap-10 w-full justify-center">
        {/* Person 1 */}
        <div className="flex-1 bg-gray-50 rounded-lg p-6 shadow-sm flex flex-col items-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Reeshmanth</h2>
          <div className="flex gap-5 mt-2">
            <a href="https://github.com/reeshmanth" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="hover:text-indigo-600 transition-colors">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.865 8.184 6.839 9.504.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.154-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.004.07 1.532 1.032 1.532 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.339-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.987 1.029-2.686-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.295 2.748-1.025 2.748-1.025.546 1.378.202 2.397.1 2.65.64.699 1.028 1.593 1.028 2.686 0 3.847-2.338 4.695-4.566 4.944.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.749 0 .267.18.577.688.479C19.138 20.2 22 16.448 22 12.021 22 6.484 17.523 2 12 2z" /></svg>
            </a>
            <a href="www.linkedin.com/in/reeshmanth-chowdary-557319275" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="hover:text-indigo-600 transition-colors">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-10h3v10zm-1.5-11.268c-.966 0-1.75-.784-1.75-1.75s.784-1.75 1.75-1.75 1.75.784 1.75 1.75-.784 1.75-1.75 1.75zm13.5 11.268h-3v-5.604c0-1.337-.025-3.063-1.868-3.063-1.868 0-2.154 1.459-2.154 2.967v5.7h-3v-10h2.881v1.367h.041c.401-.761 1.381-1.563 2.841-1.563 3.039 0 3.6 2.001 3.6 4.599v5.597z" /></svg>
            </a>
            <a href="http://t.me/reeshmanth" target="_blank" rel="noopener noreferrer" aria-label="Telegram" className="hover:text-indigo-600 transition-colors">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M9.036 16.569l-.396 3.724c.568 0 .814-.244 1.112-.537l2.664-2.523 5.522 4.033c1.012.558 1.73.264 1.98-.937l3.594-16.84c.327-1.513-.547-2.104-1.527-1.74L2.16 9.197c-1.48.576-1.463 1.396-.253 1.77l4.59 1.434 10.646-6.7c.5-.326.96-.145.583.181z" /></svg>
            </a>
            <a href="mailto:2320030321@klh.edu.in" aria-label="Email" className="hover:text-indigo-600 transition-colors">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M2 4a2 2 0 012-2h16a2 2 0 012 2v16a2 2 0 01-2 2H4a2 2 0 01-2-2V4zm2 0v.01L12 13l8-8.99V4H4zm16 2.243l-7.071 7.071a2 2 0 01-2.828 0L4 6.243V20h16V6.243z" /></svg>
            </a>
          </div>
        </div>
        {/* Person 2 */}
        <div className="flex-1 bg-gray-50 rounded-lg p-6 shadow-sm flex flex-col items-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Sathvik</h2>
          <div className="flex gap-5 mt-2">
            <a href="https://github.com/sathvikchoudar61" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="hover:text-indigo-600 transition-colors">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.865 8.184 6.839 9.504.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.154-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.004.07 1.532 1.032 1.532 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.339-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.987 1.029-2.686-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.295 2.748-1.025 2.748-1.025.546 1.378.202 2.397.1 2.65.64.699 1.028 1.593 1.028 2.686 0 3.847-2.338 4.695-4.566 4.944.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.749 0 .267.18.577.688.479C19.138 20.2 22 16.448 22 12.021 22 6.484 17.523 2 12 2z" /></svg>
            </a>
            <a href="www.linkedin.com/in/sathvik-choudary-a73249286" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="hover:text-indigo-600 transition-colors">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-10h3v10zm-1.5-11.268c-.966 0-1.75-.784-1.75-1.75s.784-1.75 1.75-1.75 1.75.784 1.75 1.75-.784 1.75-1.75 1.75zm13.5 11.268h-3v-5.604c0-1.337-.025-3.063-1.868-3.063-1.868 0-2.154 1.459-2.154 2.967v5.7h-3v-10h2.881v1.367h.041c.401-.761 1.381-1.563 2.841-1.563 3.039 0 3.6 2.001 3.6 4.599v5.597z" /></svg>
            </a>
            <a href="https://t.me/sathvik_17" target="_blank" rel="noopener noreferrer" aria-label="Telegram" className="hover:text-indigo-600 transition-colors">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M9.036 16.569l-.396 3.724c.568 0 .814-.244 1.112-.537l2.664-2.523 5.522 4.033c1.012.558 1.73.264 1.98-.937l3.594-16.84c.327-1.513-.547-2.104-1.527-1.74L2.16 9.197c-1.48.576-1.463 1.396-.253 1.77l4.59 1.434 10.646-6.7c.5-.326.96-.145.583.181z" /></svg>
            </a>
            <a href="mailto:2320030235@klh.edu.in" aria-label="Email" className="hover:text-indigo-600 transition-colors">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M2 4a2 2 0 012-2h16a2 2 0 012 2v16a2 2 0 01-2 2H4a2 2 0 01-2-2V4zm2 0v.01L12 13l8-8.99V4H4zm16 2.243l-7.071 7.071a2 2 0 01-2.828 0L4 6.243V20h16V6.243z" /></svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
} 