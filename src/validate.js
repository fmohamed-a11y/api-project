const   DATED = [ 'all', 'today','3days','week','month'];
const TYPES = ['FULLTIME', 'PARIME','CONTRACTOR','INTERN'];

function checkSearch (q) {
    const query = (q.q || '').trim();
    if (query.length < 2 || query.length > 80) return { error: 'Please type 2 to 80 characters.'};

    const country = (q.country || 'us').toLowerCase();
    if (!/^[a-z]{2}$/.test(country)) return {error :'Please choose a valid country.'};

    const datePosted =q.datePosted || 'all' ;
    if (!DATED.includes(datePosted)) return { error : 'Please choose a valid date.'};

    const  types = q.types ? q.types.split(',') : [] ;
    if ( types.some((t) => !TYPES .includes (t))) return {error: 'Please choose a valid job type.' };
    
    return {query, country, datePosted, remote:q.remote === 'true', types: types.join(',')};

}
module.exports= {checkSearch};