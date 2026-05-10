# English Codebook Review - 2026-05-10

Review note for English codebook cleanup. The English dataset currently has only the distributed codebook file, so this pass updates `codebook-dist/english.json` directly.

Selection criteria:

- One-letter and two-letter entries that are too terse for stable address words.
- Common technical abbreviations, month/state-like abbreviations, and short code-like fragments.
- Country, region, city, and place names that can conflict with geographic labels.
- Brand names and platform names.
- Adult, negative, risky, or violent terms.

Replacement rules:

- Replacement words must not already exist in the English codebook.
- Replacement words should be neutral, readable, and suitable as address words.
- The codebook size and uniqueness must remain unchanged.

| Original | Replacement | Reason |
| --- | --- | --- |
| A | Acorn | too short for stable address word; single letter |
| B | Alder | too short for stable address word; single letter |
| C | Arbor | too short for stable address word; single letter |
| D | Aspen | too short for stable address word; single letter |
| E | Aster | too short for stable address word; single letter |
| F | Basil | too short for stable address word; single letter |
| G | Beacon | too short for stable address word; single letter |
| H | Birch | too short for stable address word; single letter |
| I | Bloom | too short for stable address word; single letter |
| J | Blossom | too short for stable address word; single letter |
| K | Boulder | too short for stable address word; single letter |
| L | Breeze | too short for stable address word; single letter |
| M | Briar | too short for stable address word; single letter |
| N | Brook | too short for stable address word; single letter |
| O | Broom | too short for stable address word; single letter |
| P | Herbary | too short for stable address word; single letter |
| Q | Cabin | too short for stable address word; single letter |
| R | Cedar | too short for stable address word; single letter |
| S | Clover | too short for stable address word; single letter |
| T | Cobble | too short for stable address word; single letter |
| U | Creek | too short for stable address word; single letter |
| V | Crest | too short for stable address word; single letter |
| W | Dawn | too short for stable address word; single letter |
| X | Dewdrop | too short for stable address word; single letter; watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Y | Dune | too short for stable address word; single letter |
| Z | Honeydew | too short for stable address word; single letter |
| Ai | Fern | too short for stable address word; watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Am | Flint | too short for stable address word |
| Be | Flora | too short for stable address word |
| Cd | Hazel | too short for stable address word |
| Dc | Hearth | too short for stable address word; watchlist: abbreviation, place, brand, adult, negative, or technical term |
| De | Hollow | too short for stable address word; watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Do | Leafbud | too short for stable address word |
| Fw | Juniper | too short for stable address word; watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Go | Lagoon | too short for stable address word |
| He | Laurel | too short for stable address word |
| Hi | Leaf | too short for stable address word; watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Id | Lily | too short for stable address word; watchlist: abbreviation, place, brand, adult, negative, or technical term |
| If | Linden | too short for stable address word |
| Is | Meadow | too short for stable address word |
| It | Moss | too short for stable address word |
| La | Myrtle | too short for stable address word; watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Me | Nectar | too short for stable address word; watchlist: abbreviation, place, brand, adult, negative, or technical term |
| My | Orchard | too short for stable address word |
| No | Pebble | too short for stable address word |
| Oh | Petal | too short for stable address word; watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Ok | Pollen | too short for stable address word; watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Pc | Poppy | too short for stable address word; watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Pm | Prairie | too short for stable address word; watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Re | Quartz | too short for stable address word |
| So | Reed | too short for stable address word |
| St | Rowan | too short for stable address word |
| Tv | Saffron | too short for stable address word; watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Uk | Sprout | too short for stable address word |
| Up | Thistle | too short for stable address word |
| Us | Tulip | too short for stable address word |
| We | Violet | too short for stable address word |
| App | Willow | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Aug | Wisp | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Avg | Woodland | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Cad | Yarrow | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Com | Zephyr | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Con | Apricot | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Dec | Barley | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Dev | Canopy | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Feb | Cattail | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Jan | Chestnut | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Jun | Cinnamon | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Mar | Daffodil | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Nov | Daisy | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Oct | Dogwood | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Sad | Driftwood | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Seo | Fennel | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Sep | Firefly | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Url | Garland | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Cuba | Ginger | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Debt | Ginkgo | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Ebay | Goldenrod | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Fear | Grassland | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Fire | Hyacinth | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Ford | Iris | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Loss | Jasmine | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Meta | Lavender | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Nike | Magnolia | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Peru | Marigold | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Risk | Marjoram | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Rome | Moonbeam | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Sick | Mulberry | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Visa | Nettle | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Apple | Nutmeg | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Congo | Oatmeal | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Fever | Orchid | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Fight | Pasture | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Fraud | Peach | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| India | Petunia | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Intel | Plum | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Knife | Primrose | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Korea | Rosemary | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Malta | Seagrass | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Miami | Seashell | watchlist: abbreviation, place, brand, adult, negative, or technical term |

## Sub-Agent Re-Review Addendum

An additional review pass checked the current distributed English codebook for
sexual, gambling, violent, military, drug, medical, political, religious,
negative, name-like, place-like, and awkward generated terms. The pass removed
the reported urgent/high findings, then repeated review until no urgent, high,
medium, or low findings were reported for the current file.
| Paris | Snowdrop | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Spain | Sorrel | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Sudan | Sparrow | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Texas | Sunbeam | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Theft | Thyme | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Tokyo | Treetop | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Africa | Vanilla | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Alaska | Windmill | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Amazon | Zinnia | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Berlin | Brooklet | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Boston | Cornflower | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Brazil | Daybreak | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Breast | Evergreen | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Canada | Fairway | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Dallas | Foxglove | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Damage | Grapevine | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Denver | Greenery | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Europe | Larkspur | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| France | Milkweed | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Greece | Moonrise | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Guinea | Pinecone | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Hawaii | Rainfall | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Injury | Riverbend | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Jordan | Rosebud | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Latvia | Sandbar | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| London | Seedling | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Madrid | Snowfall | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Monaco | Starling | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Oracle | Sweetpea | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Ottawa | Tealight | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Panama | Wildrose | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Poland | Woodbine | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Sweden | Woodcraft | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Sydney | Woodnote | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Target | Amberly | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Turkey | Arborly | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Uganda | Bloomly | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Weapon | Cedarly | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| America | Cloverly | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Assault | Fernvale | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Austria | Glenwood | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Bahamas | Hilltop | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Belgium | Lakelet | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Chicago | Leaflet | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Croatia | Mossbank | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Denmark | Oakvale | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Disease | Pinevale | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Ecuador | Rivulet | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Estonia | Rosehill | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Finland | Sunvale | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Florida | Windvale | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Georgia | Ashwood | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Germany | Bayleaf | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Houston | Bellwort | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Hungary | Bluebell | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Iceland | Bracken | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Ireland | Bramble | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Jamaica | Brookside | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Lebanon | Budding | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Morocco | Celadon | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Nigeria | Clearway | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Phoenix | Clifftop | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Romania | Cloudlet | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Seattle | Coppice | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Toronto | Dewfall | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Ukraine | Driftway | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Bulgaria | Elmwood | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Colombia | Farmland | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Tanzania | Fernbank | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Thailand | Fernwood | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Argentina | Fielding | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Australia | Firthwood | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Singapore | Florin | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Venezuela | Foxtail | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| California | Glenlet | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Luxembourg | Goldleaf | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Netherlands | Greenway | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Philippines | Grovelet | watchlist: abbreviation, place, brand, adult, negative, or technical term |
| Switzerland | Hayshed | watchlist: abbreviation, place, brand, adult, negative, or technical term |
