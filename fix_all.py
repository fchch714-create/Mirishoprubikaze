import sys

def patch_file(path, replacements):
    with open(path, 'r') as f:
        lines = f.readlines()
    
    for l_num, new_val in replacements.items():
        # 1-indexed to 0-indexed
        idx = l_num - 1
        lines[idx] = new_val + '\n'
        
    with open(path, 'w') as f:
        f.writelines(lines)

patch_file('src/components/layout/CategoryClientContent.tsx', {
    330: '                  ))}',
    331: '                </div>',
    332: '              </div>',
    333: '            )}',
    526: '      <AnimatePresence>',
    623: '                        ))}',
    624: '                    </div>',
    625: '                  </div>',
    639: '            </motion.div>',
    640: '          </React.Fragment>',
    641: '        )}',
    642: '      </AnimatePresence>',
    651: '        {isMobileSortOpen && (',
    652: '          <React.Fragment>',
    653: '            <motion.div',
    698: '            </motion.div>',
    699: '          </React.Fragment>',
    700: '        )}',
    701: '      </AnimatePresence>',
    702: '    </div>',
    703: '  );',
    704: '}'
})

patch_file('src/components/layout/Header.tsx', {
    301: '          {isMobileMenuOpen && (',
    302: '            <React.Fragment>',
    303: '              <motion.div',
    386: '                        </motion.div>',
    387: '                      )}',
    388: '                    </AnimatePresence>',
    412: '              </motion.div>',
    413: '            </React.Fragment>',
    414: '          )}',
    415: '        </AnimatePresence>',
    416: '      </header>',
    417: '      <CartDrawer',
    418: '        isOpen={isCartOpen}',
    419: '        onClose={() => setIsCartOpen(false)}',
    420: '        dict={dict}',
    421: '        locale={locale}',
    422: '      />',
    423: '    </React.Fragment>',
    424: '  );',
    425: '}'
})
