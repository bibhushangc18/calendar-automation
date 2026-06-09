const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

//lookup table 
const nepaliMonths = {
    1: "Baisakh", 2: "Jestha", 3: "Asadh", 4: "Shrawan", 
    5: "Bhadra", 6: "Ashwin", 7: "Kartik", 8: "Mangsir", 
    9: "Poush", 10: "Magh", 11: "Falgun", 12: "Chaitra"
};

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

test.use({ 
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' 
});

test('Automate Hamro Patro 2083 Calendar - Full Dates Format', async ({ page }) => {
    test.setTimeout(120000); 

    const reportData = [];
    const year = 2083;

    console.log(` Starting calendar automation for year ${year} B.S...`);

    for (let month = 1; month <= 12; month++) {
        const targetUrl = `https://www.hamropatro.com/calendar/${year}/${month}`;
        console.log(` Reading Month: ${nepaliMonths[month]}`);
        
        await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('.calendar .dates', { timeout: 10000 });
        await page.waitForTimeout(1000); 

        const validDayLocator = page.locator('.calendar .dates li[id]:not([id="0"])');
        const totalDays = await validDayLocator.count();

        if (totalDays === 0) {
            console.log(` Could not find days for ${nepaliMonths[month]}. Skipping...`);
            continue;
        }

        const lastDayCell = validDayLocator.nth(totalDays - 1);
        
        // 1. Get the full English Date String (e.g., "2026-5-14")
        const fullEnglishDate = await lastDayCell.getAttribute('id'); 

        // 2. Format the Month string to always have 2 digits (e.g., "1" becomes "01")
        const formattedNepaliMonth = month < 10 ? `0${month}` : `${month}`;
        
        // 3. Create the Full Nepali Date string (YYYY-MM-DD format)
        const fullNepaliDate = `${year}-${formattedNepaliMonth}-${totalDays}`;

        // 4. Generate the accurate Day Name using JavaScript's Date Engine
        const dateObject = new Date(fullEnglishDate);
        const weekdayName = dayNames[dateObject.getDay()];

        reportData.push({
            monthName: nepaliMonths[month],
            totalDays: totalDays,
            lastDateIndex: totalDays, 
            lastDay: weekdayName,
            nepaliFullDate: fullNepaliDate,      
            englishFullDate: fullEnglishDate    
        });
    }

    // BUILD EXCEL ROWS
    const spreadsheetRows = [];
    const headers = ['Month Name', 'Total Days', 'Last Date', 'Last Day', 'Nepali Last Date', 'English Last Date'];
    spreadsheetRows.push(headers.join(','));

    for (const row of reportData) {
        const rowValues = [
            row.monthName,
            row.totalDays,
            row.lastDateIndex,     // Simple day number count
            `"${row.lastDay}"`,    // Day Name
            row.nepaliFullDate,    // FULL NEPALI DATE (2083-01-31)
            row.englishFullDate    // FULL ENGLISH DATE (2026-05-14)
        ];
        spreadsheetRows.push(rowValues.join(','));
    }

    const filePath = path.join(__dirname, 'HamroPatro_2083_Full_Report.csv');
    fs.writeFileSync(filePath, spreadsheetRows.join('\n'), 'utf8');
    
    console.log(`\n SUCCESS! Full Date Excel report saved at:\n  ${filePath}\n`);
    console.table(reportData);
});