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
    330: '                  onChange={(e) => setMaxPrice(parseInt(e.target.value))}',
    623: '                      onChange={(e) => setMaxPrice(parseInt(e.target.value))}',
    638: '            </motion.div>',
    639: '          </React.Fragment>',
    640: '        )}',
    641: '      </AnimatePresence>',
    642: '      <AnimatePresence>'
})

