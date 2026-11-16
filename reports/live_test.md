# Live test: real articles and edge cases

Run on 16 November 2026 against https://news-classifier.assetdesk-archive-20261016.workers.dev (the live site, through its /api).

## Real articles

**31 / 42 correct** (74%) on today's articles from BBC News, The Guardian and The Hindu. The section an outlet filed a story under is taken as its true category. 0 request(s) failed.

| Outlet | Correct |
|---|---|
| BBC | 12 / 15 |
| Guardian | 12 / 15 |
| The Hindu | 7 / 12 |

| Outlet | Section | Headline | Prediction | Also related |
|---|---|---|---|---|
| BBC | sport | [Cap fits as Robertson poised to take King Kenny's crown](https://www.bbc.co.uk/sport/football/articles/cjp3v5r9enp1o?at_medium=RSS&at_campaign=rss) | ✅ sport (100%) |  |
| BBC | sport | [Klopp says Infantino worse than Blatter](https://www.bbc.co.uk/sport/football/articles/cjr4gr2k41dxo?at_medium=RSS&at_campaign=rss) | ✅ sport (85%) | politics |
| BBC | sport | [Burnham urges caution on scrapping 3pm TV blackout](https://www.bbc.co.uk/sport/football/articles/c6jre22p3941o?at_medium=RSS&at_campaign=rss) | ✅ sport (93%) |  |
| BBC | politics | [UK lost more than it gained from Brexit, Burnham to say ahead of EU summit](https://www.bbc.co.uk/news/articles/crp3e1n5kezpo?at_medium=RSS&at_campaign=rss) | ✅ politics (96%) |  |
| BBC | politics | [UK will have 'voice' but no vote on EU food rules in Brexit reset](https://www.bbc.co.uk/news/articles/c6wy4l8nl42wo?at_medium=RSS&at_campaign=rss) | ✅ politics (73%) | business |
| BBC | politics | [Workers should get paid time off to train for crises, say peers](https://www.bbc.co.uk/news/articles/cq8j4yn1vjymo?at_medium=RSS&at_campaign=rss) | ✅ politics (86%) | tech |
| BBC | business | [Elon Musk joins 'Bring Jensen Back' campaign to reinstate the ex-Nvidia boss](https://www.bbc.co.uk/news/articles/cry49plv8v3go?at_medium=RSS&at_campaign=rss) | ❌ tech (54%) | business, politics |
| BBC | business | [Create more jobs for under-25s by cutting National Insurance, key report urges](https://www.bbc.co.uk/news/articles/c6p9dzmj514ko?at_medium=RSS&at_campaign=rss) | ✅ business (97%) |  |
| BBC | business | [Intel sued by investors after PC sales slump hits share price](https://www.bbc.co.uk/news/articles/cw62p42p288do?at_medium=RSS&at_campaign=rss) | ✅ business (90%) | tech |
| BBC | tech | [Elon Musk joins 'Bring Jensen Back' campaign to reinstate the ex-Nvidia boss](https://www.bbc.co.uk/news/articles/cry49plv8v3go?at_medium=RSS&at_campaign=rss) | ✅ tech (54%) | business, politics |
| BBC | tech | [Intel sued by investors after PC sales slump hits share price](https://www.bbc.co.uk/news/articles/cw62p42p288do?at_medium=RSS&at_campaign=rss) | ❌ business (90%) | tech |
| BBC | tech | [Suspected China spy linked to Nvidia's ex-boss left in 2025, Megaspeed says](https://www.bbc.co.uk/news/articles/cmdx1vpprk9vo?at_medium=RSS&at_campaign=rss) | ✅ tech (54%) | business |
| BBC | entertainment | [Russell Brand prison message denying rape 'appalling' and being investigated, No 10 says](https://www.bbc.co.uk/news/articles/cm9d7pe8y559o?at_medium=RSS&at_campaign=rss) | ❌ politics (61%) | entertainment |
| BBC | entertainment | [Brand moved from Wandsworth to category C prison, his wife confirms on podcast](https://www.bbc.co.uk/news/articles/cm7024p1ded3o?at_medium=RSS&at_campaign=rss) | ✅ entertainment (87%) |  |
| BBC | entertainment | [Tourette's film I Swear wins three Scottish Baftas](https://www.bbc.co.uk/news/articles/crgqx11wkzy8o?at_medium=RSS&at_campaign=rss) | ✅ entertainment (96%) |  |
| Guardian | sport | [French football head Philippe Diallo is shock contender to fight Infantino for Fifa job](https://www.theguardian.com/football/2026/nov/16/philippe-diallo-fifa-gianni-infantino-president-french-football-federation) | ❌ tech (50%) | sport |
| Guardian | sport | [Jay Shah re-elected unopposed as ICC chair after board clears way for bigger IPL](https://www.theguardian.com/sport/2026/nov/16/jay-shah-icc-chair-bigger-ipl-cricket) | ✅ sport (67%) | business, politics |
| Guardian | sport | [Moeen Ali warns England ‘cannot win the World Cup’ by sidelining Adil Rashid](https://www.theguardian.com/sport/2026/nov/16/moeen-ali-warns-england-world-cup-sidelining-adil-rashid) | ✅ sport (99%) |  |
| Guardian | politics | [Barristers could be barred from practice over use of rape myths, warns justice secretary](https://www.theguardian.com/law/2026/nov/16/barristers-barred-practice-rape-myths-russell-brand-trial) | ✅ politics (85%) |  |
| Guardian | politics | [Burnham pledges early intervention and ‘benefits backstop’ to tackle youth jobs crisis](https://www.theguardian.com/society/2026/nov/15/no-free-lunch-milburn-mcfadden-kuenssberg-uk-benefits-youth-unemployment-neet) | ✅ politics (71%) | business |
| Guardian | politics | [Andy Burnham to say Brexit ‘has not worked’ and he will sign new deal with EU](https://www.theguardian.com/politics/2026/nov/16/andy-burnham-brexit-has-not-worked-sign-new-deal-with-eu) | ✅ politics (69%) | business |
| Guardian | business | [Great Britain’s oldest renewables projects could rake in nearly £9bn next year](https://www.theguardian.com/business/2026/nov/16/great-britain-renewable-energy-subsidies-wind-solar) | ✅ business (94%) |  |
| Guardian | business | [Weakening UK electric vehicle targets would hurt car industry, ministers told](https://www.theguardian.com/environment/2026/nov/16/weakening-uk-electric-vehicle-targets-would-hurt-car-industry-ministers-told) | ❌ politics (51%) | business |
| Guardian | business | [Burnham pledges early intervention and ‘benefits backstop’ to tackle youth jobs crisis](https://www.theguardian.com/society/2026/nov/15/no-free-lunch-milburn-mcfadden-kuenssberg-uk-benefits-youth-unemployment-neet) | ❌ politics (71%) | business |
| Guardian | tech | [Elon Musk joins 165,000 others calling for Nvidia to bring back Jensen Huang in open letter](https://www.theguardian.com/technology/2026/nov/16/elon-musk-tech-execs-open-letter-jensen-huang-return-nvidia-ceo) | ✅ tech (59%) | business |
| Guardian | tech | [Apple MacBook Pro M6 review: probably the last of its generation](https://www.theguardian.com/technology/2026/nov/16/apple-macbook-pro-m6-review-battery-laptop) | ✅ tech (99%) |  |
| Guardian | tech | [160 questions, only one wrong: top scorer in South Korea tax exam admits AI cheating](https://www.theguardian.com/technology/2026/nov/15/ai-cheating-south-korea-college-entrance-exam) | ✅ tech (56%) | politics, business |
| Guardian | entertainment | [The Nice Ones review – invasion of the sunny personality snatchers](https://www.theguardian.com/film/2026/nov/16/the-nice-ones-review-peter-stylianou) | ✅ entertainment (80%) | tech |
| Guardian | entertainment | [‘Partly the movie’s fault I’m a writer at all’: why Wonder Boys is my feelgood movie](https://www.theguardian.com/film/2026/nov/16/wonder-boys-curtis-hanson-feelgood-movie) | ✅ entertainment (99%) |  |
| Guardian | entertainment | [Accidents, emotional affairs and impromptu Leonard Cohen dancing - My Wife Cries review](https://www.theguardian.com/film/2026/nov/16/my-wife-cries-review-angela-schanelec) | ✅ entertainment (83%) | tech |
| The Hindu | sport | [IND vs NZ Tests: WTC hopes, Gambhir’s credibility on the line](https://www.thehindu.com/sport/cricket/ind-vs-nz-tests-wtc-hopes-gambhirs-credibility-on-the-line/article71707787.ece) | ❌ tech (53%) | sport |
| The Hindu | sport | [IND vs NZ fifth ODI: Bowlers step up to lift India to 22-run win over NZ](https://www.thehindu.com/sport/cricket/india-vs-new-zealand-fifth-odi-in-mount-maunganui-on-november-15/article71703996.ece) | ✅ sport (84%) |  |
| The Hindu | sport | [Foxy and Carrina impress](https://www.thehindu.com/sport/races/horse-racing/article71707840.ece) | ❌ tech (83%) |  |
| The Hindu | business | [Rupee rises 27 paise to close at 93.92 against U.S. dollar](https://www.thehindu.com/business/Industry/rupee-rises-27-paise-to-close-at-9392-against-us-dollar/article71707732.ece) | ✅ business (97%) |  |
| The Hindu | business | [Stock markets end higher on foreign fund inflows, lower crude oil; Sensex up 512 points](https://www.thehindu.com/business/Industry/stock-markets-end-higher-on-foreign-fund-inflows-lower-crude-oil-sensex-up-512-points/article71707675.ece) | ✅ business (99%) |  |
| The Hindu | business | [Andhra’s proposed Investment Protection Act seeks to shield investors from policy U-turns](https://www.thehindu.com/elections/andhra-pradesh-assembly/andhras-proposed-investment-protection-act-seeks-to-shield-investors-from-policy-u-turns/article71707378.ece) | ❌ tech (41%) | business, politics |
| The Hindu | tech | [Jordan blocks Telegram app over national security concerns](https://www.thehindu.com/sci-tech/technology/jordan-blocks-telegram-app-over-national-security-concerns/article71707574.ece) | ✅ tech (94%) |  |
| The Hindu | tech | [UK regulator orders tougher action on child abuse material ahead of next year's social media ban](https://www.thehindu.com/sci-tech/technology/uk-regulator-orders-tougher-action-on-child-abuse-material-ahead-of-next-years-social-media-ban/article71707526.ece) | ✅ tech (99%) |  |
| The Hindu | tech | [Chip tensions loom over Trump-Xi summit, as US and China push AI safety steps](https://www.thehindu.com/sci-tech/technology/chip-tensions-loom-over-trump-xi-summit-as-us-and-china-push-ai-safety-steps/article71707485.ece) | ✅ tech (59%) | business, politics |
| The Hindu | entertainment | [‘Ramayana: Part 1’: Decoding the film’s massive budget and box-office performance](https://www.thehindu.com/entertainment/movies/ramayana-box-office-ramayana-part-1-yash-ranbir-kapoor-ramayana-sita-ramayana-budget-namit-malhotra/article71707320.ece) | ✅ entertainment (73%) | tech, business |
| The Hindu | entertainment | [Therukoothu workshop in Coimbatore: Learn the folk art form from seasoned artistes](https://www.thehindu.com/society/therukoothu-workshop-in-coimbatore-learn-the-folk-art-form-from-seasoned-artistes/article71697051.ece) | ❌ tech (84%) | business |
| The Hindu | entertainment | [Shillong Cherry Blossom Festival 2026: Nelly, Khalid, and Swae Lee headline two days of music](https://www.thehindu.com/entertainment/music/shillong-cherry-blossom-festival-2026-nelly-khalid-and-swae-lee-headline-two-days-of-music/article71692760.ece) | ❌ tech (55%) | entertainment |

## Edge cases

**20 / 21** returned the expected status code.

| Input | Status | Expected | Result |
|---|---|---|---|
| Empty text | ✅ 422 | 422 | Please paste a news article first. |
| Only spaces and newlines | ✅ 422 | 422 | Please paste a news article first. |
| 19 words (one short) | ✅ 422 | 422 | The text is too short (19 words). Paste at least 20 words of an article. |
| Exactly 20 words | ❌ 422 | 200 | The text is too short (19 words). Paste at least 20 words of an article. |
| Headline only, short | ✅ 422 | 422 | The text is too short (3 words). Paste at least 20 words of an article. |
| Very long article (truncated to 512 tokens) | ✅ 200 | 200 | sport (98%), truncated |
| Over 50,000 characters | ✅ 413 | 413 | The article is too long. Paste at most 50,000 characters. |
| ALL CAPS | ✅ 200 | 200 | sport (99%) |
| No punctuation, lowercase | ✅ 200 | 200 | sport (98%) |
| Emoji and symbols | ✅ 200 | 200 | sport (99%) |
| Pasted HTML | ✅ 200 | 200 | sport (98%) |
| Hindi (non-English) | ✅ 200 | 200 | entertainment (30%), related: business, sport, politics, tech |
| Mixed topic: politics + business | ✅ 200 | 200 | politics (68%), related: business |
| Not news: a recipe | ✅ 200 | 200 | business (66%), related: sport |
| Gibberish | ✅ 200 | 200 | tech (54%), related: business, entertainment, sport |
| Numbers only | ✅ 200 | 200 | sport (31%), related: business, entertainment, politics, tech |
| One word repeated | ✅ 200 | 200 | sport (99%) |
| Prompt injection text | ✅ 200 | 200 | sport (98%) |
| JSON-breaking characters | ✅ 200 | 200 | sport (99%) |
| GET on /predict | ✅ 405 | 405 |  |
| 300 KB raw upload | ✅ 413 | 413 |  |
