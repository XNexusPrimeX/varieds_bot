const app = express();

app.get('/', (req, res) => {
    res.send('Bot is Running');
});

require('./dist');

app.listen(process.env.PORT);