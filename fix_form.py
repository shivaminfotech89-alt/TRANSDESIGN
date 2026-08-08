fpath = 'src/components/TransformerForm.tsx'
with open(fpath, 'r') as f:
    content = f.read()

content = content.replace('const mats = matSnap.docs.map(d => ({id: d.id, ...d.data()}));', 'const mats = matSnap.docs.map(d => ({id: d.id, ...d.data()})) as any[];')
content = content.replace('const prices = priceSnap.docs.map(d => ({id: d.id, ...d.data()}));', 'const prices = priceSnap.docs.map(d => ({id: d.id, ...d.data()})) as any[];')

with open(fpath, 'w') as f:
    f.write(content)
