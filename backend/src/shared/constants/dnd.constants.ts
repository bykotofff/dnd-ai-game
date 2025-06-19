// backend/src/shared/constants/dnd.constants.ts

// Основные характеристики
export const ABILITY_SCORES = {
    STRENGTH: 'strength',
    DEXTERITY: 'dexterity',
    CONSTITUTION: 'constitution',
    INTELLIGENCE: 'intelligence',
    WISDOM: 'wisdom',
    CHARISMA: 'charisma'
} as const

export type AbilityScore = typeof ABILITY_SCORES[keyof typeof ABILITY_SCORES]

// Навыки и их связанные характеристики
export const SKILLS = {
    acrobatics: 'dexterity',
    animalHandling: 'wisdom',
    arcana: 'intelligence',
    athletics: 'strength',
    deception: 'charisma',
    history: 'intelligence',
    insight: 'wisdom',
    intimidation: 'charisma',
    investigation: 'intelligence',
    medicine: 'wisdom',
    nature: 'intelligence',
    perception: 'wisdom',
    performance: 'charisma',
    persuasion: 'charisma',
    religion: 'intelligence',
    sleightOfHand: 'dexterity',
    stealth: 'dexterity',
    survival: 'wisdom'
} as const

export type Skill = keyof typeof SKILLS

// Спасительные броски
export const SAVING_THROWS = [
    'strength',
    'dexterity',
    'constitution',
    'intelligence',
    'wisdom',
    'charisma'
] as const

export type SavingThrow = typeof SAVING_THROWS[number]

// Расы персонажей
export const RACES = {
    HUMAN: {
        name: 'Человек',
        abilityScoreIncrease: { strength: 1, dexterity: 1, constitution: 1, intelligence: 1, wisdom: 1, charisma: 1 },
        size: 'Medium',
        speed: 30,
        languages: ['Общий'],
        traits: ['Универсальность', 'Дополнительный навык']
    },
    ELF: {
        name: 'Эльф',
        abilityScoreIncrease: { dexterity: 2 },
        size: 'Medium',
        speed: 30,
        languages: ['Общий', 'Эльфийский'],
        traits: ['Тёмное зрение', 'Острые чувства', 'Эльфийское происхождение', 'Транс']
    },
    DWARF: {
        name: 'Дварф',
        abilityScoreIncrease: { constitution: 2 },
        size: 'Medium',
        speed: 25,
        languages: ['Общий', 'Дварфский'],
        traits: ['Тёмное зрение', 'Дварфская стойкость', 'Дварфская боевая подготовка', 'Знание инструментов']
    },
    HALFLING: {
        name: 'Полурослик',
        abilityScoreIncrease: { dexterity: 2 },
        size: 'Small',
        speed: 25,
        languages: ['Общий', 'Полуросличий'],
        traits: ['Удачливость', 'Храбрость', 'Ловкость полуросликов']
    },
    DRAGONBORN: {
        name: 'Драконорождённый',
        abilityScoreIncrease: { strength: 2, charisma: 1 },
        size: 'Medium',
        speed: 30,
        languages: ['Общий', 'Драконий'],
        traits: ['Драконье происхождение', 'Оружие дыхания', 'Сопротивление урону']
    },
    GNOME: {
        name: 'Гном',
        abilityScoreIncrease: { intelligence: 2 },
        size: 'Small',
        speed: 25,
        languages: ['Общий', 'Гномский'],
        traits: ['Тёмное зрение', 'Гномская хитрость']
    },
    HALF_ELF: {
        name: 'Полуэльф',
        abilityScoreIncrease: { charisma: 2 },
        size: 'Medium',
        speed: 30,
        languages: ['Общий', 'Эльфийский'],
        traits: ['Тёмное зрение', 'Эльфийское происхождение', 'Универсальность навыков']
    },
    HALF_ORC: {
        name: 'Полуорк',
        abilityScoreIncrease: { strength: 2, constitution: 1 },
        size: 'Medium',
        speed: 30,
        languages: ['Общий', 'Орочий'],
        traits: ['Тёмное зрение', 'Неумолимая стойкость', 'Дикие атаки']
    },
    TIEFLING: {
        name: 'Тифлинг',
        abilityScoreIncrease: { intelligence: 1, charisma: 2 },
        size: 'Medium',
        speed: 30,
        languages: ['Общий', 'Инфернальный'],
        traits: ['Тёмное зрение', 'Адское сопротивление', 'Инфернальное наследие']
    }
} as const

export type Race = keyof typeof RACES

