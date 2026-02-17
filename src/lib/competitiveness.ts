export interface CompetitiveProfile {
  score: number;
  label: string;
  overview: string;
}

export const COMPETITIVE_PROFILES: Record<string, CompetitiveProfile> = {
  "northeast": {
    score: 6,
    label: "Moderately Competitive",
    overview:
      "The Northeast is a mature, renovation-heavy market where aging housing stock in Boston, Hartford, and Portland (ME) drives steady hardwood demand, but new construction has fallen sharply — permits dropped 44% from 2021 peaks by mid-2025. Specialty flooring stores have been expanding into Connecticut and Massachusetts, though overall store density remains lower than Sun Belt states. The market skews mid-to-luxury given Greater Boston median home prices around $800K, but low population growth and persistent outmigration limit new-build volume. Wayfair, headquartered in Boston, exerts meaningful e-commerce pressure in this tech-savvy region, and independent specialty retailers compete alongside the big-box duo of Home Depot and Lowe's.",
  },
  "north-atlantic": {
    score: 8,
    label: "Highly Competitive",
    overview:
      "One of the most competitive flooring markets in the country, driven by the massive NYC metro, Philadelphia, and northern New Jersey's dense suburban corridors. Specialty flooring retailers have been aggressively expanding here, and the region combines robust renovation demand — NYC apartment and brownstone remodeling alone is a major driver — with a deep bench of big-box stores and design showrooms. Competition spans the full price spectrum from budget-conscious suburban homeowners to ultra-luxury Manhattan and Westchester projects. The sheer population density (36M+ across three states) sustains intense retailer competition at every price tier.",
  },
  "atlantic-coast": {
    score: 7,
    label: "Competitive",
    overview:
      "The DC-Maryland-Virginia (DMV) corridor is the economic engine here, with strong government and defense-sector employment sustaining housing demand. Active listings jumped 14.4% in 2025 and renovation spending is substantial as homeowners upgrade to maximize property values. Specialty flooring retailers maintain a solid presence across Virginia and Maryland. The luxury segment is well-represented in Georgetown, Bethesda, and Northern Virginia, while Delaware's coastal markets (Rehoboth Beach, Fenwick Island) drive luxury seasonal-home demand with median luxury sales around $1.2M. West Virginia's lower population density and slower growth moderate the overall regional score, but Baltimore is poised for housing growth over the next five years.",
  },
  "southeast": {
    score: 9,
    label: "Extremely Competitive",
    overview:
      "Among the most fiercely competitive hardwood flooring markets in the nation, anchored by Atlanta — a hub for major flooring industry headquarters and distribution. North Carolina issued 57,000 building permits and Georgia 39,000 in recent counts — both among the highest rates nationally at nearly 19 new homes per 1,000 existing units. Population growth is surging: Charlotte, Raleigh-Durham, Nashville, Charleston, and Atlanta are all top inbound migration destinations. Every major retailer is well-represented, the full luxury-to-budget spectrum is active, and the combination of low cost of living, job growth, and population influx makes this one of the most saturated competitive battlegrounds for flooring.",
  },
  "south-florida": {
    score: 9,
    label: "Extremely Competitive",
    overview:
      "An intensely competitive market driven by Miami, Fort Lauderdale, and West Palm Beach. Florida leads the nation in specialty flooring retail density, with a disproportionate concentration in the tri-county area (Miami-Dade, Broward, Palm Beach). Miami ranked 7th nationally for new apartment construction, permitting 7,257 units between July 2024 and 2025. The market is heavily skewed toward luxury with dozens of ultra-high-end condo towers under development. Florida grew 2.04% in population — the fastest of any state — and international buyers add another competitive layer. The combination of new luxury condo construction, massive renovation activity, dense retail competition, and an active online marketplace makes this one of the two or three most competitive flooring markets in the country.",
  },
  "north-florida": {
    score: 6,
    label: "Moderately Competitive",
    overview:
      "A more moderate competitive environment compared to South Florida. Jacksonville, the region's largest market, issued 757 residential permits in October 2025 alone but saw overall permitting fall nearly 30% year-over-year to 8,828 single-family permits — the lowest since 2016. Jacksonville was the only Florida city on NAR's Top 10 Housing Hot Spots for 2026, suggesting future growth. Pensacola's market is transitioning to balance with flat pricing, and Alabama markets like Birmingham show steady but unspectacular construction activity. Specialty retailer density is far lower than South Florida. The market primarily serves budget-to-mid segments, with limited luxury demand outside select coastal communities like Amelia Island and 30A.",
  },
  "gulf-coast": {
    score: 5,
    label: "Moderately Low Competition",
    overview:
      "A less competitive flooring market characterized by lower population density and fewer specialty retailers. Houston (TX Gulf) is the exception — expected to add 14,439 apartments in 2025 with strong retailer presence across all categories. However, Louisiana and Mississippi have much thinner markets: Mississippi Gulf Coast development is steady but not explosive, with limited units under development. New Orleans has renovation demand tied to its older housing stock, but the state faces population stagnation. Specialty flooring retailers are scarce in Mississippi and limited in Louisiana. The market leans budget-to-mid range with limited luxury segments outside select Houston neighborhoods and historic New Orleans districts. Hurricane rebuilding creates periodic demand spikes.",
  },
  "interior-texas": {
    score: 7,
    label: "Competitive",
    overview:
      "Anchored by the powerhouse metros of Dallas-Fort Worth, Austin, and San Antonio. Four Texas cities led the nation in new home construction in 2025, and DFW alone expects 28,958 new apartments, ranking second nationally. Both big-box and specialty flooring retailers maintain heavy presence across these interior metros. However, oversupply is becoming an issue: prices fell in all four major Texas metros in late 2025 (Austin down 6%, Dallas down 3.9%). Oklahoma City shows steady moderate growth while Arkansas's market is balanced with 5 months of supply. The market serves the full price spectrum in Texas metros but is primarily budget-to-mid in Oklahoma and Arkansas, where specialty retailer options are more limited.",
  },
  "midwest": {
    score: 6,
    label: "Moderately Competitive",
    overview:
      "The Midwest is experiencing a housing market resurgence — six of Zillow's ten most popular 2025 markets were Midwestern, led by Rockford (IL), Toledo (OH), Carmel (IN), and Dearborn (MI) — but this is driven by affordability rather than high-volume new construction. Housing starts held roughly stable at 199,000 annualized in October 2025. Specialty flooring retailers maintain a moderate presence concentrated in the Chicago metro and major Ohio and Michigan cities. Home Depot, Lowe's, and Menards have dense networks across the region's many mid-size metros. The market skews budget-to-mid given median home values well below coastal levels. Renovation demand is meaningful given the older housing stock, but new construction lags Sun Belt states.",
  },
  "mountain-west": {
    score: 7,
    label: "Competitive",
    overview:
      "Combines several of the nation's fastest-growing states with rapidly expanding construction. Idaho leads nationally in new construction permits at 21.2 new units per 1,000 existing homes, and Utah follows at 18.6. Population growth is strong in Nevada (1.65%) and Utah (1.75%). Denver, Phoenix, Salt Lake City, Las Vegas, and Boise are all significant construction markets with growing specialty retailer presence. However, vast geography means many areas (Montana, Wyoming, rural Idaho) have very thin retail competition. Salt Lake City metro ranks first among large metros for home improvement spending. The luxury segment is well-represented in resort communities (Aspen, Park City, Scottsdale, Sun Valley) alongside massive budget-tier new construction in Phoenix and Las Vegas suburbs.",
  },
  "pacific-northwest": {
    score: 7,
    label: "Competitive",
    overview:
      "A competitive market led by Seattle and Portland, with Northern California adding significant demand. Seattle's housing market shows resilience with a 25.64% year-over-year increase in active listings across King County, while Portland's apartment construction dropped 54% from 2024 but single-family homes remain available. Specialty flooring retailers have a limited but growing presence, with density notably lower than Sun Belt states. Home improvement spending ranks among the top nationally in both Washington and Oregon. The market skews mid-to-luxury given high home values (Seattle metro median exceeds $750K). Strong tech-sector employment supports premium flooring demand, and online retailer competition is significant in this digitally sophisticated market.",
  },
  "southern-california": {
    score: 8,
    label: "Highly Competitive",
    overview:
      "One of the most competitive flooring markets nationally, driven by the enormous LA, San Diego, Riverside-San Bernardino, and Orange County metros collectively housing 23M+ people. Every major and minor flooring retailer competes aggressively here, with heavy specialty store concentration across the region. However, new construction has declined significantly — new-home closings and starts in LA fell 30% and 24% respectively in 2025, hitting the lowest levels since mid-2012. The market is therefore heavily renovation-driven, with homeowners upgrading rather than moving due to extremely high home prices. The luxury segment is exceptionally strong in coastal markets (Malibu, Newport Beach, La Jolla), while inland areas serve budget-to-mid tier buyers. Online competition from Wayfair, Amazon, and D2C brands is particularly intense.",
  },
  "great-plains": {
    score: 3,
    label: "Low Competition",
    overview:
      "The least competitive hardwood flooring market among the 13 regions due to low population density, minimal metro concentration, and limited specialty retailer presence. The largest cities — Omaha, Wichita, Kansas City (KS side), and Lincoln — are modest by national standards. Specialty flooring chains have minimal to no presence in South Dakota, North Dakota, or Nebraska. North Dakota's typical home value is $281K with slow 3.9% annual growth, and the state needs only 9,285-10,280 new housing units over multi-year periods. The market is almost entirely budget-to-mid range with virtually no luxury hardwood segment. Home Depot, Lowe's, and Menards are the primary competitors supplemented by small independent dealers. The thin market and low retail density result in minimal competitive intensity.",
  },
};
