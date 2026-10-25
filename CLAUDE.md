# Consignes pour l'assistant IA (Claude Code ou autre)

Projet scolaire en binôme, qui sera présenté à l'oral.
**Objectif n°1 : que chaque membre comprenne et sache expliquer chaque ligne du projet.**
Personne ne doit avoir à répondre « c'est l'IA qui l'a écrit, je ne sais pas ce que ça fait ».

## Binôme

- **E** = Benjamin · **I** = son collègue · **E + I** = en binôme
- Répartition des parties : voir le tableau du `README.md`. Ne pas coder dans la partie de l'autre
  sans le signaler.

## Règle pédagogique (obligatoire à chaque évolution)

1. **Petits pas.** Une évolution = un fichier ou une petite fonctionnalité à la fois, jamais
   un gros bloc de code livré d'un coup.
2. **Expliquer avant ou pendant le code, pas après coup.** Pour chaque fichier créé ou modifié :
   - à quoi sert le fichier et pourquoi il est à cet endroit de l'architecture ;
   - le code expliqué bloc par bloc, et ligne par ligne dès qu'une ligne n'est pas évidente ;
   - le vocabulaire nouveau (hook, props, state, quaternion, AudioContext…) défini simplement ;
   - pourquoi cette solution plutôt qu'une autre.
3. **Quiz de 5 questions** après chaque évolution, posé dans la conversation :
   - questions de compréhension (« que se passe-t-il si… », « pourquoi… », « que fait cette ligne… »),
     pas de par cœur ;
   - attendre les réponses de l'étudiant, puis corriger et réexpliquer ce qui n'est pas acquis ;
   - ne jamais donner les réponses avant qu'il ait essayé.
4. **Fiche de révision.** Chaque évolution produit une fiche dans `docs/apprentissage/`
   (modèle : `docs/apprentissage/_modele.md`) : explication + quiz + corrigé. Ces fiches servent à
   préparer la soutenance.
5. **Pas validé tant que pas compris.** Une évolution n'est terminée (commit, PR) qu'une fois le
   quiz réussi.
6. Préférer le code simple et lisible au code astucieux : il doit pouvoir être expliqué à l'oral.

## Stack et commandes

Vite · React · TypeScript (strict) · React Three Fiber / drei · Zustand · Web Audio API · Vercel

```bash
npm run dev        # serveur de développement
npm run typecheck  # vérification des types
npm run build      # tsc + build Vite (doit passer avant toute PR)
```

## Workflow Git

Branche `feature/...` créée depuis `dev`, Pull Request vers `dev` relue par l'autre membre,
puis `dev` → `main` quand c'est stable. Ne jamais pousser directement sur `main`.