// Классы персонажей
export const CLASSES = {
    BARBARIAN: {
        name: 'Варвар',
        hitDie: 12,
        primaryAbility: ['strength'],
        savingThrowProficiencies: ['strength', 'constitution'],
        skillChoices: 2,
        availableSkills: ['animalHandling', 'athletics', 'intimidation', 'nature', 'perception', 'survival'],
        armorProficiencies: ['light', 'medium', 'shields'],
        weaponProficiencies: ['simple', 'martial'],
        features: ['Ярость', 'Безрассудная атака', 'Опасное чутьё']
    },
    BARD: {
        name: 'Бард',
        hitDie: 8,
        primaryAbility: ['charisma'],
        savingThrowProficiencies: ['dexterity', 'charisma'],
        skillChoices: 3,
        availableSkills: Object.keys(SKILLS) as Skill[],
        armorProficiencies: ['light'],
        weaponProficiencies: ['simple', 'hand crossbows', 'longswords', 'rapiers', 'shortswords'],
        features: ['Колдовство', 'Bardic Inspiration', 'Expertise']
    },
    CLERIC: {
        name: 'Жрец',
        hitDie: 8,
        primaryAbility: ['wisdom'],
        savingThrowProficiencies: ['wisdom', 'charisma'],
        skillChoices: 2,
        availableSkills: ['history', 'insight', 'medicine', 'persuasion', 'religion'],
        armorProficiencies: ['light', 'medium', 'shields'],
        weaponProficiencies: ['simple'],
        features: ['Колдовство', 'Божественный домен']
    },
    DRUID: {
        name: 'Друид',
        hitDie: 8,
        primaryAbility: ['wisdom'],
        savingThrowProficiencies: ['intelligence', 'wisdom'],
        skillChoices: 2,
        availableSkills: ['arcana', 'animalHandling', 'insight', 'medicine', 'nature', 'perception', 'religion', 'survival'],
        armorProficiencies: ['light', 'medium', 'shields'],
        weaponProficiencies: ['clubs', 'daggers', 'darts', 'javelins', 'maces', 'quarterstaffs', 'scimitars', 'sickles', 'slings', 'spears'],
        features: ['Колдовство', 'Друидизм']
    },
    FIGHTER: {
        name: 'Воин',
        hitDie: 10,
        primaryAbility: ['strength', 'dexterity'],
        savingThrowProficiencies: ['strength', 'constitution'],
        skillChoices: 2,
        availableSkills: ['acrobatics', 'animalHandling', 'athletics', 'history', 'insight', 'intimidation', 'perception', 'survival'],
        armorProficiencies: ['light', 'medium', 'heavy', 'shields'],
        weaponProficiencies: ['simple', 'martial'],
        features: ['Боевой стиль', 'Второе дыхание']
    },
    MONK: {
        name: 'Монах',
        hitDie: 8,
        primaryAbility: ['dexterity', 'wisdom'],
        savingThrowProficiencies: ['strength', 'dexterity'],
        skillChoices: 2,
        availableSkills: ['acrobatics', 'athletics', 'history', 'insight', 'religion', 'stealth'],
        armorProficiencies: [],
        weaponProficiencies: ['simple', 'shortswords'],
        features: ['Боевые искусства', 'Ци']
    },
    PALADIN: {
        name: 'Паладин',
        hitDie: 10,
        primaryAbility: ['strength', 'charisma'],
        savingThrowProficiencies: ['wisdom', 'charisma'],
        skillChoices: 2,
        availableSkills: ['athletics', 'insight', 'intimidation', 'medicine', 'persuasion', 'religion'],
        armorProficiencies: ['light', 'medium', 'heavy', 'shields'],
        weaponProficiencies: ['simple', 'martial'],
        features: ['Божественное чутьё', 'Наложение рук']
    },
    RANGER: {
        name: 'Следопыт',
        hitDie: 10,
        primaryAbility: ['dexterity', 'wisdom'],
        savingThrowProficiencies: ['strength', 'dexterity'],
        skillChoices: 3,
        availableSkills: ['animalHandling', 'athletics', 'insight', 'investigation', 'nature', 'perception', 'stealth', 'survival'],
        armorProficiencies: ['light', 'medium', 'shields'],
        weaponProficiencies: ['simple', 'martial'],
        features: ['Заклятый враг', 'Избранная местность']
    },
    ROGUE: {
        name: 'Плут',
        hitDie: 8,
        primaryAbility: ['dexterity'],
        savingThrowProficiencies: ['dexterity', 'intelligence'],
        skillChoices: 4,
        availableSkills: ['acrobatics', 'athletics', 'deception', 'insight', 'intimidation', 'investigation', 'perception', 'performance', 'persuasion', 'sleightOfHand', 'stealth'],
        armorProficiencies: ['light'],
        weaponProficiencies: ['simple', 'hand crossbows', 'longswords', 'rapiers', 'shortswords'],
        features: ['Экспертиза', 'Скрытая атака', 'Воровской жаргон']
    },
    SORCERER: {
        name: 'Чародей',
        hitDie: 6,
        primaryAbility: ['charisma'],
        savingThrowProficiencies: ['constitution', 'charisma'],
        skillChoices: 2,
        availableSkills: ['arcana', 'deception', 'insight', 'intimidation', 'persuasion', 'religion'],
        armorProficiencies: [],
        weaponProficiencies: ['daggers', 'darts', 'slings', 'quarterstaffs', 'light crossbows'],
        features: ['Колдовство', 'Чародейское происхождение']
    },
    WARLOCK: {
        name: 'Колдун',
        hitDie: 8,
        primaryAbility: ['charisma'],
        savingThrowProficiencies: ['wisdom', 'charisma'],
        skillChoices: 2,
        availableSkills: ['arcana', 'deception', 'history', 'intimidation', 'investigation', 'nature', 'religion'],
        armorProficiencies: ['light'],
        weaponProficiencies: ['simple'],
        features: ['Потусторонний покровитель', 'Магия договора']
    },
    WIZARD: {
        name: 'Волшебник',
        hitDie: 6,
        primaryAbility: ['intelligence'],
        savingThrowProficiencies: ['intelligence', 'wisdom'],
        skillChoices: 2,
        availableSkills: ['arcana', 'history', 'insight', 'investigation', 'medicine', 'religion'],
        armorProficiencies: [],
        weaponProficiencies: ['daggers', 'darts', 'slings', 'quarterstaffs', 'light crossbows'],
        features: ['Колдовство', 'Ритуальное колдовство', 'Книга заклинаний']
    }
} as const

