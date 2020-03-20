const Apify = require('apify');

//const { log } = Apify.utils;
const sourceUrl = 'https://www.gov.uk/government/publications/covid-19-track-coronavirus-cases';
//const LATEST = 'LATEST';
//let check = false;

Apify.main(async () =>
{

    const input = {
        email: 'katacek@gmail.com'
    }
        
    //const { email } = await Apify.getValue('INPUT');
    const email = input.email
    
    //why opening request queue if I have just one page to scrape?
    //const requestQueue = await Apify.openRequestQueue();

    // how to open existing KVS?
    //const kvStore = await Apify.openKeyValueStore('COVID-19-POLAND');
    //const dataset = await Apify.openDataset('COVID-19-POLAND-HISTORY');

    console.log('Launching Puppeteer...');
    const browser = await Apify.launchPuppeteer();

    const page = await browser.newPage();

    await page.goto('https://www.gov.uk/government/publications/covid-19-track-coronavirus-cases');
    
    const trackCoronavirusCases = '#attachment_4077017 > div.attachment-details > h2 > a';
    await page.waitForSelector(trackCoronavirusCases);

    const trackCoronavirusCasesLink = await page.$eval(trackCoronavirusCases,el=>el.href);
    await page.goto(trackCoronavirusCasesLink);

    const totalCases = '#ember474 > svg > g.responsive-text-label > svg > text'
    const dailyConfirmed = '#ember475 > svg > g.responsive-text-label > svg > text'
    const patientsRecovered = '#ember469 > svg > g.responsive-text-label > svg > text'
    const deceased = '#ember476 > svg > g.responsive-text-label > svg > text' 

    const textTotal = await page.$eval(totalCases, el => el.textContent);
    const textDaily = await page.$eval(dailyConfirmed, el => el.textContent);
    const textRecovered = await page.$eval(patientsRecovered, el => el.textContent);
    const textDeceased = await page.$eval(deceased, el => el.textContent);

    const data = {
        total: textTotal,
        today: textDaily,
        recovered: textRecovered,
        deceased: textDeceased,
        sourceUrl,
        // to be added later
        //lastUpdatedAtApify: new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes())).toISOString(),
        //readMe: 'https://apify.com/vaclavrut/covid-pl',
    };
    console.log(data)
});

// Run the crawler and wait for it to finish.
//await crawler.run();







            

            // Compare and save to history
            // const latest = await kvStore.getValue(LATEST);
            // delete latest.lastUpdatedAtApify;
            // const actual = Object.assign({}, data);
            // delete actual.lastUpdatedAtApify;

            // if (JSON.stringify(latest) !== JSON.stringify(actual)) {
            //     log.info('Data did change :( storing new to dataset.');
            //     await dataset.pushData(data);
            // }

            // await kvStore.setValue(LATEST, data);
            // log.info('Data stored, finished.');

            // to have lovely public runs...
        //     await Apify.pushData(data);
        // },

        // This function is called if the page processing failed more than maxRequestRetries+1 times.
        // handleFailedRequestFunction: async ({ request }) => {
        //     console.log(`Request ${request.url} failed twice.`);
        // },
    

    // if there are no region data, send email, because that means something is wrong
    // const env = await Apify.getEnv();
    // if (check) {
    //     await Apify.call(
    //         'apify/send-mail',
    //         {
    //             to: email,
    //             subject: `Covid-19 PL from ${env.startedAt} failed `,
    //             html: `Hi, ${'<br/>'}
    //                     <a href="https://my.apify.com/actors/${env.actorId}#/runs/${env.actorRunId}">this</a> 
    //                     run had 0 regions, check it out.`,
    //         },
    //         { waitSecs: 0 },
    //     );
    // }
