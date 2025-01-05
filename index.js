require('dotenv').config();
const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

const games = {}; // Store ongoing games

// Helper function to create a new game
const newGame = (player1, player2) => ({
    board: Array(9).fill(null),
    players: [player1, player2],
    currentPlayer: 0,
});

// Helper function to render the game board as buttons
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
                    .setDisabled(!!cell) // Disable button if cell is already taken
            );
        }
        rows.push(row);
    }
    return rows;
};

// Check if there's a winner
const checkWinner = (board) => {
    const winningCombos = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8], // rows
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8], // columns
        [0, 4, 8],
        [2, 4, 6], // diagonals
    ];

    for (let combo of winningCombos) {
        const [a, b, c] = combo;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return true;
        }
    }
    return false;
};

// Handle interactions (button clicks)
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
        delete games[gameId]; // End the game
    } else if (game.board.every((cell) => cell !== null)) {
        await interaction.update({
            content: "It's a tie! 🤝",
            components: renderBoard(game, gameId),
        });
        delete games[gameId]; // End the game
    } else {
        game.currentPlayer = 1 - game.currentPlayer; // Switch players
        await interaction.update({
            content: `It's ${game.players[game.currentPlayer]}'s turn!`,
            components: renderBoard(game, gameId),
        });
    }
});

// Handle commands starting with L.
client.on('messageCreate', async (message) => {
    if (!message.content.startsWith('L.')) return;

    const commandBody = message.content.slice(2).trim(); // Remove "L." prefix
    const [command, ...args] = commandBody.split(/\s+/);

    if (command === 'start') {
        if (args.length < 2) {
            return message.reply('Please mention two players to start the game.');
        }

        const player1 = args[0];
        const player2 = args[1];
        const gameId = message.id; // Use message ID as the game ID
        games[gameId] = newGame(player1, player2);

        await message.reply({
            content: `Tic Tac Toe game started! ${player1} (❌) vs ${player2} (⭕). It's ${player1}'s turn!`,
            components: renderBoard(games[gameId], gameId),
        });
    }
});

client.login(process.env.TOKEN);
