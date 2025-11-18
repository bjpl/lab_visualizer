import React from 'react';
import Link from 'next/link';
import { Github, Twitter, Mail } from 'lucide-react';

const footerLinks = {
  product: [
    { name: 'Features', href: '#' },
    { name: 'Documentation', href: '#' },
    { name: 'API Reference', href: '#' },
    { name: 'Examples', href: '#' },
  ],
  resources: [
    { name: 'PDB Database', href: 'https://www.rcsb.org' },
    { name: 'AlphaFold', href: 'https://alphafold.ebi.ac.uk' },
    { name: 'Mol* Viewer', href: 'https://molstar.org' },
    { name: 'Tutorials', href: '#' },
  ],
  company: [
    { name: 'About', href: '#' },
    { name: 'Blog', href: '#' },
    { name: 'Contact', href: '#' },
    { name: 'Privacy', href: '#' },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-secondary-200 bg-white dark:border-secondary-800 dark:bg-secondary-950">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <h3 className="text-lg font-bold text-secondary-900 dark:text-white">LAB Visualizer</h3>
            <p className="mt-2 text-sm text-secondary-600 dark:text-secondary-400">
              Interactive molecular structure visualization platform for education and research.
            </p>
            <div className="mt-4 flex space-x-4">
              <a
                href="https://github.com"
                className="text-secondary-400 hover:text-secondary-500"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com"
                className="text-secondary-400 hover:text-secondary-500"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="mailto:contact@example.com"
                className="text-secondary-400 hover:text-secondary-500"
                aria-label="Email"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-sm font-semibold text-secondary-900 dark:text-white">Product</h4>
            <ul className="mt-4 space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-secondary-600 hover:text-primary-600 dark:text-secondary-400"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h4 className="text-sm font-semibold text-secondary-900 dark:text-white">Resources</h4>
            <ul className="mt-4 space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-secondary-600 hover:text-primary-600 dark:text-secondary-400"
                    target={link.href.startsWith('http') ? '_blank' : undefined}
                    rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-sm font-semibold text-secondary-900 dark:text-white">Company</h4>
            <ul className="mt-4 space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-secondary-600 hover:text-primary-600 dark:text-secondary-400"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 border-t border-secondary-200 pt-8 dark:border-secondary-800">
          <p className="text-center text-sm text-secondary-500">
            &copy; {new Date().getFullYear()} LAB Visualizer. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
