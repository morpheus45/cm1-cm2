#!/usr/bin/env python3
"""Les demandes des maîtresses transmises à l'administrateur.
  python3 tools/demandes.py            liste celles qui ne sont pas traitées
  python3 tools/demandes.py --traitee ID [ID…]   les marque traitées
Lit ~/.config/cm1-cm2/relais.env (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)."""
import json, os, sys, urllib.request

for ligne in open(os.path.expanduser('~/.config/cm1-cm2/relais.env')):
    if '=' in ligne and not ligne.startswith('#'):
        k, v = ligne.strip().split('=', 1); os.environ.setdefault(k, v)
URL = os.environ['SUPABASE_URL'].rstrip('/') + '/rest/v1/demandes_administrateur'
CLE = os.environ['SUPABASE_SERVICE_ROLE_KEY']
H = {'apikey': CLE, 'Content-Type': 'application/json', **({} if CLE.startswith('sb_secret_') else {'Authorization': 'Bearer ' + CLE})}

if len(sys.argv) > 2 and sys.argv[1] == '--traitee':
    for i in sys.argv[2:]:
        urllib.request.urlopen(urllib.request.Request(f'{URL}?id=eq.{i}', json.dumps({'traitee': True}).encode(), H, method='PATCH'))
    print(len(sys.argv) - 2, 'demande(s) marquée(s) traitée(s)')
else:
    req = urllib.request.Request(f'{URL}?traitee=eq.false&order=created_at.asc&select=id,created_at,teacher_email,resume,demande', headers=H)
    demandes = json.load(urllib.request.urlopen(req))
    print(len(demandes), 'demande(s) en attente')
    for d in demandes:
        print(f"\n— {d['id']} · {d['created_at'][:16]} · {d['teacher_email']}\n  Résumé : {d['resume']}\n  Demande : {d['demande']}")
