/* From recipes.json */
var SMELT_RECIPES = [
  {
    "id": "copperbar",
    "label": "Smelt copper bar",
    "inputs": [
      [
        "copper",
        1
      ]
    ],
    "xp": 12,
    "need": 1
  },
  {
    "id": "ironbar",
    "label": "Smelt iron bar",
    "inputs": [
      [
        "iron",
        1
      ]
    ],
    "xp": 25,
    "need": 15
  },
  {
    "id": "diamondbar",
    "label": "Smelt diamond bar",
    "inputs": [
      [
        "diamondore",
        1
      ]
    ],
    "xp": 50,
    "need": 40
  },
  {
    "id": "dragonitebar",
    "label": "Smelt dragonite bar",
    "inputs": [
      [
        "dragoniteore",
        1
      ]
    ],
    "xp": 70,
    "need": 60
  }
];
var SMITH_RECIPES = [
  {
    "id": "copperdagger",
    "label": "Smith copper dagger (logs + copper)",
    "bar": "copperbar",
    "bars": 1,
    "extra": [
      [
        "logs",
        1
      ]
    ],
    "xp": 14,
    "need": 1
  },
  {
    "id": "coppersword",
    "label": "Smith copper sword (logs + copper)",
    "bar": "copperbar",
    "bars": 2,
    "extra": [
      [
        "logs",
        1
      ]
    ],
    "xp": 28,
    "need": 5
  },
  {
    "id": "copperaxe",
    "label": "Smith copper axe",
    "bar": "copperbar",
    "bars": 1,
    "xp": 16,
    "need": 1
  },
  {
    "id": "copperpick",
    "label": "Smith copper pickaxe",
    "bar": "copperbar",
    "bars": 1,
    "xp": 16,
    "need": 1
  },
  {
    "id": "coppershield",
    "label": "Smith copper shield",
    "bar": "copperbar",
    "bars": 2,
    "xp": 22,
    "need": 6
  },
  {
    "id": "ironsword",
    "label": "Smith iron sword (ash + iron)",
    "bar": "ironbar",
    "bars": 2,
    "extra": [
      [
        "ashlogs",
        1
      ]
    ],
    "xp": 40,
    "need": 15
  },
  {
    "id": "ironaxe",
    "label": "Smith iron axe",
    "bar": "ironbar",
    "bars": 1,
    "xp": 36,
    "need": 15
  },
  {
    "id": "ironpick",
    "label": "Smith iron pickaxe",
    "bar": "ironbar",
    "bars": 1,
    "xp": 36,
    "need": 15
  },
  {
    "id": "ironshield",
    "label": "Smith iron square shield",
    "bar": "ironbar",
    "bars": 3,
    "xp": 50,
    "need": 16
  },
  {
    "id": "diamondsword",
    "label": "Smith diamond blade (yew + diamond)",
    "bar": "diamondbar",
    "bars": 2,
    "extra": [
      [
        "yewlogs",
        1
      ]
    ],
    "xp": 80,
    "need": 42
  },
  {
    "id": "diamondaxe",
    "label": "Smith diamond axe",
    "bar": "diamondbar",
    "bars": 1,
    "xp": 70,
    "need": 40
  },
  {
    "id": "diamondpick",
    "label": "Smith diamond pickaxe",
    "bar": "diamondbar",
    "bars": 1,
    "xp": 70,
    "need": 40
  },
  {
    "id": "diamondshield",
    "label": "Smith diamond square shield",
    "bar": "diamondbar",
    "bars": 3,
    "xp": 95,
    "need": 42
  },
  {
    "id": "dragonitesword",
    "label": "Smith dragonite blade (magic + dragonite)",
    "bar": "dragonitebar",
    "bars": 2,
    "extra": [
      [
        "magiclogs",
        1
      ]
    ],
    "xp": 120,
    "need": 62
  },
  {
    "id": "dragoniteaxe",
    "label": "Smith dragonite axe",
    "bar": "dragonitebar",
    "bars": 1,
    "xp": 100,
    "need": 60
  },
  {
    "id": "dragonitepick",
    "label": "Smith dragonite pickaxe",
    "bar": "dragonitebar",
    "bars": 1,
    "xp": 100,
    "need": 60
  },
  {
    "id": "dragoniteshield",
    "label": "Smith dragonite square shield",
    "bar": "dragonitebar",
    "bars": 3,
    "xp": 140,
    "need": 62
  }
];
var CRAFT_RECIPES = [
  {
    "id": "tan:cowhide",
    "label": "Tan cowhide",
    "kind": "tan",
    "xpSkill": "crafting"
  },
  {
    "id": "string:fur",
    "label": "Spin string from rabbit fur",
    "inputs": [
      [
        "rabbitfur",
        1
      ]
    ],
    "output": "string",
    "qty": 1,
    "xp": 8,
    "xpSkill": "crafting",
    "need": 1
  },
  {
    "id": "stitch:gloves",
    "label": "Stitch leather gloves",
    "inputs": [
      [
        "leather",
        1
      ],
      [
        "string",
        1
      ]
    ],
    "output": "gloves",
    "qty": 1,
    "xp": 25,
    "xpSkill": "crafting",
    "need": 1
  },
  {
    "id": "scalegloves",
    "label": "Craft drake-scale gloves",
    "inputs": [
      [
        "drakescale",
        2
      ],
      [
        "leather",
        1
      ],
      [
        "string",
        1
      ]
    ],
    "output": "scalegloves",
    "qty": 1,
    "xp": 45,
    "xpSkill": "crafting",
    "need": 40
  },
  {
    "id": "net",
    "label": "Weave fishing net",
    "inputs": [
      [
        "string",
        3
      ]
    ],
    "output": "net",
    "qty": 1,
    "xp": 18,
    "xpSkill": "crafting",
    "need": 1
  },
  {
    "id": "coppernet",
    "label": "Weave copper fishing net",
    "inputs": [
      [
        "string",
        3
      ],
      [
        "copperbar",
        1
      ]
    ],
    "output": "coppernet",
    "qty": 1,
    "xp": 28,
    "xpSkill": "crafting",
    "need": 15
  },
  {
    "id": "ironnet",
    "label": "Weave iron fishing net",
    "inputs": [
      [
        "string",
        3
      ],
      [
        "ironbar",
        1
      ]
    ],
    "output": "ironnet",
    "qty": 1,
    "xp": 40,
    "xpSkill": "crafting",
    "need": 28
  },
  {
    "id": "diamondnet",
    "label": "Weave diamond fishing net",
    "inputs": [
      [
        "string",
        3
      ],
      [
        "diamondbar",
        1
      ]
    ],
    "output": "diamondnet",
    "qty": 1,
    "xp": 60,
    "xpSkill": "crafting",
    "need": 40
  },
  {
    "id": "dragonitenet",
    "label": "Weave dragonite fishing net",
    "inputs": [
      [
        "string",
        3
      ],
      [
        "dragonitebar",
        1
      ]
    ],
    "output": "dragonitenet",
    "qty": 1,
    "xp": 90,
    "xpSkill": "crafting",
    "need": 60
  },
  {
    "id": "woodclub",
    "label": "Carve wood club",
    "inputs": [
      [
        "logs",
        1
      ]
    ],
    "output": "woodclub",
    "qty": 1,
    "xp": 12,
    "xpSkill": "crafting",
    "need": 1
  },
  {
    "id": "shield",
    "label": "Carve wooden shield",
    "inputs": [
      [
        "logs",
        2
      ]
    ],
    "output": "shield",
    "qty": 1,
    "xp": 20,
    "xpSkill": "crafting",
    "need": 1
  },
  {
    "id": "oakplankshield",
    "label": "Carve shield from oak planks",
    "inputs": [
      [
        "oakplank",
        2
      ]
    ],
    "output": "shield",
    "qty": 1,
    "xp": 24,
    "xpSkill": "construction",
    "need": 1
  },
  {
    "id": "woodaxe",
    "label": "Carve wood axe",
    "inputs": [
      [
        "logs",
        2
      ]
    ],
    "output": "woodaxe",
    "qty": 1,
    "xp": 14,
    "xpSkill": "crafting",
    "need": 1
  },
  {
    "id": "woodpick",
    "label": "Carve wood pickaxe",
    "inputs": [
      [
        "logs",
        2
      ]
    ],
    "output": "woodpick",
    "qty": 1,
    "xp": 14,
    "xpSkill": "crafting",
    "need": 1
  },
  {
    "id": "staff",
    "label": "Carve wood staff (logs + air)",
    "inputs": [
      [
        "logs",
        2
      ],
      [
        "airrune",
        1
      ]
    ],
    "output": "staff",
    "qty": 1,
    "xp": 18,
    "xpSkill": "crafting",
    "need": 1
  },
  {
    "id": "copperstaff",
    "label": "Craft copper staff (oak + air)",
    "inputs": [
      [
        "oaklogs",
        1
      ],
      [
        "airrune",
        2
      ]
    ],
    "output": "copperstaff",
    "qty": 1,
    "xp": 30,
    "xpSkill": "crafting",
    "need": 8
  },
  {
    "id": "ironstaff",
    "label": "Craft iron staff (ash + water)",
    "inputs": [
      [
        "ashlogs",
        1
      ],
      [
        "waterrune",
        2
      ]
    ],
    "output": "ironstaff",
    "qty": 1,
    "xp": 44,
    "xpSkill": "crafting",
    "need": 20
  },
  {
    "id": "diamondstaff",
    "label": "Craft diamond staff (yew + earth)",
    "inputs": [
      [
        "yewlogs",
        1
      ],
      [
        "earthrune",
        2
      ]
    ],
    "output": "diamondstaff",
    "qty": 1,
    "xp": 80,
    "xpSkill": "crafting",
    "need": 45
  },
  {
    "id": "dragonitestaff",
    "label": "Craft dragonite staff (magic + fire)",
    "inputs": [
      [
        "magiclogs",
        1
      ],
      [
        "firerune",
        2
      ]
    ],
    "output": "dragonitestaff",
    "qty": 1,
    "xp": 120,
    "xpSkill": "crafting",
    "need": 65
  },
  {
    "id": "wizardrobe",
    "label": "Sew wizard robe (string + leather + logs)",
    "inputs": [
      [
        "leather",
        2
      ],
      [
        "string",
        1
      ],
      [
        "logs",
        1
      ]
    ],
    "output": "wizardrobe",
    "qty": 1,
    "xp": 28,
    "xpSkill": "crafting",
    "need": 5
  },
  {
    "id": "copperarmour",
    "label": "Sew copper armour (string + leather + copper)",
    "inputs": [
      [
        "leather",
        2
      ],
      [
        "string",
        1
      ],
      [
        "copperbar",
        3
      ]
    ],
    "output": "copperarmour",
    "qty": 1,
    "xp": 40,
    "xpSkill": "crafting",
    "need": 8
  },
  {
    "id": "ironarmour",
    "label": "Sew iron armour (string + leather + iron)",
    "inputs": [
      [
        "leather",
        2
      ],
      [
        "string",
        1
      ],
      [
        "ironbar",
        5
      ]
    ],
    "output": "ironarmour",
    "qty": 1,
    "xp": 70,
    "xpSkill": "crafting",
    "need": 18
  },
  {
    "id": "diamondarmour",
    "label": "Sew diamond armour (string + leather + diamond)",
    "inputs": [
      [
        "leather",
        2
      ],
      [
        "string",
        1
      ],
      [
        "diamondbar",
        5
      ]
    ],
    "output": "diamondarmour",
    "qty": 1,
    "xp": 140,
    "xpSkill": "crafting",
    "need": 45
  },
  {
    "id": "dragonitearmour",
    "label": "Sew dragonite armour (string + leather + dragonite)",
    "inputs": [
      [
        "leather",
        2
      ],
      [
        "string",
        1
      ],
      [
        "dragonitebar",
        5
      ]
    ],
    "output": "dragonitearmour",
    "qty": 1,
    "xp": 200,
    "xpSkill": "crafting",
    "need": 65
  },
  {
    "id": "woodbow",
    "label": "Fletch wood bow",
    "inputs": [
      [
        "logs",
        1
      ],
      [
        "string",
        1
      ]
    ],
    "output": "woodbow",
    "qty": 1,
    "xp": 16,
    "xpSkill": "fletching",
    "need": 1
  },
  {
    "id": "copperbow",
    "label": "Fletch copper bow",
    "inputs": [
      [
        "oaklogs",
        1
      ],
      [
        "string",
        1
      ]
    ],
    "output": "copperbow",
    "qty": 1,
    "xp": 22,
    "xpSkill": "fletching",
    "need": 5
  },
  {
    "id": "oakbow",
    "label": "Fletch ash bow",
    "inputs": [
      [
        "ashlogs",
        1
      ],
      [
        "string",
        1
      ]
    ],
    "output": "oakbow",
    "qty": 1,
    "xp": 36,
    "xpSkill": "fletching",
    "need": 15
  },
  {
    "id": "yewbow",
    "label": "Fletch yew bow",
    "inputs": [
      [
        "yewlogs",
        1
      ],
      [
        "string",
        1
      ]
    ],
    "output": "yewbow",
    "qty": 1,
    "xp": 60,
    "xpSkill": "fletching",
    "need": 40
  },
  {
    "id": "magicbow",
    "label": "Fletch magic bow",
    "inputs": [
      [
        "magiclogs",
        1
      ],
      [
        "string",
        1
      ]
    ],
    "output": "magicbow",
    "qty": 1,
    "xp": 90,
    "xpSkill": "fletching",
    "need": 60
  },
  {
    "id": "woodarrow",
    "label": "Fletch wooden arrows (x10)",
    "inputs": [
      [
        "logs",
        1
      ],
      [
        "feather",
        1
      ]
    ],
    "output": "woodarrow",
    "qty": 10,
    "xp": 10,
    "xpSkill": "fletching",
    "need": 1
  },
  {
    "id": "copperarrow",
    "label": "Fletch copper arrows (x10)",
    "inputs": [
      [
        "oaklogs",
        1
      ],
      [
        "copperbar",
        1
      ],
      [
        "feather",
        1
      ]
    ],
    "output": "copperarrow",
    "qty": 10,
    "xp": 18,
    "xpSkill": "fletching",
    "need": 5
  },
  {
    "id": "ironarrow",
    "label": "Fletch iron arrows (x10)",
    "inputs": [
      [
        "ashlogs",
        1
      ],
      [
        "ironbar",
        1
      ],
      [
        "feather",
        1
      ]
    ],
    "output": "ironarrow",
    "qty": 10,
    "xp": 30,
    "xpSkill": "fletching",
    "need": 15
  },
  {
    "id": "diamondarrow",
    "label": "Fletch diamond arrows (x10)",
    "inputs": [
      [
        "yewlogs",
        1
      ],
      [
        "diamondbar",
        1
      ],
      [
        "feather",
        1
      ]
    ],
    "output": "diamondarrow",
    "qty": 10,
    "xp": 50,
    "xpSkill": "fletching",
    "need": 40
  },
  {
    "id": "dragonitearrow",
    "label": "Fletch dragonite arrows (x10)",
    "inputs": [
      [
        "magiclogs",
        1
      ],
      [
        "dragonitebar",
        1
      ],
      [
        "feather",
        1
      ]
    ],
    "output": "dragonitearrow",
    "qty": 10,
    "xp": 80,
    "xpSkill": "fletching",
    "need": 60
  },
  {
    "id": "shortbowunstrung",
    "label": "Fletch unstrung copper bow",
    "inputs": [
      [
        "oaklogs",
        1
      ]
    ],
    "output": "shortbowunstrung",
    "qty": 1,
    "xp": 14,
    "xpSkill": "fletching",
    "need": 1
  },
  {
    "id": "stringbow",
    "label": "String copper bow",
    "inputs": [
      [
        "shortbowunstrung",
        1
      ],
      [
        "string",
        1
      ]
    ],
    "output": "copperbow",
    "qty": 1,
    "xp": 10,
    "xpSkill": "fletching",
    "need": 5
  },
  {
    "id": "oakplank",
    "label": "Saw oak plank",
    "inputs": [
      [
        "oaklogs",
        1
      ]
    ],
    "output": "oakplank",
    "qty": 1,
    "xp": 20,
    "xpSkill": "construction",
    "need": 1
  }
];
