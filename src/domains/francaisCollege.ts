import { writtenItem as item, type WrittenItem } from './histoireGeographie';

/**
 * Le français du collège (étude de la langue), écrit à la main, de la 5e à la 3e.
 *
 * Programmes suivis en 2026-2027 :
 *  - 5e : nouveau programme de français du cycle 4 (BO n° 10 du 5 mars 2026), en vigueur en 5e
 *    dès la rentrée 2026 (en 4e en 2027, en 3e en 2028). Conjugaison : passé simple à toutes les
 *    personnes, futur et conditionnel, plus-que-parfait, impératif, passé et futur antérieurs par
 *    imitation, valeurs des temps. Accords : sujet-verbe complexes, chaînes du groupe nominal,
 *    attribut du sujet, participe passé avec être et avec avoir (COD placé avant, distinct du COI).
 *    Lexique : formation des mots, étymologie, relations de sens, registres, néologismes.
 *  - 4e et 3e : programme de cycle 4 de 2015, modifié en 2020 (BO n° 31 du 30 juillet 2020), et
 *    repères annuels de progression. 4e : subjonctif présent, temps composés, conditionnel passé,
 *    participe passé avec avoir, adjectifs de couleur, sujet « qui », homophones des conjonctions,
 *    étymologie grecque et latine, figures de style. 3e : valeurs des modes, subjonctif après
 *    certaines conjonctions, concordance des temps, voix passive, participe passé des verbes
 *    pronominaux et suivi d'un infinitif, « tout », « même », « leur », homophones lexicaux,
 *    connecteurs logiques, figures d'opposition et d'insistance.
 * La 6e (générateurs) a déjà posé les quatre temps de l'indicatif, le passé simple aux 3es
 * personnes, les homophones grammaticaux courants et les synonymes : le collège les prolonge.
 */
