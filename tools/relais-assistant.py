#!/usr/bin/env python3
"""Le relais de l'assistant, sur le PC de Cédric.

Il lit les questions déposées par la fonction Supabase « assistant-problemes »
dans la table assistant_travaux, les fait traiter par OmniRoute (local), et y
écrit la réponse. Rien n'est ouvert sur internet : c'est le PC qui va chercher.

Configuration (~/.config/cm1-cm2/relais.env) :
  SUPABASE_URL=https://….supabase.co
  SUPABASE_SERVICE_ROLE_KEY=…      (clé « service_role », à ne jamais publier)
  OMNIROUTE_URL=http://127.0.0.1:20128/v1/chat/completions
  OMNIROUTE_KEY=sk-…
  OMNIROUTE_MODELES=antigravity/gemini-3.8-flash-tiered,gratuit-fiable
"""
import json, os, time, urllib.request, urllib.error

def env(nom, defaut=None):
    valeur = os.environ.get(nom, defaut)
    if valeur is None:
        raise SystemExit(f'{nom} manquant dans ~/.config/cm1-cm2/relais.env')
    return valeur

SUPABASE = env('SUPABASE_URL').rstrip('/') + '/rest/v1/assistant_travaux'
CLE = env('SUPABASE_SERVICE_ROLE_KEY')
OMNI = env('OMNIROUTE_URL', 'http://127.0.0.1:20128/v1/chat/completions')
OMNI_CLE = env('OMNIROUTE_KEY')
MODELES = env('OMNIROUTE_MODELES', 'antigravity/gemini-3.8-flash-tiered,gratuit-fiable').split(',')
ENTETES = {'apikey': CLE, 'Content-Type': 'application/json', **({} if CLE.startswith('sb_secret_') else {'Authorization': 'Bearer ' + CLE})}

def base(methode, requete='', corps=None, prefer=None):
    entetes = dict(ENTETES, **({'Prefer': prefer} if prefer else {}))
    req = urllib.request.Request(SUPABASE + requete, json.dumps(corps).encode() if corps is not None else None, entetes, method=methode)
    with urllib.request.urlopen(req, timeout=30) as r:
        texte = r.read().decode()
        return json.loads(texte) if texte else None

def repondre(systeme, messages):
    for modele in MODELES:
        try:
            corps = {'model': modele, 'temperature': 0.2, 'max_tokens': 6000, 'response_format': {'type': 'json_object'},
                     'messages': [{'role': 'system', 'content': systeme}, *messages]}
            req = urllib.request.Request(OMNI, json.dumps(corps).encode(), {'Authorization': 'Bearer ' + OMNI_CLE, 'Content-Type': 'application/json'})
            with urllib.request.urlopen(req, timeout=100) as r:
                texte = json.load(r)['choices'][0]['message']['content'] or ''
            if '{' in texte:
                return texte
        except Exception as e:
            print('modèle', modele, 'en échec :', e, flush=True)
    return None

def tour():
    for travail in base('GET', '?statut=eq.en_attente&order=created_at.asc&limit=4&select=id,systeme,messages') or []:
        # On le prend seulement s'il est encore en attente : deux relais ne le traiteraient pas deux fois.
        pris = base('PATCH', f"?id=eq.{travail['id']}&statut=eq.en_attente", {'statut': 'en_cours'}, 'return=representation')
        if not pris:
            continue
        texte = repondre(travail['systeme'], travail['messages'])
        base('PATCH', f"?id=eq.{travail['id']}", {'statut': 'pret', 'reponse': texte} if texte else {'statut': 'erreur'})
        print(time.strftime('%H:%M:%S'), 'réponse', 'envoyée' if texte else 'en échec', flush=True)

if __name__ == '__main__':
    print('Relais de l\'assistant démarré', flush=True)
    while True:
        try:
            tour()
        except Exception as e:
            print('erreur :', e, flush=True)
            time.sleep(10)
        time.sleep(1.5)
