const entries = ({ reason, confidence = "high", words }) =>
  words
    .trim()
    .split(/\s+/)
    .map((word) => ({ word, reason, confidence }));

export const englishPolicyFindingsPart1 = [
  ...entries({
    reason: "personal-name",
    words: `
        Roy Tim Brad Carl Eric Gary Jeff Joan Joel Luke Matt Neil Nick Pete
        Phil Tony Troy Allen Billy Bruce Carol Chris Craig Diana Diego Elvis
        Emily Harry Helen Henry Jacob James Jamie Janet Jason Jerry Jimmy
        Julia Julie Kelly Kevin Larry Laura Linda Louis Maria Mario Peter
        Ralph Randy Sarah Scott Simon Steve Susan Terry Tommy Tyler Wayne
        Wendy Albert Andrew Arnold Carlos Dennis Donald Joseph Justin Monica
        Pierre Antonio Jessica Michael Benjamin
      `,
  }),
  ...entries({
    reason: "identity-or-demonym",
    words:
      "Arab Irish Latin Roman Swiss Arabic Norwegian Australian Portuguese",
  }),
  ...entries({
    reason: "place-name",
    words: `
        Francisco Hampshire Lancaster Nashville Newcastle Rochester Tennessee
        Birmingham Manchester Montgomery
      `,
  }),
  ...entries({
    reason: "brand-or-product",
    words: "Mac Java Jeep Spam Zoom Canon Excel Gamespot",
  }),
  ...entries({
    reason: "software-or-web-jargon",
    words: `
        Admin Login Proxy Browser Database Internet Protocol Permalink Trackback
        Webmaster Repository Programming
      `,
  }),
  ...entries({
    reason: "legal-or-regulatory",
    words: `
        Law Laws Court Judge Legal Trial Copyright Liability Testimony Trademark
        Regulation Legislative Regulations
      `,
  }),
  ...entries({
    reason: "medical-or-body-health",
    words: `
        Acid Cure Dose Gene Blind Liver Pulse Health Genetic Genetics Screening
        Substance Prescribed Bandage
      `,
  }),
  ...entries({
    reason: "gambling-alcohol-drug-or-game-adjacent",
    words:
      "Ace Pub Card Cards Drink Joint Prize Smoke Wines Arcade Drinks Tournament",
  }),
  ...entries({
    reason: "weapon-violence-or-military",
    words: "Arms Hunt Raid Shot Tank Blast Force Guard Shots Squad",
  }),
  ...entries({
    reason: "religious-occult-or-spiritual",
    words: "Halo Soul Fairy Magic Angels Belief Bishop Spirit Spirits",
  }),
  ...entries({
    confidence: "medium-high",
    reason: "awkward-rare-industrial-or-url-unfriendly",
    words: `
        Linencloth Rugmat Loomband Threader Ewer Knapkin Outhouse Mossy
        Leafmold Forklift
      `,
  }),
  ...entries({
    reason: "second-pass-personal-name-or-surname",
    words: `
        Jean Kent Clark Lewis Moore Edward George Gordon Harris Howard Johnny
        Martin Morgan Morris Murray Norman Oliver Ronald Samuel Sharon Steven
        Stuart Walter Wilson Anthony Charles Charlie Douglas Francis Leonard
        Matthew Patrick Raymond Richard Russell Stanley Stephen Timothy Vincent
        William Winston Anderson Franklin Jonathan Lawrence Margaret Marshall
        Michelle Mitchell Nicholas Victoria Charlotte
      `,
  }),
  ...entries({
    reason: "second-pass-place-name-overlap",
    words: "Durham Madison Hampton Brighton Hamilton Kingston Stanford",
  }),
  ...entries({
    reason: "second-pass-place-demonym-or-language",
    words: `
        Dutch French German Jersey African British England English Holland
        Italian Memphis Newport Oakland Spanish American Arkansas Brooklyn
        Canadian Carolina European Maryland Portland Cleveland
      `,
  }),
  ...entries({
    reason: "second-pass-software-web-or-network-jargon",
    words: `
        Plugin Server Upload Network Website Username Websites Antivirus
        Databases Networking Client Clients Script Scripts Socket Packet
      `,
  }),
  ...entries({
    reason: "second-pass-brand-or-personal-name",
    words: "Mercedes",
  }),
  ...entries({
    reason: "second-pass-legal-political-or-civic",
    words: `
        Tax Mayor State Voted Votes Courts Empire Nation Patent Permit Police
        Policy Treaty Justice License Senator Contract Governance
      `,
  }),
  ...entries({
    reason: "second-pass-body-part-or-medical",
    words:
      "Arm Ear Eye Foot Bone Skin Brain Heart Hearts Mouth Finger Muscle Nurses",
  }),
  ...entries({
    reason: "second-pass-adult-military-or-tobacco",
    words: "Kiss Navy Smoking",
  }),
  ...entries({
    confidence: "medium-high",
    reason: "second-pass-generated-place-like-or-awkward-compound",
    words: `
        Alderbowl Rosehill Brightleaf Softleaf Redleaf Stillwater Whiskbroom
        Hearthrug
      `,
  }),
  ...entries({
    reason: "third-pass-personal-name-surname-or-title",
    words: `
        Armstrong Britney Campbell Captain Carter Chairman Clinton Commissioner
        Dean Duke Edwards Harrison Helena Jackson Jefferson Johnson Katrina
        Kennedy King Lincoln Madonna Murphy Nelson Newton Prince Princess Queen
        Rachel Roberts Robinson Simpson Solomon Taylor Thomas Thompson Tiffany
        Williams
      `,
  }),
  ...entries({
    reason: "third-pass-place-demonym-or-institution",
    words: `
        Americans Angeles Atlantic Berkeley Botswana Bristol Broadway Columbus
        Florence Harvard Illinois Indians Latinas Missouri Montana Montreal
        Norfolk Oklahoma Ontario Pacific Salvador Scottish Vienna Wyoming
      `,
  }),
  ...entries({
    reason: "third-pass-brand-platform-or-product",
    words: `
        Acrobat Apache Beatles Chrome Dealtime Dell Epinions Ericsson Gamecube
        Jelsoft Medline Olympic Olympus Outlook Python Safari Siemens Solaris
        Toshiba Windows
      `,
  }),
  ...entries({
    reason: "third-pass-software-web-hardware-or-network-jargon",
    words: `
        Blogging Boolean Bookmark Browsing Coding Compiler Console Desktops
        Domains Download Downloaded Ecommerce Encoding Filename Firewall
        Identifier Interface Keyboard Laptops Modules Offline Online Password
        Pixels Processor Processors Router Runtime Scanner Screenshot
        Screenshots Slideshow Startup Syntax Tablet Toolbar Variable Variables
        Virtual Widescreen Wireless
      `,
  }),
  ...entries({
    reason: "third-pass-medical-body-or-anatomy",
    words: `
        Bacteria Body Disorder Eyes Face Feet Fingers Genes Hair Hand Hands Head
        Heads Healing Healthy Hearing Leg Legs Neck Nose Nursing Nutrition
        Physiology Protein Receptor Shoulder Sodium Teeth Throat Thumbs Tongue
        Vitamin Wellness
      `,
  }),
  ...entries({
    reason: "third-pass-legal-political-civic-or-finance",
    words: `
        Advocacy Advocate Attorney Attorneys Authority Authorities Banking
        Campaigns Candidate Candidates Capital Capitol Census Citizen Citizens
        Civil Civilian Coalition Commission Committee Committees Commonwealth
        Compliance Consent Contracts Counsel Council Countries Counties County
        Declaration Defendant Dispute Divorce Elected Evidence Federal Finance
        Financial Financing Immigration Inflation Invest Investing Investment
        Investments Investor Investors Judges Judgment Judicial Liable Licence
        Licensed Licensing Mortgage Mortgages Municipal Nations Obligation
        Obligations Passport Patents Payday Penalty Pension Permits Petition
        Policies Poverty Province Refinance Regulatory Rights Securities States
        Statute Trials Voting Welfare Witness
      `,
  }),
  ...entries({
    reason: "third-pass-military-violence-death-or-threat",
    words: `
        Boxing Cemetery Command Conflict Defence Defense Emergency Funeral
        Hunter Martial Nuclear Rocket Shield Suspect Trigger Veteran
      `,
  }),
  ...entries({
    reason: "third-pass-adult-dating-or-relationship",
    words:
      "Bride Bridal Engaged Husband Married Marriage Spouse Wedding Weddings",
  }),
  ...entries({
    reason: "third-pass-religion-occult-myth-or-celestial",
    words: `
        Beliefs Dragon Earth Genesis Gnome Mars Mercury Moon Parish Titans
        Trinity Wizard Worship
      `,
  }),
  ...entries({
    reason: "fourth-pass-proper-name-title-religion-or-place",
    words: `
        Abbas Abbasi Abbassi Abbacy Abbatial Abbatical Abbess Abbey Abbot
        Abbotcy Abbotship Abdal Abdest Abelite Abhiseka Abigail Abaton Junior
        Senior Professor Secretary Victor Victorian
      `,
  }),
  ...entries({
    reason: "fourth-pass-medical-body-anatomy-or-biology",
    words: `
        Abasia Abasic Abdomen Abdominal Abducens Abducent Abductor Abenteric
        Abiogeny Abiology Abiosis Biology Biological Calcium Cognitive Mental
        Molecular Oxygen Plasma Tissue Stroke
      `,
  }),
  ...entries({
    reason: "fourth-pass-legal-crime-violence-military-or-negative",
    words: `
        Abacinate Abaction Abactor Abatis Abatised Abattoir Abduct Abduction
        Abet Abetment Abettal Abettor Abhor Abhorrent Abhorrer Abhorring
        Abigeat Abigeus Abatement Abatable Abator Abeyance Abeyant Capture
        Commander Forces Struck
      `,
  }),
  ...entries({
    reason: "fourth-pass-legal-political-civic-or-finance",
    words: `
        Account Accounting Admission Admissions Advisor Amendment Amendments
        Charter Claim Claimed Claims Clearance Commons Constitutes Contracting
        Contractor Contractors Credit Debate Disclosure District Donation
        Donations Economic Economics Fiscal Income Labor Lease Loan Loans Money
        National Nationwide Officer Officers Official Officials Opposition
        Payments Permitted Poll Price Prices Profit Property Provincial Rebate
        Redeem Reform Refund Registry Rent Rental Resident Residents Revenue
        Revenues Salary Saving Township Trade Trader Trading Transaction
        Transactions Treasury Union Unions United Valuation Wage Wages Wealth
      `,
  }),
  ...entries({
    reason: "fourth-pass-adult-dating-or-relationship",
    words: "Love Loving Partner Partners Relationship",
  }),
  ...entries({
    reason: "fourth-pass-software-web-hardware-platform-or-product-jargon",
    words: `
        Adapter Application Applications Archive Array Backup Benchmark Binary
        Broadband Buffer Bytes Camcorder Cartridge Chat Click Clone Code Codes
        Compile Computing Configure Connector Controller Converter Data Delete
        Device Directory Domain Edit Editor Encryption Error Errors Export File
        Files Filter Filtering Finder Font Graphics Header Host Hosted Hosts
        Import Index Inkjet Inline Input Keywords Laptop Layout Link Linked
        Links Loaded Logged Lookup Macro Matrix Messaging Messenger Micro
        Mobile Module Networks Node Nodes Notion Output Package Packages
        Parameter Parameters Platform Playlist Plug Portal Prefix Printer
        Printers Printing Profile Profiles Program Programs Protocols Query
        Receiver Recorder Register Reload Remote Reset Scanning Search Searches
        Security Sensor Serial Settings Setup Snapshot Source Spec Specs Static
        Status Streaming Switch Sync System Tech Technical Technician
        Technologies Technology Template Templates Terminal Thumbnail Thumbnails
        Timeline Track Tracking Uploaded User Users Utilities Validation Vector
        Verified Version Versions Wallpaper Web Wiring
      `,
  }),
  ...entries({
    confidence: "medium-high",
    reason: "fourth-pass-rare-generated-looking-or-specialist",
    words: `
        Abac Abacate Abacay Abaciscus Abacist Abactinal Abaculus Abaff
        Abaisance Abaiser Abaissed Abampere Abandonee Abask Abature Abave
        Abaxial Abaxile Abaze Abbacomes Abcoulomb Abdat Abdicable Abdicant
        Abdicator Abditive Abditory Abear Abearance Abecedary Abed Abeigh
        Aberrance Aberrancy Aberrate Aberrator Abey Abeyancy Abfarad Abhenry
        Abietate Abietene Abietic Abietin Abietinic Abilao Abilla Abilo
      `,
  }),
  ...entries({
    reason: "fifth-pass-negative-shame-fear-or-disaster",
    words: `
        Abandon Abandoned Abandoner Abase Abased Abasedly Abasement Abaser
        Abash Abashed Abashedly Abashment Aberrant Afraid Chaos Cheat Cheats
        Collapse Complaint Denied Deviant Dying Flood Forced Hurt Invalid
        Missing Problem Shock Stress Struggle Tension Trouble Unemployment
      `,
  }),
  ...entries({
    reason: "fifth-pass-legal-finance-regulatory-commerce",
    words: `
        Accounts Advisory Amend Amended Applicant Applicants Appointed
        Appointment Approval Approved Assessed Assessment Auction Auctions Audit
        Authorized Bank Banks Billing Bills Broker Brokers Budget Cash
        Certificate Certificates Certified Charge Charged Charges Checkout
        Confidential Credits Currency Deposit Discount Discounted Discounts
        Dollar Dollars Donate Earnings Economy Equity Estate Exchange Exchanges
        Expenditure Expenditures Expense Expenses Executive Executives Fund
        Funded Funding Funds Grant Granted Grants Guarantee Guaranteed Insurance
        Invoice Leasing Lending Ledger Market Marketing Marketplace Markets Pay
        Payable Paying Payment Payroll Pays Permission Privacy Purchase
        Purchases Purchasing Receipt Registered Registration Rentals Reseller
        Retail Retailer Retailers Savings Sponsor Sponsored Sponsors
        Sponsorship Stock Stocks Trademarks Vendor Vendors
      `,
  }),
  ...entries({
    reason: "fifth-pass-software-web-hardware-or-media",
    words: `
        Activation Adapters Clicking Computer Computers Desktop Devices Digital
        Directories Hosting Indexed Installation Installed Installing Keyword
        Linking Loading Logging Navigation Notification Notified Notify
        Programme Projector Routing Satellite Simulation Site Sites Syndication
        Systems Telecom Telephone Television Tracker Tutorial Tutorials Typing
        Upgrade Utility Video Videos Voltage Wired
      `,
  }),
  ...entries({
    reason: "fifth-pass-medical-body-or-health",
    words: `
        Cell Cells Cellular Chemical Chemistry Diet Digest Exercise Exercises
        Fitness Fluid Gauze Infant Lab Labs Laboratories Physical Recovery
        Rescue Supplement Supplements Temperature Temperatures
      `,
  }),
  ...entries({
    reason: "fifth-pass-identity-title-proper-brand-or-place",
    words:
      "Costa Eve Frank Hong Knight Miller Omega Parker San Sierra Sigma Thomson",
  }),
  ...entries({
    reason: "fifth-pass-adult-relationship-religion-royalty-or-alcohol",
    words: `
        Couple Couples Engage Engagement Partnership Partnerships Singles Ceremony
        Eternal Paradise Royal Royalty Yoga Ciderkin
      `,
  }),
  ...entries({
    reason: "sixth-pass-malformed-fragment-or-rare-specialist",
    words: `
        Alt Ave Biz Cal Cam Der Eco Geo Int Las Mins Misc Mon Non Pre Pro Ref
        Reg Rom Sub Temp Tue Abduce Abelmosk
      `,
  }),
  ...entries({
    reason: "sixth-pass-legal-finance-commerce-or-regulatory",
    words: `
        Asset Assets Bidding Buyer Buyers Buying Cents Commercial Compensation
        Corporation Cost Costs Coupon Dealer Merchant Merchants Procurement
        Supplier Suppliers Wholesale Advertiser Advertising Affiliate Affiliated
        Affiliates Bestsellers Businesses Merchandise Abater Abdicate
        Classified Classifieds Federation Headquarters Independence Institution
        Institutions Intervention Negotiations Officially Prohibited
        Restrictions Termination Territory University Universities
      `,
  }),
  ...entries({
    reason: "sixth-pass-software-web-hardware-or-media",
    words: `
        Audio Automation Broadcast Broadcasting Calculator Connectivity Demo
        Developer Developers Disc Discs Disk Electrical Electronic Electronics
        Fax Framework Function Functions Headset Icon Image Images Interactive
        Logo Logos Memo Monitoring Net Newsletter Newsletters Optimization Phone
        Phones Photo Photos Processing Publication Publications Publisher
        Publishers Publishing Ringtone Ringtones Screen Soundtrack Subscribe
        Subscriber Transmission Verification
      `,
  }),
  ...entries({
    reason: "sixth-pass-sports-games-or-competition",
    words: `
        Athletics Basketball Bowling Championship Chess Competition Competitions
        Competitive Contest Contests Football Game Games Golf Hockey Polo Rugby
        Score Scored Scores Scoring Soccer Softball Sporting Tennis
      `,
  }),
  ...entries({
    reason: "sixth-pass-identity-sensitive",
    words: `
        Boy Boys Female Gender Girl Girls Identity Lady Ladies Male Males Men
        Minor Minority Woman Women Youth
      `,
  }),
  ...entries({
    reason: "sixth-pass-medical-science-industrial-or-negative-threat",
    words: `
        Acute Aging Birth Engineering Hydrogen Industrial Industries Manufacture
        Manufacturer Mathematics Mathematical Mechanical Petroleum Pipeline
        Pollution Sciences Scientific Scientist Scientists Alarm Alert Broken
        Chase Concerned Confusion Criticism Difficult Difficulty Disclaimer
        Expensive Survival Suspension Targeted Unavailable Consequences
      `,
  }),
  ...entries({
    reason: "seventh-pass-proper-calendar",
    words:
      "April August February Friday July June Monday November September Sunday Thursday Wednesday",
  }),
  ...entries({
    reason: "seventh-pass-finance-commerce-legal-or-corporate",
    words: `
        Bid Bidder Bids Bond Bonds Bonus Bucks Buy Coin Coins Paid Penny Sale
        Sales Sell Seller Sellers Selling Sold Priced Prepaid Share Shared
        Shares Wishlist Agreement Agreements Companies Comply Consumers
        Corporate Customers Employee Employees Employer Employers Employment
        Enterprise Franchise Personnel Proprietary Owner Owners Ownership
        Possession
      `,
  }),
];
