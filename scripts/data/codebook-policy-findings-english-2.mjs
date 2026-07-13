const entries = ({ reason, confidence = "high", words }) =>
  words
    .trim()
    .split(/\s+/)
    .map((word) => ({ word, reason, confidence }));

export const englishPolicyFindingsPart2 = [
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
    reason:
      "fourteenth-pass-function-adverb-negative-medical-finance-or-software",
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
    reason:
      "fourteenth-pass-place-business-infrastructure-brand-or-proper-name",
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
    reason:
      "fifteenth-pass-function-negative-medical-place-identity-software-or-finance",
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
    reason:
      "sixteenth-pass-gambling-poison-medical-political-institution-or-commerce",
    words: `
        Club Clubs Hemlock Lozenge Planet Freedom Liberty Equality Homeland
        Imperial Revolution Academy Faculty Institute Organisation Organization
        Shopper
      `,
  }),
  ...entries({
    reason:
      "seventeenth-pass-role-education-civic-corporate-media-or-sensitive",
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
    reason:
      "nineteenth-pass-role-doc-media-science-civic-commerce-place-negative-or-privacy",
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
    reason:
      "twenty-first-pass-doc-media-place-transit-science-abstract-or-negative",
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
    words:
      "Chicks Firm Firms General Issue Issues Marine Mate Remix Supreme Tribute",
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
];
