const Apify = require('apify');

//const { log } = Apify.utils;
const sourceUrl = 'https://www.gov.uk/government/publications/covid-19-track-coronavirus-cases';
const LATEST = 'LATEST';

Apify.main(async () =>
{

    const kvStore = await Apify.openKeyValueStore('COVID-19-UK');
    const dataset = await Apify.openDataset('COVID-19-UK-HISTORY');

    console.log('Launching Puppeteer...');
    const browser = await Apify.launchPuppeteer();

    const page = await browser.newPage();
    await Apify.utils.puppeteer.injectJQuery(page);

    console.log('Going to website...');
    await page.goto('https://www.gov.uk/government/publications/covid-19-track-coronavirus-cases');
    
    const trackCoronavirusCases = '#attachment_4077017 > div.attachment-details > h2 > a';
    await page.waitForSelector(trackCoronavirusCases);

    const trackCoronavirusCasesLink = await page.$eval(trackCoronavirusCases, el => el.href);
    // networkidle0 : wait for all page to load
    await page.goto(trackCoronavirusCasesLink), { waitUntil: 'networkidle0', timeout: 60000 };
   
    await page.waitForSelector('div.flex-fluid');
    await page.waitFor(4000);
 
    console.log('Getting data...');
    // page.evaluate(pageFunction[, ...args]), pageFunction <function|string> Function to be evaluated in the page context, returns: <Promise<Serializable>> Promise which resolves to the return value of pageFunction
    const result = await page.evaluate(() =>
    {

        const getInt = (x)=>{
            return parseInt(x.replace(' ','').replace(',',''))};
        const now = new Date();
        
        // eq() selector selects an element with a specific index number, text() method sets or returns the text content of the selected elements
        const totalInfected = $("text[vector-effect='non-scaling-stroke']").eq(0).text();
        const dailyConfirmed = $("text[vector-effect='non-scaling-stroke']").eq(1).text();
        const patientsRecovered = $("text[vector-effect='non-scaling-stroke']").eq(2).text();
        const deceased = $("text[vector-effect='non-scaling-stroke']").eq(3).text();
        const england = $("text[vector-effect='non-scaling-stroke']").eq(4).text();
        const scottland = $("text[vector-effect='non-scaling-stroke']").eq(5).text();
        const wales = $("text[vector-effect='non-scaling-stroke']").eq(6).text();
        const ireland = $("text[vector-effect='non-scaling-stroke']").eq(7).text();
        const data = {
            totalInfected: getInt(totalInfected),
            dailyConfirmed: getInt(dailyConfirmed),
            recovered: getInt(patientsRecovered),
            deceased: getInt(deceased),
            england: getInt(england),
            scottland: getInt(scottland),
            wales: getInt(wales),
            ireland: getInt(ireland),
            sourceUrl:'https://www.gov.uk/government/publications/covid-19-track-coronavirus-cases',
            lastUpdatedAtApify: new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes())).toISOString()
            //readMe: 'https://apify.com/vaclavrut/covid-pl',
        };
        return data;
    });       
    
    console.log(result)

    let latest = await kvStore.getValue(LATEST);
    if (!latest) {
        await kvStore.setValue('LATEST', data);
        latest = data;
    }
    delete latest.lastUpdatedAtApify;
    const actual = Object.assign({}, data);
    delete actual.lastUpdatedAtApify;

    if (JSON.stringify(latest) !== JSON.stringify(actual)) {
        await dataset.pushData(data);
    }

    await kvStore.setValue('LATEST', data);
    await Apify.pushData(data);


    console.log('Closing Puppeteer...');
    await browser.close();
    console.log('Done.');  
    
});










            

            // //Compare and save to history
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
    

    