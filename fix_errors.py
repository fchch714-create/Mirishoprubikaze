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
    285: '                  ))}',
    312: '                  ))}',
    330: '                  ))}',
    520: '                ))}',
    526: '      <AnimatePresence>',
    578: '                        ))}',
    605: '                        ))}',
    623: '                        ))}',
    639: '            </motion.div>',
    640: '        )}',
    641: '      </AnimatePresence>',
    642: '',
    651: '            {isMobileSortOpen && (<motion.div',
    694: '                ))}'
})

patch_file('src/components/layout/Header.tsx', {
    186: '              ))}',
    215: '                  ))}',
    301: '          {isMobileMenuOpen && (<motion.div',
    337: '                    ))}',
    381: '                            ))}',
    384: '                          ))}',
    386: '                        </motion.div>',
    387: '                      )}',
    421: '      </AnimatePresence>'
})

