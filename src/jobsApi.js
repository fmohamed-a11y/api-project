const API_HOST = "jsearch.p.rapidapi.com";
class ApiError extends Error {
    constructor(message, status) {
        super(message);
        this.status = status;
    }
}
async function searchJobs(search) {
    if (!process.env.RAPIDAPI_KEY) {
        throw new ApiError('The server has no Api key set up.', 500);

    }
const params = new URLSearchParams({
    query: search.query,
    country: search.country,
    date_posted: search.datePosted,
});
if (search.remote) params.set('work_from_home','true');
if(search.types) params.set('employment_types', search.types);
const url =`https://${API_HOST}/search-v2?${params}`;
    let response
    try {
        response = await fetch(url, {
            headers: {
                'x-rapidapi-key': process.env.RAPIDAPI_KEY,
                'x-rapidapi-host': API_HOST,
            },
            signal: AbortSignal.timeout(10000),

        });
    } catch (err) {
        if (err.name == 'TimeoutError') {
            throw new ApiError('The job service took too long to answer. Please try again.', 504)
        }
        throw new ApiError('Could not reach the job service. Check your internet connection.', 502)
    }

    if (response.status === 401 || response.status == 403) {
        throw new ApiError('The Job Service rejected our Api key', 502);
    }
    if (response.status === 429) {
        throw new ApiError('We have used up our searches for now. Please try again later.', 503)
    }
    if (!response.ok) {
        console.error('JSearch returnd status', response.status)
        throw new ApiError('The job service is having problems. Please try again later.', 502);
    }

    let body;
    try {
        body = await response.json();

    } catch {
        throw new ApiError('The job service sent back something we could not read.', 502)

    }
    if (!body || !body.data) {
        throw new ApiError('The job service sent an unexpected answer.', 502)

    }

    return body.data;

}
module.exports = { searchJobs, ApiError };