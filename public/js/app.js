const sortSelect = document.getElementById('sort');
let currentJobs = [];
const form = document.getElementById('search-form');
const input = document.getElementById('search-input');
const statusText = document.getElementById('status');
const jobList = document.getElementById('job-list');
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
        showStatus(`Found ${jobs.length} jobs.`);
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

} function showJobs(jobs) {
    
        jobList.innerHTML ='';
        jobs.forEach((job) => {
        const item = document.createElement('li');
        item.className = 'job';

        const title = document.createElement('h3');
        title.textContent = job.job_title || 'Untitled job';

        const company = document.createElement('P');
        company.textContent = job.employer_name || 'Unknown company';

        const location = document.createElement('p');
        const place = job.job_location || [job.job_city, job.job_country].filter(Boolean).join(', ');
        location.textContent = job.job_is_remote ? `Remote${place ? ' . ' + place : ''}` : (place || 'Location not listed')

        const salary = document.createElement('p');
        salary.textContent = formatSalary(job);

        item.append(title, company, location, salary);

        if (job.job_apply_link) {
            const link = document.createElement('a');
            link.href = job.job_apply_link;
            link.textContent = "Apply";
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            item.append(link);
        }
        jobList.append(item);
    });
}
function formatSalary(job) {
    const min = job.job_min_salary;
    const max = job.job_max_salary;
    if (!min && !max) return 'Salary not listed';

    const period = (job.job_salary_period || 'year').toLowerCase();
    const fmt = (n) => n.toLocaleString();

    if (min && max) return `${fmt(min)}  -  ${fmt(max)} per ${period}`;
    return `${fmt(min || max)}  per ${period}`;

}
sortSelect.addEventListener('change', () =>  {
    showJobs(sortJobs(currentJobs));
});
