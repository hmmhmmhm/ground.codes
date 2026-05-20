const entries = ({ reason, confidence = "high", words }) =>
  words
    .trim()
    .split(/\s+/)
    .map((word) => ({ word, reason, confidence }));

export const AGENT_REVIEWED_POLICY_FINDINGS = {
  english: [
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
    ...entries({
      reason: "seventh-pass-software-web-media-or-hardware",
      words: `
        Access Archived Archives Component Deployment Messages Migration
        Operating Operation Operations Operational Operators Photograph
        Photographer Photographic Photography Previews Prompt Printable Prints
        Recording Recordings Release Released Releases Revision Screens
        Searching Sessions Submit Submitted Submission Submissions Toner
        Transfer Transfers Transferred Update Updated Updates Updating Viewer
        Analog Antenna Camera Engine Engines Generator Handheld Laser Machine
        Machines Optics Radar Radio Stereo
      `,
    }),
    ...entries({
      reason: "seventh-pass-identity-family-medical-or-industrial",
      words: `
        Baby Father Guy Mom Moms Mother Native Oriental Parent Parents Parenting
        Race Sister Son Tribal Tribe Uncle Imaging Procedure Procedures
        Substances Diesel
      `,
    }),
    ...entries({
      reason: "seventh-pass-malformed-fragment",
      words: "Gonna Lite Thats Wanna",
    }),
    ...entries({
      reason: "eighth-pass-proper-calendar-or-civic",
      words: "May Tuesday Saturday Country Ward",
    }),
    ...entries({
      reason: "eighth-pass-adult-dating-sports-or-identity",
      words: `
        Date Dated Dates Single Athletic Baseball Sport Sports Females Guys
        Mothers Seniors Sisters Womens
      `,
    }),
    ...entries({
      reason: "eighth-pass-software-web-media-or-hardware",
      words: `
        Cameras Editing Edited Graphic Imports Imported Install Media Message
        Monitor Preview Print Printed Publish Published Record Recorded Records
        Scan Session Switches Switching Tracked Tracks
      `,
    }),
    ...entries({
      reason: "eighth-pass-finance-commerce-corporate-or-negative",
      words: `
        Cent Company Consumer Coupons Customer Dealers Earn Earned Enterprises
        Pricing Properties Sells Subscription Alerts Concern Concerning
        Concerns Targets
      `,
    }),
    ...entries({
      reason: "ninth-pass-proper-calendar",
      words: "January March October December",
    }),
    ...entries({
      reason: "ninth-pass-software-web-technical-or-science",
      words: `
        Battery Charger Circuit Commands Compilation Compressed Compression
        Electro Electron Embedded Equation Equations Formula Forum Forums Integer
        Lambda Particle Particles Physics Quantum Science Silicon Statistics
        Statistical Transmitted
      `,
    }),
    ...entries({
      reason: "ninth-pass-finance-commerce-corporate-or-education",
      words: `
        Agencies Agency Business Charity Commerce Occupation Profession
        Recruiting Recruitment Syndicate Tuition Workforce Workplace
      `,
    }),
    ...entries({
      reason: "ninth-pass-violence-legal-user-hostile-or-malformed",
      words: "Execute Executed Abashless Aalii Abas",
    }),
    ...entries({
      reason: "tenth-pass-finance-corporate-legal-or-software-security",
      words: `
        Advertise Corp Florin Premium Proceedings Signature Signed Signing
        Unsigned Browse Default Moderator Podcast Secure Valid Verify Kingdom
      `,
    }),
    ...entries({
      reason: "tenth-pass-title-identity-family",
      words: `
        Agent Agents Brother Chief Director Directors Engineer Engineers Family
        Families Man Manager Principal Professional Supervisor
      `,
    }),
    ...entries({
      reason: "tenth-pass-function-word-or-malformed-fragment",
      words: `
        Abeam Abaft Aback About Above Across After Again Against Ago All Along
        Also Among Any Apart Are Around Aside Away Because Before Behind Below
        Besides Between Beyond Both But Did Due During Either Else For From Had
        Has Her Hereby Him Himself His How Its Itself Just Neither Once Only
        Onto Our Per She Them Themselves They This Unto Upon Versus Via Was
        Were What Whenever Where Whether Which Whilst Who Whom Whose Why With
        Without Would You Your
      `,
    }),
    ...entries({
      reason: "eleventh-pass-function-word-or-pronoun",
      words: `
        One Too Yet Each Even Ever Here Into None Ones Over Same Some Such Than
        Then Very When Every Hence Maybe Never Often Other Quite Since There
        These Those Under Until Almost Always Anyone Anyway Indeed Merely Mostly
        Myself Nearby Nearly Nobody Others Rather Really Simply Solely Toward
        Unless Within Another Anybody However Perhaps Someone Towards Usually
        Everyone Moreover Possibly Probably Somebody Together Whatever Wherever
        Everybody Meanwhile Otherwise Therefore
      `,
    }),
    ...entries({
      reason: "eleventh-pass-fragment-prefix-software-or-science",
      words: `
        Max Mid Min Auto Mini Mono Semi Combo Inter Retro Stats Turbo Ultra Alpha
        Beta Gamma Zip Text Graph Format Calculate Calculated Calculation
        Geometry Polyphonic Implemented
      `,
    }),
    ...entries({
      reason: "eleventh-pass-legal-civic-finance-sports-medical-or-negative",
      words: `
        Appeal Appeals Cited Eligible Mandatory Directive Provision Provisions
        Convention Resolution Portfolio Allocation Allocated Inspector Qualified
        Gym Ski Skiing Quiz Arena Coach League Player Stadium Winner Medal
        Puzzle Rank Ranked Sprint Fairway Desire Pupils Hit Kick Lose Lost
        Losing Quit Stuck Void Screw
      `,
    }),
    ...entries({
      reason: "twelfth-pass-function-word-pronoun-interjection-date-or-place",
      words: `
        Their While Thereby Despite Except Unlike Already Anymore Anytime
        Anything Anywhere Elsewhere Everything Furthermore Nothing Overall
        Please Somehow Something Sometimes Somewhere Somewhat Thank Thanks Today
        Tonight Tomorrow Yesterday Hey Wow Yes Okay Hello Cheers City Cities
        Town Towns Village Island Islands Region Regions North South East West
        Northeast Northwest Southeast Southwest Eastern Western Northern Midwest
        Metro Metropolitan Downtown Palace Plaza Wed
      `,
    }),
    ...entries({
      reason: "twelfth-pass-religion-violence-sports-software-or-jargon",
      words: `
        Atlas Cross Memorial Arrow Monster Vice Champion Winners Winning Victory
        Puzzles Compete Award Awards Reward Ping Robot Stylus Locator Mapping
      `,
    }),
    ...entries({
      reason: "thirteenth-pass-function-adverb-verb-form-or-malformed",
      words: `
        Been Being Could Does Down Have Now Off Out Own Shall Should Came Come
        Done Fed Get Got Let Put Ran Say See Used Absolutely Actually
        Additionally Apparently Basically Carefully Certainly Clearly Closely
        Commonly Completely Constantly Correctly Currently Deeply Definitely
        Directly Easily Effectively Entirely Equally Especially Essentially
        Eventually Exactly Exclusively Extremely Fairly Finally Formerly
        Frequently Fully Generally Greatly Hardly Highly Hopefully Immediately
        Increasingly Initially Instantly Largely Locally Mainly Naturally
        Necessarily Normally Obviously Occasionally Originally Particularly
        Perfectly Personally Potentially Previously Primarily Properly Quickly
        Rarely Rapidly Reasonably Recently Regularly Relatively Separately
        Seriously Shortly Similarly Slightly Specifically Strictly Strongly
        Suddenly Surely Totally Truly Typically Ultimately Widely
      `,
    }),
    ...entries({
      reason: "thirteenth-pass-software-finance-medical-identity-brand-or-title",
      words: `
        Explorer Functional Implement Implementing Operator Deal Deals Duty Duties
        Gratis Hire Hiring Rankings Rated Rates Rating Shipping Shoppers Shopping
        Blonde Breath Tired Butler Cooper Dodge Mason Sonic
      `,
    }),
    ...entries({
      reason: "fourteenth-pass-function-adverb-negative-medical-finance-or-software",
      words: `
        Far Few Less Like Many Might More Most Must Near Past Plus Prior Several
        Twice Will Inside Instead Outside According Excluding Following Including
        Regarding Regardless Daily Early Hourly Likely Partly Slowly Weekly
        Monthly Actively Annually Respectively Successfully Abate Absent Cancel
        Critical Decline Disagree Excess Ignore Imposed Opposed Scratch Shaved
        Unknown Recover Treated Pound Pounds Percent Percentage Rate Cookies
        Formats Guestbook Offset Pointer Posted Posting Tag Tags Tagged Texts
        Type Types Abeltree
      `,
    }),
    ...entries({
      reason: "fourteenth-pass-place-business-infrastructure-brand-or-proper-name",
      words: `
        Airport Avenue Campus Center Centre Highway Hotel Hotels Lobby Lodge
        Lodging Museum Museums Office Offices Parking Railway Railroad Resort
        Resorts Salon Station Stations Street Streets Studio Theater Theatre
        Theaters Tourism Tourist Traffic Transit Venue Venues Villa Villas Baker
        Delta Fisher Galaxy Grace Jaguar Mustang Nova Opera Potter Rover Turner
        Walker
      `,
    }),
    ...entries({
      reason: "fifteenth-pass-function-negative-medical-place-identity-software-or-finance",
      words: `
        Last Least Much Next Timely Cry Cut Lies Argument Arguments Break Breaks
        Breaking Fort Papercut Aldercaplet Aspencaplet Basilcaplet Birchcaplet
        Briarcaplet Cedarcaplet Clovercaplet Cottoncaplet Elmcaplet Feltcaplet
        Ferncaplet Cafe Mall Mart Park Port Restaurant Restaurants Spa Apartment
        Apartments College Colleges Managers Kid Childhood Reply Replied Replies
        Assembly Exception Transcript Toll Trust Trusted
      `,
    }),
    ...entries({
      reason: "sixteenth-pass-gambling-poison-medical-political-institution-or-commerce",
      words: `
        Club Clubs Hemlock Lozenge Planet Freedom Liberty Equality Homeland
        Imperial Revolution Academy Faculty Institute Organisation Organization
        Shopper
      `,
    }),
    ...entries({
      reason: "seventeenth-pass-role-education-civic-corporate-media-or-sensitive",
      words: `
        Boss Master Masters Leader Leaders Founder Celebrity Celebrities
        Academic Education Educational Curriculum Diploma Elementary Enrollment
        Graduation Assignment Assignments Examination Homework Instructor
        Instruction Instructions Lecture Lectures Seminar Semester Student
        Students Teacher Teachers Teaching Alliance Association Associations
        Community Communities Foundation Society Societies Mission Missions
        Facility Facilities Department Departments Conference Conferences
        Analyst Assistant Associate Associates Career Careers Consultant
        Consultants Consulting Coordinator Management Membership Leadership
        Staffing Outsourcing Holdings Inventory Logistics Provider Providers
        Distributor Warehouse Booking Industry Factory Specialist Occupational
        Retirement Customs Airline Airlines Party Parties Diversity Inclusion
        Inclusive Guardian Meetup Fortune Ranking Ratings Players Coaching
        Atomic Emission Exposure Strain Editorial Headline Headlines Journalism
        Journalist Newspaper Newspapers Reporter Bulletin
      `,
    }),
    ...entries({
      reason: "eighteenth-pass-education-role-media-or-academic-subject",
      words: `
        Class Classes Classroom Course Courses Degree Degrees Exam Grade Graduate
        Learning Lesson Lessons Literacy Math Research Researchers Studies Study
        Studying Subject Subjects Test Tested Testing Textbook Textbooks Training
        Workshop Workshops Actor Actors Artist Author Authors Chef Clerk Composer
        Courier Driver Elite Farmer Florist Human Individual Individuals Member
        Members Musicians Passenger People Person Persons Peoples Pilot Reader
        Rider Role Roles Runner Scout Singer Staff Team Teams Visitor Visitors
        Volunteer Volunteers Worker Workers Writer Astronomy Ecology Geography
        Grammar Journal Journals Literature Magazine Magazines News Philosophy
        Showtimes Theory Theories
      `,
    }),
    ...entries({
      reason: "nineteenth-pass-role-doc-media-science-civic-commerce-place-negative-or-privacy",
      words: `
        Buddy Cook Drivers Expert Experts Guest Guests Guide Guides Hero Maker
        Makers Observer Producer Producers Reviewer Traveler Recipient Respondent
        Respondents Contributor Contributors Colleagues Companion Humanity Answer
        Almanac Appendix Architecture Checklist Dictionary Essay Example Examples
        Genealogy Glossary Handbook Historic Historical History Language
        Languages Literary Manual Paragraph Question Questions References
        Sentence Section Sections Subsection Album Albums Ballet Cinema Comic
        Comics Disco Drama Fiddle Guitar Jazz Lyrics Movie Movies Music Orchestra
        Piano Piccolo Trailer Trailers Chronicles Documentary Novel Poetry Atom
        Ion Axis Ratio Radius Linear Median Integral Magnetic Velocity Spectrum
        Frequency Mechanism Indicator Dimension Dimensions Differential Entity
        Probe Emissions Addressed Addresses Addressing Agenda Agriculture Castle
        Cosmetics Demand Demands Destination Destinations Frontier Geographic
        Greenway Highland Hospitality Location Locations Mainland Neighborhood
        Offshore Outlet Overseas Packaging Postal Public Relocation Reserve
        Reserved Reserves Residence Residential Road Roads Route Routes Shop
        Shops Store Tour Tours Tower Trail Train Transport Underground Challenge
        Challenges Delay Escape Flame Lightning Pressure Storm Thunder Drew Mark
        Miles Anonymous Majority Personal Personality Personalized Population
        Populations
      `,
    }),
    ...entries({
      reason: "twentieth-pass-doc-role-media-transit-event-science-or-abstract",
      words: `
        Acoustic Address Affairs Affordable Age Ages Aircraft Analysis Analyze
        Analyzes Anniversary Announcement Architect Article Articles Artists
        Attraction Attractions Audience Avoid Barrier Behavior Bicycle Bike Bikes
        Biography Birthday Boat Boats Book Books Bookstore Brand Brands Brochure
        Builder Builders Bus Calendar Calendars Car Cargo Carrier Carriers Cars
        Catalog Catalyst Catering Celebration Channel Channels Chapter Clearway
        Cluster Comedy Comment Comments Concert Concerts Condition Conditioning
        Conditions Contact Contacts Content Contents Context Cookbook Creator
        Cricket Critics Cruise Cycling Delayed Delivery Density Designer Diagram
        Diameter Diary Display Displays Document Documents Driftway Driving
        Dynamics Eclipse Edition Editions Electric Electricity Element Elements
        Emotional Employed Entities Episode Event Events Excerpt Exhibit Exposed
        Extreme Factor Factors Falling Farmers Fashion Feedback Feelings
        Festival Fiction Fielding Film Films Flight Flights Florists Friend
        Friends Fusion Galleries Gallery Garage Gateway Generate Generated
        Generating Generation Gravity Grocery Guidance Guidelines Guild Holiday
        Holidays Hybrid Inspection Instrument Instruments Intellectual
        Intelligence Interview Interviews Invitation Jamboree Knowledge Leaflet
        Learn Learned Libraries Library Lifestyle Logic Logical Manuals Memories
        Memory Mobility Mode Model Modeling Models Modes Motion Motor Motorcycle
        Motors Musical Occasion Offer Offering Offers Opinion Opinions Optical
        Ordering Orders Participant Participants Performance Phase Pioneer Poem
        Ports Postage Poster Posters Private Product Products Project Projects
        Proposal Proposals Quest Read Readers Reading Readings Reads Reference
        Report Reported Reporting Reports Request Requests Requirement
        Requirements Reservation Reservations Resource Resources Response
        Responses Reunion Review Reviews Riddle Ride Riding Safety Sailing Scale
        Scales Scenario Scope Secret Secured Serious Service Services Signal
        Signals Social Spatial Speaker Speakers Stage Stages Standard Standards
        Statement Statements Stopped Stores Stories Story Strategies Strategy
        Summary Support Supports Surfing Survey Surveys Swimming Symbol Symbols
        Synopsis Teach Testimonials Tests Thermal Ticket Tickets Trails Travel
        Traveling Truck Tunnel Unit Units Vacation Vacations Vehicle Vehicles
        Venture Vision Volume Volumes Voluntary Weight Width Write Writes Writing
        Written Young Younger
      `,
    }),
    ...entries({
      reason: "twenty-first-pass-doc-media-place-transit-science-abstract-or-negative",
      words: `
        Abacus Abele Act Acts Adoption Aid Alignment Amateur Animated Annotation
        Apparel Arrival Art Artistic Arts Artwork Attribute Attributes Baseline
        Bibliography Bridge Cable Cables Camp Camping Camps Carbon Cartoon
        Categories Category Centers Central Chalkboard Chart Charts Circular
        Circulation Climate Climbing Clipboard Column Columns Commentary Compound
        Concept Concepts Conversion Cosmetic Crossing Crosswalk Cube Culture
        Cultures Curve Cycle Cycles Dance Dancing Definition Definitions
        Departure Detection Dialog Dialogue Dimensional Distribution Diving
        Division Divisions Drawing Drawings Efficiency Elevation Energy Entrance
        Environment Environments Equipment Evaluation Evolution Exit Experiment
        Experimental Extraction Fable Fantasy Feature Features Filters Fishing
        Folder Folders Foreign Fraction Gauge Goal Goals Goods Grid Habitat Hall
        Harbor Heading Height Heights Hiking Horizon Horizontal Housing Humidity
        Illustration Innovation Innovative Instance Integration Internal Interval
        Invention Journey Landing Lane Launch Launched Lens Lenses Letter
        Letters Log Mail Mailing Maintenance Map Maps Margin Mass Match Matches
        Measurement Meeting Menu Mesh Meter Meters Method Methods Mining Miss
        Mixture Modification Momentum Name Named Names Navigate Note Notes Number
        Numbers Order Ordered Orientation Page Pages Parade Parallel Passage
        Pattern Patterns Perception Perfume Perspective Perspectives Picture
        Pictures Play Played Playing Plays Portrait Position Positions Precision
        Predict Prediction Process Production Productivity Projection Proportion
        Quality Quantity Quote Quoted Quotes Rail Random Range Ranges Reaction
        Reactions Recipe Recipes Recognition Recycling Reduction Reflection
        Relation Relations Reliability Repair Repairs Replica Resistance
        Resistant Retention Robin Rotation Sample Samples Sampling Scene Scenes
        Scroll Sector Sectors Segment Sender Sequence Sequences Series Shipped
        Show Shows Sidewalk Significance Sketchbook Skill Skills Sleep Sleeping
        Solar Solution Solutions Song Songs Sources Space Spaces Species Speech
        Speed Square Stability Stamp Stamps Starring Storage Storybook Structure
        Structures Supply Surface Sustainable Tale Talent Tales Technique
        Techniques Theme Themes Title Tolerance Topic Topics Transition
        Translation Trek Triangle Trip Trips Universe Unlock Value Values
        Variation Vertical Visibility Visual Vocal Voice Voices Word Words Zero
        Zone
      `,
    }),
    ...entries({
      reason: "twenty-second-pass-doc-commercial-transit-science-or-abstract",
      words: `
        Abstract Accessible Acquisition Aggregate Automobile Automotive Bias
        Collector Consultation Coverage Declared Discretion Documented Dynamic
        Equivalent Evaluate Evaluated Evaluating Findings Hardcover Herald
        Herbarium Hidden Illustrated Indicators Information Insider Interact
        Interaction Interactions Investigate Limitation Limitations Limousines
        Listing Listings Notebook Notebooks Notepad Optimal Paperback Pickup
        Premier Presentation Press Projected Renewal Reproduced Reproduction
        Retired Reviewed Revised Robust Roster Seeker Ship Ships Structural
        Structured Subdivision Threshold Trained Translate Translated Untitled
        Utilization
      `,
    }),
    ...entries({
      reason: "twenty-third-pass-commercial-media-referral-or-language-collision",
      words: "Bar Bars Polish Punk Referral Resume Spell",
    }),
    ...entries({
      reason: "twenty-fourth-pass-role-commercial-media-or-collision",
      words: "Chicks Firm Firms General Issue Issues Marine Mate Remix Supreme Tribute",
    }),
    ...entries({
      reason: "twenty-fifth-pass-media-negative-privacy-or-game",
      words: "Blues Hanging Hung Rap Reveal Watched Watching Win Wins Won",
    }),
    ...entries({
      reason: "twenty-sixth-pass-tobacco-collision",
      words: "Ashtray",
    }),
    ...entries({
      reason: "twenty-eighth-pass-legal-civic-negative-or-privacy",
      words: "Admit Admitted Approve Commit Committed Major Occupied Strip",
    }),
    ...entries({
      reason: "twenty-ninth-pass-slur-or-name-collision",
      words: "Cracker Pansy",
    }),
    ...entries({
      reason: "thirty-second-pass-negative-commerce-privacy-or-media",
      words: "Bare Blow Cheap Cheaper Dealing Lack Listening Strange",
    }),
    ...entries({
      reason: "thirty-third-pass-negative-place-commerce-energy-or-legal",
      words: `
        Absence Brookside Deluxe Exclusive Fuel Gas Glenwood Listen Luxury Mine
        Offered Rule Rules Term Terms Unusual
      `,
    }),
    ...entries({
      reason: "thirty-fifth-pass-place-royalty-or-finance-collision",
      words: "Border Borders Crown Interest Interests",
    }),
    ...entries({
      reason: "thirty-sixth-pass-appearance-collision",
      words: "Colored",
    }),
    ...entries({
      reason: "thirty-seventh-pass-civic-negative-commerce-or-game",
      words: "Correction Corrections Discipline Pride Spend Spending Spent Trick Tricks",
    }),
    ...entries({
      reason: "thirty-ninth-pass-negative-civic-promotion-or-proof",
      words: `
        Challenging Forget Forgot Forgotten Innocent Noise Peace Promote
        Promoting Promotion Proof Unity
      `,
    }),
    ...entries({
      reason: "forty-fourth-pass-pest-or-animal-collision",
      words: "Bug Bugs Fly Mice Monkey Mouse Spider",
    }),
    ...entries({
      reason: "forty-eighth-pass-commerce-or-promotional-collision",
      words: "Best Free Hot",
    }),
    ...entries({
      reason: "forty-ninth-pass-violent-action-collision",
      words: "Cutting",
    }),
    ...entries({
      reason: "fiftieth-pass-promotional-collision",
      words: "Lowest",
    }),
    ...entries({
      reason: "core-review-test-blocklist-alignment",
      words: "Amberstone Petunia",
    }),
  ],
  korean: [
    ...entries({
      reason: "brand-or-platform",
      words: "엘지 구글 롯데 틱톡 네이버 유튜브",
    }),
    ...entries({
      confidence: "medium",
      reason: "brand-common-word-collision",
      words: "애플 신세계",
    }),
    ...entries({
      reason: "place-landmark-or-dynasty",
      words:
        "백두 경복궁 창덕궁 덕수궁 고구려 남대문 영산강 섬진강 대동강 임진강 소양강",
    }),
    ...entries({
      reason: "personal-or-proper-name",
      words: "바흐 멘델 하이든 베르디 푸치니 차이코 파가니 바르톡 모차르트",
    }),
    ...entries({
      reason: "alcohol",
      words:
        "와인 맥주 소주 맛술 술병 술잔 술통 막걸리 와인병 와인잔 와인통 위스키 소주잔 맥주잔",
    }),
    ...entries({
      reason: "medical-or-clinical",
      words: `
        의사 약국 재활 한의 치과 증상 의학 약사 혈압 혈액 백신 염증 통원
        입원 세균 혈관 항체 구급차 간호사 호르몬 염색체
      `,
    }),
    ...entries({
      reason: "legal-political-or-military",
      words:
        "법률 군사 규제 법원 법규 법정 법령 법조 법학 법무 인권 민주 주권 변호사",
    }),
    ...entries({
      reason: "religious-ritual-or-occult",
      words:
        "마법 성당 제단 제물 사제 신령 신주 신전 신사 신탁 신성 신당 영가 사신 마법사",
    }),
    ...entries({
      reason: "violent-disaster-weapon-or-military",
      words: "사격 기폭 탱크 방폭 지진 화재 절단 화살 적군 장군",
    }),
    ...entries({
      reason: "dating-body-or-underwear-adjacent",
      words: "연인 입술 내의 수영복 로맨스 데이트 신혼여행",
    }),
    ...entries({
      confidence: "medium-high",
      reason: "game-gambling-adjacent-or-foreign-fragment",
      words: "룰 윷 게임기",
    }),
    ...entries({
      reason: "clipped-loanword-or-game-product-jargon",
      words: "오렌 아몬 바닐 라즈 크랜 리보 아이템 세이브 퀘스트 스타트 레전드",
    }),
    ...entries({
      confidence: "medium",
      reason: "generated-looking-compound",
      words:
        "푸른새봄 은빛달빛 은빛물빛 차분한일감 새벽일감 밝은누룽지 고요한누룽지",
    }),
    ...entries({
      reason: "second-pass-fragment-brand-or-platform-collision",
      words: "빙 뷰 톡 줌 텐 티쏘 다이소",
    }),
    ...entries({
      reason: "second-pass-proper-name-or-place-fragment",
      words: "베토 주안 가거",
    }),
    ...entries({
      reason: "second-pass-religious-myth-or-occult",
      words: "신화 주술 영혼 마술 여신",
    }),
    ...entries({
      reason: "second-pass-medical-or-clinical",
      words: "간호 진료 증세 예후 약통 치주 부기 경련",
    }),
    ...entries({
      reason: "second-pass-legal-political-or-civic",
      words: "특허 상표 판사 고소 고발 의회",
    }),
    ...entries({
      reason: "second-pass-gambling-game-or-chance",
      words: "블랙잭 주사위 고도리 백개먼",
    }),
    ...entries({
      reason: "second-pass-disaster-violence-or-hunting",
      words: "해일 태풍 사냥꾼",
    }),
    ...entries({
      reason: "second-pass-alcohol",
      words: "브루어리",
    }),
    ...entries({
      reason: "second-pass-dating-or-relationship",
      words: "약혼",
    }),
    ...entries({
      reason: "second-pass-clipped-or-malformed-loanword",
      words: "악세 부끄",
    }),
    ...entries({
      reason: "third-pass-medical-body-anatomy-or-herb",
      words: `
        손 입 귀 발 뼈 턱 허리 머리 눈썹 손톱 얼굴 신체 발톱 근육 수염
        잇몸 구강 복부 척추 관절 소변 대변 종양 단백 간염 폐렴 비만
        신장 비장 대장 소장 식도 인후 심실 심방 맥박 체액 청각 후각
        안과 소아 내과 외과 응급 처방 소독 예방 체온 소화 면역 심장
        호흡 신경 접종 붕대 소생 마취 수액 퇴원 이비인후과 알레르기
        유전자 단백질 리보솜 세포질 백출 황기 지황 천마 갈근 복령
        황정 단삼 황백 백지
      `,
    }),
    ...entries({
      reason: "third-pass-proper-place-event-or-planet",
      words: `
        가야 종묘 진해 서귀 마라도 가거도 설악 금강 동강 남강 북강
        오대 소백 덕유 변산 무등 팔공 치악 북악 수락 대둔 월악 주왕
        구룡 운악 천관 용문 화악 설봉 금오 주봉 신불 대청 용화 운봉
        북해 영산 서초 청원 지구 목성 금성 토성 천왕 해왕 명왕 올림픽
        삼일절
      `,
    }),
    ...entries({
      reason: "third-pass-brand-platform-software-or-account-jargon",
      words: `
        슬랙 레딧 옥션 한화 넥슨 모나미 아모레 오메가 오레오 다이제
        파네라이 에러 배포 유저 댓글 이모 하트 노드 채널 계정 로그인
        아이디 관리자 게스트 이메일 와이파이 이모티콘 사용자 메시지
        수신함 발신함 변수 함수 리턴 객체 쿼리
      `,
    }),
    ...entries({
      reason: "third-pass-religion-ritual-or-occult",
      words: `
        기도 예배 성경 경전 성지 천국 구원 천사 성자 성녀 요정 명복
        신녀 신명 부적 사주 명당 연등 요술 성전 제의 백중 신자 성소 유두
      `,
    }),
    ...entries({
      reason: "third-pass-alcohol",
      words: `
        주점 주류 사케 비어 양조 주조 시음 포도주 바텐더 소믈리에
        테이스팅 비노
      `,
    }),
    ...entries({
      reason: "third-pass-violence-disaster-gambling-or-threat",
      words: `
        해적 복싱 펜싱 무술 타격 전술 폭풍 가뭄 홍수 한파 폭염 홀덤
        빙고 사냥 괴물 악당 도적 방어구 배틀 복수 추격 위협 발사 화염
        충돌 분쟁 대결 적대 무에타이 킥복싱 스파링
      `,
    }),
    ...entries({
      reason: "third-pass-legal-civic-finance-or-identity",
      words: `
        경찰 행정 세무 계약 정책 보험 상해 보상 증서 담보 위임 대출
        조항 의무 권리 소송 중재 면허 허가 신분 요건 조례 규정 국가
        시민 자치 선출 법인 여권 수사 증거 신고 증인 의결 약관 권한
        주식 투자 채권 수표 환율 이자 배당 펀드 증권 주가 금리 환전 재무
      `,
    }),
    ...entries({
      reason: "third-pass-dating-or-relationship",
      words: "결혼 신혼 신랑 혼례 이성 교제 사귐",
    }),
    ...entries({
      reason: "third-pass-clipped-malformed-or-generated-looking",
      words: `
        캐릭 그라픽 랩퍼 후라이 씨리얼 헤이즐 피스타 브륄레 악세사리
        악세서리 스트라빈 양배 파슬 셀러 바나 소고 닭고 양고 해산
        오징 모짜 마요 밀가 선글 나락단 콩단 팥단 깨단 마늘단
        푸른누룽지 소담한누룽지 새벽누룽지 따스한누룽지 너른누룽지
        너른일감 소담한일감 따스한일감 맑은라온 푸른라온
      `,
    }),
    ...entries({
      reason: "fourth-pass-clipped-loanword-or-fragment",
      words:
        "밴 휠 뱅 롤 젤 롱 숏 맵 힙 팩 레 윙 딜 메 슈 번 링 림 릴 맥 니 빔 홈",
    }),
    ...entries({
      reason: "fourth-pass-software-hardware-account-or-media-jargon",
      words: `
        블로그 회원 인증 폴더 모니터 키보드 마우스 스위치 케이블 배터리
        충전기 디지털 비디오 오디오 스크린 화면
      `,
    }),
    ...entries({
      reason: "fourth-pass-finance-civic-or-commerce",
      words: `
        돈 현금 화폐 지폐 금융 경제 세금 임금 예금 결제 금액 대금 송금
        상환 환불 모금 기금 금고 보증 요금 수입 손실 이익 상금 후보
        증명 영수증
      `,
    }),
    ...entries({
      reason: "fourth-pass-medical-body-health-or-disaster",
      words: `
        숨 혈 눈물 한숨 복근 소아과 체온계 소독제 기저귀 미세먼지 소방
        소방관 소방서 소방차 소방복 소방대 소방장 소방사 소방센터
        소방대장 소화기 소화전 구명환
      `,
    }),
    ...entries({
      reason: "fourth-pass-herb-drug-or-malformed-loanword",
      words: `
        양귀비 천궁 바질 로즈마리 오레가노 파슬리 민트 커민 세이지
        페퍼민트 카다멈 카르다몸 라벤더 향신료
      `,
    }),
    ...entries({
      reason: "fourth-pass-religion-ritual-holiday-or-violence",
      words: "절 축복 신도 크리스마스 태권도 합기도 군 딜러",
    }),
    ...entries({
      reason: "fourth-pass-adult-or-relationship",
      words: "결혼식 피로연 혼수",
    }),
    ...entries({
      reason: "fifth-pass-medical-health-body-or-biomedical",
      words: `
        치유 건강 완화 회복 힐링 보건 수의 심리 침술 체중 바디 마사지 문신
        핵산 미생물 영양소 영양분 식습관 돌연변이 라돈
      `,
    }),
    ...entries({
      reason: "fifth-pass-finance-legal-civic-or-commerce",
      words: "후원 기부 회계 자산 협약 서약 신용 재산 부동산 이용료 수수료",
    }),
    ...entries({
      reason: "fifth-pass-adult-relationship-negative-alcohol-or-hazard",
      words: "사랑 로맨틱 겁 슬픔 망신 불신 안주 전사 면도날 원자력",
    }),
    ...entries({
      reason: "fifth-pass-brand-game-product-jargon-or-malformed",
      words:
        "에이스 모노폴리 조이스틱 샌드박스 몬테레이 빛나 차분 따뜻 큰 긴 볶",
    }),
    ...entries({
      reason: "sixth-pass-brand-product-or-identity-title",
      words: `
        다음 올레 토니 바비 왕자 여왕 여성 남성 여자 남자 위원 회장 서기
        사장 대표 북촌 서해 남양 남포 서경
      `,
    }),
    ...entries({
      reason: "sixth-pass-religion-occult-medical-or-biomedical",
      words: `
        요가 명상 사리 유령 마녀 구급 기침 증후 심박 식이 배양 효소 세포
        어깨 상체 하체 체형 노화 분유 수유
      `,
    }),
    ...entries({
      reason: "sixth-pass-finance-legal-commerce-or-account",
      words: `
        자본 소득 무역 수출 노동 재정 거래 독점 계좌 수익 분배 재원 잔고
        이체 통장 코인 경매 입찰 청구 납부 고지 지급 등록 할인 가격 구매
        주문 배달 세일 쿠폰 배송 재고 발행 거래처 추첨
      `,
    }),
    ...entries({
      reason: "sixth-pass-software-hardware-account-or-media",
      words: `
        보안 소셜 탐지 계층 대역 연산 제어 전송 암호 응답 설정 구독 알림
        수신 그룹 답장 첨부 발신 보관 삭제 목록 저장 편집 분류 화질 방송
        통신 패널 명령 접속 터치 녹화 볼륨 복사 레이저 그래픽 디스크
        플러그 이어폰 휴대폰 헤드폰 노트북 리모컨 콘센트 솔루션 플래시
        메모리 라이브 게이트 업그레이드
      `,
    }),
    ...entries({
      reason: "sixth-pass-negative-risk-violence-distress-or-malformed",
      words: `
        비극 호러 놀람 걱정 생존 경고 순찰 경비 비상 경보 충격 방어 방패
        투구 사슬 가드 파단 갈등 대립 논쟁 반목 마찰 이별 압박 긴장 굴욕
        치욕 수모 불만 반감 거부 비난 경멸 모욕 냉소 불쾌 불평 불안 고독
        비애 어둠 불화 비명 미디 플릭 비메 하모 멜로 샌드 디핑 핸드 플랫
        점핑 신디 비주 듀오 시크 컨셉 미도 캐시 푸쉬 코다 모듬 드로우
        파이브 나인 세븐 식스 쓰리 하이 로우
      `,
    }),
    ...entries({
      reason: "seventh-pass-finance-legal-or-commerce",
      words: "동전 연봉 결재 비용 고용 승인 보너스",
    }),
    ...entries({
      reason: "seventh-pass-software-media-product-or-technical-jargon",
      words: `
        주소록 도움말 매뉴얼 라인업 에디션 커뮤니티 이미지 비주얼 엠블럼
        일러스트 브로셔 플로우 화학 실험 전자 전기 용접 토목 항공 변압기
        주파수 그리드 태양광 바이오 축전기 저항기 수처리 냉난방 아르곤
        크립톤 도형학 기하학 생태학 유기체
      `,
    }),
    ...entries({
      reason: "seventh-pass-medical-health-herb-religion-or-hazard",
      words: `
        유산소 운동량 체력 지구력 유연성 화장실 백수오 구기자 차가버섯
        에키네시아 대보름 한가위 의식 신념 정신 비상식량 방충제 라이터 탐정
      `,
    }),
    ...entries({
      reason: "seventh-pass-malformed-fragment",
      words: "의 나 하 다 얌 짱 짤 쿵 쌤 락 존 사이키 크로노 일렉트로 스테인",
    }),
    ...entries({
      reason: "eighth-pass-medical-body-or-dental",
      words: "치아 이빨 치약 치실 양치",
    }),
    ...entries({
      reason: "eighth-pass-legal-finance-civic-or-corporate",
      words: `
        권 증 합의 협의 결의 자격 은행 상장 기업 회사 기관 협회 연합 직원
        출판사
      `,
    }),
    ...entries({
      reason: "eighth-pass-software-media-or-technical-hardware",
      words: `
        전화 영상 라디오 아날로그 엔진 다이얼 타이머 전기장판 전기장치
        전기기구 전기제품 전기기기 전기용품 전기기계 전기장비
      `,
    }),
    ...entries({
      reason: "eighth-pass-game-sports-or-product-jargon",
      words: `
        퀴즈 도미노 당구 볼링 스페어 셔틀콕 스매시 스코어 바스켓 리바운드
        나일론 폴리에스터 스웨이드 트리밍 핸드메이드 그라데이션 아방가르드
      `,
    }),
    ...entries({
      reason: "eighth-pass-adjective-fragment-brand-or-proper-collision",
      words: `
        두꺼운 가벼운 무거운 단단한 유연한 견고한 섬세한 화려한 단순한
        우아한 세련된 부드러운 접이 현대 소나타
      `,
    }),
    ...entries({
      reason: "ninth-pass-place-venue-institution",
      words: `
        도시 광장 공원 극장 학교 학원 대학 학회 센터 공장 공항 호텔 카페
        식당 여관 회관 서원 서관 화랑 주택 단지 동네 시내 구역 지역 박물관
        도서관 지하철 궁전
      `,
    }),
    ...entries({
      reason: "ninth-pass-place-like-island-region-or-dynasty",
      words: `
        무의 서도 동도 남도 북도 여도 모도 중도 금도 은도 초도 화도 비도
        흑도 소도 대도 상도 하도 연도 사도 장도 구도 가도 마도 북산 북문
        북항 북제 남촌 남천 서대 삼국 서부 남부
      `,
    }),
    ...entries({
      reason: "ninth-pass-title-role-family-or-identity",
      words: `
        교수 학생 강사 교사 선생 학장 교장 사서 저자 기자 감독 선수 작가
        배우 고객 승객 여객 손님 상인 사육사 여행자 조종사 할머니 할아버지
        누나 동생 친척 형제 자매 사촌 조카 삼촌 형님 언니 조부 조모 누님
        오빠 유아 소녀 소년 부모 엄마 아빠
      `,
    }),
    ...entries({
      reason: "ninth-pass-finance-commerce-corporate",
      words: `
        시장 상점 가게 상품 판매 매장 장터 광고 홍보 예약 접수 회의 업무
        상사 출근 퇴근 기한 서류 직무 직책 업종 업계 실적 물류 유통 경영
        사무 비서 사업 소비 생산 수요 불황 호황 위기 협상 통계 지표 견적
        혜택 적립 사은 제공 부서 업체
      `,
    }),
    ...entries({
      reason: "ninth-pass-legal-civic-policy",
      words: "규칙 절차 수칙 방침 책임 공정 이행 변경 사안 공지 문의 자문 심사 안건 의제 규범 행위 기표 서명",
    }),
    ...entries({
      reason: "ninth-pass-software-hardware-or-technical",
      words: `
        장치 장비 기계 설비 성능 기술 기능 신호 전파 음향 인쇄 정비 전력
        난방 냉방 전선 공급 유지 계산 교체 터빈 배관 수압 전압 전류 수질
        충전 풍력 수력 지열 연료 석유 부품 내장 외장 연비 가속 제동 핸들
        공조 센서 알람 기체 이륙 착륙 조종 탑재 무선 압력 노즐 머신 추출
        분쇄 제조 싱크 방수 방오 방진 방충 방음 방열 방전 방화 방사 합성
        경량 확장 보강 부착 배선 수온 어종 퓨즈 기판 밸브 소켓 입력 출력
        구현 추적 화소 녹음 이송 배출 압축 분사 공업 건설 하수 폐수 급수
        배수 정제
      `,
    }),
    ...entries({
      reason: "ninth-pass-science-math-specialist",
      words: `
        물질 표본 측정 표준 조건 생물 과학 수학 진화 생태 생명 암석 유황
        광물 화산 고도 용암 분화 운석 혜성 위성 행성 항성 천체 석영 운모
        규산 석회 석고 사암 규암 암반 지각 광맥 지형 지질 퇴적 촉매 원료
        액체 고체 분말 입자 조성 농도 유체 전이 계면 열전 응용 법칙 원리
        저항 확률 분포 추정 가설 평균 편차 회귀 미분 적분 극한 계수 원자
        원소 헬륨 수소 질소 네온 제논 분자 탄화 산화 유전
      `,
    }),
    ...entries({
      reason: "ninth-pass-religion-ritual-holiday-or-adult-relationship",
      words: "설날 추석 단오 명절 신년 차례 주일 동지 예물 축가 하객 예식 부케 주례 고백 친밀 애정 포옹 연가",
    }),
    ...entries({
      reason: "ninth-pass-medical-body-health-hygiene",
      words: `
        욕실 욕조 목욕 세면 변기 샤워 칫솔 린스 토너 앰플 타투 케어 틴트
        립스틱 블러셔 클렌저 리무버 에센스 마스카라 아이섀도 메이크업
        면도폼 세면도구
      `,
    }),
    ...entries({
      reason: "ninth-pass-negative-user-hostile-or-malformed",
      words: "문제 냄새 실패 불황 위기 편견 반발 고함 먼지 곰팡이 가리 사파 에메 토파 읽기 보내기",
    }),
    ...entries({
      reason: "tenth-pass-place-venue-infrastructure",
      words: `
        공방 숙소 마을 왕국 서점 밥집 찻집 빵집 화실 주차장 편의점 백화점
        놀이터 영화관 미술관 체육관 운동장 경기장 공연장 전시장 사무실
        연구실 연구소 사무소 작업실 이발소 주유소 세탁소 수족관 회의실
        시험장 기숙사 수영장 비행장 항공사 항구 부두 포구 항만 선착장
        정류장 정류소 정거장 전시관 기념관 실험실 휴게소 가판대
      `,
    }),
    ...entries({
      reason: "tenth-pass-sports-games-competition",
      words: `
        축구 야구 배구 탁구 농구 골프 수영 하키 카약 서핑 체조 육상 대회
        리그 심판 관중 응원 메달 유도 런닝 매치 더블 순위 시합 씨름 양궁
        승마 카누 요트 역도 레슬링 스쿼시 주짓수 스쿼트 다이빙 스케이트
        배드민턴 금메달 은메달 동메달 결승 준결 예선 결선 상대팀 유니폼
        리허설 페이스 바둑 오목 젠가 고누 퍼즐 플레이 레이싱 레벨 길드
        대국
      `,
    }),
    ...entries({
      reason: "tenth-pass-title-role-person-identity",
      words: `
        리더 가수 댄서 선원 선장 어부 셰프 시인 주자 캐디 연사 대원 주방장
        비행사 모험가 요리사 방문자 연구원 상담자 수험생 편집자 비평가
        연주자 재즈맨 드러머 디제이 조각가 디자이너 바리스타 아티스트
        엔지니어 코미디언 전문가 전달자 주인공 음악가 연습생 기술자 훈련생
        사무원 사무직 아이 어른 청춘 청년 노인 인간 아기 꼬마 어린이 새끼
      `,
    }),
    ...entries({
      reason: "tenth-pass-software-product-commerce-jargon",
      words: `
        포탈 베타 수식 샘플 패키지 커스텀 텍스처 클리너 스포크 스패너
        설명서 출시 신제품 제품 프리미엄 소비자 장학 가입 신청 의뢰 인력
        상가 대리 입회 평점
      `,
    }),
    ...entries({
      reason: "tenth-pass-science-technical-industrial",
      words: `
        항법 합금 리벳 지능 추론 물리 좌표 전하 반경 직경 밀도 질량 부피
        중력 단위 수치 규조 오존 염분 지층 수맥 층리 방출 연소 아연 분무
        제빙 지리
      `,
    }),
    ...entries({
      reason: "tenth-pass-medical-hygiene-personal-care",
      words: "샴푸 면도 화장 미용 로션 립밤 세럼 핀셋 면봉 네일 스킨 타올 패드 화장품 면도기 선크림",
    }),
    ...entries({
      reason: "tenth-pass-negative-user-hostile-or-adjective-fragment",
      words: "소음 고민 반성 부족 단점 잔여 불균형 불균일 불연속 울음 외침 삶은 파란 하얀 거친 얇은 작은 넓은 좁은 짧은 낮은 높은 둥근 각진",
    }),
    ...entries({
      reason: "eleventh-pass-brand-proper-finance-political-medical-religion-or-fragment",
      words: "동아 스냅드래곤 통화 흑자 개혁 조작 균 열감 위생 용 산사 흑룡 흑신 애니 파인 소나 참나 구기",
    }),
    ...entries({
      reason: "twelfth-pass-fragment-proper-software-legal-technical-sports-or-malformed",
      words: `
        교 묘 혼 적 바 홀 규 율 인 리 측 압 길동 장우 테디 룸바 아시아고
        배너 패치 태그 네트 필드 정의 장관 장부 훈장 수법 원칙 전략 화력
        장기 외피 내피 가스 천연가스 버너 열전도 코팅 렌치 니퍼 탬버린
        심벌즈 가야금 스케이팅 버디 패스 라운드 스텝퍼 클라이머 스테이지
        굿즈 리퀴드 트렌디 소프트 솔리드 심플 다크 오가닉 어쿠스틱
        엘레강스 소세지 퀴시 스모크
      `,
    }),
    ...entries({
      reason: "thirteenth-pass-single-character-sensitive-fragments",
      words: `
        광 영 작 예 사 모 주 과 육 간 역 봉 만 호 동 촌 폭 온 미 이 재 능
        둔 환 세 가 송 숙 객 축 지 희 망 치 청 흑 황 녹 냉 습 농 족 경
        승 탁 염 변 민 진 준 근 격 항 합 충 극 학 독 요 당
      `,
    }),
    ...entries({
      reason: "thirteenth-pass-malformed-place-commercial-finance-or-medicine",
      words: `
        세미 비둘 홍여 설매 선착 기숙 샤브 파크 슈퍼 마트 사원 맛집 꽃집
        떡집 차집 고기집 사진관 여행사 문구점 갤러리 댄스홀 라운지 사우나
        물가 합작 감초 산초 치자 흑삼 도라지 오미자 호로파
      `,
    }),
    ...entries({
      reason: "fourteenth-pass-fragment-clipped-software-commerce-legal-hazard-or-sports",
      words: `
        두 오 제 후 첫 십 억 액 부 한 노 곱 답 설 결 건 서 로제 레드 그린
        스퀘어 플레인 로컬 글로벌 럭셔리 내추럴 스포티 미니멀 플라워
        스카이 아이스 스노클 슬레드 클로저 트위스트 리뷰 포토 튜닝 음원
        시즌 시리즈 다큐 뮤직 아이돌 사운드 리믹스 값 주소 번호 이름
        명함 상호 소울 기적 운명 길상 승무 무고 노출 성냥 모닥불 절벽
        암벽 지문 인장
      `,
    }),
    ...entries({
      reason: "fifteenth-pass-single-character-fragment-or-interjection",
      words: "화 불 각 원 기 식 수 계 생 행 명 심 애 위 직 휴 짠",
    }),
    ...entries({
      reason: "sixteenth-pass-role-music-sports-place-nautical-herb-style-or-science",
      words: `
        청중 화자 주인 관객 기사 화가 작곡가 멘토 예술가 조리사 토론자 상대방
        기타 봉고 콩가 테너 콰르텟 아리아 관현악 앙상블 우쿨렐레 소프라노
        비트박스 캐스터네츠 트라이앵글 오케스트라 스키 보드 빙상 턱걸이
        달리기 명소 관광 투어 탐방 시골 농촌 산촌 어촌 교외 어장 해운
        교차로 출입구 엘리베이터 조타 항차 해도 선실 선체 어업 어획 어구
        어로 레몬밤 타라곤 자스민 재스민 사프란 아니스 시나몬 육두구
        아가베 루이보스 다이아 바베큐 브러쉬 머스타드 트렌치 에스닉
        스파클링 모노크롬 보헤미안 크로스 메이트 아웃도어 소행성 포유류
        파충류 양서류 미네랄
      `,
    }),
    ...entries({
      reason: "seventeenth-pass-role-sports-place-music-or-hazard",
      words: `
        아동 청소년 인턴 동문 선배 후배 조원 팀원 스승 팬들 크루 보행자
        항해사 뮤지션 무희 철인 가이드 조깅 골대 슛폼 속공 파울 종목 선발
        경연 승리 상패 상훈 교실 장소 입구 출구 터널 육교 지하도 이정표
        신호등 유적 동상 석상 흉상 수도 전철 차고 객실 발레 탱고 살사
        왈츠 레게 농악 학춤 입춤 쿼텟 국악 합주 안무 교향 협주 가곡 지휘
        음악회 주제곡 불꽃
      `,
    }),
    ...entries({
      reason: "eighteenth-pass-education-music-performance-transit-place-sports-events",
      words: `
        강의 수업 학습 강연 강좌 교재 실습 과목 학기 졸업 입학 교과 전공
        교감 답안 점수 필기 학위 수료 교육 훈련 교문 교복 학년 영어 국어
        한자 체육 공부 시험지 강의록 세미나 가르침 모의 수험 기출 합격
        문항 공연 음악 리듬 연출 상연 관람 시청 무용 연주 마임 축제 출연
        파티 무도 촬영 입장 티켓 좌석 참석 영화 밴드 듀엣 합창 솔로 앨범
        싱글 재즈 가요 인디 보컬 악단 음반 음정 화음 선율 음계 악보 발성
        작곡 편곡 템포 스윙 곡조 싱어 작사 신곡 명곡 주연 조연 민속 풍물
        연주회 무도회 발라드 블루스 드라마 리셉션 야유회 바자회 페스티벌
        퍼레이드 시나리오 버스 택시 기차 열차 선박 항로 항해 해상 어선
        어망 차량 도로 차도 보도 보행 노선 운전 정차 이동 구간 화물 탑승
        환승 운행 운송 차표 하차 주행 기내 비행기 비행편 기관차 자동차
        산맥 반도 대륙 유역 도랑 개천 수로 해안 고향 현장 창고 박물 북길
        북성 북안 북대 북회 북원 북림 북사 북소 북연 북화 북천 남지 남선
        동부 서쪽 낚시 레저 러닝 바벨 덤벨 봉돌 도래 비치볼 운동화 운동복
        스피드 보트 패들 튜브 수경 표창 수상 우승 시상 박람 회식 송년 환갑
        칠순 팔순 백일 고희 만찬 오찬 축전 화환 기념식 기념일 돌잔치
        집들이 초대장
      `,
    }),
    ...entries({
      reason: "nineteenth-pass-education-publication-performance-event-transit-or-game",
      words: `
        독서 문학 논문 출판 서평 시험 과제 연수 레슨 진로 문법 예제 상급
        하급 수련 문헌 보고서 서론 본론 서문 필명 인용 각주 부록 본문 주석
        해설 출처 번역 발음 한글 철학 학문 학자 교양 탐구 설문 서체 칼럼
        미학 무대 연극 대사 전시 연기 댄스 노래 음표 독자 잡지 신문 힙합
        음색 만화 서예 조형 도예 유화 수채 판화 시연 전람 예능 사극 연예
        희극 서사 상영 분장 극단 시집 수필 산문 즉흥 변주 후주 서곡 박자
        드로잉 멜로디 하모니 그루브 베이스 전시회 전시물 에세이 작품집 행사
        인파 행진 행렬 참가 초대 잔치 연회 송별 생일 동아리 단체 조직 소속
        봉사 정체성 해방 복지 사회 주차 교통 세단 기어 출발 도착 차선 차체
        주유 궤도 경로 기내식 레인 드롭 페어 드림 토픽 트리 수수께끼 연날리기
      `,
    }),
    ...entries({
      reason: "twentieth-pass-doc-media-role-civic-transit-event-science-or-loanword",
      words: `
        주제 발표 정보 자료 연구 사례 의견 질문 답변 토론 연설 주최 기획
        전문 이론 사전 개념 심화 조사 사상 분석 요약 관점 주장 설명 예시
        상담 조언 전달 기록 결론 도서 서적 문서 참고 일지 문자 문고 장서
        서신 서표 서고 사료 고서 유물 메모 문장 공책 보고 논의 대담 발언
        토의 지침 배움 제목 원고 의논 철자 참조 단편 장편 연대기 줄거리
        다이어리 전설 민담 소설 기담 인물 교훈 상징 전개 결말 장면 대화
        창작 작품 예술 문화 전통 조명 기법 체험 감상 사진 사인 역할 배역
        영웅 고전 예고 비평 렌즈 필름 포즈 시선 시각 대비 명암 비율 화폭
        명도 채도 심볼 화구 플롯 수묵 서정 사조 화풍 화각 인화 전경 후경
        화판 명화 초상 소묘 채색 화첩 문체 서술 화법 후기 구절 춤사위
        조형물 스케치북 사람 친구 가족 이웃 동료 신입 생애 성찰 인맥 목소리
        눈빛 위치 비밀 사건 일기 편지 소문 참여 소통 연대 협력 운영 관리
        지원 교류 친목 자유 개발 평가 제안 시설 직업 설계 제작 건축 외식
        제과 제빵 농업 축산 수산 보호 대응 연락 실행 반납 교환 대기 이용
        비품 서빙 간판 식품 포장 표시 진열 가판 산업 발명 유효 효율 개선
        확인 조치 이력 신규 공사 이사 약속 기간 완료 선정 협조 표식 명칭
        방문 제출 우편 소포 택배 마차 비행 썰매 자전 자전거 나룻배 바퀴
        차문 유모차 등대 책방 거리 놀이 장난 추리 도전 블록 딱지 묘기
        소풍 휴가 일정 만남 축하 박수 연말 연초 예복 초청 명단 소모임
        기념품 기념 천둥 번개 우박 가시 촛불 숯불 화로 불판 한기 무더위
        청결 세제 세탁 세탁망 세탁기 청소기 공기청정기 온도계 기력 정상
        운동 태양 우주 은하 별자리 망원경 프리즘 생태계 수증기 산소 공생
        복원 번식 품종 파동 진동 물체 현상 구형 구체 투영 투시 투과 굴절
        산란 흡수 발산 분산 감속 유동 동적 분해 이차 지수 화석 미세 증가
        감소 처리 수지 변형 상관 집합 섬광 토양 지반 표고 증기 광선 자석
        기계식 기능성 안전성 안정성 신축성 통기성 상호작용 미러 도어 오일
        와셔 헬멧 고글 체인 타프 코펠 랜턴 믹서 몰드 서클 리넨 라벨 버클
        포켓 엣지 코튼 메쉬 리폼 토트 숄더 슬링 홀더 키트 버프 비니 터번
        베레 베일 조거 루즈 스판 카라 마린 슬릿 드레스 기모노 스팽글 레이스
        가디건 블라우스 플레어 실루엣 스니커즈 액세서리 선글라스 헤어밴드
        주얼리 클러치 스트랩 프린지 펜던트 케이스 브러시 스펀지 파우더
        미스트 브로우 세라믹 실리콘 브론즈 텀블러 플라스틱 알루미늄 크리스탈
        드릴 사포 나사 공구 본드 재단 조립 도면 조리기 가열기 로스터 토스터
        스탠드 바인더 선풍기 에어컨 온풍기 가습기 보일러 지팡이
      `,
    }),
    ...entries({
      reason: "twenty-first-pass-doc-place-media-event-science-loanword-or-abstract",
      words: `
        눈 춤 사진첩 책 길 방 글 목 곡 모래길 공터 모임 형식 내용 기초
        연습 동화 사연 배경 감정 모험 기억 여행 구성 의미 전환 패턴 구조
        구경 활동 그림 도안 영감 소식 벽화 엽서 수첩 안내 지도 탐험 탐사
        해답 조합 조정 산책 사교 가사 장르 성장 정원 온실 화단 텃밭 정자
        온도 품질 기준 추천 컬러 관찰 해석 해양 해변 사막 동굴 초원 평원
        언덕 계곡 연못 미술 산길 숲길 설화 해류 해수 휴양 조수 해조 온천
        활력 산림 구릉 하천 평야 다리 단어 구상 추상 색칠 서가 서재
        장바구니 표지 백팩 계단 달력 날짜 사실 진실 논리 통찰 길목 길손
        길터 자신 비유 시가 성격 태도 세대 가락 주말 기후 캠핑 여가 실크
        셔츠 재킷 자켓 팬츠 후드 코랄 핑크 블랙 블루 퍼플 실버 골드 로즈
        수트 부츠 미니 벨벳 슬림 핏감 솔숲길 선조 연휴 습도 기온 날씨
        냉각 열대 체계 파이 미각 가정 농장 비즈 비닐 가상 현실 입체 작동
        가공 내구 텐트 식수 스푼 종류 크기 재질 조절 표면 휴대 무게 사용
        설치 자동 수동 균일 규격 세척 강철 고무 투명 광택 혼합 질감 원형
        소형 대형 곡선 직선 두께 투톤 각도 기하 램프 스툴 용도 장인 정밀
        보온 보냉 방습 몸체 길이 반원 곡면 평면 금속 인조 일체 머그 용량
        사양 마감 중형 서식 수분 보전 통기 반사 취향 건조 돔형 각인 음영
        샌들 패딩 점퍼 캔들 직조 염색 섬유 피리 장구 히터 원인 대책 영향
        타월 면체 반전 집중 정지 연속 초기 시점 간격 시대 이중 흑연 부문
        분야 동무 혼자 다락 발달 성질 계기 인식 언어 최적 모사 중앙 집단
        변동 수량 항목 수집 추가 대지 연안 심해 지하 지대 통합 자기 개요
        목차 상승 하락 걷기 소모 배급 접지 계량 침실 감지 재배 실내 실외
        현관 문턱 초점 밝기 음량 수준 작성 식단 회수 인지 몰입 차원 촉각
        공식 유형 돌담길 글씨 이야기 비대칭 장난감 에너지 오솔길 재충전
        캔버스 친환경 수공예 과수원 피크닉 내구성 사이즈 재활용 소지품
        실용성 지속성 탈부착 다양성 편지지 메모장 계획안 작업물 밸런스
        슬랙스 레깅스 아이디어 주방용품 인테리어 들길 바닷길 그림책 동화책
        창가 꽃밭 논두렁 밭두렁 초가집 기와집 돌계단 보리밭 밀밭 콩밭
      `,
    }),
    ...entries({
      reason: "twenty-second-pass-place-path-event-negative-date-or-proper",
      words: `
        정겨운나루 정겨운바닷길 정겨운산길 정겨운들길 정겨운솔길
        정겨운숲길 푸른숲길 볼 정겨운오솔길 푸른흙길 종료 따스한길섶
        경쟁 유산 차분한숲길 너른들길 맑은숲길 너른솔길 맑은흙길
        따스한솔길 따스한나루터 차분한나루 차분한산길 차분한솔길
        고운길섶 푸른글밭 새벽글밭 고운글밭 물길 요일 새벽나루 은빛길섶
        너른공터 차분한공터 정답 푸른길섶 푸른돌길 푸른꽃길 푸른나루
        푸른나루터 은빛솔길 푸른바닷길 푸른산길 푸른들길 푸른솔길
        나무밭두렁 푸른오솔길 삼베밭두렁 너른숲길 고운흙길 은빛산길
        가랑잎길 밝은글밭 밝은길섶 밝은돌길 밝은꽃길 밝은나루 밝은나루터
        밝은바닷길 봄나루 밝은산길 밝은들길 밝은솔길 은빛돌길 밝은숲길
        밝은오솔길 은빛꽃길 은빛나루 산길마루 숲길마루 잠금 새벽꽃길
        따스한꽃길 따스한글밭 따스한바닷길 따스한나루 따스한돌길
        따스한산길 차분한꽃길 너른오솔길 따스한들길 새벽길섶 따스한숲길
        따스한오솔길 차분한돌길 종이밭두렁 새벽돌길 맑은길섶 모시밭두렁
        포근한꽃길 차분한들길 은빛숲길 고요한글밭 고요한길섶 고요한돌길
        고요한꽃길 길잡이 고요한나루 고요한나루터 고요한바닷길 고요한산길
        고요한들길 고요한솔길 고요한숲길 고요한오솔길 새벽숲길 너른글밭
        차분한글밭 너른길섶 너른돌길 너른꽃길 너른나루 너른나루터
        너른바닷길 너른산길 소담한글밭 소담한길섶 소담한돌길 소담한꽃길
        소담한나루 소담한나루터 따스한공터 소담한바닷길 소담한산길
        소담한들길 소담한솔길 소담한숲길 소담한오솔길 소담한공터 책가방
        정겨운글밭 정겨운길섶 정겨운돌길 면밭두렁 데이지 마가렛 새벽공터
        포근한길섶 포근한글밭 은빛글밭 월요일 화요일 수요일 목요일 금요일
        토요일 일요일 한지밭두렁 포근한돌길 파운드 재규어 새벽들길
        새벽솔길 새벽산길 아이리스 은빛들길 자갈길 고운숲길 나무길 흙길
        고운오솔길 맑은오솔길
      `,
    }),
    ...entries({
      reason: "twenty-third-pass-title-or-negative-collision",
      words: "공작 흑비 흑염",
    }),
    ...entries({
      reason: "twenty-fourth-pass-brand-or-animal-collision",
      words: "설빙 메이플 벌레",
    }),
    ...entries({
      reason: "twenty-fifth-pass-negative-household-collision",
      words: "걸레",
    }),
    ...entries({
      reason: "twenty-sixth-pass-negative-household-compound",
      words: "나무걸레 종이걸레 면걸레",
    }),
    ...entries({
      reason: "twenty-seventh-pass-fragment-place-date-or-negative-collision",
      words: "거문 북 소서 주중 지방 흑기",
    }),
    ...entries({
      reason: "thirtieth-pass-food-or-brand-collision",
      words: "당근 멜론",
    }),
    ...entries({
      reason: "thirty-third-pass-drug-place-civic-or-political-collision",
      words: "뽕 수단 개성 보수",
    }),
    ...entries({
      reason: "thirty-fifth-pass-commercial-quality-collision",
      words: "고급 저렴",
    }),
    ...entries({
      reason: "fortieth-pass-relationship-animal-royalty-or-civic-collision",
      words: "관계 모기 스컹크 왕관 지네 평화 연대감",
    }),
    ...entries({
      reason: "forty-first-pass-adult-or-moral-collision",
      words: "순결",
    }),
    ...entries({
      reason: "forty-second-pass-science-or-fragment-collision",
      words: "양수 이인 이각 이분",
    }),
    ...entries({
      reason: "forty-fifth-pass-pest-or-animal-collision",
      words: "거미 박쥐 쥐 뱀 물뱀 원숭이 하이에나",
    }),
    ...entries({
      reason: "forty-sixth-pass-tech-or-web-term-collision",
      words: "깃 쿠키 루비 스프링",
    }),
  ],
  chinese: [
    ...entries({
      reason: "tobacco",
      words: "烟",
    }),
    ...entries({
      reason: "adult-or-sexual-double-meaning",
      words: "高潮",
    }),
    ...entries({
      reason: "place-landmark-or-geopolitical-name",
      words: "普陀 南海 西沙 东沙 黄岩 金门 马祖 澎湖 大连 天坛",
    }),
    ...entries({
      reason: "named-river-lake-or-place-like-label",
      words: `
        珠江 辽河 淮河 海河 洞庭 鄱阳 滇池 巢湖 洱海 阳澄 西江 东江
        南江 北江 沱江 怒江 红河 松江 清江 乌江 涪江 岷江 白河 汉江
        漓江 湘江 赣江 闽江 黑河 渭河 桂江
      `,
    }),
    ...entries({
      reason: "religion-occult-myth-or-holiday",
      words: "魔术 巫师 妖精 幽灵 亡灵 天使 灵魂 中元 天宫 嫦娥 仙女 平安夜",
    }),
    ...entries({
      reason: "medical-anatomy-or-clinical",
      words: `
        愈合 护士 皮肤 细胞 器官 肌肉 骨骼 免疫 生殖 激素 细菌 淋巴
        脊髓 大脑 小脑 脑干 肝脏 肾脏 心脏 胰腺 脾脏 胆囊 毛发 关节
        韧带 肌腱 生理
      `,
    }),
    ...entries({
      reason: "medicine-herb-or-drug-root",
      words:
        "虫草 川芎 白芷 黄连 黄柏 香附 牛膝 杜仲 石斛 麦冬 黄精 地黄 枳实 木通 罂粟 决明子",
    }),
    ...entries({
      reason: "legal-political-or-civic",
      words: `
        审查 备案 批准 赔偿 救济 调解 和解 权利 律师 证人 原告 被告
        案件 权力 人权 公民 改革 民族 制度 民主 条款
      `,
    }),
    ...entries({
      reason: "weapon-combat-threat-or-disaster",
      words: "拳击 武术 射击 塔防 猎人 忍者 敌人 武侠 灾难 反击 警报 刺客",
    }),
    ...entries({
      reason: "card-board-game-or-gambling-adjacent",
      words: "卡牌 纸牌 暗棋 双陆棋",
    }),
    ...entries({
      reason: "brand-product-platform-or-event",
      words: "北斗 奥运 蓝牙 智联 猎云 乐视 咪咕 迅雷 酷狗 虾米 酷我",
    }),
    ...entries({
      reason: "planet-or-celestial-proper-name",
      words: "天王星 海王星 冥王星",
    }),
    ...entries({
      confidence: "medium",
      reason: "place-like-directional-label",
      words: "南澳 北澳 东澳 西澳 南湾 北湾 东湾 西湾",
    }),
    ...entries({
      confidence: "medium",
      reason: "generated-or-poetic-compound",
      words: "青雨 青雪 青露 青霞 青香 白香 绿雪 绿露 绿霞",
    }),
    ...entries({
      confidence: "medium",
      reason: "awkward-childish-or-generated-looking",
      words: "水瓢子 小星星 小太阳 小月亮",
    }),
    ...entries({
      reason: "second-pass-brand-platform-or-social-app",
      words: "优酷 虎扑 陌陌 美克",
    }),
    ...entries({
      reason: "second-pass-planet-or-celestial-proper-name",
      words: "地球 水星 金星 火星 木星 土星",
    }),
    ...entries({
      reason: "second-pass-place-sea-mountain-or-landmark",
      words: "北海 东海 西海 香山 南山 五岳",
    }),
    ...entries({
      reason: "second-pass-lake-or-place-like-label",
      words:
        "东湖 南湖 北湖 龙湖 南岭 南村 南园 南河 南岛 西塔 西港 西岭 西河 西村",
    }),
    ...entries({
      reason: "second-pass-anatomy-or-body-root",
      words: "肺 肝 胃 肾 牙 眼 耳 鼻 喉 脉 胆 骨 脑 肠 齿",
    }),
    ...entries({
      reason: "second-pass-medical-physiology-or-biomedical",
      words: "灸 呼吸 消化 发育 心跳 基因 核酸 遗传",
    }),
    ...entries({
      reason: "second-pass-medicine-herb-or-drug-root",
      words: "枸杞 艾草 陈皮 金银花 银杏叶",
    }),
    ...entries({
      reason: "second-pass-legal-case-evidence-or-civic",
      words: "卷宗 证言 证据 当事人 合规 义务 权益 权限",
    }),
    ...entries({
      reason: "second-pass-religious-ritual-occult-or-myth",
      words: "祈 庵 坛 魂 符文 精灵 信仰 图腾 仪式",
    }),
    ...entries({
      reason: "second-pass-gambling-or-alcohol",
      words: "筹 干杯",
    }),
    ...entries({
      confidence: "medium-high",
      reason: "second-pass-generated-looking-color-nature-compound",
      words: "青沙 绿沙",
    }),
    ...entries({
      reason: "third-pass-place-civic-region-or-opera-label",
      words: `
        市 县 省 府 国 渝 湘 浙 滇 澳 淮 漓 洱 渭 沂 沅 沱 泸 泾 灞
        澧 濮 京剧 豫剧 粤剧 川剧 越剧 黄梅戏 西洋 西域
      `,
    }),
    ...entries({
      reason: "third-pass-royalty-title-or-proper-name-adjacent",
      words: "王 后 皇 侯 伯 卿 帝 君 王子 公主 天王 领主",
    }),
    ...entries({
      reason: "third-pass-software-network-account-or-hardware-jargon",
      words: `
        网络 平台 应用 数据 电子 设备 手机 电脑 平板 耳机 音箱 电信
        通信 宽带 系统 终端 号码 流量 监控 界面 图标 按钮 屏幕 网页
        账号 密码 软件 硬件 程序 备份 共享 设置 版本 下载 上传 带宽
        节点 域名 搜索 引擎 日志 组件 模块 直播 频道 播放 订阅 账户
        画质 字幕 控制器 机器人 显示器 链接 同步 智能 识别 指纹 像素
        导入 导出 保存 模板 兼容 安装 接口
      `,
    }),
    ...entries({
      reason: "third-pass-game-product-or-virtual-jargon",
      words: `
        游戏 任务 装备 技能 地图 副本 公会 玩家 主机 手柄 卡带 游戏展
        游戏机 地下城 虚拟 属性 敏捷 等级
      `,
    }),
    ...entries({
      reason: "third-pass-medical-body-health-or-senses",
      words: `
        胎 嘴 肩 腿 脚 脸 嗓 手指 身体 体重 体型 健康 心理 咨询
        健身 健身房 营养 代谢 繁殖 蛋白 脂肪 触觉 嗅觉 味觉 视觉
        听觉 试管 试剂
      `,
    }),
    ...entries({
      reason: "third-pass-legal-political-finance-civic-or-identity",
      words: `
        权 审 判 罚 证 护照 签证 协议 投资 收益 风险 监督 执行 登记
        申请 公正 正义 自由 平等 权威 银行 发票 身份 隐私 认证
      `,
    }),
    ...entries({
      reason: "third-pass-violence-adult-religion-or-fantasy-risk",
      words: `
        刃 弹 靶 护甲 头盔 对抗 进攻 防守 拦截 骑士 勇士 部落 兽人
        怪物 怪兽 灵 灵性 冥想 恋 婚礼 亲密
      `,
    }),
    ...entries({
      reason: "fourth-pass-malformed-or-foreign-script",
      words: "霧 雲 滝 水獺 苦蕎",
    }),
    ...entries({
      confidence: "medium-high",
      reason: "fourth-pass-generated-looking-material-compound",
      words: `
        木囊 木毯 木被 木巾 木帕 木袱 木烛 木饼 木糕 木丸 木酥 木脆
        木羹 竹被 竹袱 竹炉 竹烛 竹饼 竹糕 竹丸 竹酥 竹脆 竹羹
        纸被 纸枕 纸烛 纸炉 纸杵 纸臼 纸砧
      `,
    }),
    ...entries({
      reason: "fourth-pass-place-region-landmark-or-institution",
      words: `
        东极 大屿 红岛 长山 白山 黑山 青山 红山 金山 银山 铜山 南路
        南桥 南苑 南门 西街 西门 古城 景点 遗址 名胜 古迹 遗产 王国
        度假村 幼儿园 养老院 雕塑公园
      `,
    }),
    ...entries({
      reason: "fourth-pass-brand-platform-software-account-or-media",
      words: `
        品牌 用户 客户 会员 编程 开发 测试 浏览 存储 访问 功能 选项
        窗口 面板 菜单 预览 格式 剪切 缩放 裁剪 点赞 视频 音频 播客
      `,
    }),
    ...entries({
      reason: "fourth-pass-medical-body-herb-or-health",
      words:
        "菌 菌类 护肤 指甲 疲劳 木香 紫草 紫菀 薄荷 桑叶 槐花 槐米 荷叶 蒲公英",
    }),
    ...entries({
      reason: "fourth-pass-legal-political-civic-or-finance",
      words: `
        倡导 证书 证件 领袖 游行 经济 财经 货币 现金 支付 交易 账单
        收银 信用卡 预算 成本 回报 利润 订单 付款 古币 金币 硬币 协会
      `,
    }),
    ...entries({
      reason: "fourth-pass-military-violence-game-or-religion",
      words: `
        符 盔 勇者 柔道 摔跤 防线 象棋 围棋 跳棋 飞行棋 黑白棋
        国际象棋 棋类 棋谱 棋艺 棋手 对弈 对局
      `,
    }),
    ...entries({
      reason: "fifth-pass-person-title-role-or-identity",
      words: `
        老师 教师 教授 校长 院长 导师 助教 专家 学者 学生 同学 校友
        作者 读者 导演 演员 主持 嘉宾 演讲者 经理 裁判 评委 设计师
        摄影师 艺术家 音乐家 雕塑家 消费者 服务员 志愿者 创作者
      `,
    }),
    ...entries({
      reason: "fifth-pass-game-technical-math-or-chemistry-jargon",
      words: `
        棋 棋盘 棋子 参数 变量 函数 导数 矩阵 向量 方程 公式 坐标
        系数 微分 斜率 方差 均值 定理 证明 氧 氧气 氢 氦 氮 钠 钾
        钙 酶
      `,
    }),
    ...entries({
      reason: "fifth-pass-fitness-medical-commercial-or-real-estate",
      words: `
        瑜伽 健美 恢复 监测 产品 商品 价格 销售 买卖 供应 需求 库存
        批发 零售 商家 商贩 商场 商圈 促销 优惠 折扣 消费 兑换 特权
        广告 营销 运营 房产 物业 房东 利益
      `,
    }),
    ...entries({
      reason: "fifth-pass-dating-holiday-or-ritual",
      words: "光棍 寒食 腊八 七夕",
    }),
    ...entries({
      reason: "sixth-pass-negative-shame-failure-distress-or-hazard",
      words: "怒 哀 悲 问题 劣势 失误 悲剧 溺 溃 烟雾 爆竹",
    }),
    ...entries({
      reason: "sixth-pass-industrial-hardware-lab-or-process-jargon",
      words: `
        阀 泵 焊 铸 锻 铣 矿 机床 夹具 磨具 焊接 切割 加工 制造
        生产 车间 仪器 烧杯 天平 电路 电压 功率 电缆 导线 电流 电机
        马达 转子 轴承 扭矩 负载 装配 零件 部件 机械 齿轮 传动 驱动
        线圈 磁场 溶液 试验
      `,
    }),
    ...entries({
      reason: "sixth-pass-math-physics-chemistry-or-software-jargon",
      words: `
        数学 统计 曲线 数列 序列 常数 几何 映射 顶点 半径 直径 运算
        维度 分子 化学 物理 粒子 原子 量子 力学 光学 声学 热量 体积
        密度 波动 折射 频率 硫磺 钴 钛 铬 锰 钨 钼 铋 锗 镓 铌 钽
        锂 铯 铷 铊 镉 锑 注册 连接 传输 维护 支持 升级 优化 更新
        通知 定位 标识 列表 分类 回放
      `,
    }),
    ...entries({
      reason: "sixth-pass-game-competition-award-or-scoring",
      words: `
        金牌 银牌 铜牌 勋章 排行榜 赢家 胜算 胜者 积分 得分 比分 罚球
        点球 联赛 决赛 预赛 复赛 赛程 火炬 竞速 模拟 解谜 生存 养成
        竞技 沙盒
      `,
    }),
    ...entries({
      reason: "sixth-pass-commercial-finance-person-role-or-event",
      words: `
        信用 赞助 物流 商城 购物 票房 票务 机票 预约 评价 作家 诗人
        编剧 歌手 舞者 导游 游客 厨师 画家 观众 球员 教练 选手 买家
        卖家 园丁 才子 才女 名人 明星 文人 艺人 助手 老人 宝宝 青少年
        西子 昆曲 北辰 青年节 儿童节
      `,
    }),
    ...entries({
      reason: "sixth-pass-instrument-specialist-or-fitness-health",
      words: `
        贝斯 小提琴 大提琴 单簧管 电子琴 合成器 扬琴 古筝 琵琶 二胡
        古琴 小号 长号 长笛 体能 锻炼 热身 哑铃 杠铃
      `,
    }),
    ...entries({
      reason: "seventh-pass-finance-commercial",
      words: "币 财 货 价 利 买 卖 供 需 元 店 商 红包 套餐 顾客 摊贩 商会",
    }),
    ...entries({
      reason: "seventh-pass-medical-body-health-or-adult",
      words: "身 体 背 肥 康 健 养 碳水 化妆品 拉伸 耐力 媚 艳",
    }),
    ...entries({
      reason: "seventh-pass-violence-disaster-hazard-or-political",
      words: "震 火山 熔岩 岩浆 喷发 火口 火山口 灰烬 将 侦探 悬疑 调查 口号",
    }),
    ...entries({
      reason: "seventh-pass-religion-ritual-holiday-or-place-institution",
      words: `
        戒 幽 春节 元宵 中秋 端午 重阳 清明 除夕 新年 元旦 冬至 夏至
        秋分 春分 小年 大年 龙舟 舞龙 城堡 城市 村庄 村落 小镇 港口
        空港 灯塔 园区 校园 学校 大学 学院 小学 中学 学府 公园 乐园
        花园 果园 茶园 梅园 竹园 山庄 办公室 加油站 服务站 便利店
        停车场 图书馆 博物馆 艺术馆 文化馆 电影院 音乐厅 体育馆
        展览馆 咖啡馆 游乐场 滑雪场 竞技场 俱乐部 会所 商铺 店铺
        餐厅 茶馆 宾馆 旅馆 旅社 旅店 客栈 宿舍 别墅 公馆 宅邸
        住宅 公寓
      `,
    }),
    ...entries({
      reason: "seventh-pass-software-technical-corporate-or-competition",
      words: `
        交互 构建 计算 原型 逻辑 光盘 线路 管理 流程 规范 覆盖 实施
        资讯 公告 会议 机构 媒体 社区 领导 推广 创业 胜 输 局 赛 竞 榜
      `,
    }),
    ...entries({
      reason: "eighth-pass-fragments",
      words: `
        钥 鹦 鹉 鸳 鸯 蝴 蚂 蜻 蝙 蜈 蟋 蟑 螳 馄 饨 玻 珊 瑚 苜 蓿 橄
        榄 檬
      `,
    }),
    ...entries({
      reason: "eighth-pass-place-like-or-venue-institution",
      words: `
        小溪 柳溪 竹溪 星湾 雪岭 雪湖 雪溪 月湖 星湖 晨溪 白溪 绿溪 小湖
        花溪 梅岭 翠湖 翠岭 云溪 清溪 河湾 湖畔 山路 教室 影院 剧院 画室
        书院 场馆 展厅 展馆 戏院 书店 操场 食堂 饭店 食府 讲座厅 会议室
        实验室 资料室 服务台 咖啡厅
      `,
    }),
    ...entries({
      reason: "eighth-pass-software-media-or-technical",
      words: `
        科技 技术 录音 剪辑 特效 视听 文档 索引 图库 快照 自拍 聊天 充电
        夜视 电视 相机 扬声器 收音机 控制 广播 话筒 播音 电波 电声 电池
        插头 插座 合成 模糊 亮度 对比 饱和 音量 时长 电话 邮件 地址 消息
        图像 录像 字体 布局
      `,
    }),
    ...entries({
      reason: "eighth-pass-commercial-finance-or-role",
      words: `
        市场 集市 商店 展位 摊位 展会 展台 展区 市集 学费 讲师 教员 助理
        乐手 代表
      `,
    }),
    ...entries({
      reason: "ninth-pass-software-technical",
      words: "验证 导航 教程 机器 电器 器械 电源 型号 滤器 操作 调节 指示 过滤 研磨 搅拌",
    }),
    ...entries({
      reason: "ninth-pass-commercial-product-service",
      words: "货物 货架 标签 包装 样品 快递 邮局 包裹 航班 住宿 香水 纪念品",
    }),
    ...entries({
      reason: "ninth-pass-medical-personal-care-or-religious",
      words: "美容 化妆 香氛 光环 幡 幢",
    }),
    ...entries({
      reason: "ninth-pass-place-venue-infrastructure",
      words: `
        机场 车站 码头 超市 工厂 仓库 仓储 街区 街道 公路 大道 车库
        车行 水库 营地 栈房 球场 发球区 广场 胡同 巷子 街角 剧场 画廊
      `,
    }),
    ...entries({
      reason: "ninth-pass-proper-place-geographic-root-or-calendar",
      words: "泗 涪 洛 滁 滕 渤 漳 潍 潞 濉 濠 瀛 嵩 岱 花朝 节气",
    }),
    ...entries({
      reason: "tenth-pass-identity-family-role",
      words: `
        子 父 母 兄 弟 姐 妹 女 士 祖 师 客 主 员 者 儿童 孩子 小孩
        母亲 父亲 父母 兄弟 姐妹 姐姐 弟弟 妹妹 女子 男子 家人 家长
        乘客 旅客 研究生
      `,
    }),
    ...entries({
      reason: "tenth-pass-place-venue-fragment-or-geographic-label",
      words: `
        岛 乡 镇 堡 宫 楼 亭 阁 站 馆 堂 院 舍 苑 居 栈 庐 宅 庄 坊
        大河 小河 大山 小山 海湾 西岸 西北 西南 大街 大楼 家庭日
      `,
    }),
    ...entries({
      reason: "tenth-pass-software-technical-fragment-or-science-math",
      words: `
        视 频 络 网 码 端 控 屏 调频 电台 实验 工程 假设 预测 偏差 极值
        随机 推断 命题 约束 波形 对照 误差 电力
      `,
    }),
    ...entries({
      reason: "tenth-pass-legal-civic-commercial-medical-religion-or-game",
      words: `
        校规 伦理 辩论 局势 决策 责任 劳动 社会 建设 压力 睡眠 反射
        祝福 典礼 宝冠 火焰 火球 黑火 黑洞 泪水 分数 排名 回合 局数
        运气
      `,
    }),
    ...entries({
      reason: "eleventh-pass-gambling-finance-medical-adult-legal-software-hazard-place-or-negative",
      words: `
        卡 牌 票 博 睡 眠 渴 爱 亲 情 娇 红颜 激情 规 则 规则 公平 秩序
        道德 设 备 信号 设施 论坛 火 焰 烈 烟花 焰火 火花 华 泰 西餐
        西式 西部 五湖 乡村 雪山 河畔 西林 遗迹 泪 怜 渣 滥 滞 漏 争
        负 寂 旧 昏 暗 浊 遗物
      `,
    }),
    ...entries({
      reason: "twelfth-pass-place-symbol-religion-fragment-or-negative",
      words: `
        银座 红旗 凤 四象 四书 旌 帜 麾 旗帜 滓 昧 览 务 阅 骤 研 究
        习 演 自 别 然 挖 掘 持 统 交 互 应 用 产 发 创 解 滤 测 练 作
        听 跑 插 遥 洗 吸 聊 招 涂 压
      `,
    }),
    ...entries({
      reason: "thirteenth-pass-fragment-title-civic-medical-award-adult-or-negative",
      words: "芫 荽 槟 榔 芍 出租 潘 李 公 案 监 司 制 人口 醇 经 术 卫 冠 名次 称号 荣誉 荣耀 合欢 垃圾桶",
    }),
    ...entries({
      reason: "fourteenth-pass-fragment-software-legal-place-sports-or-myth",
      words: `
        服 饰 具 朋 范 标 准 讯 所 域 程 蔬 舶 崇 泳 算 资 档 议 方 能
        源 化 令 邮 通 单 旦 旨 昇 昌 易 昔 昨 评 据 件 式 类 播 对 款
        把 正 接 部 系 决 助 项 序 几 阶 极 值 率 差 积 定 列 相 间 开
        关 全 广 同 位 级 电 机 路径 循环 状态 提醒 移动 档案 车牌
        年报 地点 海域 比赛 竞赛 赛季 赛事 网球 篮球 足球 排球 赛车
        手球 棒球 赛艇 球队 球门 进球 前锋 中场 后卫 角球 助攻 替补
        平局 球衣 球鞋 球棒 壁球 集训 观赛 赛后 铅球 本垒 一垒 二垒
        三垒 投手 篮筐 控球 传球 篮板 快攻 上篮 首发 球技 射门 替换
        传中 接球 羽毛球 高尔夫 橄榄球 曲棍球 大龙 红龙
      `,
    }),
    ...entries({
      reason: "fifteenth-pass-gambling-identity-action-legal-science-or-sports",
      words: `
        黑桃 红心 英雄 粉丝 巨人 影迷 智者 听众 高手 新手 铁人 哥哥
        乐迷 观看 使用 倒入 定律 冰球 体育 球网 球拍 发球 接发 回球
        击球 球迷 果岭 球杆 球洞 球包 乒乓 田径 体操 马术 滑冰 跳水
        水球 飞盘 举重 网前 后场 前场 单打 双打 三分
      `,
    }),
    ...entries({
      reason: "sixteenth-pass-abstract-education-identity-safety-adventure-industrial-or-place-like",
      words: `
        命运 奇迹 秘密 宣传 周边 联盟 盟友 胜利 对手 训练 运动 评分 竞争
        轮次 考试 论文 培训 实习 本科 学位 学分 文凭 考卷 面试 成绩
        成绩单 课程表 科学 学术 研究 理论 原理 天文 地理 标准 测量 日程
        家族 亲情 人际 自我 个人 人人 群体 人才 天才 先锋 榜样 典范
        安全 保护 礼仪 礼节 冒险 探险 刺激 奋斗 拼搏 燃料 重金属 青泉
        林岸 小屿 花径 雪域 乐土 白泉 香泉 暖泉 清泉 石径 石泉 晴野
        冬泉 晴川 芳林 林泉 山泉 翠峰 青林 绿林 绿泉 远山 远岚 秋岚 春岚
      `,
    }),
    ...entries({
      reason: "seventeenth-pass-celestial-geography-education-or-school",
      words: `
        星河 银河 白洞 山脉 湖泊 河流 岛屿 冰川 冰山 冰河 海岸 海峡
        山谷 山脊 山丘 高峰 雪峰 雪谷 雪川 雪滩 雪堡 戈壁 绿洲 课堂
        课程 教材 课本 教育 作业 辅导 学期 学科 班级 测验 选修 必修
        评估 毕业 入学 学堂 校刊 校车 校服 校徽 校史 校庆 学友 学会
        科教 作文 大考
      `,
    }),
    ...entries({
      reason: "eighteenth-pass-education-organization-event-media-sports-or-place",
      words: `
        社 会 组 群 族 课 班 校 学 教 试 考 讲 队 文学 哲学 讲座 讲义
        讲解 学习 演讲 研讨 讲习 研讨会 练习 复习 展览 博览 博览会
        社团 组织 团队 队伍 乐队 聚会 舞会 宴会 年会 晚会 音乐会 电影
        新闻 报告 期刊 广播剧 游泳 跑步 跑道 跳绳 农场 牧场 场地 场所
        大桥 天桥 街 路
      `,
    }),
    ...entries({
      reason: "nineteenth-pass-education-performance-media-event-sports-celestial-or-chance",
      words: `
        小测 暑假 寒假 字母 拼音 考古 吉他 乐团 指挥 编舞 独奏 歌剧
        交响 摇滚 爵士 民谣 说唱 蓝调 嘻哈 舞曲 朋克 编曲 演奏 和声
        演唱 演技 排练 台词 独白 剧目 剧评 观演 演艺 演绎 戏班 剧作
        话剧 舞剧 小品 朗读 专辑 单曲 综艺 访谈 预告 剧照 插曲 配音
        影展 影评 观影 影片 剧集 短片 长片 喜剧 科幻 纪录片 派对 盛典
        音乐节 美食节 动漫展 艺术节 冰壶 滑雪 徒步 骑行 潜水 冲浪
        滑板 攀岩 探洞 漂流 越野 轮滑 滑翔伞 路口 行星 卫星 彗星
        光年 天体 星座 好运 幸运
      `,
    }),
    ...entries({
      reason: "twentieth-pass-doc-media-role-transit-celestial-luck-science-or-abstract",
      words: `
        诗 文 词 句 章 题 论 言 刊 报 典 卷 页 字 籍 册 稿 版 传
        辞 历 赋 读 写 书籍 文献 摘要 知识 信息 资料 提纲 案例
        分析 总结 观点 话题 字典 手册 插图 目录 书名 翻译 阅读 启蒙
        小说 散文 名著 传记 图纸 报纸 信函 画册 样本 草图 文章 读物
        百科 辞典 年鉴 书信 计划书 明信片 笔记本 章节 文字 书展 舞
        歌 唱 戏 剧 团 琴 笛 锣 铙 笙 箫 弦 曲目 艺术 音乐
        舞蹈 绘画 摄影 雕塑 戏剧 诗歌 动画 时尚 乐器 合唱 作曲 戏曲
        杂技 表演 作品 展品 文物 古玩 古籍 邮票 漫画 照片 唱片 乐谱
        音响 动漫 海报 剧情 音效 舞台 灯光 道具 服装 面具 场景 剧本
        情节 演出 旋律 节拍 舞狮 花车 画作 创作 剧团 古装 文艺 真人
        对话 情景 纪录 片头 片尾 演示 古典 潮流 相册 镜头 色彩 构图
        拍摄 光线 背景 视角 活动 项目 展示 交流 体验 盛会 节日 旅行
        旅程 游记 游览 休闲 假期 露营 野餐 观光 指南 日记 回忆 娱乐
        分组 放映 系列 评论 讨论 分享 推荐 制作 发行 社交 互动 示范
        探讨 线索 答案 探索 合作 发现 服务 职业 生涯 参与 经验 提升
        联系 关系 庆典 理念 价值 信念 愿景 使命 方向 步骤 行动 成果
        贡献 引导 促进 进步 发展 趋势 方案 解决 未来 效果 优势 行业
        动态 模式 日期 位置 中心 区域 标志 礼品 食品 宠物 口碑 信誉
        信任 品质 环保 回馈 满意 团体 透明 诚信 机会 朋友 伙伴 友人
        知己 邻居 信使 人物 人像 肖像 家庭 童年 青春 车 船 舟 筏
        帆 航 舵 艇 驾 轮 轿 轨 舫 舸 航线 航标 飞机 火车
        摩托 公交 轿车 卡车 货车 轮船 单车 电车 巴士 地铁 帆船 游艇
        运输 飞船 热气球 滑翔机 车窗 车顶 车门 车轮 小车 小船 步行
        宇 宙 宇宙 星星 飞行 天空 星辰 流星 星光 星球 星空 星系
        星云 星海 太阳 月亮 月光 夜空 星辉 星灯 天际 天边 云海 福
        缘 祥 吉 瑞 运 贺 祝 祝愿 吉祥 团圆 团聚 生日 庆祝 祝贺
        生物 两栖 昆虫 鱼类 矿物 气体 地热 热泉 图表 颜色 数字 图形
        构造 结构 化石 恐龙 石英 石膏 滑石 长石 辉石 石墨 硅石 萤石
        生长 平衡 协调 意识 事件 分布 比例 相关 条件 连续 面积 变化
        平面 性质 范围 相似 对称 集合 数值 概念 形式 分配 排列 解答
        结论 生命 大气 湿度 效率 原料 成品 现象 培养 重复 实践 实例
        传播 物质 质量 发明 核心 水平 进程 表现 态度 类型 热度 难度
        智力 局面 局部 全局 局限 沉浸 虚构 设定 寓意 印象 亮点 清洁
        开关 温度 浓度 容量 重量 工序 用途 过程 结果 观察 视野 角度
        细节 记录 生态 环境 气候
      `,
    }),
    ...entries({
      reason: "twenty-first-pass-doc-media-place-luck-transit-science-or-abstract",
      words: `
        谜 锁 房 图 道 友 书 梦 影 语 画 海 泉 桥 家 愿 话 知
        库 像 台 技 展 室 区 阳 月 星 游 玩 宴 旅 途 天 空 峰
        洞 川 隧 洲 洋 岳 本 信 问 表 录 厅 户 计 庭 吧 赞
        誉 名 篇 仪 答 链 数 速 热 煤 炭 球 寿 雷 铅 铝 锌
        镍 锡 号 印 记 邻 约 雹 毛 皮 史 说 铺 策 镁 陆
        拍 垒 幕 秒 伴 顺 历史 文化 语言 主题 内容 反馈 建议
        计划 目标 策略 技巧 要点 资源 故事 传说 传奇 寓言 童话
        角色 幽默 情感 声音 动作 形象 风格 传统 节奏 表情 创意
        幻想 梦境 设计 印刷 收藏 模型 符号 印记 拼图 温泉 航海
        滑翔 游乐 反应 速度 配乐 影像 片段 经典 梦想 感受 元素
        画面 情绪 图案 笔记 封面 习惯 兴趣 愿望 陪伴 画展 高度
        日出 日落 树屋 步道 图书 小路 幸福 友谊 桥梁 诗篇 乐章
        舞步 隧道 拱桥 悬桥 手稿 指导 书屋 钢琴 心灵 能量 心境
        边界 梦幻 空间 房屋 列车 行程 航图 油画 水彩 素描 信件
        名片 层次 框架 音色 音调 友情 祥和 美梦 信封 信纸 博物
        院子 阳台 庭院 温室 海滩 房子 房间 楼房 单元 日历 小组
        心情 奇幻 杂志 喜好 出行 徽章 钱包 推理 判断 谜团 地壳
        岩层 陀螺 弹珠 轨道 画画 玩耍 玩伴 卡通 滑梯 秋千 装置
        黑板 特征 海底 海沟 海流 动力 观摩 志愿 出版 美术 图画
        爱好 呐喊 观赏 舞美 戏台 音域 音阶 和弦 乐感 静物 抽象
        写实 透视 明暗 质感 笔触 意境 鉴赏 临摹 写生 速写 工笔
        写意 丹青 彩绘 粉彩 水墨 白描 重彩 淡彩 泼墨 泼彩 点彩
        线描 勾勒 渲染 晕染 草稿 色调 协作 进度 叙述 阴影 高光
        边框 歌声 曲调 音质 乐坛 音律 歌谣 曲风 前程 乐音 古代
        幻境 意见 名画 友爱 艺术品 音乐剧 儿童剧 古生物 金刚石
        方解石 白云石 铝土矿 钾长石 钠长石 石灰石 黄铁矿
      `,
    }),
    ...entries({
      reason: "twenty-second-pass-doc-media-event-place-or-material-collision",
      words: `
        书包 书房 白书 画卷 壁画 节目 乐曲 音符 音轨 歌唱 歌舞 乐声
        欢歌 盛宴 宴席 聚餐 欢庆 喜庆 沙龙 旅途 行李 森林 沙滩 峡谷
        瀑布 海洋 沙漠 草原 山巅 湖面 海边 峰顶 林间 林地 田园 大海
        雪原 湿地 沙洲 晴空 蓝天 象牙
      `,
    }),
    ...entries({
      reason: "twenty-third-pass-chemical-myth-illusion-or-place-collision",
      words: "溴 鸾 幻 幻影 四海 四平 普洱",
    }),
    ...entries({
      reason: "twenty-fourth-pass-fragment-negative-media-or-body-collision",
      words: "日 干 穴 乐动 音悦",
    }),
    ...entries({
      reason: "twenty-fifth-pass-negative-fragment-or-myth-collision",
      words: "溲 湎 湮 泯 潲 俗 假 坑 渍 渎 滚 鲲",
    }),
    ...entries({
      reason: "twenty-sixth-pass-place-collision",
      words: "黄石",
    }),
    ...entries({
      reason: "twenty-seventh-pass-place-food-animal-or-fragment-collision",
      words: "草 白沙 朝阳 菊花 绿茶 韭菜 黄牛 黑木耳",
    }),
    ...entries({
      reason: "thirty-second-pass-negative-fragment",
      words: "苦",
    }),
    ...entries({
      reason: "thirty-third-pass-negative-compound",
      words: "苦果 酸葡萄",
    }),
    ...entries({
      reason: "thirty-fifth-pass-negative-fragment",
      words: "阴",
    }),
    ...entries({
      reason: "thirty-sixth-pass-commerce-place-civic-or-negative-collision",
      words: "奢华 木兰 黑冰 变革 和平 团结 名品 佳品",
    }),
    ...entries({
      reason: "forty-first-pass-pest-or-stinging-insect",
      words: "蚊 蝇 蝎 蚊子",
    }),
    ...entries({
      reason: "forty-fourth-pass-disaster-or-pest-collision",
      words: "旱 蝗 蝗虫",
    }),
    ...entries({
      reason: "forty-sixth-pass-animal-collision",
      words: "蝙蝠 黑蝙蝠",
    }),
    ...entries({
      reason: "forty-ninth-pass-brand-or-common-fruit-collision",
      words: "苹果",
    }),
    ...entries({
      reason: "fiftieth-pass-animal-collision",
      words: "鸡 鸭",
    }),
  ],
  japanese: [
    ...entries({
      reason: "adult-dating-sexual-or-relationship",
      words: `
        こい かれし よめ つきあい あいする あいじょう ひとづま しょじょ
        はなよめ こんやく よくぼう じょそう つきあう かいらく いとしい
      `,
    }),
    ...entries({
      reason: "alcohol-gambling-finance-or-auction",
      words:
        "さけ いざかや がちゃ かぶぬし かぶか そうば しょうちゅう くじ いんしゅ らくさつ さいころ あまざけ",
    }),
    ...entries({
      reason: "medical-symptom-anatomy-pharmacy-or-treatment",
      words: `
        いがく げか にきび ずつう べんぴ めんえき にょう しゅっけつ
        かんぞう ますい まひ やっきょく ないか けつあつ どうみゃく
        にんぷ じんぞう りょうよう ふくよう せきずい
      `,
    }),
    ...entries({
      reason: "political-or-legal",
      words: `
        せいふ ほうりつ とうひょう しゅしょう けんぽう こっかい ないかく
        てんのう みんしゅ そしょう そうり はんけつ しほう ちじ ほうてき
        ひこく とうち さよく せんのう しゅのう うよく よとう かんぜい
        あんぽ りっぽう みんぽう
      `,
    }),
    ...entries({
      reason: "military-violence-disaster-crime-or-threat",
      words: `
        いくさ じこ ひがい たたかい ぼうえい さいがい かたな あぶない
        げんぱつ ぶそう ほうしゃ ふくしゅう しんりゃく しんさい しょうぼう
        どろぼう ついらく らち かくとう つなみ ほりょ くうぼ ふんそう
        ぼうどう むち おどし あらす こくぼう こうずい おの とりで
        ようさい はんぎゃく きずつける
      `,
    }),
    ...entries({
      reason: "religious-occult-or-ritual",
      words: `
        まほう たましい てんし おに まじょ ようかい てんごく めがみ
        うらない しんわ ゆうれい ぎしき いのり まおう しんとう すうはい
        みこ くよう おんみょう かぐら
      `,
    }),
    ...entries({
      reason: "place-brand-index-or-demonym-risk",
      words: "りょうこく ぎふ にっけい",
    }),
    ...entries({
      reason: "slang-malformed-stem-clipped-filler-or-awkward-katakana",
      words: `
        まじ すげ めっちゃ やばい すっごい どや こまか すばらし
        がっつり ばりばり ざっくり かたかな ぐる くっく いっと
        ちゃり こすもす
      `,
    }),
    ...entries({
      confidence: "medium",
      reason: "common-name-reading",
      words: "さかい はやし いぬい ゆり なぎさ りか",
    }),
    ...entries({
      confidence: "medium",
      reason: "repeated-mimetic-or-filler",
      words: "ごろごろ ただただ ふわふわ ぐるぐる がちがち もやもや",
    }),
    ...entries({
      reason: "second-pass-relationship-or-dating",
      words: "あい であい",
    }),
    ...entries({
      reason: "second-pass-medical-body-anatomy-or-treatment",
      words: `
        しんたい さいぼう しんけい きんにく かいぼう しょうどく
        こっかく みゃく ちゆ そせい べんじょ
      `,
    }),
    ...entries({
      reason: "second-pass-alcohol-venue-or-process",
      words: "さかば じょうぞう",
    }),
    ...entries({
      reason: "second-pass-finance-tax-or-accounting",
      words: `
        ぎんこう とうし きんゆう かぶしき のうぜい かぜい ぞうぜい
        げらく ふきょう けいり ふりこみ はいとう
      `,
    }),
    ...entries({
      reason: "second-pass-legal-or-crime",
      words:
        "いほう ごうほう ほうてい ほうれい みんじ ほうか ほうふく れんこう",
    }),
    ...entries({
      reason: "second-pass-disaster-violence-or-conflict",
      words: "たいふう ほうかい たたかう あらそう てんらく ぼっぱつ",
    }),
    ...entries({
      reason: "second-pass-religious-clergy-or-pilgrimage",
      words: "しさい しんぷ そうりょ じゅんれい",
    }),
    ...entries({
      reason: "second-pass-political-title-empire-or-dynasty",
      words: "こうしつ だんしゃく おうちょう ていこく",
    }),
    ...entries({
      reason: "third-pass-adult-or-relationship",
      words: "つま おっと ふうふ こうさい",
    }),
    ...entries({
      reason: "third-pass-alcohol-or-gambling",
      words: "さかずき かんぱい はなふだ",
    }),
    ...entries({
      reason: "third-pass-medical-body-or-anatomy",
      words: `
        からだ かお あたま くち あし むね ゆび うで はら せなか
        こし ひざ ほね おなか のど つば あせ なみだ おやゆび てあし
        しろめ ひじ てのひら あしくび まゆ めだま ゆびさき ひふ
        しきゅう しりょく たいじゅう こきゅう しんちょう たいかく
        けんこう しょうじょう とうにょう しょうに ほっさ しょほう
        せっしゅ かいご だつもう たいちょう はっきょう
      `,
    }),
    ...entries({
      reason: "third-pass-legal-political-or-civic",
      words: `
        けいやく こっか とりひき けんり しょうこ ぜい ぎむ ぎょうせい
        きそく きてい めんきょ じち ごうい せいとう つうほう こくりつ
        ぎかい こくえい こくせい かくりょう ほうせい じゅんさ けつぎ
        はんれい もうしたて こっき あいこく ぼこく そこく たこく
        たいこく やくしょ やくしょく げんこく かけつ とくひょう
        ちょうかい けんさつ ゆうざい むざい じょうれい べんご
        きょうじゅつ せんこく しっこう ていけつ
      `,
    }),
    ...entries({
      reason: "third-pass-finance-tax-or-accounting",
      words: `
        しゅうにゅう きゅうりょう しはらい きんがく つうか しへい
        かけい こぜに きんこ ねさげ ねあげ ねびき ぶっか もうける
        もうかる ししゅつ へんさい さいむ しょとく かんさ かかく
        しょうひ しじょう ひよう ていか げつがく やすね
      `,
    }),
    ...entries({
      reason: "third-pass-military-violence-crime-or-disaster",
      words: `
        やり ゆみ かんたい じえい せんご せんりゃく せめ あらそい
        けいび けいじ けいかい だっしゅつ いじめ しゅつどう
        きょうぼう ちょうはつ ちょうえき ぼうご ぼうび しゅりょう
        しきょ ざいあく けんどう からて
      `,
    }),
    ...entries({
      reason: "third-pass-religion-or-occult",
      words: "ようせい せいれい まもの まりょく みこと しと",
    }),
    ...entries({
      reason: "third-pass-software-hardware-or-jargon",
      words: `
        けんさく とうろく せってい しょり せつぞく にゅうりょく
        たんまつ じっそう しゅつりょく へんすう かくちょう そうち
      `,
    }),
    ...entries({
      reason: "third-pass-generated-looking-compound",
      words: `
        たけこづつみ きこづつみ かみこづつみ いとこづつみ
        たけこぶくろ きこぶくろ かみこぶくろ いとこぶくろ
        まめこぶくろ こめこぶくろ むぎこぶくろ はっぱこぶくろ
        はなこぶくろ くさこぶくろ
      `,
    }),
    ...entries({
      reason: "fourth-pass-medical-body-or-anatomy",
      words: "ぞうき たいしゃ",
    }),
    ...entries({
      reason: "fourth-pass-identity-place-title-or-royalty",
      words: `
        くに がいこく こくない こくないがい くにぐに しゅと みんぞく
        みょうじ おう ひめ おうじ じょおう との はくしゃく おうひ
        おうじゃ おうざ しゃちょう かいちょう ぶちょう せんちょう
        がくちょう
      `,
    }),
    ...entries({
      reason: "fourth-pass-legal-political-civic-or-finance",
      words: `
        りえき ゆうし きょか ほしょう しんせい けんりょく れんぽう
        がいこう うったえ こよう せいきゅう わりびき かせぐ じょうと
        ちょうしゅう きゅうふ かいやく しょうだく ちんたい めんじょ
        しょうほう たがく しんたく てっぱい かくぎ かねもち まずしい
        びんぼう ふごう
      `,
    }),
    ...entries({
      reason: "fourth-pass-military-violence-crime-disaster-or-death",
      words: `
        めいれい しれい はっしゃ かいぞく かいじゅう かいぶつ めつぼう
        とどめ ぜっきょう ぶじょく ぞうお ほろび まいそう そうしき
      `,
    }),
    ...entries({
      reason: "fourth-pass-religion-occult-or-ritual",
      words: "みや おんりょう めいそう",
    }),
    ...entries({
      reason: "fourth-pass-software-technical-jargon",
      words: "けいたい はいれつ ざひょう",
    }),
    ...entries({
      confidence: "medium-high",
      reason: "fourth-pass-generated-looking-or-malformed",
      words: `
        きさら きたな きつくえ きござ きかさ きひがさ きなふだ
        きえふだ きまきもの きつつみ きとじひも きおてだま
        きおりがみ ききりえ きちぎりえ ききゅうす
      `,
    }),
    ...entries({
      reason: "fifth-pass-body-or-anatomy",
      words: "くちびる てくび かみのけ くろかみ まえがみ えら",
    }),
    ...entries({
      reason: "fifth-pass-title-royalty-identity-place-or-demonym",
      words: `
        せんせい はかせ きょうじゅ ぎちょう こうちょう てんちょう
        かんちょう いんちょう かちょう だんちょう しょちょう
        ばんちょう こくおう おうじょ おうこく おうべい かんとく
        せんしゅ せんぱい よこづな りきし ぜんこく こくさい かいがい
      `,
    }),
    ...entries({
      reason: "fifth-pass-legal-political-finance-or-negative",
      words: `
        けいざい かくめい じょうやく きやく ぜいこみ きんり しはらう
        ほうしゅう ついほう ふほう しゃくほう えいり ゆうふく
        ちょうじゃ げっしゅう たいきょ はんそく はんする おきて
        ぜつぼう しつぼう くのう ざせつ さいてい めいわく ひどい
        じゃま ずるい ずる いつわり きょぎ なさけない だいなし
        きょひ むりょく
      `,
    }),
    ...entries({
      reason: "fifth-pass-threat-violence-or-distress",
      words: `
        ひめい さけび さけぶ しょうげき あっぱく けいほう ぼうそう
        とらえる おいだし まっしょう かっとう
      `,
    }),
    ...entries({
      reason: "sixth-pass-adult-relationship-medical-body-or-symptom",
      words: "かれ つめ ほお くうふく やせる もうそう げんかく",
    }),
    ...entries({
      reason: "sixth-pass-death-ritual-occult-or-legal-political-civic",
      words: `
        いれい ついとう にんぎょ ばけ こうふ しゅつば にゅうたい
        はばつ こっこう もんぶ
      `,
    }),
    ...entries({
      reason: "sixth-pass-place-institution-corporate-or-negative",
      words: `
        とうだい ちめい めいしょ しゃめい へいしゃ ふはい けんお
        ぼうめい ろうえい とうわく
      `,
    }),
    ...entries({
      reason: "seventh-pass-negative-insult-distress",
      words: `
        がき だめ わるい むり いや まけ むだ こまる はずかしい なやみ
        あっか へた くろう うるさい むなしい さびしい いらいら しっと
        あやしい そんがい にせ ぎわく きつい まける ふのう かなしみ
        うしなう ひげき くずれ くるしい はいぼく ざつ さわぎ まよい
        かなし あくむ やっかい くるしみ ぎそう しっかく しつぎょう
        うんざり こんわく きょぜつ だまし はきけ あくい ぐち しんどい
        ひきょう むのう とらわれ やぶれ きらう ふちょう ぜいじゃく
        あわれ ためいき あやまち くるい かしつ すさまじい せつない
        さっかく
      `,
    }),
    ...entries({
      reason: "seventh-pass-finance-legal-political-identity-corporate",
      words: `
        うりあげ ばいきゃく かいけい ざいせい ばいしゅう そうぞく
        いたく とっきょ てんばい きゅうよ しゅうえき あかじ けっさい
        ざいむ かわせ けいひ にゅうさつ めいがら もうけ じゅちゅう
        こくせき かっこく とうきょく じんしゅ ざいにち にゅうこく
        しょうひょう きみつ こくゆう ぜんべい じつめい ほんみょう
        あだな べつめい ほんしゃ とうしゃ しゃない かくしゃ
      `,
    }),
    ...entries({
      reason: "seventh-pass-medical-body-religion-death-occult-or-violence",
      words: `
        ないぞう ふしょう あんま たいない じんたい けあな てあて
        はっしょう かんせつ せいたい べんき けいぶ きせき いのる はか
        ぼうず ぼち せっきょう さんぱい ぼくし しゅくふく けんじゃ
        かさい わな たいけつ たおす ぼうぎょ にんじゃ さむらい
        かいめつ きょうき ひょうてき ごえい ていさつ じゅうどう
        でんげき よろい ふんか しっそう ほかく たいじ せんにゅう
        ぶし くんしょう
      `,
    }),
    ...entries({
      reason: "seventh-pass-software-technical-jargon-or-malformed",
      words: `
        あんごう すうち かんすう しすう しひょう たんし だいすう
        ていすう けいすう でんりゅう でんあつ でんじ こうあつ おんぱ
        ぶつり りけい りつ しゃ しゅ ほんと やっぱ ちょい とんでも
        ごく じゃく ぞく まぢか おた あんだ ちと べた ぶつ とつ
        ずい へき めんどい ばあ
      `,
    }),
    ...entries({
      reason: "eighth-pass-finance-commerce-corporate",
      words: `
        かいしゃ きぎょう はつばい はんばい こうにゅう よやく こうこく
        こきゃく しょうぎょう ざいこ ねんしゅう ちょうたつ しょうばい
        ぼうえき しゅっか じきゅう かいとり ふさい はんがく はっちゅう
        うりば
      `,
    }),
    ...entries({
      reason: "eighth-pass-legal-political-civic",
      words: `
        ようぎ ちょさく じゅうしょ しょゆう しょじ こっきょう きふ
        ばいしょう もちぬし ほゆう こくど けんい にんか うったえる
        たんぽ
      `,
    }),
    ...entries({
      reason: "eighth-pass-medical-body-health-or-identity",
      words: `
        ねつ えいよう やせ きゅうきゅう よぼう たいしつ しんりょう
        あご ひげ きんぱつ ひやけ めす
      `,
    }),
    ...entries({
      reason: "eighth-pass-violence-disaster-crime-threat-or-negative",
      words: `
        ひさい けいこく ぜつめつ きゅうじょ ぼうさい くつう はんこう
        ぶしょう むりやり ゆうがい つぶす くるしむ つぶれ まいご
        もんだい うそ しんぱい ごみ やろう めちゃくちゃ あくしつ
        にせもの わるぐち おろか くやしい くじょう むしょく かこく
        しょうしつ
      `,
    }),
    ...entries({
      reason: "eighth-pass-software-media-place-or-malformed",
      words: `
        どうが がぞう でんわ でんし つうち じまく ばいたい えき
        えきまえ くうこう ばんぱく からおけ ばいばい けたい いお
        ぶい
      `,
    }),
    ...entries({
      reason: "ninth-pass-political-legal-civic",
      words: `
        やとう たいし しょめい ろうどう ざんぎょう じんじ じしょく
        にんめい めいぼ じょうむ みんえい じしゅく
      `,
    }),
    ...entries({
      reason: "ninth-pass-commerce-finance-industrial-or-medical",
      words: "しいれ せったい ゆうりょう げんゆ きゅうゆ しわ びよう けしょう かび",
    }),
    ...entries({
      reason: "ninth-pass-violence-negative-user-hostile",
      words: `
        たたく くじょ はいじょ にげる さまたげ そがい いんぺい ごくひ
        くろまく ふとう ふりょう はずれ つぶし だったい れんぱい
      `,
    }),
    ...entries({
      reason: "ninth-pass-software-technical-media",
      words: "せいぎょ ぞくせい じっこう ふくせい てんぷ さくじょ ろくが いんさつ",
    }),
    ...entries({
      reason: "ninth-pass-fragments-malformed-or-names",
      words: "きえ たけえ まめえ あで おも とめ ふれ ちら てい ごび かそ ひこ ざい ふよ びみ きよ",
    }),
    ...entries({
      reason: "tenth-pass-gambling-or-medical-body",
      words: `
        きさいころ たけさいころ かみさいころ いとさいころ せき つかれ
        つかれる ふるえ ふるえる ひとみ こぶし りょうて みぎて ひだりて
        つら てさき はみがき
      `,
    }),
    ...entries({
      reason: "tenth-pass-legal-political-civic-place-or-software-security",
      words: `
        こうほ きせい きょうせい ふくし しんがい しゅっしょ けんない
        とない こくがい しょこく りょうど こくどう いせき そうさ
        かんし きどう にんしょう かいどく
      `,
    }),
    ...entries({
      reason: "tenth-pass-finance-commerce-industrial",
      words: `
        はらう はらい かせぎ かせげる かくやす うりきれ せきゆ じゅきゅう
        ぶつりゅう さいくつ ばいよう ようせつ ゆにゅう ゆしゅつ
        りゅうつう そうりょう そんしつ とみ こづかい
      `,
    }),
    ...entries({
      reason: "tenth-pass-violence-negative-user-hostile-or-religion",
      words: `
        まちがい まちがえる きんきゅう しょうめつ そうしつ ふそく おくれ
        おくれる ておくれ よわい にがて ひてい ほうち しつれい しつこい
        ついせき おいかける きゅうしゅつ きゅうさい じょきょ てっきょ
        とりのぞく きゃっか ごきぶり ごみばこ かわいそう むよう ねらう
        えもの ほしょく たんてい しんぴ
      `,
    }),
    ...entries({
      reason: "eleventh-pass-function-word-pronoun-identity-place-medical-religion-technical-negative-or-fragment",
      words: `
        ちょっと すぐ もっと とても なぜ かなり やっぱり ほぼ もし
        やはり なるほど みずから いったい まさに まさか まるで まだまだ
        あんまり とっても けっして もはや いちおう あらためて だいたい
        きわめて あえて あくまで まして ますます せめて やがて はたして
        ただちに ばっちり あらかじめ いまいち まんがいち せいぜい
        かえって よほど さほど ひとまず まったく まず あまり たまに
        たまたま いまさら しょっちゅう まさしく ありのまま きみ われ
        みな こども おとこ おんな じょせい だんせい おや あに あね
        むすめ ははおや ちちおや まご そふ そぼ おば おじ じい
        ちょうじょ としより わかもの みうち しんせき しんぞく こそだて
        ぬし でし りじ ぶか てんしゅ しんし むらびと みならい まち
        しま むら ちいき ちほう げんち しきち えいせい しんり いやし
        まつり でんぱ でんりょく ごさ きたない はじ すいたい おとろえ
        たおれる ぼろぼろ ぽい
      `,
    }),
    ...entries({
      reason: "twelfth-pass-function-word",
      words: `
        すこし ずっと すべて ちゃんと たしか ほとんど とりあえず
        なかなか しっかり きっと かならず どうぞ よろしく すでに
        ゆっくり とにかく そろそろ もっとも やっと かつて ついに
        はっきり いっさい ふたたび たった いきなり おそらく もともと
        どうせ わざわざ わずか せっかく ようやく おなじく たしょう
        ときどき きちんと さっさと ただ たんに だいぶ まれ いかが
        ひさびさ まいど とっとと あれこれ よっぽど ついつい おおむね
        めった ことごとく すみやか だらだら じわじわ ときおり ゆったり
        まったり たびたび なおさら ちょっぴり
      `,
    }),
    ...entries({
      reason: "twelfth-pass-identity-finance-legal-software-negative-or-fragment",
      words: `
        じょし おんなのこ しょうじょ だんし おとこのこ びじょ おとめ
        あにき しゅふ じょしゅ むりょう えいぎょう けいえい てんぽ
        ぎょうむ しょくば ぎょうしゃ きんむ じむ しゅうしょく おうぼ
        めんせつ じゅうぎょう にゅうしゃ てんしょく しゅうかつ ないてい
        じつむ にゅうかい ゆそう たくはい はいそう うんそう きゅうぎょう
        しめきり かんばい もうしこみ しゅぎ せいど しちょう こうきょう
        とういつ はいし れんごう かいかく くみあい みんしゅう せいてい
        てっかい もうしで ぎじゅつ かいはつ さつえい ついか ひょうじ
        きろく へんしゅう せっけい ていし さいせい しゅうろく じっきょう
        とうこう そうにゅう けいそく きごう ぶんき かきこみ かきかえ
        かくのう たいりつ そうどう しんにゅう あつりょく おおさわぎ
        つかまる やぶる ふんとう のがれる とうそう むちゃ きょうれつ
        れっか ちこく ふざい まよう じゅうたい じゅつ がり らい はや
        ぶち
      `,
    }),
    ...entries({
      reason: "thirteenth-pass-medical-place-identity-legal-disaster-adult-or-function",
      words: `
        のう きも こり せいけい こうそ たいりく ほんど はんとう れっとう
        しゅうらく ばんち せいち かぞく むすこ おとうと いもうと
        きょうだい おやこ いとこ ふたご あかんぼう せんぞ いぞく
        だんじ こぞう おやじ ほしゅ すり みすい かがい かじ ごうう
        かやく ほれ よっきゅう ぜひ しばらく そもそも ちょうど あんな
        いくら さすが すっかり こっそり いかに ふと そこそこ やたら
        わざと じっと ずいじ いっそ のんびり じっくり ただいま
        いちいち おおいに うっかり そっと とうとう あっさり ひたすら
        ともかく いよいよ たっぷり さっそく ぎりぎり なるべく いまだ
        ぴったり ほっと およそ さっぱり はやばや
      `,
    }),
    ...entries({
      reason: "fourteenth-pass-function-fragment-medical-place-title-finance-software-negative-or-sports",
      words: `
        とくに いがい ぜったい じっさい はじめて ひじょう けっきょく
        いっぱい しょうじき つうじょう ちょくせつ こんご さまざま
        ほんらい あたりまえ しだい どうよう たいてい つね つぎつぎ
        つくづく しばしば てっきり とりわけ いっそう ひごろ ちかごろ
        たいがい もろもろ ふい いわば あんのじょう きょくりょく
        とうてい おもいっきり とつじょ まっさき いっこう めいめい
        ねんじゅう ひっそり ぼんやり にやにや ほのぼの さくさく
        ころころ きらきら どきどき わくわく にこにこ ぞくぞく
        ばらばら すっきり しっくり そっくり まっすぐ ふつ しら がい
        あつ がた もろ れっき きくし ほんま かな がれ かたて
        あしもと しっぽ たいじゅ ちのう ずのう じゅみょう ながいき
        ちょうじゅ おい こぶ ねむい じもと きんじょ げんば かくち
        くいき りょういき こきょう ふるさと とかい いなか ちょうない
        さんち じゅうきょ きょじゅう ざいじゅう たいざい べっそう
        だんち しんきょ ろじょう どうろ てつどう せんろ みなと
        かいどう とうげ へいか ていとく そうとく りょうしゅ きぞく
        ばくまつ もんか ほくと とうほう とうよう せいよう ちゅうぶ
        なんぶ ほくとう とうぶ こうり しゅうきゃく せっきゃく
        かしきり わりあて ばいりつ ぜんがく かんてい ねんぴ ゆうきゅう
        たいしょく しょくむ しゅっちょう ふくぎょう ほんぎょう
        ぎょうしゅ せんぎょう しんそつ ざいせき はいたつ ゆうそう
        はんそう さいそく ぜいたく えいぞう ほうそう ばんぐみ けいさい
        りれき つうわ でんち えきしょう かいろ がしつ おんせい
        おんきょう けんしゅつ あっしゅく そくてい かんそく けいりょう
        たんさく そうじゅう あおり いじり あやつる ばれる いいわけ
        うたがい うたがう ごかい かんちがい こりつ かいむ あんこく
        くらやみ ぼろ まっくら しずむ おちいる たえる ひっぱる
        つっこむ とびだし ついきゅう おおあめ ふぶき もうしょ
        きょうふう どしゃ こごえ こくはく ときめき しょうぎ すもう
        たっきゅう しあい たいかい やきゅう しょうぶ きょうぎ けまり
        どうじょう
      `,
    }),
    ...entries({
      reason: "fifteenth-pass-function-date-fragment-sensitive-or-domain",
      words: `
        きょう あす きのう まいにち こんかい げんざい ことし ぜんぶ
        いじょう ばあい わけ とおり ふつう けっこう こんど さっき
        ほんじつ こんしゅう まいかい へいじつ しゅうまつ きゅうじつ
        せんじつ どうじ ぜんじつ よくじつ けさ どにち どよう げつよう
        しゅくじつ せんげつ いまごろ らいしゅう こんげつ ごじつ さいど
        げつまつ ひづけ らいげつ にちよう あした ついたち みょうごにち
        ねんない そくじつ れんじつ のちのち りゃく おこ はなしき
        すんで べら ひとひと にこ しょう きち やみ なくなる ししゃ
        せんごく ちょうきょう のがれ きょうい ふうさ しょうきょ
        いきのこる いきのこり どうきょ えんかい しゅっし がいし
        けいき しょうこう いしょく でんどう じゅうじ えんぎ てつや
      `,
    }),
    ...entries({
      reason: "sixteenth-pass-date-award-role-negative-or-domain",
      words: `
        つき とうじ とうじつ かげつ まいしゅう まいつき せんしゅう
        ねんだい ねんまつ ようび かよう すいよう もくよう きんよう
        しょうり ゆうしょう じゅしょう にゅうしょう ひょうしょう
        れんしょう らくしょう しょうしゃ ほうび いご だしゃ とうしゅ
        きゅうじょう しょうがく だんじょ じょゆう だんゆう やくしゃ
        がくしゃ さくしゃ ちょしゃ かしゅ きしゅ ゆうしゃ じんぶつ
        ねんれい そうぎ むしょう そうぎょう もれ おかしい むずかしい
      `,
    }),
    ...entries({
      reason: "seventeenth-pass-adult-ritual-military-education-role-place-commerce-or-domain",
      words: `
        どうてい そうさい そくし ちゅうさ じんえい ほうい ぎせき
        かんぼう びょうどう こうがい せいは ほんめい がっこう だいがく
        こうこう がくせい せいと ちゅうがく にゅうがく じゅく がくぶ
        つうがく がっか しゅくだい かもく しんがく ぶかつ がくれき
        にゅうし がっきゅう ちゅうこうせい しゅつだい たいがく がくりょく
        きょうざい みせ しせつ だんたい げきじょう きょうし さっか
        てんさい しょくぎょう はいゆう えいゆう こうし がっき がっかい
        りゅうがく ししょう いんしょく りくじょう じょうきゃく しょくどう
        そうむ すいえい ぶしょ がっしょう だせき しきょく ようがく
        ひっしゃ えかき
      `,
    }),
    ...entries({
      reason: "eighteenth-pass-education-role-commerce-legal-negative-or-domain",
      words: `
        きょういく べんきょう そつぎょう じゅぎょう がくしゅう きょうしつ
        たいいく ごうかく かがく すうがく こうがく がくじゅつ ごがく
        あいて ともだち おとな なかま きゃく れんちゅう ひとびと
        じんるい じょうし どうりょう しりあい しろうと じんざい だいり
        しつじ がか りょうし だいく おやかた あいかた こもり かいもの
        うり ちゅうこ うけつけ ほんぶ かいさい ゆうち こうしき ほうどう
        しゅざい じょうほう しょうめい ていしゅつ しょぞく こうしょう
        にんてい しんさ かいせい しそう けんしょう しゃざい きょうかい
        こうりゃく たいりょく きんちょう ふめい ひみつ ふざけ はげしい
        ていこう きびしい わかれ おこる よけい たいこう さわぐ もうれつ
        けっせき とりけし うちきり なくす はいきょ てぐち でんせつ
        こよみ こくほう ひほう
      `,
    }),
    ...entries({
      reason: "nineteenth-pass-education-institution-commerce-industrial-risk-or-domain",
      words: `
        えいご おんがく がく れんしゅう しどう げいのう がっきょく こうざ
        てつがく けんしゅう しゅっせき こうぎ ぶんがく じっしゅう こうしゃ
        けんがく しんきょく こくご けんてい こうしゅう えんしゅう
        がっしゅく ぶんぽう きょうがく がくふ きょうゆ えし そうしゃ
        ぶんげい じぎょう うんえい してい さいよう ぼしゅう ぎょうかい
        うんよう にんむ しゅさい せつりつ そち しんこく かにゅう
        どうめい こうほう だいこう じしゃ どうしゃ しゅうよう せつやく
        かいぎょう かいごう りょうしゃ そうがく がっぺい せいやく
        しゅうけい ちゅうかい しさつ うちあわせ ほっそく さくてい
        けいはつ がんそ こうえき じんてき こうばい しゅうち そうりつ
        はいぞく こうぼ しょうごう にっぽう きじつ ちきゅう こうつう
        こうじょう せいぞう さんぎょう けんせつ けんちく かこう ねんりょう
        こうくう いじゅう のうぎょう こうぎょう かいたい じょうしゃ
        じゅんかい つうこう しんちく くかく かいさつ ぎょぎょう どぼく
        りりく はっちゃく げしゃ けんさ きょうそう しゅつじょう へいさ
        はんぱつ ふっこう はいき ろんそう ゆうぎ ちゅうにゅう しゅっしょう
        ひひょう くちこみ しゅうちゃく きょうこう ゆうはつ れんぱ
        こんにゅう こうじつ
      `,
    }),
    ...entries({
      reason: "twentieth-pass-role-media-education-civic-transit-science-negative-or-place",
      words: `
        しごと くるま なまえ えいが しゃかい まんが おしえ けんきゅう
        はっぴょう ちょうさ ちゅうい かんり ひょうか だいひょう
        ほうこく たんとう そしき うた ふね でんしゃ かいぎ かんこう
        しょうせつ りょこう きかい かいじょう ものがたり でんき
        あそび ぶたい ざっし かいふく とうちゃく えんそう ぶんせき
        しりょう れんさい げんさく てんじ しんさく じんこう きしゃ
        しょせき えんしゅつ ほんやく にんずう わたくし とくしゅう
        しゃりょう れっしゃ てがみ ぶんしょう ちず せつび じっか
        まなぶ にっき しゅっぱつ しょるい とくめい こうひょう かんさつ
        じょうえい ふぞく げんそく めいしょう せりふ てつづき ろんり
        ほいく にゅうじょう かいせき さんそ といあわせ ていじ さっきょく
        はつめい ほうそく まなび しゅうかい いちぞく おおぜい どくしょ
        やけ れんきゅう ざせき ひしょ うらやましい けむり せたい
        えんじる げんこう しゅやく めいさく ぎょうじ じゅうりょく
        のりかえ えきたい のうか りんり えんぜつ かりょく じょうりく
        げんし とっきゅう としうえ ひんど こたい しばい のうこう のうど
        まどぐち せんい かいぬし たんこう めいぎ しょうがつ かもつ
        あやまり しっぴつ しまつ てはい ほんや えんげき ごっこ
        ちゃくりく らくがき じしょ かくさ みだれ けんぞう めいし
        きゅうしょく もけい ひとりぐらし さくし きざい さいはつ
        めいきょく ちょしょ さび ちらし かんしゅう らくご のうじょう
        にゅうよく ごらく わかれる やたい まちあわせ はなみ あやまる
        としょ あっとう ことわる かぶき ちょうしゅ きにゅう ていしゃ
        きゃくしつ しにせ のりもの せいみつ ちけい しんしょ きっぷ
        ろうりょく ろうどく ちゅうすう おおや まさつ にっし かたみち
        みんか ひりょう われる おもいこみ しんしゃ ひゃっか ちゃくち
        がんこ かえりみち まんざい いんせき かごう もより むめい
        ちちゅう なける どうわ しょうぞう かいかい はいく けんざい
        あとち けんだま いかだ ぬりえ
      `,
    }),
    ...entries({
      reason: "twenty-first-pass-place-doc-role-event-science-negative-or-abstract",
      words: `
        ばしょ みち みずべ やま うみ かわ へや ちゅうおう とち
        たてもの さか たに さと いけ みずうみ はたけ やど にわ
        ひろば いりぐち つうろ でぐち やしき しゅくはく じたく
        おくじょう やがい おくない おくがい すまい ろじ ほどう
        しんろ ざいたく さんちょう すいじょう しんごう おうふく
        きゅうこう かいそく ばしゃ しつない どうくつ かいわい ろうか
        だいどころ かいいき しんかい たにま さんどう こうや のはら
        まきば はなぞの たけやぶ こみち いしだたみ まどべ やまみち
        はまべ すなはま かわべ おがわ じゅうたく かおく しょざい
        ことば もじ せつめい しょうかい かいせつ かだい ちしき
        げいじゅつ よみ ぶんしょ さんしょう いんよう たんご どくしゃ
        こくち ぶんこ ようご びじゅつ きじゅつ びょうしゃ ぶんるい
        じれい さくが かいが みだし てがき がいよう さっし ばっすい
        ふろく はがき えはがき あんない さくせい しゅうせい へんじ
        ひょうし しょかい れんらく よてい けいかく かつどう こうかい
        ていきょう りよう しゅとく せっち せいび はいち かくほ はいふ
        きょうきゅう じゅよう しゅうり かいしゅう にゅうしゅ てきよう
        そうこ にゅうか うけとり さんにゅう りょうしょう しょち
        かんゆう かりる にゅうきょ ざっか きっさ がいしょく ていしょく
        せんちゃく とりあつかい とりあつかう もちこみ もちだし かいじ
        ほきゅう ほじゅう ふっきゅう きゅうし かいし うまれ せだい
        じんかく こせい わかて かんきゃく たいしゅう なにもの たしゃ
        ななし としした しゅぞく ねんしょう ひとがら おさななじみ
        しかい きょくちょう ぶぞく あいぼう しんゆう ゆうじょう
        なかよし つれ うんどう ねむり ねむる ねむれる せんぱつ
        たんぱつ かみがた さんか しゅみ さんぽ つり たいそう おどり
        はなび かいまく なつやすみ きゅうけい しょにち らいじょう
        かんげき えんき うちゅう かんきょう こうぞう ぶっしつ せいぶつ
        しょくぶつ すうじ こうりつ げんしょう じょうき かくりつ そくど
        はっこう ざいりょう けっしょう おんど とうけい たいき しげき
        じっしつ かくど りったい たいけい ひりつ しんどう ぎんが
        たんたい はんしゃ かそく すいそ ちゅうせい ごうせい けいじょう
        ぶんかつ かんわ しゅくしょう てきおう へんけい ぶんし ほうし
        すいり しきべつ かくり しんど れいきゃく きあつ きしょう
        ふくごう さんかく すいへい りゅうし はんしょく しつりょう
        るいけい ぞうしょく かせき たんそ しんくう かんつう じくう
        たんさ じそく はどう げんしょく ぶんぴつ じゅし しょくしゅ
        ぶんけい ぼうすい たいよう わくせい りゅうせい きょうりゅう
        いのち せいめい ほんのう せいそく めんどう うわさ ふよう
        やめる よごれ けす かくす ふせぐ さける たたき とつにゅう
        おとす りだつ へらす そうぐう からむ とうとつ かじょう
        ほりゅう あきらめる せまる ちんもく じょがい だきょう
        ねんちゃく ふちゃく ふうじ きゅうげき れんぱつ もほう
        おしい ゆがみ ざんりゅう まるみえ
      `,
    }),
    ...entries({
      reason: "twenty-second-pass-role-doc-transit-science-negative-or-domain",
      words: `
        せいゆう げんご こうそく たんい きさい ないしょ しりつ
        てんない てんすう こうどく なのる たいじょう しんしつ のりくみ
        しゃたい だいめい はんけい しょうりつ しゅもく かおだし
        ぶんみゃく たんか とまり ないや あんき ごい ごじ とうさい
        こうてい けいれき かいきゅう きょうど ひょうぎ しゅご えんせい
        きこく ぎょうせき てんしょう てんそう れんめい けいろ けつごう
        たんしゅく こうてき とうよ えんかく しょとう つうやく ちゅうしゅつ
        せんばつ かせつ かんかつ じっしょう ぼくじょう いくじ つうしょう
        ちょうじょう かいよう ぶったい こんざつ しょうりゃく でんたつ
      `,
    }),
    ...entries({
      reason: "twenty-third-pass-negative-place-role-or-privacy-collision",
      words: `
        あく いえで かす かくし かんぶ こうれい こじ であう であえる
        はんじ ひそか まっき みせかけ りゅうしゅつ
      `,
    }),
    ...entries({
      reason: "twenty-fourth-pass-privacy-or-exposure",
      words: "のぞく さらす",
    }),
    ...entries({
      reason: "twenty-sixth-pass-name-place-negative-or-domain-collision",
      words: `
        かごめ にっこう ひなた あかね ゆかり めい くどう しんや はつね
        さつき りく りゅう かそう さらし わき うむ きょうわ
      `,
    }),
    ...entries({
      reason: "twenty-eighth-pass-civic-negative-or-privacy-collision",
      words: "かいじょ かいにゅう こうはい るす",
    }),
    ...entries({
      reason: "twenty-ninth-pass-adult-negative-or-domain-collision",
      words: "いとしき じょうじ きじょ みまい ちゅうしょう らっか じょじ",
    }),
    ...entries({
      reason: "thirty-first-pass-civic-negative-or-sports-collision",
      words: "ふっかつ どくりつ ゆるし どうい ゆるす けり しゅび れんだ",
    }),
    ...entries({
      reason: "thirty-fourth-pass-role-or-transit-collision",
      words: "しめい じょうこう",
    }),
    ...entries({
      reason: "thirty-fifth-pass-negative-civic-or-hazard-collision",
      words: "ねらい ひっし ふじょう とうせい こく ほのお",
    }),
    ...entries({
      reason: "thirty-eighth-pass-civic-commerce-negative-or-domain-collision",
      words: `
        じゆう はんたい へいわ さんせい だんけつ こうきゅう ごうか
        ごくじょう あしつぼ はなつまみ しゅぎょう
      `,
    }),
    ...entries({
      reason: "fortieth-pass-commerce-verb",
      words: "かう うる うれる",
    }),
    ...entries({
      reason: "forty-first-pass-commerce-transit-or-media-collision",
      words: "おおて けいゆ そくほう",
    }),
    ...entries({
      reason: "forty-second-pass-civic-religion-or-primary-collision",
      words: "せいこう しんこう しゅよう",
    }),
    ...entries({
      reason: "forty-third-pass-pest-insect",
      words: "はえ あぶ",
    }),
    ...entries({
      reason: "forty-fourth-pass-drug-software-commerce-moral-or-social",
      words: "けし きょうゆう こうすい どうとく つぶやき ふくぶくろ",
    }),
    ...entries({
      reason: "forty-fifth-pass-climax-collision",
      words: "ぜっちょう",
    }),
    ...entries({
      reason: "forty-seventh-pass-animal-collision",
      words: "さる へび ねずみ",
    }),
    ...entries({
      reason: "forty-eighth-pass-crowding-verb-collision",
      words: "こむ",
    }),
    ...entries({
      reason: "forty-ninth-pass-rank-or-service-collision",
      words: "たいさ しょうさ たいい はてな",
    }),
    ...entries({
      reason: "fiftieth-pass-identity-slur-collision",
      words: "げい",
    }),
  ],
};

export const AGENT_REVIEWED_BLOCKLISTS = Object.fromEntries(
  Object.entries(AGENT_REVIEWED_POLICY_FINDINGS).map(([language, findings]) => [
    language,
    findings.map((finding) => finding.word),
  ]),
);
