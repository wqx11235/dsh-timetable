import io, json
d = json.load(open('/root/workspace/jwxt/courses.json'))
for c in d['courses']:
    c.setdefault('campus', '阳光校区')
json.dump(d, open('/root/workspace/jwxt/courses.json', 'w'), ensure_ascii=False, indent=1)

tpl = io.open('/root/workspace/jwxt/kb.tpl.html', encoding='utf-8').read()
html = tpl.replace('/*__DATA__*/', json.dumps(d, ensure_ascii=False))
io.open('/root/workspace/jwxt/kb.html', 'w', encoding='utf-8').write(html)
print('html bytes', len(html))
