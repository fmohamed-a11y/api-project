<p align="center">
    <img src="docs/banner.svg" alt="JobPilot banner" width="100%">
</p>

# JobPilot ✈️

Job hunting means searching five websites, losing track of applications, and guessing what a salary in dollars means at home. **JobPilot** searches **LinkedIn, Indeed, Glassdoor and more** at once, shows pay **in your own currency**, and tracks every job you apply for.

- 🌐 **Live app:** `http://18.135.15.23/` 
- 🎬 **Demo video:** `<VIDEO_LINK>` 
- 👩🏽‍✈️ **Made by:** Fatima Samir

---

<img src="public/images/pilot-girl.png" align="right" width="120" alt="">

## ✨ Features

- 🔍 **Search and filter** by keyword, country, date posted, job type and remote only
- ↕️ **Sort** by newest, highest salary (converted to a yearly amount for fair comparison) or company
- 💱 **Salaries in your currency:** USD, RWF, KES, NGN, SDG, ETB, ZAR, GBP or EUR
- 🆕 **Posting dates** like "Posted 3 days ago", plus a results summary
- 📍 **Apply** and **Open in Google Maps** buttons on every job
- 📋 **My applications:** save jobs, set a status (Saved → Applied → Interview → Offer / Rejected) and add notes. Everything stays saved in your browser.

---

## 🔌 APIs used

| API | Used for | Documentation |
|---|---|---|
| **JSearch** by OpenWeb Ninja (RapidAPI) | Job listings (`/search-v2`) | [Docs](https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch) |
| **ExchangeRate-API** | Currency rates, cached for 24 hours | [Docs](https://www.exchangerate-api.com/docs/free) |
| **Google Maps URLs** | Office location links (no key) | [Docs](https://developers.google.com/maps/documentation/urls/get-started) |

**Built with:** Node.js, Express and dotenv on the server · HTML, CSS and JavaScript in the browser · designed in Figma.

---

## 💻 Run it locally

You need **Node.js 20+**, **Git**, and a free **RapidAPI key** for JSearch (Basic plan).

```bash
git clone https://github.com/fmohamed-a11y/api-project.git
cd api-project
npm install
cp .env.example .env        # open .env and add: RAPIDAPI_KEY=your-key
node server.js
```

Open **http://localhost:3000**. The key stays in `.env`, which `.gitignore` keeps off GitHub.

---

<img src="public/images/pilot-cat.png" align="right" width="100" alt="">

## 🧭 How it works

```
Client (browser) ──► Internet ──► Lb01 (HAProxy, round robin)
                                     ├──► Web01: Nginx ──► Node/Express ──┐
                                     └──► Web02: Nginx ──► Node/Express ──┤
                                                                          ├──► JSearch API
                                                                          └──► ExchangeRate-API
```

The browser only talks to the load balancer. Both web servers run the same code and call the APIs themselves, so **the API key never reaches the browser**.

---

<img src="public/images/pilot-briefcase.png" align="right" width="85" alt="">

## 🚀 Deployment

> *Replace `WEB01_IP`, `WEB02_IP` and `LB01_IP` with the real addresses.*

**1. Web01 and Web02: install and start the app.** PM2 keeps it running and restarts it if it crashes.
```bash
sudo apt update && sudo apt install -y git nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs
sudo npm install -g pm2
git clone https://github.com/fmohamed-a11y/api-project.git && cd api-project
npm install
cp .env.example .env && nano .env      # add the API key on each server
pm2 start server.js --name jobpilot && pm2 save
```

**2. Web01 and Web02: Nginx.** It forwards port 80 to the app and labels each response with the server's name. Put this in `/etc/nginx/sites-available/jobpilot`:
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

**3. Lb01: HAProxy.** It shares visitors between both servers and skips any server that fails its health check. Add this to `/etc/haproxy/haproxy.cfg`:
```
frontend jobpilot_front
    bind *:80
    default_backend jobpilot_back

backend jobpilot_back
    balance roundrobin
    option httpchk GET /api/health
    server web-01 WEB01_IP:80 check
    server web-02 WEB02_IP:80 check
```
```bash
sudo haproxy -c -f /etc/haproxy/haproxy.cfg && sudo systemctl restart haproxy
```

**4. Test the load balancer.** The answers should alternate between `web-01` and `web-02`:
```bash
for i in 1 2 3 4; do curl -sI http://LB01_IP | grep -i x-served-by; done
```
Then open `http://LB01_IP` and try searching, sorting, changing the currency and saving a job.

---

## 🛡️ Error handling and security

- Clear messages for an empty search, a wrong key, the request limit, a slow API (10-second timeout), no internet, a broken response, or no results
- If the currency rates fail, only the currency menu switches off, and the rest of the app keeps working
- The API key stays on the server, every search value is checked against an allow-list, and job text is shown with `textContent` to block XSS

---

## 🧗 Challenges

> *Rewrite in your own words.*

- **JSearch moved its endpoint.** `/search` returned a 404. I logged the status code, switched to `/search-v2`, and checked the new response with `curl`.
- **Hiding the API key.** I built an Express server that calls the API, so the browser never sees the key.
- **Only 200 free requests a month.** Sorting, currency conversion and the tracker run in the browser, and the exchange rates are cached for a day.
- **Small typos, big bugs.** `PARIME` instead of `PARTTIME` broke the job filters. Reading the terminal and the browser console (F12) helped me find bugs like this.

---

<img src="public/images/pilot-waving.png" align="right" width="95" alt="">

## 🙏 Credits

- [JSearch API](https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch) by OpenWeb Ninja: job data
- [Rates by Exchange Rate API](https://www.exchangerate-api.com): currency rates
- [Google Maps](https://www.google.com/maps): location links
- [Express](https://expressjs.com/) and [dotenv](https://github.com/motdotla/dotenv): server and settings
- [Google Fonts](https://fonts.google.com/): Sora and DM Sans
- [Nginx](https://nginx.org/), [HAProxy](https://www.haproxy.org/) and [PM2](https://pm2.keymetrics.io/): deployment
- Figma: design and pilot stickers

<p align="center"><b>JobPilot</b> · Made by Fatima Samir · A little courage. A lot of possibility. 💜</p>
