import csv, io, re, collections, random
p='/mnt/user-data/attachments/9b820a78-3c5d-529b-bd0e-7efcd843a755/ff5626a8-tk_lista.csv'
t=open(p,'rb').read().decode('iso-8859-2')
rows=list(csv.reader(io.StringIO(t), delimiter=';', quotechar='"'))
data=[[c.strip() for c in r] for r in rows[1:] if len(r)>=6]
names=sorted(set(r[1] for r in data))
UNIT=r'(?:mg|g|µg|μg|mcg|ml|M?IU|NE|E|mmol|MBq|GBq|%|mikrogramm|ezer\s*NE|millió\s*NE|mg/ml|U)'
STR=re.compile(r'(\d[\d.,]*\s*'+UNIT+r'(?:\s*/\s*(?:\d[\d.,]*\s*)?'+UNIT+r')*(?:\s*/\s*\d[\d.,]*\s*'+UNIT+r')*)', re.I)
random.seed(3)
ok=0
for n in random.sample(names,25):
    m=STR.search(n)
    print(repr(n),'=>', m.group(1) if m else None, '| rest:', n[m.end():].strip() if m else '')
print(sum(1 for n in names if STR.search(n)), len(names))
# form words frequency
forms=collections.Counter()
for n in names:
    m=STR.search(n)
    if m: forms[n[m.end():].strip().lower()]+=1
print(forms.most_common(60))
