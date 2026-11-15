# Manual test on current news

Run on 15 November 2026. 20 recent articles from BBC News RSS feeds, classified with both models. The BBC section an article was published in is taken as its true category.

| Section | Headline | Combined | DistilBERT | TF-IDF |
|---|---|---|---|---|
| business | [Beauty advent calendars can cost hundreds but are they value for money?](https://www.bbc.co.uk/news/articles/cqn83l442724o?at_medium=RSS&at_campaign=rss) | ✅ business (85%) | ✅ business (98%) | ✅ business (72%) |
| business | [How the Jensen Huang scandal created a headache for business-friendly Singapore](https://www.bbc.co.uk/news/articles/ck1exevgql4qo?at_medium=RSS&at_campaign=rss) | ✅ business (51%) | ❌ tech (77%) | ✅ business (79%) |
| business | [Microsoft says services fully restored after day-long global outage](https://www.bbc.co.uk/news/articles/c6rrg51rkz09o?at_medium=RSS&at_campaign=rss) | ❌ tech (96%) | ❌ tech (100%) | ❌ tech (93%) |
| business | [Why is Microsoft's outage lasting so long and will emails be lost?](https://www.bbc.co.uk/news/articles/cwvg238zrnm5o?at_medium=RSS&at_campaign=rss) | ❌ tech (100%) | ❌ tech (100%) | ❌ tech (100%) |
| entertainment | [Holly Humberstone: People can't connect to a pop star who's 'too polished'](https://www.bbc.co.uk/news/articles/cw77p7yj42k5o?at_medium=RSS&at_campaign=rss) | ✅ entertainment (99%) | ✅ entertainment (100%) | ✅ entertainment (99%) |
| entertainment | [Hannah Fry feels 'unbelievably lucky' after cervical cancer treatment](https://www.bbc.co.uk/news/articles/cw62p4n3n1xyo?at_medium=RSS&at_campaign=rss) | ✅ entertainment (84%) | ✅ entertainment (100%) | ✅ entertainment (68%) |
| entertainment | [Alleged Russell Brand rape victim wants age of consent law changed](https://www.bbc.co.uk/news/articles/cm3rgx9p583zo?at_medium=RSS&at_campaign=rss) | ✅ entertainment (56%) | ✅ entertainment (99%) | ❌ business (60%) |
| entertainment | [Brand, Walliams and MAFS: Is this a reckoning for the entertainment industry?](https://www.bbc.co.uk/news/articles/cqn70lz71lg8o?at_medium=RSS&at_campaign=rss) | ✅ entertainment (67%) | ✅ entertainment (100%) | ❌ politics (45%) |
| politics | [Minister backs legal right to job support for young people](https://www.bbc.co.uk/news/articles/cqr7gn1zmlj1o?at_medium=RSS&at_campaign=rss) | ✅ politics (86%) | ✅ politics (100%) | ✅ politics (72%) |
| politics | [UK ethics watchdog chief steps back from role over sexual misconduct claims](https://www.bbc.co.uk/news/articles/cmewv2kzq2e5o?at_medium=RSS&at_campaign=rss) | ✅ politics (91%) | ✅ politics (100%) | ✅ politics (82%) |
| politics | [Young people should have legal guarantee of job or training, Milburn tells BBC](https://www.bbc.co.uk/news/articles/c69vwp09d7vvo?at_medium=RSS&at_campaign=rss) | ✅ politics (76%) | ✅ politics (100%) | ✅ politics (52%) |
| politics | [Reform and Tory spokesmen in angry clash over immigration at Piddington](https://www.bbc.co.uk/news/articles/cr9d7y937n58o?at_medium=RSS&at_campaign=rss) | ✅ politics (99%) | ✅ politics (100%) | ✅ politics (99%) |
| sport | [Banton pushes case and bowlers sparkle for inconsistent England](https://www.bbc.co.uk/sport/cricket/articles/c8n50wgr6vd4o?at_medium=RSS&at_campaign=rss) | ✅ sport (99%) | ✅ sport (100%) | ✅ sport (98%) |
| sport | [McIlroy wins record-equalling eighth European title](https://www.bbc.co.uk/sport/golf/articles/c6kg7rwmz1g8o?at_medium=RSS&at_campaign=rss) | ✅ sport (100%) | ✅ sport (100%) | ✅ sport (99%) |
| sport | [Australia's Sayers 'took sandpaper from field' & rejects Cummins' claims](https://www.bbc.co.uk/sport/cricket/articles/c9ly4jm8djy7o?at_medium=RSS&at_campaign=rss) | ✅ sport (82%) | ✅ sport (100%) | ✅ sport (64%) |
| sport | [How Spain's humble superstar Simon became world's best keeper](https://www.bbc.co.uk/sport/football/articles/cqvg23nv0jw2o?at_medium=RSS&at_campaign=rss) | ✅ sport (99%) | ✅ sport (100%) | ✅ sport (99%) |
| tech | [Italy fines Meta €805m over accessing users' photos](https://www.bbc.co.uk/news/articles/cwn83gxemk35o?at_medium=RSS&at_campaign=rss) | ✅ tech (100%) | ✅ tech (100%) | ✅ tech (100%) |
| tech | [Microsoft says services fully restored after day-long global outage](https://www.bbc.co.uk/news/articles/c6rrg51rkz09o?at_medium=RSS&at_campaign=rss) | ✅ tech (96%) | ✅ tech (100%) | ✅ tech (93%) |
| tech | [Even Grand Theft Auto's original creators haven't been able to play GTA 6](https://www.bbc.co.uk/news/articles/c6jd7k5ryl1mo?at_medium=RSS&at_campaign=rss) | ✅ tech (97%) | ✅ tech (100%) | ✅ tech (95%) |
| tech | [How the Jensen Huang scandal created a headache for business-friendly Singapore](https://www.bbc.co.uk/news/articles/ck1exevgql4qo?at_medium=RSS&at_campaign=rss) | ❌ business (51%) | ✅ tech (77%) | ❌ business (79%) |

## Score

- **Combined:** 17 / 20 correct (85%)
- **DistilBERT:** 17 / 20 correct (85%)
- **TF-IDF:** 15 / 20 correct (75%)

Notes: this is a small, informal check. Some BBC stories sit between sections (for example a business story about a tech company), so a "wrong" answer can still be reasonable.
