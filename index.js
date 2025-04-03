require('dotenv').config();
const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

const games = {}; 

const newGame = (player1, player2) => ({
    board: Array(9).fill(null),
    players: [player1, player2],
    currentPlayer: 0,
});

const renderBoard = (game, gameId) => {
    const rows = [];
    for (let i = 0; i < 3; i++) {
        const row = new ActionRowBuilder();
        for (let j = 0; j < 3; j++) {
            const cellIndex = i * 3 + j;
            const cell = game.board[cellIndex];
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(`${gameId}-${cellIndex}`)
                    .setLabel(cell ? (cell === 'X' ? '❌' : '⭕') : '⬜')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(!!cell) 
            );
        }
        rows.push(row);
    }
    return rows;
};

const checkWinner = (board) => {
    const winningCombos = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8], 
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8], 
        [0, 4, 8],
        [2, 4, 6], 
    ];

    for (let combo of winningCombos) {
        const [a, b, c] = combo;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return true;
        }
    }
    return false;
};

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    const [gameId, cellIndex] = interaction.customId.split('-');
    const game = games[gameId];

    if (!game) {
        return interaction.reply({ content: 'This game no longer exists!', ephemeral: true });
    }

    if (game.players[game.currentPlayer] !== `<@${interaction.user.id}>`) {
        return interaction.reply({ content: 'It’s not your turn!', ephemeral: true });
    }

    const cell = parseInt(cellIndex);
    game.board[cell] = game.currentPlayer === 0 ? 'X' : 'O';

    if (checkWinner(game.board)) {
        await interaction.update({
            content: `${game.players[game.currentPlayer]} wins! 🎉`,
            components: renderBoard(game, gameId),
        });
        delete games[gameId]; 
    } else if (game.board.every((cell) => cell !== null)) {
        await interaction.update({
            content: "It's a tie! 🤝",
            components: renderBoard(game, gameId),
        });
        delete games[gameId]; 
    } else {
        game.currentPlayer = 1 - game.currentPlayer; 
        await interaction.update({
            content: `It's ${game.players[game.currentPlayer]}'s turn!`,
            components: renderBoard(game, gameId),
        });
    }
});

client.on('messageCreate', async (message) => {
    if (!message.content.startsWith('L.')) return;

    const commandBody = message.content.slice(2).trim(); 
    const [command, ...args] = commandBody.split(/\s+/);

    if (command === 'start') {
        if (args.length < 2) {
            return message.reply('Please mention two players to start the game.');
        }

        const player1 = args[0];
        const player2 = args[1];
        const gameId = message.id; 
        games[gameId] = newGame(player1, player2);

        await message.reply({
            content: `Tic Tac Toe game started! ${player1} (❌) vs ${player2} (⭕). It's ${player1}'s turn!`,
            components: renderBoard(games[gameId], gameId),
        });
    }


    if (command === 'help') {
        await message.reply(
            "Here are the available commands:\n" +
            "`L.start <player1> <player2>` - Start a new Tic Tac Toe game.\n" +
            "`L.help` - Show this help message."
        );
    }
    
});

client.login(process.env.TOKEN);
