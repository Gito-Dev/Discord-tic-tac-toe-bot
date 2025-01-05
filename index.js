require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

const PREFIX = '!'; // Command prefix
let games = {}; // Store ongoing games

// Helper function to create a new game
const newGame = (player1, player2) => ({
    board: Array(9).fill(null),
    players: [player1, player2],
    currentPlayer: 0,
});

// Helper function to display the board
const renderBoard = (board) => {
    return (
        `${getSymbol(board[0])} | ${getSymbol(board[1])} | ${getSymbol(board[2])}\n` +
        `${getSymbol(board[3])} | ${getSymbol(board[4])} | ${getSymbol(board[5])}\n` +
        `${getSymbol(board[6])} | ${getSymbol(board[7])} | ${getSymbol(board[8])}\n`
    );
};

// Helper function to map board values to images
const getSymbol = (cell) => {
    if (cell === 'X') return '❌'; // Use emojis for better visualization
    if (cell === 'O') return '⭕';
    return '⬜'; // Empty cell symbol
};

// Handle incoming messages
client.on('messageCreate', (message) => {
    if (!message.content.startsWith(PREFIX) || message.author.bot) return;

    const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
    const command = args.shift().toLowerCase();

    if (command === 'start') {
        if (games[message.guild.id]) {
            return message.reply('A game is already ongoing! Use `!end` to stop the current game.');
        }

        if (args.length < 2) {
            return message.reply('Please mention two players to start the game.');
        }

        const player1 = args[0];
        const player2 = args[1];
        games[message.guild.id] = newGame(player1, player2);

        message.channel.send(`Tic Tac Toe game started! ${player1} (❌) vs ${player2} (⭕). Player 1, make your move using \`!move <cell number>\` (1-9).`);
    }

    if (command === 'move') {
        const game = games[message.guild.id];

        if (!game) {
            return message.reply('No game is ongoing! Use `!start` to begin a new game.');
        }

        const cell = parseInt(args[0]) - 1;

        if (isNaN(cell) || cell < 0 || cell > 8) {
            return message.reply('Please provide a valid cell number (1-9).');
        }

        if (game.board[cell]) {
            return message.reply('That cell is already taken! Choose another.');
        }

        game.board[cell] = game.currentPlayer === 0 ? 'X' : 'O';
        const currentPlayerSymbol = game.currentPlayer === 0 ? '❌' : '⭕';
        const currentPlayerName = game.players[game.currentPlayer];

        if (checkWinner(game.board)) {
            message.channel.send(renderBoard(game.board));
            message.channel.send(`Player ${currentPlayerSymbol} wins! 🎉`);
            delete games[message.guild.id]; // End the game
        } else if (game.board.every((cell) => cell !== null)) {
            message.channel.send(renderBoard(game.board));
            message.channel.send("It's a tie! 🤝");
            delete games[message.guild.id]; // End the game
        } else {
            game.currentPlayer = 1 - game.currentPlayer; // Switch players
            message.channel.send(renderBoard(game.board));
            message.channel.send(`Player ${game.players[game.currentPlayer]} (${game.currentPlayer === 0 ? '❌' : '⭕'}), it's your turn!`);
        }
    }

    if (command === 'end') {
        if (!games[message.guild.id]) {
            return message.reply('No game is ongoing to end.');
        }

        delete games[message.guild.id];
        message.channel.send('The current Tic Tac Toe game has been ended.');
    }

    if (command === 'help') {
        message.channel.send(
            "Commands:\n" +
            "!start <player1> <player2> - Start a new game\n" +
            "!move <cell number> - Make your move (1-9)\n" +
            "!end - End the current game\n" +
            "!help - Show this help message"
        );
    }
});

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

// Log the token to check if it's loaded properly
console.log("Token:", process.env.TOKEN);  // Make sure it prints the token in the console

// Log in to Discord
client.login(process.env.TOKEN);