export type CharacterClass = keyof typeof CLASSES

// Мировоззрения
export const ALIGNMENTS = [
    'Законно-добрый',
    'Нейтрально-добрый',
    'Хаотично-добрый',
    'Законно-нейтральный',
    'Истинно нейтральный',
    'Хаотично-нейтральный',
    'Законно-злой',
    'Нейтрально-злой',
    'Хаотично-злой'
] as const

export type Alignment = typeof ALIGNMENTS[number]

// Размеры существ
export const CREATURE_SIZES = [
    'Tiny',
    'Small',
    'Medium',
    'Large',
    'Huge',
    'Gargantuan'
] as const

export type CreatureSize = typeof CREATURE_SIZES[number]

// Типы урона
export const DAMAGE_TYPES = [
    'acid',
    'bludgeoning',
    'cold',
    'fire',
    'force',
    'lightning',
    'necrotic',
    'piercing',
    'poison',
    'psychic',
    'radiant',
    'slashing',
    'thunder'
] as const

export type DamageType = typeof DAMAGE_TYPES[number]

// Состояния
export const CONDITIONS = [
    'blinded',
    'charmed',
    'deafened',
    'frightened',
    'grappled',
    'incapacitated',
    'invisible',
    'paralyzed',
    'petrified',
    'poisoned',
    'prone',
    'restrained',
    'stunned',
    'unconscious'
] as const

export type Condition = typeof CONDITIONS[number]

// Уровни заклинаний
export const SPELL_LEVELS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const
export type SpellLevel = typeof SPELL_LEVELS[number]

// Школы магии
export const MAGIC_SCHOOLS = [
    'abjuration',
    'conjuration',
    'divination',
    'enchantment',
    'evocation',
    'illusion',
    'necromancy',
    'transmutation'
] as const

export type MagicSchool = typeof MAGIC_SCHOOLS[number]

// Опыт по уровням
export const EXPERIENCE_TABLE = {
    1: 0,
    2: 300,
    3: 900,
    4: 2700,
    5: 6500,
    6: 14000,
    7: 23000,
    8: 34000,
    9: 48000,
    10: 64000,
    11: 85000,
    12: 100000,
    13: 120000,
    14: 140000,
    15: 165000,
    16: 195000,
    17: 225000,
    18: 265000,
    19: 305000,
    20: 355000
} as const

// Бонус мастерства по уровням
export const PROFICIENCY_BONUS = {
    1: 2, 2: 2, 3: 2, 4: 2,
    5: 3, 6: 3, 7: 3, 8: 3,
    9: 4, 10: 4, 11: 4, 12: 4,
    13: 5, 14: 5, 15: 5, 16: 5,
    17: 6, 18: 6, 19: 6, 20: 6
} as const