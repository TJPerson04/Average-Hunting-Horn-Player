const { Events } = require('discord.js');

const GUILDID = '1300229191735967805';
const CHANNELID = '1306425055516823552';

const WORDS_WHITELIST = {
    // Champions
    '487382978587131904': [  // Colin
        'math',
        'color',
        'beast',
        'element',
        'time',
        'space',
        'thing',
        'hold',
        'hunt',
        'sound',
        'grass',
        'sea',
    ],
    '293261067759648783': [  // Alaina
        
    ],
    '463854892415582210': [  // Griffin
        'blood',
        'sand',
        'magic',
        'combine',
        'place',
        'spine',
    ],

    // Cryptids
    '365968487706787850': [  // Cisco
        'math',
        'color',
        'beast',
        'element',
        'time',
        'space',
        'thing',
        'hold',
        'hunt',
        'sound',
        'grass',
        'sea',
    ],
    '180417404281683969': [  // Brady
        
    ],
    '407336921363251230': [  // Thomas
        'blood',
        'sand',
        'magic',
        'combine',
        'place',
        'spine',
    ],
}

const UNIV_WORDS = [
    'yes',
    'no',
    'of',
    'for',
    'with',
    'like',
    'wait',
    'maybe',
    'now',
    'help',
    'find',
    'again',
    'symbol',
    'same',
    'me',
    'you',
    'us',
    'them',
    'match',
    'done',
    'leave',
    'give',
    'eat',
    'orange',
]

function validateMessage(message, whitelist) {
    let words = message.toLowerCase().replaceAll(':', '')
        .replaceAll('|', '')
        .replaceAll(',', '')
        .replaceAll('\\', '')
        .replaceAll('/', '')
        .replaceAll('?', '')
        .replaceAll('"', '')
        .replaceAll('!', '')
        .replaceAll('-', '')
        .replaceAll('.', '')
        .replaceAll('+', '').split(' ');

    // console.log(words);

    for (let i = 0; i < words.length; i++) {
        if (words[i] !== '' && !(whitelist.includes(words[i])) && !(UNIV_WORDS.includes(words[i]))) {
            return false;
        }
    }

    return true;
}


module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        const guildId = message.guildId;
        const channelId = message.channelId;
        const userId = message.author.id;
        const content = message.content;

        if (
            guildId === GUILDID &&
            channelId === CHANNELID &&
            WORDS_WHITELIST[userId]
        ) {
            const isValid = validateMessage(content, WORDS_WHITELIST[userId]);
            if (!isValid) {
                message.delete();
            }
        }

        // console.log(message)
    }
}