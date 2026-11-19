const sortSelect = document.getElementById('sort');
let currentJobs = [];
const form = document.getElementById('search-form');
const input = document.getElementById('search-input');
const statusText = document.getElementById('status');
const jobList = document.getElementById('job-list');
const trackerList = document.getElementById('tracker-list');
const statusFilter = document.getElementById('status-filter')
const currencySelect = document.getElementById('currency');
let rates = null;
const STATUSES =['Saved', 'Applied', 'Interview', 'Offer', 'Rejected'];
let tracker = load('tracker', {});
function sortJobs(jobs) {
    const sorted = [...jobs];
    const order = sortSelect.value;
    if (order === 'newest') {
        sorted.sort((a, b) => new Date (b.job_posted_at_datetime_utc || 0) - new Date (a.job_posted_at_datetime_utc || 0));
    }
    if (order === 'salary') {
        sorted.sort((a, b) => yearlySalary(b)- yearlySalary (a));
    }
    if (order === 'company' ) {
        sorted.sort((a, b) => (a.employer_name || '').localeCompare(b.employer_name || ''));

    }
    return sorted;
}
function yearlySalary(job) {
    const pay = job.job_max_salary || job.job_min_salary || 0;
    const perYear = { hour: 2080, day: 260, week: 52, month: 12, year:1 };
    return pay * (perYear[(job.job_salary_period || 'year').toLowerCase()] || 1);

}

form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const query = input.value.trim();

    if (query.length < 2) {
        showStatus('Please type at least 2 characters.', true);
        return;
    }

    jobList.innerHTML = '';
    showStatus('Searching...');

    try {

const params = new URLSearchParams({
    q: query,
    country: document.getElementById('country').value,
    datePosted:document.getElementById('date-posted').value,
    remote:document.getElementById('remote').checked,
    types:[...document.querySelectorAll ('input[name="types"]:checked ')].map((box) => box.value).join(','),
});
const response = await fetch (`/api/jobs?${params}`);
const data = await response.json();

        if (!response.ok) {
            showStatus(data.error || 'Something went wrong. Please try again.', true)
            return;
        }

        const jobs = data.jobs || [];
        if (jobs.length === 0) {
            showStatus('No jobs found, Try a different job title.');
            return;
        }
        showStatus(summaryText(jobs));
currentJobs = jobs;
showJobs(sortJobs(jobs));
    } catch (err) {
        console.error(err);
        showStatus('Could not reach the server. Check your connection and try again later', true)
        return;

    }

});
function showStatus(message, isError = false) {
    statusText.textContent = message;
    statusText.classList.toggle('error', isError);

}//function showJobs(jobs) {
    
        

