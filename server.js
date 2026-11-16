require('dotenv').config();
const express = require('express');
const { searchJobs } = require('./src/jobsApi');
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.static('public'));

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.get('/api/jobs', async (req, res) => {
    const query = (req.query.q || '' ).trim();
    if (query.length < 2) {
        return res.status(400).json({ error:'Please type at least 2 characters.'});
    }

    try {
        const jobs = await searchJobs(query);
        res.json(jobs);
    } catch (err) {
        console.error('Search failed:', err.message);
        res.status(err.status || 500).json({ error: err.message || 'Something went wrong.' });
    }
});

app.listen(PORT, () => {
    console.log(`server running at http://localhost:${PORT}`);
});
