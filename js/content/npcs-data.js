/* From npcs.json */
var NPC_DEFS = {
  "haven": [
    {
      "key": "guild",
      "name": "Guildmaster Bram",
      "x": 168,
      "y": 296,
      "tint": 16777215,
      "questGiver": true,
      "options": [
        "talk",
        "quest"
      ],
      "examine": "A scarred militia captain. He still drills the courtyard.",
      "lines": [
        "Welcome to Emberhaven, adventurer.",
        "Goblins from Northwood raid our stores.",
        "Slay 5 goblins and return. The militia will pay."
      ]
    },
    {
      "key": "banker",
      "name": "Banker Elise",
      "x": 232,
      "y": 168,
      "tint": 16777215,
      "options": [
        "talk",
        "bank"
      ],
      "examine": "The town banker. She stands behind the courtyard counter.",
      "lines": [
        "Your coin is safe with me.",
        "Deposit what you cannot carry.",
        "Step up to the counter when you need the vault."
      ]
    },
    {
      "key": "guard",
      "name": "Guard Rowan",
      "x": 424,
      "y": 248,
      "tint": 16777215,
      "options": [
        "talk"
      ],
      "examine": "A watchful town guard. He knows every path from the gate.",
      "lines": [
        "Keep to the paths.",
        "North is woods. East is farms. South is the sea."
      ]
    },
    {
      "key": "shopkeep",
      "name": "Shopkeeper Mira",
      "x": 264,
      "y": 216,
      "tint": 16777215,
      "texture": "npc-shopkeeper",
      "options": [
        "talk",
        "trade"
      ],
      "shopKey": "mira",
      "examine": "The town shopkeeper. She minds the courtyard stall.",
      "lines": [
        "Take a look at the wares.",
        "Bones and spare food fetch a price."
      ]
    },
    {
      "key": "dummy",
      "name": "Training dummy",
      "x": 360,
      "y": 296,
      "tint": 16777215,
      "texture": "npc-dummy",
      "options": [
        "talk",
        "duel"
      ],
      "examine": "A straw-filled training dummy for duels.",
      "lines": [
        "Up for a practice duel?",
        "No loot, just honour."
      ]
    },
    {
      "key": "arms",
      "name": "Armsman Cole",
      "x": 328,
      "y": 200,
      "tint": 16777215,
      "texture": "npc-arms",
      "options": [
        "talk",
        "trade"
      ],
      "shopKey": "arms",
      "examine": "A weapons stall keeper. Oil stains his gloves.",
      "lines": [
        "Blades, bows, and staves, if you have the coin.",
        "Take a look at the wares.",
        "A copper bow trains Ranged; a staff needs Air runes for Air Strike."
      ]
    },
    {
      "key": "cook",
      "name": "Cook Pell",
      "x": 296,
      "y": 328,
      "tint": 16777215,
      "options": [
        "talk"
      ],
      "tutor": "firemaking",
      "examine": "The town cook. Flour dusts her sleeves and a ladle never leaves her hand.",
      "lines": [
        "Take this tinderbox.",
        "Use it on logs to light a fire on open ground.",
        "Cook raw food on that fire or the town range.",
        "If you burn a meal it is ruined — nothing left to keep."
      ]
    },
    {
      "key": "herbalist",
      "name": "Herbalist Ivy",
      "x": 168,
      "y": 216,
      "tint": 16777215,
      "options": [
        "talk"
      ],
      "tutor": "herblore",
      "examine": "Emberhaven's herbalist. Bundles of guam hang by her stall.",
      "lines": [
        "Guam grows easily if you have a seed.",
        "Mix a leaf into an attack potion here.",
        "Bring guam and I will show you the craft."
      ]
    },
    {
      "key": "priest",
      "name": "Priest Alden",
      "x": 296,
      "y": 152,
      "tint": 16777215,
      "options": [
        "talk"
      ],
      "examine": "A quiet shrine priest. Ash marks the collar of his robe.",
      "lines": [
        "The shrine still hears a prayer.",
        "Bury the bones of the fallen, traveler."
      ]
    }
  ],
  "northwood": [
    {
      "key": "ranger",
      "name": "Ranger Kett",
      "x": 240,
      "y": 200,
      "tint": 16777215,
      "options": [
        "talk"
      ],
      "tutor": "combat",
      "examine": "A Northwood ranger. Goblin tracks stain her boots.",
      "lines": [
        "Goblins nest in these trees.",
        "Click a goblin to fight it, like the old days.",
        "Wield a bow from Armsman Cole — leave ammo empty for infinite wooden arrows, or equip copper arrows.",
        "A wood staff plus an Air rune casts Air Strike.",
        "Shared splits XP; Strength, Ranger, or Mage train from your weapon."
      ]
    }
  ],
  "millfields": [
    {
      "key": "farmer",
      "name": "Farmer Willa",
      "x": 200,
      "y": 180,
      "tint": 16777215,
      "options": [
        "talk"
      ],
      "tutor": "cows",
      "examine": "A Millfields farmer. Cabbage stains her apron.",
      "lines": [
        "Cows got into the cabbages again.",
        "The mill road runs back to Emberhaven.",
        "Click a cow when you need hide and beef.",
        "They kick, so keep a combat style ready."
      ]
    }
  ],
  "southshore": [
    {
      "key": "fisher",
      "name": "Fisher Ned",
      "x": 220,
      "y": 160,
      "tint": 16777215,
      "options": [
        "talk",
        "quest"
      ],
      "questGiver": true,
      "sideQuest": "shipment",
      "tutor": "fishing",
      "examine": "An old shore fisher. Salt and rope have worn his hands.",
      "lines": [
        "Crabs pinch harder than they look.",
        "Ships used to stop here. Not anymore.",
        "Click the fishing spots along the shore and cast a net.",
        "You will need a small fishing net first."
      ]
    }
  ],
  "westmead": [
    {
      "key": "wanderer",
      "name": "Wanderer Sila",
      "x": 180,
      "y": 190,
      "tint": 16777215,
      "options": [
        "talk"
      ],
      "examine": "A plains wanderer. Her cloak is dusted with Westmead grass.",
      "lines": [
        "Plains look empty until they are not.",
        "Graves lie north-west. Do not linger."
      ]
    }
  ],
  "graves": [
    {
      "key": "ghost",
      "name": "Wisp",
      "x": 200,
      "y": 170,
      "tint": 16777215,
      "options": [
        "talk"
      ],
      "examine": "A restless grave-wisp. Cold light pools where a face should be.",
      "lines": [
        "The dead remember steel.",
        "Turn back unless you seek bones."
      ]
    }
  ],
  "darkmine": [
    {
      "key": "miner",
      "name": "Miner Corb",
      "x": 210,
      "y": 200,
      "tint": 16777215,
      "options": [
        "talk",
        "quest"
      ],
      "questGiver": true,
      "sideQuest": "bats",
      "tutor": "mining",
      "examine": "A Darkmine digger. He will not go down the Deep Mine.",
      "lines": [
        "That shaft leads to the Deep Mine. Floor one starts at level 40 — each floor adds one.",
        "Every twenty-first floor wakes a dragon. Escape marks the floor for next time.",
        "Every fifth floor has a campfire. Ore still waits up here with a pickaxe."
      ]
    }
  ],
  "highlands": [
    {
      "key": "hermit",
      "name": "Hermit Ola",
      "x": 240,
      "y": 160,
      "tint": 16777215,
      "options": [
        "talk"
      ],
      "examine": "A windrock hermit. Drake-scale grit is stuck in her cloak.",
      "lines": [
        "Drakes nest on the windrock.",
        "Bring a stout shield.",
        "East of here a boulder seals a deeper den — only a diamond pickaxe cracks it."
      ]
    }
  ],
  "mire": [
    {
      "key": "witch",
      "name": "Fen Witch",
      "x": 200,
      "y": 180,
      "tint": 16777215,
      "options": [
        "talk"
      ],
      "examine": "A fen healer. Marsh-light clings to her sleeves.",
      "lines": [
        "The fen drinks the lost.",
        "I can stitch wounds... for a price."
      ]
    }
  ]
};
