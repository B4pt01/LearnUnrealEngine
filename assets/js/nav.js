/* Plan du site : source unique pour la barre latérale, la recherche,
   la page d'accueil et la navigation précédent / suivant. */
window.UE5_NAV = [
  {
    group: "Démarrer",
    items: [
      {
        id: "accueil", file: "index.html", title: "Accueil & feuille de route", time: "5 min", level: "Tous niveaux",
        desc: "Comment utiliser ce site et dans quel ordre apprendre.",
        keywords: "accueil roadmap feuille de route parcours programme"
      },
      {
        id: "installation", file: "pages/installation.html", title: "Installation & premier projet", time: "25 min", level: "Débutant",
        desc: "Installer UE5, configurer Visual Studio ou Rider, créer un projet C++ et comprendre ses dossiers.",
        keywords: "epic games launcher visual studio rider ide uproject sln source config content binaries intermediate git lfs perforce template live coding compiler"
      },
      {
        id: "editeur", file: "pages/editeur.html", title: "Prendre en main l'éditeur", time: "30 min", level: "Débutant",
        desc: "Viewport, Outliner, Details, Content Browser, raccourcis et conventions de nommage.",
        keywords: "viewport outliner details content browser raccourcis navigation play in editor pie simulate world settings project settings nommage convention assets"
      }
    ]
  },
  {
    group: "Fondamentaux",
    items: [
      {
        id: "architecture", file: "pages/architecture.html", title: "Architecture du moteur", time: "40 min", level: "Débutant",
        desc: "UObject, Actors, Components et le Gameplay Framework (GameMode, Controller, Pawn…).",
        keywords: "uobject aactor actor component composant scene component gamemode gamestate playercontroller playerstate pawn character hud gameinstance subsystem world level framework hiérarchie"
      },
      {
        id: "maths", file: "pages/maths.html", title: "Maths du jeu vidéo", time: "35 min", level: "Débutant",
        desc: "Repère d'Unreal, vecteurs, produit scalaire, rotations, interpolation.",
        keywords: "vecteur fvector frotator fquat transform produit scalaire dot cross vectoriel normalize lerp interp rotation pitch yaw roll coordonnées unités centimètres trigonométrie"
      }
    ]
  },
  {
    group: "Programmer",
    items: [
      {
        id: "blueprints", file: "pages/blueprints.html", title: "Blueprints : le scripting visuel", time: "45 min", level: "Débutant",
        desc: "Event Graph, variables, fonctions, cast, interfaces, event dispatchers.",
        keywords: "blueprint event graph construction script variable fonction macro cast interface event dispatcher branch sequence for each node pin exec communication"
      },
      {
        id: "cpp-bases", file: "pages/cpp-bases.html", title: "C++ pour Unreal : les bases", time: "50 min", level: "Intermédiaire",
        desc: "Rappels C++, macros UCLASS/UPROPERTY/UFUNCTION, réflexion, types et conteneurs.",
        keywords: "c++ cpp uclass uproperty ufunction ustruct uenum generated_body réflexion reflection fstring fname ftext tarray tmap tset pointeur référence header include createdefaultsubobject ue_log build.cs module"
      },
      {
        id: "cpp-avance", file: "pages/cpp-avance.html", title: "C++ avancé : vie des objets", time: "50 min", level: "Intermédiaire",
        desc: "Cycle de vie, Tick, timers, delegates, interfaces, garbage collector, pointeurs intelligents.",
        keywords: "beginplay tick endplay constructeur cycle de vie timer delegate multicast dynamic interface garbage collector gc tobjectptr tweakobjectptr tsoftobjectptr tsharedptr spawnactor subsystem async"
      }
    ]
  },
  {
    group: "Gameplay",
    items: [
      {
        id: "input-personnage", file: "pages/input-personnage.html", title: "Enhanced Input & personnage", time: "40 min", level: "Intermédiaire",
        desc: "Input Actions, Mapping Contexts, Character Movement, caméra et Spring Arm.",
        keywords: "enhanced input action mapping context trigger modifier character movement component caméra spring arm saut sprint déplacement manette clavier"
      },
      {
        id: "collisions", file: "pages/collisions.html", title: "Collisions, traces & physique", time: "40 min", level: "Intermédiaire",
        desc: "Canaux, presets, overlap vs hit, line traces, sweeps et physique Chaos.",
        keywords: "collision channel canal preset overlap hit block ignore line trace sweep raycast physique chaos impulse simulate physics trigger"
      },
      {
        id: "systemes-gameplay", file: "pages/systemes-gameplay.html", title: "Systèmes de gameplay", time: "55 min", level: "Intermédiaire",
        desc: "Santé et dégâts, inventaire, Data Assets, Data Tables, Gameplay Tags, sauvegarde, GAS.",
        keywords: "santé health dégâts damage inventaire data asset data table gameplay tags savegame sauvegarde gas gameplay ability system attribute effect pickup interaction"
      },
      {
        id: "ia", file: "pages/ia.html", title: "Intelligence artificielle", time: "45 min", level: "Intermédiaire",
        desc: "AIController, NavMesh, Behavior Trees, Blackboard, perception, EQS, StateTree.",
        keywords: "ia ai aicontroller behavior tree arbre de comportement blackboard navmesh navigation perception sight sens eqs statetree task decorator service ennemi patrouille"
      }
    ]
  },
  {
    group: "Contenu & rendu",
    items: [
      {
        id: "ui", file: "pages/ui.html", title: "Interfaces avec UMG", time: "40 min", level: "Intermédiaire",
        desc: "Widgets, HUD, menus, bindings, BindWidget en C++, Common UI.",
        keywords: "umg widget hud menu interface ui userwidget bindwidget progress bar text block bouton canvas panel common ui viewport input mode"
      },
      {
        id: "animation", file: "pages/animation.html", title: "Animation", time: "40 min", level: "Intermédiaire",
        desc: "Skeletal Mesh, Animation Blueprint, State Machines, Blend Spaces, Montages, Notifies.",
        keywords: "animation skeletal mesh squelette anim blueprint state machine blend space montage notify retargeting ik control rig motion matching anim instance"
      },
      {
        id: "graphismes", file: "pages/graphismes.html", title: "Matériaux, lumière & VFX", time: "45 min", level: "Intermédiaire",
        desc: "Matériaux PBR, instances, Nanite, Lumen, éclairage, post-process, Niagara.",
        keywords: "matériau material instance pbr shader nanite lumen éclairage lumière ombres virtual shadow maps post process niagara vfx particules landscape world partition pcg"
      },
      {
        id: "audio", file: "pages/audio.html", title: "Audio & MetaSounds", time: "25 min", level: "Débutant",
        desc: "Sound Waves, Sound Cues, MetaSounds, atténuation, classes et mixes.",
        keywords: "audio son sound wave cue metasound atténuation spatialisation sound class mix submix concurrency musique quartz"
      }
    ]
  },
  {
    group: "Avancé",
    items: [
      {
        id: "multijoueur", file: "pages/multijoueur.html", title: "Réseau & multijoueur", time: "55 min", level: "Avancé",
        desc: "Client-serveur, réplication, RPC, autorité, rôles et RepNotify.",
        keywords: "réseau multijoueur network replication réplication rpc server client multicast authority autorité role repnotify dedicated server listen server online subsystem session"
      },
      {
        id: "optimisation", file: "pages/optimisation.html", title: "Débogage & optimisation", time: "45 min", level: "Avancé",
        desc: "Debugger, logs, commandes stat, Unreal Insights, budgets de frame et bonnes pratiques.",
        keywords: "debug débogage breakpoint log stat fps unit gpu unreal insights profiling optimisation performance tick lod nanite pooling hard reference size map visual logger"
      },
      {
        id: "packaging", file: "pages/packaging.html", title: "Packaging & publication", time: "30 min", level: "Intermédiaire",
        desc: "Configurations de build, cook, package, Steam et licence Unreal.",
        keywords: "packaging package build shipping development cook pak plateforme steam publication licence royalties distribution exécutable"
      }
    ]
  },
  {
    group: "Pratique",
    items: [
      {
        id: "projet", file: "pages/projet.html", title: "Projet guidé : Orb Rush", time: "2-3 h", level: "Intermédiaire",
        desc: "Un mini-jeu complet pas à pas : collecte, score, chrono, ennemi IA, HUD et menus.",
        keywords: "projet tutoriel pas à pas mini jeu orb rush collecte score chrono ennemi hud game over victoire"
      },
      {
        id: "ressources", file: "pages/ressources.html", title: "Ressources & glossaire", time: "15 min", level: "Tous niveaux",
        desc: "Documentation, chaînes, livres, communautés, glossaire et checklist.",
        keywords: "ressources documentation glossaire lexique checklist communauté livres youtube discord forum lyra samples"
      }
    ]
  }
];
