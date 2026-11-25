<p align="center"><img src="docs/banner.svg" alt="JobPilot banner" width="100%"></p>

# ✈️ JobPilot

Job hunting means searching five websites, losing track of where you applied, and guessing what a salary in dollars means back home. **JobPilot** searches LinkedIn, Indeed, Glassdoor and more in one place, shows pay in your own currency, and keeps track of every job you apply for.

- 🌐 **Live app:** http://18.135.15.23
- 🎬 **Demo video:** https://youtu.be/RDO04eom7oo
- 👩🏽‍✈️ **Made by:** Fatima Samir

<br>

---

## ✨ Features

- 🔍 **Search and filter** by keyword, country, date posted, job type and remote only
- ↕️ **Sort** by best match, newest, highest salary (turned into a yearly amount so it's fair) or company A–Z
- 💱 **See salaries in your currency**: USD, RWF, KES, NGN, SDG, ETB, ZAR, GBP or EUR
- 🆕 **Friendly dates** like "Posted 3 days ago", plus a short summary of the results
- 📍 **Apply** and **Open in Google Maps** buttons on every job
- 📋 **My applications**: save a job and move it from Saved → Applied → Interview → Offer or Rejected. It stays saved in your browser.

<br>

---

## 🔌 APIs used

| API | What it does in JobPilot | Docs |
|---|---|---|
| JSearch by OpenWeb Ninja (RapidAPI) | Job listings from many job sites | [Docs](https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch) |
| ExchangeRate-API (open access) | Currency rates, saved for 24 hours | [Docs](https://www.exchangerate-api.com/docs/free) |
| Google Maps URLs | Office location links (no key needed) | [Docs](https://developers.google.com/maps/documentation/urls/get-started) |

**Built with:** Node.js, Express and dotenv on the server, plain HTML, CSS and JavaScript in the browser, and Figma for the design.

<br>

---

## 💻 Run it locally

You need **Node.js 20+**, **Git**, and a free **RapidAPI key** for JSearch (Basic plan).

```bash
git clone https://github.com/fmohamed-a11y/api-project.git
cd api-project
npm install
cp .env.example .env     # open .env and add your key: RAPIDAPI_KEY=your-key
node server.js
```

Then open **http://localhost:3000**. The key lives only in `.env`, and `.gitignore` keeps that file off GitHub.

<br>

---

## 🧭 How it works

```
Browser ──► Lb01 (HAProxy, round robin)
              ├──► Web01: Nginx ──► Node/Express ──┐
              └──► Web02: Nginx ──► Node/Express ──┼──► JSearch API
                                                   └──► ExchangeRate-API
```

The browser only talks to the load balancer. Both web servers run the same code and call the APIs themselves, so the API key never reaches the browser.

<br>

---

## 🚀 Deployment

| Server | Name | IP |
|---|---|---|
| Web01 | 7343-web-01 | 13.135.171.207 |
| Web02 | 7343-web-02 | 35.176.211.186 |
| Lb01 | 7343-lb-01 | 18.135.15.23 |

<br>

**1. Install and start the app (on Web01 and Web02).** PM2 keeps the app running and restarts it if it crashes or the server reboots.

```bash
sudo apt update && sudo apt install -y git nginx nano
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs
sudo npm install -g pm2
git clone https://github.com/fmohamed-a11y/api-project.git && cd api-project
npm install
pm2 start server.js --name jobpilot && pm2 save && pm2 startup
```

I copied my `.env` file to each server from my laptop, so the key never went through GitHub:

```bash
scp -i ~/.ssh/school .env ubuntu@13.135.171.207:~/api-project/.env
scp -i ~/.ssh/school .env ubuntu@35.176.211.186:~/api-project/.env
```

<br>

**2. Set up Nginx (on Web01 and Web02).** Nginx sends visitors on port 80 to the app, and adds an `X-Served-By` header so I can see which server answered. File: `/etc/nginx/sites-available/jobpilot`

```nginx
server {
    listen 80 default_server;
    add_header X-Served-By $hostname;
    location / { proxy_pass http://127.0.0.1:3000; }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/jobpilot /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

<br>

**3. Set up HAProxy (on Lb01).** It shares visitors between both servers in turn, and skips a server if its health check fails. Added to `/etc/haproxy/haproxy.cfg`:

```haproxy
frontend jobpilot_front
    bind *:80
    default_backend jobpilot_back

backend jobpilot_back
    balance roundrobin
    option httpchk GET /api/health
    server web-01 13.135.171.207:80 check
    server web-02 35.176.211.186:80 check
```

```bash
sudo haproxy -c -f /etc/haproxy/haproxy.cfg && sudo systemctl restart haproxy
```

<br>

**4. Test the load balancer.** The answers switch between the two servers:

```bash
for i in 1 2 3 4; do curl -sI http://18.135.15.23 | grep -i x-served-by; done
```

```
X-Served-By: 7343-web-01
X-Served-By: 7343-web-02
X-Served-By: 7343-web-01
X-Served-By: 7343-web-02
```

Then I opened http://18.135.15.23 and tested searching, sorting, changing the currency and saving a job.

<br>

---

## 🛡️ Error handling and security

- Clear messages for an empty search, a rejected key, too many requests, a slow API (10-second timeout), no internet, a broken response, or no results
- If the currency rates can't load, only the currency menu turns off and the rest of the app keeps working
- The API key stays on the server, every search value is checked before it's used, and job text is shown with `textContent` to block XSS

<br>

---

## 🧗 Challenges

- **Deployment was the hardest part.** SSH kept saying *Permission denied (publickey)* when I tried to log in to my servers. I made a new SSH key, added it to the intranet, and asked for new servers before it finally worked. After that, PM2 couldn't find my key because it was started from the wrong folder, so I learned to always check where I am before running a command.
- **JSearch changed its endpoint.** `/search` started returning 404. I logged the status code, switched to `/search-v2`, and checked the new response with curl.
- **Only 200 free requests a month.** So sorting, currency conversion and the tracker all run in the browser, and the exchange rates are saved for a day instead of being fetched every time.
- **Small typos, big bugs.** Writing `PARIME` instead of `PARTTIME` broke the job filters. Reading the terminal and the browser console (F12) helped me find bugs like this.

<br>

---

## 🙏 Credits

- [JSearch API](https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch) by OpenWeb Ninja: job data
- [Rates By Exchange Rate API](https://www.exchangerate-api.com): currency rates
- [Google Maps URLs](https://developers.google.com/maps/documentation/urls/get-started): location links
- [Express](https://expressjs.com) and [dotenv](https://github.com/motdotla/dotenv): server and settings
- [Google Fonts](https://fonts.google.com): Sora and DM Sans
- [Nginx](https://nginx.org), [HAProxy](https://www.haproxy.org) and [PM2](https://pm2.keymetrics.io): deployment
- [Figma](https://www.figma.com): design and pilot stickers
