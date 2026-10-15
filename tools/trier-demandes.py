#!/usr/bin/env python3
"""Tous les deux jours (minuteur systemd) : relève les demandes des maîtresses
non traitées, fait proposer un tri par OmniRoute, et l'écrit dans
~/demandes-a-valider.md. Rien n'est envoyé aux maîtresses ni marqué traité :
c'est Cédric qui décide. Lit ~/.config/cm1-cm2/relais.env."""
import json, os, subprocess, time, urllib.request

for ligne in open(os.path.expanduser('~/.config/cm1-cm2/relais.env')):
    if '=' in ligne and not ligne.startswith('#'):
        k, v = ligne.strip().split('=', 1); os.environ.setdefault(k, v)
CLE = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')
if not CLE:
    raise SystemExit('Clé service_role manquante dans ~/.config/cm1-cm2/relais.env')
H = {'apikey': CLE, 'Authorization': 'Bearer ' + CLE}
url = os.environ['SUPABASE_URL'].rstrip('/') + '/rest/v1/demandes_administrateur?traitee=eq.false&order=created_at.asc&select=id,created_at,teacher_email,resume,demande'
demandes = json.load(urllib.request.urlopen(urllib.request.Request(url, headers=H), timeout=30))

def proposer(d):
    consigne = (
        "Tu aides l'administrateur d'une application d'exercices scolaires (CE1 à 3e, PWA). Une enseignante a fait cette demande. "
        "Propose un tri : « répondre » (une réponse suffit, sans changer l'application), « à coder » (il faut modifier l'application) ou « refuser » "
        "(hors sujet, risqué, données personnelles). Réponds en français, en 3 lignes : Tri : … / Pourquoi : … / Brouillon de réponse à l'enseignante : …\n\n"
        f"Résumé : {d['resume']}\nDemande : {d['demande']}"
    )
    corps = {'model': os.environ.get('OMNIROUTE_MODELES', 'gratuit-fiable').split(',')[0], 'temperature': 0.2, 'max_tokens': 800,
             'messages': [{'role': 'user', 'content': consigne}]}
    req = urllib.request.Request(os.environ['OMNIROUTE_URL'], json.dumps(corps).encode(),
                                 {'Authorization': 'Bearer ' + os.environ['OMNIROUTE_KEY'], 'Content-Type': 'application/json'})
    try:
        return json.load(urllib.request.urlopen(req, timeout=120))['choices'][0]['message']['content'].strip()
    except Exception as e:
        return f'(proposition indisponible : {e})'

lignes = [f"# Demandes à valider — {time.strftime('%d/%m/%Y %H:%M')}", '', f'{len(demandes)} demande(s) non traitée(s).', '']
for d in demandes:
    lignes += [f"## {d['created_at'][:10]} · {d['teacher_email']}", f"id : {d['id']}", f"Demande : {d['demande']}", '', proposer(d), '']
open(os.path.expanduser('~/demandes-a-valider.md'), 'w').write('\n'.join(lignes))
if demandes:
    subprocess.run(['notify-send', 'École Arc-en-Ciel', f'{len(demandes)} demande(s) de maîtresse à valider'], check=False)
print(len(demandes), 'demande(s)')