export const FRANCAIS_COLLEGE: Record<'conjugaison' | 'accords' | 'orthographe', WrittenItem[]> = {
  conjugaison: [
    // 5e T1 : le passé simple à toutes les personnes, l'imparfait et le passé simple dans le récit.
    item('5e', 1, 'Complète avec « ouvrir » au passé simple : Hier, il **…** la porte.', 'ouvrit', ['ouvra', 'ouvrait', 'ouvrira'], 'Ouvrir est du 3e groupe : il ouvrit.'),
    item('5e', 1, 'Complète avec « prendre » au passé simple : Nous **…** le train de justesse.', 'prîmes', ['prenâmes', 'prenions', 'prendrons'], 'Au passé simple, prendre fait nous prîmes, avec un accent circonflexe.'),
    item('5e', 1, 'Complète avec « chanter » au passé simple : Ce soir-là, je **…** devant toute l\'école.', 'chantai', ['chantais', 'chanta', 'chantas'], 'Au passé simple, les verbes en -er font -ai à la 1re personne du singulier.'),
    item('5e', 1, 'Complète avec « être » au passé simple : Ils **…** surpris par l\'orage.', 'furent', ['fûrent', 'étaient', 'seront'], 'Être au passé simple : ils furent, sans accent circonflexe.'),
    item('5e', 1, 'Complète avec « avoir » au passé simple : Nous **…** très peur cette nuit-là.', 'eûmes', ['avions', 'eurent', 'aurons'], 'Avoir au passé simple : nous eûmes.'),
    item('5e', 1, 'Complète avec « venir » au passé simple : Elles **…** nous voir.', 'vinrent', ['venirent', 'venaient', 'vinrèrent'], 'Venir au passé simple : elles vinrent.'),
    item('5e', 1, 'Complète avec « faire » au passé simple : Vous **…** un long voyage.', 'fîtes', ['faisâtes', 'faisiez', 'ferez'], 'Faire au passé simple : vous fîtes.'),
    item('5e', 1, 'Complète avec « aller » au passé simple : Ce jour-là, tu **…** au marché.', 'allas', ['allais', 'alla', 'iras'], 'Aller au passé simple : tu allas, avec un s.'),
    item('5e', 1, 'Complète le récit : Le vent soufflait quand soudain la porte **…**.', 'claqua', ['claquait', 'claquera', 'claque'], 'Une action soudaine, de premier plan, se met au passé simple.'),
    item('5e', 1, 'Quelle forme est à l\'imparfait ?', 'il finissait', ['il finit', 'il finira', 'il finirait'], 'L\'imparfait se termine par -ait à la 3e personne du singulier.'),
    item('5e', 1, 'Dans « Il marchait depuis une heure », quelle est la valeur de l\'imparfait ?', 'une action qui dure, en arrière-plan', ['une action brève, de premier plan', 'une action future', 'un ordre'], 'Dans un récit, l\'imparfait décrit le décor et les actions qui durent.'),

    // 5e T2 : le futur, le conditionnel présent, le plus-que-parfait.
    item('5e', 2, 'Complète avec « finir » au futur : Demain, je **…** mes exercices.', 'finirai', ['finirais', 'finissais', 'finis'], 'Au futur, je prend -ai : je finirai. Le conditionnel prend -ais.'),
    item('5e', 2, 'Complète avec « vouloir » au conditionnel présent : Je **…** un verre d\'eau, s\'il vous plaît.', 'voudrais', ['voudrai', 'voulais', 'voulrais'], 'Le conditionnel présent se termine par -ais avec je.'),
    item('5e', 2, 'Complète avec « lire » : Si j\'avais le temps, je **…** ce livre.', 'lirais', ['lirai', 'lisais', 'lise'], 'Après si et l\'imparfait, on emploie le conditionnel présent.'),
    item('5e', 2, 'Complète avec « pouvoir » au futur : Nous **…** partir à midi.', 'pourrons', ['pourrions', 'pouvons', 'pourons'], 'Pouvoir prend deux r au futur : nous pourrons.'),
    item('5e', 2, 'Complète avec « voir » au conditionnel présent : Vous **…** mieux avec des lunettes.', 'verriez', ['verrez', 'voyiez', 'voiriez'], 'Voir a pour radical verr- au futur et au conditionnel : vous verriez.'),
    item('5e', 2, 'Complète avec « envoyer » au futur : Elle t\'**…** une carte.', 'enverra', ['envoiera', 'enverrait', 'envoyait'], 'Envoyer est irrégulier au futur : elle enverra.'),
    item('5e', 2, 'Complète avec « courir » au conditionnel présent : Ils **…** plus vite sans leur sac.', 'courraient', ['couraient', 'courreraient', 'courront'], 'Courir prend deux r au conditionnel : ils courraient.'),
    item('5e', 2, 'Complète avec « préparer » au plus-que-parfait : Elle **…** son sac avant de partir.', 'avait préparé', ['a préparé', 'avait préparer', 'eut préparé'], 'Le plus-que-parfait : l\'auxiliaire à l\'imparfait et le participe passé.'),
    item('5e', 2, 'Complète avec « partir » au plus-que-parfait : Les invités **…** avant minuit.', 'étaient partis', ['avaient partis', 'étaient parti', 'sont partis'], 'Partir se conjugue avec être : le participe s\'accorde avec le sujet.'),
    item('5e', 2, 'Quel temps exprime une demande polie dans « Je voudrais un café » ?', 'le conditionnel présent', ['le futur simple', 'l\'imparfait', 'le passé simple'], 'Le conditionnel présent adoucit une demande : c\'est sa valeur de politesse.'),

    // 5e T3 : l'impératif, le passé antérieur et le futur antérieur, les valeurs des temps.
    item('5e', 3, 'Complète avec « ranger » à l\'impératif : **…** ta chambre, s\'il te plaît !', 'Range', ['Ranges', 'Rangerais', 'Ranger'], 'À l\'impératif, les verbes en -er ne prennent pas de s avec tu.'),
    item('5e', 3, 'Complète avec « finir » à l\'impératif : **…** vos assiettes, les enfants !', 'Finissez', ['Finissiez', 'Finisez', 'Finirez'], 'À l\'impératif, la 2e personne du pluriel se termine par -ez.'),
    item('5e', 3, 'Complète avec « être » à l\'impératif : **…** sages pendant mon absence !', 'Soyez', ['Soyiez', 'Êtes', 'Serez'], 'Être à l\'impératif : sois, soyons, soyez.'),
    item('5e', 3, 'Complète avec « aller » à l\'impératif : **…** au tableau, Lucas !', 'Va', ['Vas', 'Vais', 'Aille'], 'Aller à l\'impératif fait va, sans s, avec tu.'),
    item('5e', 3, 'Complète avec « avoir » à l\'impératif : **…** confiance en toi !', 'Aie', ['Aies', 'Ai', 'As'], 'Avoir à l\'impératif : aie, ayons, ayez.'),
    item('5e', 3, 'Complète avec « finir » au futur antérieur : Quand tu **…** ton repas, tu sortiras.', 'auras fini', ['aurais fini', 'as fini', 'avais fini'], 'Le futur antérieur : l\'auxiliaire au futur et le participe passé.'),
    item('5e', 3, 'Complète avec « lire » au passé antérieur : Dès qu\'il **…** la lettre, il partit.', 'eut lu', ['avait lu', 'a lu', 'eût lu'], 'Le passé antérieur : l\'auxiliaire au passé simple et le participe passé.'),
    item('5e', 3, 'Dans « La Terre tourne autour du Soleil », quelle est la valeur du présent ?', 'une vérité générale', ['une action en cours', 'un passé proche', 'une habitude'], 'Ce qui est toujours vrai s\'écrit au présent de vérité générale.'),
    item('5e', 3, 'Dans « Chaque matin, il prenait le bus », quelle est la valeur de l\'imparfait ?', 'une habitude', ['une action soudaine', 'une vérité générale', 'un ordre'], 'L\'imparfait exprime une action répétée dans le passé.'),
    item('5e', 3, 'Quel verbe est conjugué au passé simple ?', 'nous partîmes', ['nous partions', 'nous partirons', 'nous sommes partis'], 'Au passé simple, nous partîmes se termine par -îmes.'),

    // 4e T1 : le subjonctif présent.
    item('4e', 1, 'Complète avec « venir » au subjonctif présent : Il faut que tu **…** à l\'heure.', 'viennes', ['viens', 'viendras', 'venais'], 'Après « il faut que », on emploie le subjonctif : que tu viennes.'),
    item('4e', 1, 'Complète avec « faire » au subjonctif présent : Il faut que nous **…** attention.', 'fassions', ['faisons', 'ferons', 'faisions'], 'Faire au subjonctif présent : que nous fassions.'),
    item('4e', 1, 'Complète avec « dire » au subjonctif présent : Je veux que tu **…** la vérité.', 'dises', ['dis', 'diras', 'disais'], 'Après un verbe de volonté, on emploie le subjonctif : que tu dises.'),
    item('4e', 1, 'Complète avec « être » au subjonctif présent : Je souhaite qu\'elle **…** heureuse.', 'soit', ['soie', 'est', 'sera'], 'Être au subjonctif présent : qu\'elle soit.'),
    item('4e', 1, 'Complète avec « avoir » au subjonctif présent : Il faut que vous **…** du courage.', 'ayez', ['ayiez', 'avez', 'aurez'], 'Avoir au subjonctif présent : que vous ayez, sans i.'),
    item('4e', 1, 'Complète avec « aller » au subjonctif présent : Il faut qu\'ils **…** chez le médecin.', 'aillent', ['vont', 'allent', 'iront'], 'Aller au subjonctif présent : qu\'ils aillent.'),
    item('4e', 1, 'Complète avec « pouvoir » au subjonctif présent : Je doute qu\'il **…** venir.', 'puisse', ['peut', 'pourra', 'pouvait'], 'Après « douter que », on emploie le subjonctif : qu\'il puisse.'),
    item('4e', 1, 'Complète avec « savoir » au subjonctif présent : Il faut que tu **…** ta leçon.', 'saches', ['sais', 'sauras', 'savais'], 'Savoir au subjonctif présent : que tu saches.'),
    item('4e', 1, 'Complète avec « travailler » au subjonctif présent : Il faut que nous **…** ce soir.', 'travaillions', ['travaillons', 'travaillerons', 'travaillâmes'], 'Au subjonctif présent, nous prend -ions : que nous travaillions.'),
    item('4e', 1, 'Qu\'exprime le subjonctif dans « Je veux qu\'il parte » ?', 'une volonté', ['un fait certain', 'un fait passé', 'une vérité générale'], 'Le subjonctif exprime une action voulue, pas encore réalisée.'),

    // 4e T2 : les temps composés de l'indicatif.
    item('4e', 2, 'Complète avec « arriver » au plus-que-parfait : Nous **…** la veille.', 'étions arrivés', ['avions arrivé', 'sommes arrivés', 'étions arrivé'], 'Arriver se conjugue avec être : nous étions arrivés.'),
    item('4e', 2, 'Complète avec « arriver » au passé antérieur : Quand ils **…**, la fête commença.', 'furent arrivés', ['étaient arrivés', 'fûrent arrivés', 'sont arrivés'], 'Le passé antérieur : l\'auxiliaire au passé simple et le participe passé.'),
    item('4e', 2, 'Complète avec « finir » au futur antérieur : Dans une heure, j\'**…** ce livre.', 'aurai fini', ['aurais fini', 'avais fini', 'ai fini'], 'Le futur antérieur : l\'auxiliaire au futur et le participe passé.'),
    item('4e', 2, 'Complète avec « rentrer » au futur antérieur : Elles **…** avant la nuit.', 'seront rentrées', ['auront rentré', 'seront rentré', 'seraient rentrées'], 'Rentrer se conjugue avec être : le participe s\'accorde avec elles.'),
    item('4e', 2, 'À quel temps est « il eut mangé » ?', 'au passé antérieur', ['au plus-que-parfait', 'au passé composé', 'au futur antérieur'], 'Eut est l\'auxiliaire au passé simple : c\'est le passé antérieur.'),
    item('4e', 2, 'À quel temps est « nous aurons vu » ?', 'au futur antérieur', ['au conditionnel passé', 'au passé antérieur', 'au plus-que-parfait'], 'Aurons est l\'auxiliaire au futur : c\'est le futur antérieur.'),
    item('4e', 2, 'À quel temps est « vous aviez pris » ?', 'au plus-que-parfait', ['au passé antérieur', 'au passé composé', 'au conditionnel passé'], 'Aviez est l\'auxiliaire à l\'imparfait : c\'est le plus-que-parfait.'),
    item('4e', 2, 'Comment forme-t-on le passé antérieur ?', 'l\'auxiliaire au passé simple et le participe passé', ['l\'auxiliaire à l\'imparfait et le participe passé', 'l\'auxiliaire au futur et le participe passé', 'l\'auxiliaire au présent et le participe passé'], 'Chaque temps composé prend l\'auxiliaire à un temps simple.'),
    item('4e', 2, 'Complète avec « écrire » au passé antérieur : Dès que tu **…** ta lettre, tu la postas.', 'eus écrit', ['eut écrit', 'avais écrit', 'as écrit'], 'Avec tu, l\'auxiliaire avoir au passé simple s\'écrit eus.'),
    item('4e', 2, 'Complète avec le participe passé de « dire » : Il avait **…** la vérité.', 'dit', ['dis', 'dît', 'dire'], 'Le participe passé de dire se termine par un t : dit, dite.'),

    // 4e T3 : le conditionnel passé, les valeurs du conditionnel.
    item('4e', 3, 'Complète avec « venir » au conditionnel passé : Si tu m\'avais prévenu, je **…** plus tôt.', 'serais venu', ['serai venu', 'aurais venu', 'étais venu'], 'Le conditionnel passé : l\'auxiliaire au conditionnel et le participe passé.'),
    item('4e', 3, 'Complète avec « gagner » au conditionnel passé : Avec plus de chance, nous **…** le match.', 'aurions gagné', ['aurons gagné', 'aurions gagner', 'avions gagné'], 'Aurions est l\'auxiliaire au conditionnel, suivi du participe gagné.'),
    item('4e', 3, 'Complète avec « prendre » au conditionnel passé : Si j\'avais su, j\'**…** le bus.', 'aurais pris', ['aurai pris', 'avais pris', 'aurais prit'], 'Après si et le plus-que-parfait, on emploie le conditionnel passé.'),
    item('4e', 3, 'Complète avec « être » au conditionnel passé : Sans ton aide, elle **…** perdue.', 'aurait été', ['serait été', 'aura été', 'avait été'], 'Être se conjugue avec avoir aux temps composés : elle aurait été.'),
    item('4e', 3, 'Complète avec « venir » : Il avait promis qu\'il **…** le lendemain.', 'viendrait', ['viendra', 'viendrai', 'viendraient'], 'Dans un récit au passé, le conditionnel exprime le futur dans le passé.'),
    item('4e', 3, 'Quelle est la valeur du conditionnel dans « Pourriez-vous m\'aider ? »', 'une demande polie', ['un futur dans le passé', 'un fait certain', 'une habitude passée'], 'Le conditionnel adoucit une demande : c\'est la politesse.'),
    item('4e', 3, 'Quelle est la valeur du conditionnel dans « Il disait qu\'il viendrait » ?', 'un futur dans le passé', ['une demande polie', 'un regret', 'une habitude'], 'Après un verbe au passé, le conditionnel joue le rôle du futur.'),
    item('4e', 3, 'Quelle est la valeur du conditionnel dans « L\'incendie aurait fait deux blessés » ?', 'une information non vérifiée', ['un ordre', 'une habitude', 'une vérité générale'], 'Les journalistes emploient le conditionnel pour une information pas encore sûre.'),
    item('4e', 3, 'Quelle est la valeur du conditionnel dans « J\'aurais aimé te voir » ?', 'un regret', ['un futur dans le passé', 'un ordre', 'une vérité générale'], 'Le conditionnel passé exprime souvent un regret.'),
    item('4e', 3, 'À quel temps est « tu aurais dû » ?', 'au conditionnel passé', ['au futur antérieur', 'au plus-que-parfait', 'au conditionnel présent'], 'Aurais est l\'auxiliaire au conditionnel : c\'est le conditionnel passé.'),

    // 3e T1 : les modes, le subjonctif après certaines conjonctions, les valeurs du présent.
    item('3e', 1, 'Complète avec « être » : Bien qu\'il **…** fatigué, il continue.', 'soit', ['est', 'sera', 'était'], 'Bien que est toujours suivi du subjonctif.'),
    item('3e', 1, 'Complète avec « comprendre » : Je répète pour que tu **…** bien.', 'comprennes', ['comprends', 'comprendras', 'comprenais'], 'Pour que exprime le but : il est suivi du subjonctif.'),
    item('3e', 1, 'Complète avec « faire » : Rentre avant qu\'il ne **…** nuit.', 'fasse', ['fait', 'fera', 'faisait'], 'Avant que est suivi du subjonctif.'),
    item('3e', 1, 'Complète avec « être » : Après qu\'il **…** parti, nous dînerons.', 'sera', ['soit', 'serait', 'sois'], 'Après que est suivi de l\'indicatif, car l\'action est réalisée.'),
    item('3e', 1, 'Complète avec « avoir » : Quoiqu\'elle **…** raison, personne ne l\'écoute.', 'ait', ['a', 'aie', 'aura'], 'Quoique est suivi du subjonctif : qu\'elle ait.'),
    item('3e', 1, 'Complète avec « prendre » : Il faut que vous **…** vos cahiers.', 'preniez', ['prenez', 'prendrez', 'prenniez'], 'Au subjonctif présent, vous prend -iez : que vous preniez.'),
    item('3e', 1, 'Quel mode suit la conjonction « bien que » ?', 'le subjonctif', ['l\'indicatif', 'l\'impératif', 'le conditionnel'], 'Bien que introduit une concession : le verbe est au subjonctif.'),
    item('3e', 1, 'Quelle conjonction est suivie de l\'indicatif ?', 'parce que', ['pour que', 'bien que', 'afin que'], 'Parce que introduit une cause réelle : le verbe est à l\'indicatif.'),
    item('3e', 1, 'Dans « Napoléon naît en 1769 », quelle est la valeur du présent ?', 'un présent historique', ['un présent de vérité générale', 'un présent d\'habitude', 'un présent d\'énonciation'], 'Le présent historique raconte un fait passé pour le rendre vivant.'),
    item('3e', 1, 'À quel mode est « que nous soyons » ?', 'au subjonctif', ['à l\'indicatif', 'au conditionnel', 'à l\'impératif'], 'Soyons précédé de que est le subjonctif présent d\'être.'),

    // 3e T2 : la concordance des temps, le passé du subjonctif.
    item('3e', 2, 'Transpose au passé : Il dit qu\'il viendra. Il disait qu\'il **…**.', 'viendrait', ['viendra', 'viendrai', 'vienne'], 'Après un verbe au passé, le futur devient conditionnel présent.'),
    item('3e', 2, 'Transpose au passé : Elle pense qu\'il a réussi. Elle pensait qu\'il **…** réussi.', 'avait', ['a', 'ait', 'aura'], 'Après un verbe au passé, le passé composé devient plus-que-parfait.'),
    item('3e', 2, 'Transpose au passé : Je sais qu\'il est malade. Je savais qu\'il **…** malade.', 'était', ['soit', 'sera', 'sois'], 'Après un verbe au passé, le présent devient imparfait.'),
    item('3e', 2, 'Transpose au passé : Il promet qu\'il aura fini. Il promettait qu\'il **…** fini.', 'aurait', ['aura', 'aurai', 'ait'], 'Après un verbe au passé, le futur antérieur devient conditionnel passé.'),
    item('3e', 2, 'Transpose au passé : Tu crois qu\'il pleut. Tu croyais qu\'il **…**.', 'pleuvait', ['pleuve', 'pleuvra', 'pleuvais'], 'Après un verbe au passé, le présent devient imparfait : il pleuvait.'),
    item('3e', 2, 'Complète avec « réussir » au passé du subjonctif : Je suis content que tu **…** ton examen.', 'aies réussi', ['as réussi', 'aies réussis', 'auras réussi'], 'Le passé du subjonctif : l\'auxiliaire au subjonctif présent et le participe passé.'),
    item('3e', 2, 'Complète avec « partir » au passé du subjonctif : Il faut qu\'ils **…** avant midi.', 'soient partis', ['sont partis', 'aient partis', 'seront partis'], 'Partir se conjugue avec être : qu\'ils soient partis.'),
    item('3e', 2, 'Complète avec « partir » au passé du subjonctif : Je regrette qu\'elle **…** hier.', 'soit partie', ['est partie', 'soit parti', 'sois partie'], 'Avec être, le participe s\'accorde avec le sujet elle : partie.'),
    item('3e', 2, 'Comment forme-t-on le passé du subjonctif ?', 'l\'auxiliaire au subjonctif présent et le participe passé', ['l\'auxiliaire à l\'imparfait et le participe passé', 'l\'auxiliaire au futur et le participe passé', 'l\'auxiliaire au conditionnel et le participe passé'], 'Le passé du subjonctif est le temps composé du subjonctif présent.'),
    item('3e', 2, 'À quel temps est « qu\'ils aient compris » ?', 'au passé du subjonctif', ['au subjonctif présent', 'au passé composé', 'au plus-que-parfait'], 'Aient est l\'auxiliaire au subjonctif présent : c\'est le passé du subjonctif.'),

    // 3e T3 : la voix passive.
    item('3e', 3, 'Mets à la voix passive : Le chat mange la souris. La souris **…** par le chat.', 'est mangée', ['a mangé', 'est mangé', 'était mangée'], 'Le verbe être reste au présent, et le participe s\'accorde avec la souris.'),
    item('3e', 3, 'Mets à la voix passive : Le jury a récompensé les élèves. Les élèves **…** par le jury.', 'ont été récompensés', ['ont récompensé', 'ont été récompensé', 'avaient été récompensés'], 'Être se met au passé composé : ont été. Le participe s\'accorde avec élèves.'),
    item('3e', 3, 'Mets à la voix passive : Un orage détruira la cabane. La cabane **…** par un orage.', 'sera détruite', ['serait détruite', 'sera détruit', 'a été détruite'], 'Être se met au futur, et le participe s\'accorde avec la cabane.'),
    item('3e', 3, 'Mets à la voix passive : On avait fermé la porte. La porte **…**.', 'avait été fermée', ['a été fermée', 'avait été fermé', 'avait fermée'], 'Être se met au plus-que-parfait : avait été. Le participe s\'accorde avec porte.'),
    item('3e', 3, 'Mets à la voix active : Le gâteau est préparé par Lina. Lina **…** le gâteau.', 'prépare', ['a préparé', 'préparait', 'est préparée'], 'Le verbe être est au présent : à la voix active, le verbe est au présent.'),
    item('3e', 3, 'Quelle phrase est à la voix passive ?', 'La lettre est écrite par Paul.', ['Paul est parti hier.', 'Paul a écrit une lettre.', 'Paul s\'est levé tôt.'], 'À la voix passive, le sujet subit l\'action, faite par le complément d\'agent.'),
    item('3e', 3, 'Dans « Le pont sera construit par la ville », quel est le complément d\'agent ?', 'par la ville', ['le pont', 'sera construit', 'construit'], 'Le complément d\'agent fait l\'action. Il est souvent introduit par « par ».'),
    item('3e', 3, 'À quel temps est la phrase passive « La porte avait été fermée » ?', 'au plus-que-parfait', ['au passé composé', 'à l\'imparfait', 'au passé antérieur'], 'Le temps d\'une phrase passive est celui de l\'auxiliaire être : avait été.'),
    item('3e', 3, 'À quel temps est la phrase passive « Les routes sont fermées par la police » ?', 'au présent', ['au passé composé', 'au futur', 'à l\'imparfait'], 'Être est au présent : la phrase passive est au présent.'),
    item('3e', 3, 'Quelle phrase ne peut pas passer à la voix passive ?', 'Le chien dort dans sa niche.', ['Le chien mord le facteur.', 'Le chien ronge un os.', 'Le chien suit son maître.'], 'Seul un verbe qui a un COD peut passer à la voix passive.'),
  ],

  accords: [
    // 5e T1 : l'accord sujet-verbe dans les cas complexes, les chaînes du groupe nominal.
    item('5e', 1, 'Complète avec « tomber » : Les feuilles de cet arbre **…** en automne.', 'tombent', ['tombe', 'tombes', 'tombé'], 'Le sujet est les feuilles, pas cet arbre : le verbe est au pluriel.'),
    item('5e', 1, 'Complète avec « endormir » : Le bruit des vagues **…** le bébé.', 'endort', ['endorment', 'endors', 'endorme'], 'Le sujet est le bruit, au singulier : le verbe est au singulier.'),
    item('5e', 1, 'Complète avec « aboyer » : Le chien des voisins **…** toute la nuit.', 'aboie', ['aboient', 'aboit', 'aboye'], 'Le sujet est le chien, au singulier : il aboie.'),
    item('5e', 1, 'Complète avec « jouer » : Mon frère et ma sœur **…** au football.', 'jouent', ['joue', 'joues', 'jouer'], 'Deux sujets au singulier valent un sujet au pluriel.'),
    item('5e', 1, 'Complète avec « vivre » : Dans la forêt **…** des loups affamés.', 'vivent', ['vit', 'vis', 'vive'], 'Le sujet est placé après le verbe : des loups, au pluriel.'),
    item('5e', 1, 'Complète avec « penser » : Que **…** les élèves de cette sortie ?', 'pensent', ['pense', 'penses', 'pensé'], 'Dans cette question, le sujet les élèves est placé après le verbe.'),
    item('5e', 1, 'Complète avec « être » : Les enfants, à qui j\'ai donné des bonbons, **…** ravis.', 'sont', ['est', 'ait', 'son'], 'Le sujet est les enfants, séparé du verbe par la relative.'),
    item('5e', 1, 'Accorde « beau » : Il a acheté de **…** maisons anciennes.', 'belles', ['beaux', 'belle', 'bels'], 'L\'adjectif s\'accorde avec maisons, nom féminin pluriel.'),
    item('5e', 1, 'Accorde « neuf » : des chemises et des pantalons **…**', 'neufs', ['neuves', 'neuf', 'neuve'], 'Avec un nom féminin et un nom masculin, l\'adjectif se met au masculin pluriel.'),
    item('5e', 1, 'Accorde « doux » : une voix et un regard **…**', 'doux', ['douce', 'douces', 'douxs'], 'Masculin pluriel : doux ne change pas, car il finit déjà par x.'),

    // 5e T2 : l'attribut du sujet, les verbes attributifs, le participe passé avec être.
    item('5e', 2, 'Accorde « vrai » : Ces histoires semblent **…**.', 'vraies', ['vrais', 'vraie', 'vrai'], 'L\'attribut s\'accorde avec le sujet histoires, féminin pluriel.'),
    item('5e', 2, 'Accorde « sportif » : Mes cousines sont **…**.', 'sportives', ['sportifs', 'sportive', 'sportif'], 'L\'attribut s\'accorde avec cousines : -if devient -ive, puis -ives.'),
    item('5e', 2, 'Accorde « inquiet » : Ma tante et mon oncle paraissent **…**.', 'inquiets', ['inquiètes', 'inquiet', 'inquiète'], 'Un féminin et un masculin donnent un attribut au masculin pluriel.'),
    item('5e', 2, 'Accorde « aller » : Les filles sont **…** au cinéma.', 'allées', ['allés', 'allé', 'aller'], 'Avec être, le participe s\'accorde avec le sujet les filles.'),
    item('5e', 2, 'Accorde « rentrer » : Mes parents sont **…** tard.', 'rentrés', ['rentré', 'rentrées', 'rentrer'], 'Avec être, le participe s\'accorde avec mes parents, masculin pluriel.'),
    item('5e', 2, 'Accorde « tomber » : La neige est **…** toute la nuit.', 'tombée', ['tombé', 'tombées', 'tomber'], 'Avec être, le participe s\'accorde avec la neige, féminin singulier.'),
    item('5e', 2, 'Accorde « nettoyer » : Les vitres ont été **…**.', 'nettoyées', ['nettoyés', 'nettoyé', 'nettoyer'], 'Voix passive avec être : le participe s\'accorde avec le sujet « les vitres ».'),
    item('5e', 2, 'Dans « Lou devient médecin », quelle est la fonction de « médecin » ?', 'attribut du sujet', ['COD', 'complément circonstanciel', 'sujet'], 'Devenir est attributif : médecin donne une qualité au sujet Lou.'),
    item('5e', 2, 'Quel verbe est un verbe attributif ?', 'sembler', ['manger', 'courir', 'donner'], 'Être, sembler, paraître, devenir et rester relient le sujet à son attribut.'),
    item('5e', 2, 'Dans quelle phrase le verbe « rester » est-il attributif ?', 'Il reste calme.', ['Il reste à la maison.', 'Il reste un gâteau.', 'Il reste là.'], 'Calme est un adjectif qui qualifie le sujet : c\'est un attribut.'),

    // 5e T3 : le participe passé avec avoir (COD placé avant, distinct du COI).
    item('5e', 3, 'Accorde « cueillir » : Les pommes que j\'ai **…** étaient bonnes.', 'cueillies', ['cueilli', 'cueillis', 'cueillie'], 'Le COD que, mis pour les pommes, est placé avant : on accorde.'),
    item('5e', 3, 'Accorde « écrire » : J\'ai **…** une lettre.', 'écrit', ['écrite', 'écrits', 'écrire'], 'Le COD une lettre est placé après : le participe ne s\'accorde pas.'),
    item('5e', 3, 'Accorde « voir » : Ta sœur ? Je l\'ai **…** hier.', 'vue', ['vu', 'vus', 'vues'], 'Le COD l\', mis pour ta sœur, est placé avant : on accorde au féminin.'),
    item('5e', 3, 'Accorde « acheter » : Ces fleurs, je les ai **…** pour toi.', 'achetées', ['acheté', 'achetés', 'achetée'], 'Le COD les, mis pour ces fleurs, est placé avant : on accorde.'),
    item('5e', 3, 'Accorde « téléphoner » : Mes amies ? Je leur ai **…**.', 'téléphoné', ['téléphonées', 'téléphonés', 'téléphonée'], 'Leur est un COI : le participe avec avoir ne s\'accorde pas.'),
    item('5e', 3, 'Accorde « marcher » : Elles ont **…** toute la journée.', 'marché', ['marchées', 'marchés', 'marcher'], 'Avec avoir, le participe ne s\'accorde jamais avec le sujet.'),
    item('5e', 3, 'Accorde « choisir » : Quelle robe as-tu **…** ?', 'choisie', ['choisi', 'choisies', 'choisis'], 'Le COD quelle robe est placé avant : on accorde au féminin singulier.'),
    item('5e', 3, 'Accorde « prêter » : Les livres que tu m\'as **…** sont passionnants.', 'prêtés', ['prêté', 'prêtées', 'prêtée'], 'Le COD que, mis pour les livres, est placé avant : on accorde.'),
    item('5e', 3, 'Accorde « parler » : Nos voisins ? Nous leur avons **…**.', 'parlé', ['parlés', 'parlées', 'parler'], 'On parle à quelqu\'un : leur est un COI, pas d\'accord.'),
    item('5e', 3, 'Dans « Je les ai vus », quel mot est le COD placé avant le verbe ?', 'les', ['je', 'ai', 'vus'], 'Le pronom les est le COD : il commande l\'accord de vus.'),

    // 4e T1 : le participe passé avec avoir, cas variés.
    item('4e', 1, 'Accorde « commettre » : Les erreurs qu\'il a **…** sont rares.', 'commises', ['commis', 'commise', 'commit'], 'Le COD qu\', mis pour les erreurs, est placé avant : on accorde.'),
    item('4e', 1, 'Accorde « prendre » : Combien de photos as-tu **…** ?', 'prises', ['pris', 'prise', 'prit'], 'Le COD combien de photos est placé avant : on accorde.'),
    item('4e', 1, 'Accorde « entendre » : Ces chansons, nous les avons **…** cent fois.', 'entendues', ['entendu', 'entendus', 'entendue'], 'Le COD les, mis pour ces chansons, est placé avant : on accorde.'),
    item('4e', 1, 'Accorde « construire » : La maison qu\'ils ont **…** est neuve.', 'construite', ['construit', 'construites', 'construits'], 'Le COD qu\', mis pour la maison, est placé avant : on accorde.'),
    item('4e', 1, 'Accorde « perdre » : Elle a **…** ses clés.', 'perdu', ['perdues', 'perdus', 'perdue'], 'Le COD ses clés est placé après : pas d\'accord.'),
    item('4e', 1, 'Accorde « visiter » : Quels pays avez-vous **…** ?', 'visités', ['visité', 'visitées', 'visitée'], 'Le COD quels pays est placé avant : on accorde au masculin pluriel.'),
    item('4e', 1, 'Accorde « prévenir » : Mes grands-parents ? Je les ai **…**.', 'prévenus', ['prévenu', 'prévenues', 'prévenue'], 'Le COD les, mis pour mes grands-parents, est placé avant : on accorde.'),
    item('4e', 1, 'Accorde « ouvrir » : Ces lettres, qui les a **…** ?', 'ouvertes', ['ouvert', 'ouverts', 'ouverte'], 'Le COD les, mis pour ces lettres, est placé avant : on accorde.'),
    item('4e', 1, 'Accorde « faire » : Les tartes que maman a **…** sont délicieuses.', 'faites', ['fait', 'faits', 'faite'], 'Le COD que, mis pour les tartes, est placé avant : on accorde.'),
    item('4e', 1, 'Dans « les fleurs que j\'ai cueillies », quel mot est le COD de « cueillies » ?', 'que', ['j\'', 'ai', 'cueillies'], 'Le pronom relatif que, mis pour les fleurs, est le COD placé avant.'),

    // 4e T2 : les adjectifs de couleur, l'attribut, le sujet « qui ».
    item('4e', 2, 'Accorde « marron » : des yeux **…**', 'marron', ['marrons', 'marronnes', 'marronne'], 'Un nom employé comme couleur reste invariable : des yeux marron.'),
    item('4e', 2, 'Accorde « rose » : des robes **…**', 'roses', ['rose', 'rosées', 'rosés'], 'Rose est une exception : il s\'accorde comme un adjectif.'),
    item('4e', 2, 'Accorde « bleu clair » : des chemises **…**', 'bleu clair', ['bleues claires', 'bleues clair', 'bleu claires'], 'Un adjectif de couleur composé reste invariable.'),
    item('4e', 2, 'Accorde « marron » : des sacs **…**', 'marron', ['marrons', 'marronnes', 'marronne'], 'Marron est un nom employé comme couleur : il reste invariable.'),
    item('4e', 2, 'Accorde « vert » : des écharpes **…**', 'vertes', ['vert', 'verts', 'verte'], 'Un adjectif de couleur simple s\'accorde avec le nom.'),
    item('4e', 2, 'Accorde « gris foncé » : des voitures **…**', 'gris foncé', ['grises foncées', 'grises foncé', 'gris foncés'], 'Une couleur nuancée par un autre mot reste invariable.'),
    item('4e', 2, 'Accorde « actif » : Ma grand-mère est restée **…**.', 'active', ['actif', 'actifs', 'actives'], 'L\'attribut s\'accorde avec le sujet ma grand-mère, féminin singulier.'),
    item('4e', 2, 'Complète avec « faire » : C\'est moi qui **…** la vaisselle ce soir.', 'fais', ['fait', 'font', 'faisons'], 'Qui reprend moi : le verbe est à la 1re personne du singulier.'),
    item('4e', 2, 'Complète avec « avoir » : C\'est toi qui **…** raison.', 'as', ['a', 'à', 'ont'], 'Qui reprend toi : le verbe est à la 2e personne du singulier.'),
    item('4e', 2, 'Complète avec « être » : Les livres qui **…** sur la table sont à moi.', 'sont', ['est', 'son', 'ses'], 'Qui reprend les livres : le verbe est au pluriel.'),

    // 4e T3 : le sujet de plusieurs personnes, les déterminants indéfinis.
    item('4e', 3, 'Complète avec « aller » : Toi et moi **…** partir demain.', 'allons', ['allez', 'vont', 'va'], 'Toi et moi équivalent à nous : le verbe est à la 1re personne du pluriel.'),
    item('4e', 3, 'Complète avec « être » : Ton frère et toi **…** en retard.', 'êtes', ['sont', 'es', 'est'], 'Ton frère et toi équivalent à vous : vous êtes.'),
    item('4e', 3, 'Complète avec « avoir » : Lui et moi **…** la même passion.', 'avons', ['ont', 'a', 'avez'], 'Lui et moi équivalent à nous : nous avons.'),
    item('4e', 3, 'Complète avec « être » : Mes parents et moi **…** contents de te voir.', 'sommes', ['sont', 'êtes', 'est'], 'Mes parents et moi équivalent à nous : nous sommes.'),
    item('4e', 3, 'Complète avec « avoir » : Chaque élève **…** son cahier.', 'a', ['ont', 'as', 'à'], 'Chaque est toujours singulier : le verbe est au singulier.'),
    item('4e', 3, 'Accorde « aucun » : **…** livre ne m\'a plu.', 'Aucun', ['Aucuns', 'Aucune', 'Aucunes'], 'Aucun s\'accorde en genre avec livre, et reste au singulier.'),
    item('4e', 3, 'Complète avec « être » : Plusieurs élèves **…** absents.', 'sont', ['est', 'son', 'ont'], 'Plusieurs indique le pluriel : le verbe est au pluriel.'),
    item('4e', 3, 'Accorde le nom « porte » : Certaines **…** sont fermées.', 'portes', ['porte', 'portent', 'portés'], 'Certaines est un déterminant pluriel : le nom prend un s.'),
    item('4e', 3, 'Accorde le nom « pomme » : Il a acheté quelques **…**.', 'pommes', ['pomme', 'pommé', 'pommées'], 'Quelques indique le pluriel : le nom prend un s.'),
    item('4e', 3, 'Accorde « chaque » : **…** saison a son charme.', 'Chaque', ['Chaques', 'Chacune', 'Chacunes'], 'Chaque est un déterminant toujours au singulier.'),

    // 3e T1 : le participe passé des verbes pronominaux.
    item('3e', 1, 'Accorde « lever » : Elles se sont **…** tôt.', 'levées', ['levé', 'levés', 'lever'], 'Se est COD : elles ont levé qui ? elles-mêmes. On accorde.'),
    item('3e', 1, 'Accorde « laver » : Elles se sont **…** les mains.', 'lavé', ['lavées', 'lavés', 'laver'], 'Le COD les mains est placé après : pas d\'accord.'),
    item('3e', 1, 'Accorde « écrire » : Ils se sont **…** des lettres.', 'écrit', ['écrits', 'écrites', 'écrire'], 'Le COD des lettres est placé après : pas d\'accord.'),
    item('3e', 1, 'Accorde « parler » : Elles se sont **…** pendant des heures.', 'parlé', ['parlées', 'parlés', 'parler'], 'On parle à quelqu\'un : se est COI, pas d\'accord.'),
    item('3e', 1, 'Accorde « sourire » : Elles se sont **…**.', 'souri', ['souries', 'souris', 'sourire'], 'On sourit à quelqu\'un : se est COI, pas d\'accord.'),
    item('3e', 1, 'Accorde « blesser » : Ma sœur s\'est **…** au genou.', 'blessée', ['blessé', 'blessés', 'blesser'], 'Se est COD : elle a blessé elle-même. On accorde au féminin.'),
    item('3e', 1, 'Accorde « écrire » : Les lettres qu\'ils se sont **…** sont touchantes.', 'écrites', ['écrit', 'écrits', 'écrite'], 'Le COD qu\', mis pour les lettres, est placé avant : on accorde.'),
    item('3e', 1, 'Accorde « apercevoir » : Elles se sont **…** de leur erreur.', 'aperçues', ['aperçu', 'aperçus', 'aperçue'], 'S\'apercevoir de est toujours pronominal : on accorde avec le sujet.'),
    item('3e', 1, 'Accorde « souvenir » : Ils se sont **…** de ce voyage.', 'souvenus', ['souvenu', 'souvenues', 'souvenir'], 'Se souvenir est toujours pronominal : on accorde avec le sujet.'),
    item('3e', 1, 'Accorde « acheter » : Elle s\'est **…** une robe.', 'acheté', ['achetée', 'achetés', 'acheter'], 'Le COD une robe est placé après : pas d\'accord.'),

    // 3e T2 : le participe passé suivi d'un infinitif, le COD pronom relatif, l'apposition.
    item('3e', 2, 'Accorde « entendre » : La chanteuse que j\'ai **…** chanter était superbe.', 'entendue', ['entendu', 'entendues', 'entendus'], 'La chanteuse fait l\'action de chanter : on accorde.'),
    item('3e', 2, 'Accorde « entendre » : La chanson que j\'ai **…** chanter était belle.', 'entendu', ['entendue', 'entendues', 'entendus'], 'La chanson ne chante pas, elle est chantée : pas d\'accord.'),
    item('3e', 2, 'Accorde « faire » : Ces maisons, je les ai **…** construire.', 'fait', ['faites', 'faits', 'faite'], 'Fait suivi d\'un infinitif reste toujours invariable.'),
    item('3e', 2, 'Accorde « regarder » : Les enfants que j\'ai **…** jouer riaient.', 'regardés', ['regardé', 'regardées', 'regardée'], 'Les enfants font l\'action de jouer : on accorde.'),
    item('3e', 2, 'Accorde « voir » : Les arbres qu\'on a **…** abattre étaient vieux.', 'vu', ['vus', 'vue', 'vues'], 'Les arbres n\'abattent pas, ils sont abattus : pas d\'accord.'),
    item('3e', 2, 'Accorde « voir » : Mes cousines ? Je les ai **…** arriver.', 'vues', ['vu', 'vus', 'vue'], 'Mes cousines font l\'action d\'arriver : on accorde.'),
    item('3e', 2, 'Accorde « prendre » : La décision que le juge a **…** est juste.', 'prise', ['pris', 'prises', 'prit'], 'Le COD que, mis pour la décision, est placé avant : on accorde.'),
    item('3e', 2, 'Accorde « fournir » : Les efforts qu\'il a **…** ont payé.', 'fournis', ['fourni', 'fournies', 'fournie'], 'Le COD qu\', mis pour les efforts, est placé avant : on accorde.'),
    item('3e', 2, 'Accorde « surprendre » : **…** par la pluie, les randonneuses rentrèrent.', 'Surprises', ['Surpris', 'Surprise', 'Surprit'], 'Le participe apposé s\'accorde avec les randonneuses, féminin pluriel.'),
    item('3e', 2, 'Accorde « devoir » : La règle qu\'il a **…** appliquer est stricte.', 'dû', ['due', 'dues', 'dûe'], 'Que est le COD d\'appliquer, pas de dû : pas d\'accord.'),

    // 3e T3 : « tout », « même », « leur », les sujets collectifs.
    item('3e', 3, 'Complète avec « tout » : Elles sont **…** contentes.', 'toutes', ['tout', 'toute', 'touts'], 'Devant un adjectif féminin commençant par une consonne, tout s\'accorde.'),
    item('3e', 3, 'Complète avec « tout » : Elle est **…** émue.', 'tout', ['toute', 'toutes', 'tous'], 'Devant un adjectif commençant par une voyelle, tout reste invariable.'),
    item('3e', 3, 'Complète avec « tout » : **…** les élèves sont présents.', 'Tous', ['Tout', 'Toutes', 'Toute'], 'Devant les élèves, tout est déterminant : il s\'accorde au masculin pluriel.'),
    item('3e', 3, 'Complète avec « tout » : Elle lit **…** la journée.', 'toute', ['tout', 'toutes', 'tous'], 'Devant la journée, tout est déterminant : il s\'accorde au féminin singulier.'),
    item('3e', 3, 'Complète avec « même » : Ils ont fait les **…** erreurs.', 'mêmes', ['même', 'mème', 'mêmmes'], 'Même, placé devant le nom, est adjectif : il s\'accorde.'),
    item('3e', 3, 'Complète avec « même » : Elles l\'ont réparé elles-**…**.', 'mêmes', ['même', 'mème', 'meme'], 'Après un pronom pluriel, même s\'accorde : elles-mêmes.'),
    item('3e', 3, 'Complète avec « leur » : Les élèves rangent **…** affaires.', 'leurs', ['leur', 'leures', 'l\'heure'], 'Devant un nom pluriel, le déterminant leur prend un s.'),
    item('3e', 3, 'Complète avec « leur » : J\'ai vu mes voisins, je **…** ai tout dit.', 'leur', ['leurs', 'l\'eur', 'leure'], 'Devant un verbe, leur est un pronom : il reste invariable.'),
    item('3e', 3, 'Complète avec « aimer » : La plupart des élèves **…** la cantine.', 'aiment', ['aime', 'aimes', 'aimé'], 'Après la plupart des, le verbe se met au pluriel.'),
    item('3e', 3, 'Complète avec « avoir » : Chacun des joueurs **…** son maillot.', 'a', ['ont', 'as', 'à'], 'Le sujet est chacun, au singulier : le verbe est au singulier.'),
  ],

  orthographe: [
    // 5e T1 : les homophones grammaticaux, révisés dans des phrases de collège.
    item('5e', 1, 'Complète : Il faut **…** les plantes.', 'arroser', ['arrosé', 'arrosez', 'arrosait'], 'Après « il faut », on met l\'infinitif. Remplace par mordre pour vérifier.'),
    item('5e', 1, 'Complète : Elle a **…** son vélo.', 'réparé', ['réparer', 'réparez', 'réparait'], 'Après l\'auxiliaire avoir, on écrit le participe passé en -é.'),
    item('5e', 1, 'Complète : Vous **…** trop vite.', 'parlez', ['parlé', 'parler', 'parlais'], 'Avec vous, le verbe au présent se termine par -ez.'),
    item('5e', 1, 'Complète : Chaque soir, il **…** sa porte à clé.', 'fermait', ['fermé', 'fermer', 'fermez'], 'Il faut un verbe conjugué : à l\'imparfait, il fermait.'),
    item('5e', 1, 'Complète : Il **…** trompé de chemin.', 's\'est', ['c\'est', 'ses', 'ces'], 'S\'est vient du verbe se tromper : il s\'est trompé.'),
    item('5e', 1, 'Complète : **…** une belle journée.', 'C\'est', ['S\'est', 'Ses', 'Ces'], 'C\'est signifie « cela est ».'),
    item('5e', 1, 'Complète : Regarde **…** nuages, là-bas !', 'ces', ['ses', 'c\'est', 's\'est'], 'Ces montre les nuages qu\'on désigne : ces nuages-là.'),
    item('5e', 1, 'Complète : Je pense **…** a raison.', 'qu\'elle', ['quelle', 'quel', 'quelles'], 'Qu\'elle se remplace par qu\'il : je pense qu\'il a raison.'),
    item('5e', 1, 'Complète : **…** heure est-il ?', 'Quelle', ['Qu\'elle', 'Quel', 'Quelles'], 'Quelle est un déterminant qui s\'accorde avec heure, féminin singulier.'),
    item('5e', 1, 'Complète : Il **…** venir demain.', 'peut', ['peu', 'peux', 'peue'], 'Peut est le verbe pouvoir : on peut dire « il pouvait ».'),
    item('5e', 1, 'Complète : Il est parti **…** dire au revoir.', 'sans', ['s\'en', 'sang', 'cent'], 'Sans est le contraire de avec.'),
    item('5e', 1, 'Complète : Ce problème ? Il **…** moque.', 's\'en', ['sans', 'sent', 'cent'], 'S\'en vient du verbe s\'en moquer : il s\'en moque.'),

    // 5e T2 : la formation des mots, l'étymologie.
    item('5e', 2, 'Que signifie le préfixe « im- » dans « impossible » ?', 'le contraire', ['à nouveau', 'avant', 'très'], 'Im-, in-, il- et ir- donnent le sens contraire.'),
    item('5e', 2, 'Que signifie le préfixe « pré- » dans « préhistoire » ?', 'avant', ['après', 'contre', 'sans'], 'La préhistoire est la période avant l\'histoire.'),
    item('5e', 2, 'Que signifie le suffixe « -able » dans « lavable » ?', 'qui peut être', ['qui fait', 'petit', 'action de'], 'Lavable veut dire qui peut être lavé.'),
    item('5e', 2, 'Quel préfixe donne le contraire de « lisible » ?', 'il-', ['in-', 'dé-', 'mal-'], 'Devant un l, in- devient il- : illisible.'),
    item('5e', 2, 'Quel nom est formé avec un suffixe à partir de « laver » ?', 'lavage', ['lave', 'relaver', 'délaver'], 'Le suffixe -age forme un nom d\'action : le lavage.'),
    item('5e', 2, 'Quel mot est de la même famille que « terre » ?', 'atterrir', ['terrible', 'terminer', 'thermique'], 'Atterrir veut dire se poser sur la terre.'),
    item('5e', 2, 'Quel mot aide à écrire le d final de « grand » ?', 'grandir', ['grain', 'gramme', 'grange'], 'Un mot de la même famille fait entendre la lettre muette : grandir.'),
    item('5e', 2, 'Quel mot aide à écrire la fin de « respect » ?', 'respecter', ['respirer', 'reste', 'espace'], 'Respecter fait entendre le c et le t muets de respect.'),
    item('5e', 2, 'Le mot « aquarium » vient du latin « aqua ». Que signifie « aqua » ?', 'l\'eau', ['l\'air', 'le poisson', 'la terre'], 'Aqua signifie l\'eau : aquatique, aquarelle.'),
    item('5e', 2, 'Que signifie le radical grec « géo » ?', 'la terre', ['l\'eau', 'le temps', 'la vie'], 'Géo signifie la terre : géographie, géologie.'),
    item('5e', 2, 'Que signifie le radical grec « chrono » ?', 'le temps', ['la couleur', 'la vie', 'la distance'], 'Chrono signifie le temps : chronomètre, chronologie.'),

    // 5e T3 : les relations de sens, les registres de langue, les néologismes, les paronymes.
    item('5e', 3, 'Quel mot appartient au registre familier ?', 'une bagnole', ['une voiture', 'une automobile', 'un véhicule'], 'Bagnole s\'emploie entre amis, à l\'oral : c\'est familier.'),
    item('5e', 3, 'Quel mot appartient au registre soutenu ?', 'une demeure', ['une baraque', 'une maison', 'un logement'], 'Demeure s\'emploie surtout à l\'écrit, dans un texte soigné : c\'est soutenu.'),
    item('5e', 3, 'Quel verbe du registre courant a le même sens que « se marrer » ?', 'rire', ['pleurer', 'courir', 'dormir'], 'Se marrer est familier. Rire est le mot courant.'),
    item('5e', 3, 'Quel est un antonyme de « généreux » ?', 'avare', ['gentil', 'riche', 'aimable'], 'Un antonyme a le sens contraire : l\'avare ne donne rien.'),
    item('5e', 3, 'Quel est un synonyme de « audacieux » ?', 'hardi', ['peureux', 'prudent', 'lent'], 'Un synonyme a un sens proche : audacieux et hardi.'),
    item('5e', 3, 'Complète : Le danger est **…**, il faut fuir !', 'imminent', ['éminent', 'immanent', 'émanant'], 'Imminent veut dire tout proche. Éminent veut dire remarquable.'),
    item('5e', 3, 'Complète : Le voleur est entré par **…**.', 'effraction', ['infraction', 'affection', 'fraction'], 'L\'effraction est le fait de forcer une porte. L\'infraction est une faute.'),
    item('5e', 3, 'Qu\'est-ce qu\'un néologisme ?', 'un mot nouveau', ['un mot disparu', 'un mot de sens contraire', 'un mot de même sens'], 'Néo signifie nouveau, et logos signifie le mot.'),
    item('5e', 3, 'Quel mot est un néologisme créé à la fin du 20e siècle ?', 'courriel', ['château', 'fenêtre', 'cheval'], 'Courriel a été inventé au Québec pour remplacer e-mail.'),
    item('5e', 3, 'Quel mot a un sens plus général que « tulipe » ?', 'fleur', ['rose', 'pétale', 'jardin'], 'Fleur englobe la tulipe : c\'est un mot générique.'),

    // 4e T1 : les conjonctions et leurs homophones.
    item('4e', 1, 'Complète : **…** il pleut, je prends mon parapluie.', 'Quand', ['Quant', 'Qu\'en', 'Camp'], 'Quand indique le moment : lorsqu\'il pleut.'),
    item('4e', 1, 'Complète : **…** à moi, je reste ici.', 'Quant', ['Quand', 'Qu\'en', 'Quent'], 'Quant à signifie « en ce qui concerne ».'),
    item('4e', 1, 'Complète : **…** penses-tu ?', 'Qu\'en', ['Quand', 'Quant', 'Camp'], 'Qu\'en signifie « que penses-tu de cela ? ».'),
    item('4e', 1, 'Complète : **…** tu dises, je partirai.', 'Quoi que', ['Quoique', 'Quoi-que', 'Quoiqu\''], 'Quoi que, en deux mots, signifie « quelle que soit la chose que ».'),
    item('4e', 1, 'Complète : **…** fatigué, il continue à courir.', 'Quoique', ['Quoi que', 'Quoi-que', 'Quoiqu\''], 'Quoique, en un mot, signifie « bien que ».'),
    item('4e', 1, 'Complète : Il est puni **…** il a menti.', 'parce qu\'', ['par ce qu\'', 'parce que', 'par ce que'], 'Parce que donne la cause. Devant il, on écrit parce qu\'.'),
    item('4e', 1, 'Complète : Je suis étonné **…** tu dis.', 'par ce que', ['parce que', 'parce qu\'', 'par ce qu\''], 'Par ce que signifie « par la chose que ».'),
    item('4e', 1, 'Complète : Ce jardin ? Il **…** promène souvent.', 's\'y', ['si', 'ci', 'scie'], 'S\'y signifie « se promène dans ce jardin ».'),
    item('4e', 1, 'Complète : **…** tu viens, préviens-moi.', 'Si', ['S\'y', 'Ci', 'Scie'], 'Si introduit une condition.'),
    item('4e', 1, 'Complète : Le ballon est sorti **…** du terrain.', 'hors', ['or', 'hord', 'ord'], 'Hors signifie « à l\'extérieur de ».'),
    item('4e', 1, 'Complète : Il aime le sport, **…** il déteste courir.', 'mais', ['mes', 'met', 'mets'], 'Mais est une conjonction qui marque l\'opposition.'),

    // 4e T2 : l'étymologie grecque et latine, la composition des mots.
    item('4e', 2, 'Que signifie le radical grec « bio » ?', 'la vie', ['la mort', 'le livre', 'la terre'], 'Bio signifie la vie : biologie, biographie.'),
    item('4e', 2, 'Que signifie le radical grec « phobie » ?', 'la peur', ['l\'amour', 'la lumière', 'la voix'], 'Phobie signifie la peur : claustrophobie, la peur des lieux fermés.'),
    item('4e', 2, 'Que signifie « philosophe », formé sur les mots grecs « philo » et « sophia » ?', 'qui aime la sagesse', ['qui aime les livres', 'qui craint la sagesse', 'qui parle bien'], 'Philo signifie qui aime, et sophia signifie la sagesse.'),
    item('4e', 2, 'Que signifie le radical latin « omni » ?', 'tout', ['un seul', 'rien', 'petit'], 'Omni signifie tout : un omnivore mange de tout.'),
    item('4e', 2, 'Quel mot est un mot composé ?', 'un porte-monnaie', ['un portail', 'une portière', 'un portier'], 'Un mot composé réunit deux mots : porte et monnaie.'),
    item('4e', 2, 'Quel préfixe signifie « contre » ?', 'anti-', ['pré-', 're-', 'sur-'], 'Anti- signifie contre : antivol, antidote.'),
    item('4e', 2, 'Que signifie le suffixe « -cide » dans « insecticide » ?', 'qui tue', ['qui mange', 'qui aime', 'qui protège'], 'Cide vient du latin caedere, tuer : un insecticide tue les insectes.'),
    item('4e', 2, 'Quel mot vient du même mot latin que « nuit » ?', 'nocturne', ['nuire', 'nuage', 'nouveau'], 'Nuit et nocturne viennent du latin nox, noctis.'),
    item('4e', 2, 'Quel mot vient du grec « graphein », écrire ?', 'autographe', ['géant', 'grappe', 'graine'], 'Un autographe est une signature écrite par la personne elle-même.'),
    item('4e', 2, 'Que signifie le préfixe grec « télé- » ?', 'loin', ['près', 'voir', 'image'], 'Télé- signifie loin : le téléphone porte la voix au loin.'),

    // 4e T3 : les figures de style, le sens des mots en contexte.
    item('4e', 3, 'Quelle figure de style trouve-t-on dans « Il est fort comme un lion » ?', 'une comparaison', ['une métaphore', 'une personnification', 'une hyperbole'], 'La comparaison rapproche deux éléments avec un outil : comme.'),
    item('4e', 3, 'Quelle figure de style trouve-t-on dans « Cet homme est un lion » ?', 'une métaphore', ['une comparaison', 'une personnification', 'une anaphore'], 'La métaphore rapproche deux éléments sans outil de comparaison.'),
    item('4e', 3, 'Quelle figure de style trouve-t-on dans « Le vent hurle dans la nuit » ?', 'une personnification', ['une comparaison', 'une hyperbole', 'une antithèse'], 'Le vent hurle comme une personne : c\'est une personnification.'),
    item('4e', 3, 'Quelle figure de style trouve-t-on dans « Je meurs de faim » ?', 'une hyperbole', ['une comparaison', 'une personnification', 'une antithèse'], 'L\'hyperbole exagère pour frapper l\'esprit.'),
    item('4e', 3, 'Quelle figure de style trouve-t-on dans « J\'ai mille choses à te dire » ?', 'une hyperbole', ['une comparaison', 'une métaphore', 'une personnification'], 'Mille exagère le nombre : c\'est une hyperbole.'),
    item('4e', 3, 'Dans « Ses yeux brillent comme des étoiles », quel est l\'outil de comparaison ?', 'comme', ['brillent', 'ses', 'des'], 'Comme, tel, pareil à et ressembler à sont des outils de comparaison.'),
    item('4e', 3, 'Quelle phrase contient une comparaison ?', 'Elle court telle une gazelle.', ['Elle est une gazelle.', 'Elle court très vite.', 'Elle aime les gazelles.'], 'Telle est un outil de comparaison.'),
    item('4e', 3, 'Dans « Il a un cœur de pierre », quel est le sens de « pierre » ?', 'dur et insensible', ['lourd et lent', 'gris et triste', 'rare et précieux'], 'Au sens figuré, un cœur de pierre ne ressent rien.'),
    item('4e', 3, 'Dans quelle phrase « vol » signifie-t-il « larcin » ?', 'Le vol du sac a été filmé.', ['Le vol de l\'aigle est majestueux.', 'Notre vol part à midi.', 'Un vol d\'oies passe au-dessus de nous.'], 'Le contexte précise le sens d\'un mot qui en a plusieurs.'),
    item('4e', 3, 'Qu\'appelle-t-on la dénotation d\'un mot ?', 'son sens premier', ['son sens suggéré', 'son contraire', 'son origine'], 'La dénotation est le sens du dictionnaire. La connotation est le sens suggéré.'),

    // 3e T1 : les homophones lexicaux.
    item('3e', 1, 'Complète : Tu n\'es pas **…** le savoir.', 'censé', ['sensé', 'censés', 'sensés'], 'Censé signifie « supposé ». Sensé signifie « qui a du bon sens ».'),
    item('3e', 1, 'Complète : C\'est une idée **…** et raisonnable.', 'sensée', ['censée', 'sensé', 'censé'], 'Sensée signifie « qui a du bon sens ». Il s\'accorde avec idée.'),
    item('3e', 1, 'Complète : Ce chanteur a une belle **…**.', 'voix', ['voie', 'vois', 'voit'], 'La voix est le son qui sort de la bouche.'),
    item('3e', 1, 'Complète : Le train entre en **…** 2.', 'voie', ['voix', 'vois', 'voit'], 'La voie est le chemin, ici les rails.'),
    item('3e', 1, 'Complète : Il lit un **…** de fées.', 'conte', ['compte', 'comte', 'comté'], 'Un conte est une histoire. Un compte est un calcul.'),
    item('3e', 1, 'Complète : Le **…** vivait dans un château.', 'comte', ['conte', 'compte', 'comté'], 'Un comte est un noble. Le comté est sa terre.'),
    item('3e', 1, 'Complète : Je suis **…** à partir.', 'prêt', ['près', 'prés', 'pré'], 'Prêt signifie préparé. Au féminin, on dit prête.'),
    item('3e', 1, 'Complète : Il habite **…** de la gare.', 'près', ['prêt', 'prés', 'pré'], 'Près signifie « à côté de », contraire de loin.'),
    item('3e', 1, 'Complète : Il travaille **…** que son frère.', 'davantage', ['d\'avantage', 'd\'avantages', 'davantages'], 'Davantage, en un mot, signifie « plus ».'),
    item('3e', 1, 'Complète : Il a fait un **…** dans l\'eau.', 'saut', ['seau', 'sceau', 'sot'], 'Le saut vient du verbe sauter.'),
    item('3e', 1, 'Complète : Le roi apposa son **…** sur la lettre.', 'sceau', ['seau', 'saut', 'sot'], 'Le sceau est le cachet officiel d\'un roi.'),

    // 3e T2 : les connecteurs logiques, l'étymologie et la formation savante.
    item('3e', 2, 'Quel connecteur exprime la cause ?', 'car', ['mais', 'donc', 'pourtant'], 'Car introduit la cause, la raison d\'un fait.'),
    item('3e', 2, 'Quel connecteur exprime la conséquence ?', 'donc', ['car', 'puisque', 'bien que'], 'Donc introduit la conséquence, le résultat.'),
    item('3e', 2, 'Quel connecteur exprime l\'opposition ?', 'cependant', ['ainsi', 'en effet', 'car'], 'Cependant marque une opposition, comme mais ou pourtant.'),
    item('3e', 2, 'Complète : Il a beaucoup révisé, **…** il a échoué.', 'pourtant', ['donc', 'car', 'ainsi'], 'L\'échec contredit les révisions : il faut un mot d\'opposition.'),
    item('3e', 2, 'Complète : Il pleut à verse, **…** le match est annulé.', 'donc', ['pourtant', 'car', 'cependant'], 'L\'annulation est la conséquence de la pluie : on emploie donc.'),
    item('3e', 2, 'Quel mot vient du latin « manus », la main ?', 'manuel', ['manteau', 'maison', 'manger'], 'Un travail manuel se fait avec les mains.'),
    item('3e', 2, 'Que signifie le préfixe « a- » dans « apesanteur » ?', 'l\'absence', ['l\'excès', 'la répétition', 'le lieu'], 'Le a- privatif marque l\'absence : l\'apesanteur est l\'absence de pesanteur.'),
    item('3e', 2, 'Que signifie le radical grec « anthropo » ?', 'l\'être humain', ['l\'animal', 'la plante', 'la ville'], 'Anthropo désigne l\'être humain : l\'anthropologie étudie les hommes.'),
    item('3e', 2, 'Que signifie le radical latin « vore » dans « carnivore » ?', 'qui mange', ['qui voit', 'qui vole', 'qui vit'], 'Vore vient du latin vorare, dévorer : un carnivore mange de la viande.'),
    item('3e', 2, 'Quel mot est formé de deux radicaux grecs ?', 'thermomètre', ['lavage', 'refaire', 'gentiment'], 'Thermo signifie la chaleur, et mètre signifie la mesure.'),

    // 3e T3 : les figures d'opposition, d'insistance et d'atténuation, la connotation.
    item('3e', 3, 'Quelle figure de style trouve-t-on dans « Cette obscure clarté qui tombe des étoiles » ?', 'un oxymore', ['une anaphore', 'une hyperbole', 'une litote'], 'L\'oxymore unit deux mots de sens contraire : obscure et clarté.'),
    item('3e', 3, 'Quelle figure de style trouve-t-on dans « un silence assourdissant » ?', 'un oxymore', ['une litote', 'une anaphore', 'un euphémisme'], 'Un silence ne peut pas assourdir : deux mots contraires sont réunis.'),
    item('3e', 3, 'Quelle figure répète un même mot au début de plusieurs phrases ou vers ?', 'l\'anaphore', ['l\'antithèse', 'la litote', 'l\'oxymore'], 'L\'anaphore répète un mot en début de phrase pour insister.'),
    item('3e', 3, 'Quelle figure de style trouve-t-on dans « Paris outragé ! Paris brisé ! Paris martyrisé ! » ?', 'une anaphore', ['une litote', 'un euphémisme', 'un oxymore'], 'Le mot Paris est répété au début de chaque phrase.'),
    item('3e', 3, 'Quelle figure de style trouve-t-on dans « Va, je ne te hais point » ?', 'une litote', ['une hyperbole', 'une anaphore', 'une comparaison'], 'La litote dit moins pour faire entendre plus : ici, je t\'aime.'),
    item('3e', 3, 'Quelle figure de style dit « Ce n\'est pas mauvais » pour « C\'est très bon » ?', 'une litote', ['une hyperbole', 'une antithèse', 'un oxymore'], 'La litote atténue l\'expression pour suggérer davantage.'),
    item('3e', 3, 'Quelle figure de style dit « Il nous a quittés » pour « Il est mort » ?', 'un euphémisme', ['une hyperbole', 'un oxymore', 'une anaphore'], 'L\'euphémisme adoucit une réalité pénible.'),
    item('3e', 3, 'Quelle figure oppose deux idées dans une même phrase ?', 'l\'antithèse', ['l\'anaphore', 'la métaphore', 'la litote'], 'L\'antithèse rapproche deux idées contraires pour les faire ressortir.'),
    item('3e', 3, 'Quelle figure de style trouve-t-on dans « Va, cours, vole, et nous venge » ?', 'une gradation', ['une litote', 'un oxymore', 'un euphémisme'], 'La gradation enchaîne des mots de plus en plus forts.'),
    item('3e', 3, 'Que suggère le mot « nid » dans « un petit nid douillet » ?', 'la sécurité et la douceur', ['le danger', 'la tristesse', 'la colère'], 'C\'est la connotation : le sens suggéré, au-delà du sens premier.'),
  ],
};