function showJobs(jobs){
    jobList.innerHTML= "" ;
    jobs.forEach((job) => {
        const items = document.createElement('li');
        items.className = 'job';

        const title = document.createElement('h3');
        title.textContent = job.job_title || 'Untitled job';

        const company = document.createElement('p');
        company.textContent = job.employer_name || 'Unknown company';

        const location = document.createElement('p');
        const place = job.job_location || [job.job_city, job.job_country].filter(Boolean).join(', ');
        location.textContent = job.job_is_remote ? `Remote${place ? ' . ' + place : ''} `: (place || 'Location not Listed');

        const salary = document.createElement('p');
        salary.textContent = formatSalary(job);

        const posted = document.createElement('p');
        posted.textContent = formatPosted(job.job_posted_at_datetime_utc);

        const saveBtn = document.createElement('button');
        saveBtn.type = 'button';
        saveBtn.textContent = tracker[job.job_id] ? '✓ Saved' : 'Save';
        saveBtn.addEventListener ('click', () => toggleSaved(job));
        
        items.append(title, company, location, salary, posted, saveBtn);

        if (job.job_apply_link) {
            const link =document.createElement('a')
            link.href = job.job_apply_link;
            link.textContent = 'Apply';
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            items.append(link);
        }
        if (!job.job_is_remote && place) {
            const mapLink = document.createElement('a');
            const searchText = `${job.employer_name || ''} ${place}`;
            mapLink.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchText)}`;
            mapLink.textContent = '📍 Open in Google Maps';
            mapLink.target = '_blank';
            mapLink.rel = 'noopener noreferrer';
            items.append(mapLink);
        }
        jobList.append(items);
    });


}
function formatSalary(job) {
    const min = job.job_min_salary;
    const max = job.job_max_salary;
    if (!min && !max) return 'Salary not listed';

    const period = (job.job_salary_period || 'year' ).toLowerCase();
    const from =job.job_salary_currency || 'USD';
    const to = currencySelect.value;

    let text = `${from} ${range(min, max)} per ${period}`;

    if (to !== from) {
        const lo = min ? convert(min, from, to) : null;
        const hi = max ? convert(max, from, to) : null;
        if (lo || hi) text += ` (≈ ${to} ${range (lo, hi)})`;
    }
   return text; 
}

function range(lo, hi) {
    const fmt = (n) => Math.round(n).toLocaleString();
    if (lo && hi) return `${fmt(lo)} - ${fmt(hi)}`;
    return fmt(lo || hi);
}

function convert(amount, from, to) {
    if (!rates ||!rates[from] || !rates[to]) return null;
    return (amount / rates[from]) * rates[to]
}
sortSelect.addEventListener('change', () =>  {
    showJobs(sortJobs(currentJobs));
});
function formatPosted(dateText) {
    if (!dateText) return 'Date not listed';
    const days = Math.floor((Date.now() - new Date (dateText)) / 86400000 );
    if (days <= 0) return '🆕 Posted today';
    if (days === 1) return 'Posted yesterday';
    if (days < 30) return `Posted ${days} days ago`;
    return `Posted ${new Date(dateText).toLocaleDateString()}`;
}
function summaryText(jobs){
    const remote = jobs.filter((job) => job.job_is_remote).length;
    const withSalary = jobs.filter((job) => job.job_min_salary || job.job_max_salary).length;
    return `Found ${jobs.length} jobs . ${remote} remote . ${withSalary} with Salary`;
}
statusFilter.addEventListener('change', showTracker);

function toggleSaved(job) {
    if (tracker[job.job_id]){
        delete tracker[job.job_id];
    }else{
        tracker[job.job_id] = {
            id:job.job_id,
            title: job.job_title || 'Untitled Job',
            company:job.employer_name || 'Unknown company',
            link: job.job_apply_link || '',
            status: 'Saved',
            note: ''
        };
    }
    save('tracker', tracker);
    showJobs(sortJobs(currentJobs));
    showTracker();
}
function showTracker() {
    trackerList.innerHTML ='';
    const items = Object.values(tracker).filter(
        (entry) => statusFilter.value === 'All' || entry.status === statusFilter.value
    );
    if (items.length===0) {
        const empty =document.createElement('li');
        empty.textContent = 'Nothing here yet. Press Save on a job to track it .'
        trackerList.append(empty);
        return;
    }
    items.forEach((entry) => {
        const row = document.createElement('li');
        const heading = document.createElement('h3');
        heading.textContent = `${entry.title} . ${entry.company}`;
        const statusPick =document.createElement('select');
        STATUSES.forEach((s) => statusPick.add(new Option(s, s, false, s ===entry.status)));
        statusPick.addEventListener('change', ()  => {
            entry.status = statusPick.value;
            save('tracker', tracker);
            showTracker();
        });

        const note = document.createElement('input');
        note.placeholder =  'Add a note, e.g "emailed HR on Monday"'
        note.value = entry.note;
        note.addEventListener('change', () => {
            entry.note = note.value;
            save('tracker', tracker);
            
        });
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.textContent = 'Remove';
        remove.addEventListener('click', () => {
            delete tracker[entry.id];
            save('tracker',tracker);
            showTracker();
            showJobs(sortJobs(currentJobs));
        });
     row.append(heading, statusPick, note, remove);
     trackerList.append(row)
    });

}
function load (key, fallback) {
try{
 return JSON.parse(localStorage.getItem(key)) || fallback
} catch{
    return fallback;
}


}
function save (key, value){
    try{
        localStorage.setItem(key, JSON.stringify(value));
    }catch {

    }
}

showTracker();
currencySelect.addEventListener('change', () => showJobs  (sortJobs(currentJobs)));

async function loadRates() {
    try {
        const response = await fetch ('/api/rates');
        if(!response.ok) throw new Error ('Rate unavailable');
        rates = (await response.json()).rates;
    } catch (err) {
        console.error(err);
        currencySelect.disabled = true;
        currencySelect.title = 'Currency rates are unavailable right now '
    }
    }

loadRates();