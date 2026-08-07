const fs = require('fs');
let content = fs.readFileSync('src/components/layout/Header.tsx', 'utf8');

content = content.replace(
  `              {/* User Admin Panel / Profile */}
              {isAdmin && (
                <Link
                  href={\`/\${locale}/admin\`}
                  className="hidden md:flex p-2.5 text-foreground hover:text-rubik-brand hover:bg-muted rounded-full transition-all duration-200"
                  aria-label="Admin panel"
                >
                  <User className="h-5 w-5" />
                </Link>
              )}`,
  `              {/* User Profile */}
              <Link
                href={\`/\${locale}/account\`}
                className="hidden md:flex p-2.5 text-foreground hover:text-rubik-brand hover:bg-muted rounded-full transition-all duration-200"
                aria-label="Account profile"
              >
                <User className="h-5 w-5" />
              </Link>`
);

content = content.replace(
  `              {/* Bottom Drawer Footer */}
              {isAdmin && (
                <div className="p-6 border-t border-border bg-muted/30 space-y-2">
                  <Link
                    href={\`/\${locale}/admin\`}
                    className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-foreground text-card text-sm font-semibold rounded-lg hover:bg-foreground/90 transition-colors"
                  >
                    Admin Panelinə keçid
                  </Link>
                </div>
              )}`,
  `              {/* Bottom Drawer Footer */}
              <div className="p-6 border-t border-border bg-muted/30 space-y-2">
                <Link
                  href={\`/\${locale}/account\`}
                  className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-foreground text-card text-sm font-semibold rounded-lg hover:bg-foreground/90 transition-colors"
                >
                  Şəxsi Kabinet
                </Link>
              </div>`
);

fs.writeFileSync('src/components/layout/Header.tsx', content);
