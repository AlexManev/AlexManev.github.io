/* =========================================================================
   Garden Planner — reference data
   -------------------------------------------------------------------------
   Every date in the app is worked out from two numbers for your location:
   the LAST spring frost (LF) and the FIRST autumn frost (FF). Plant timings
   below are therefore written in WEEKS relative to one of those dates, which
   makes the same table work in both hemispheres and any climate.

   Crop fields
     sp     [in-row spacing, row spacing] in cm (raised-bed / intensive values)
     depth  sowing depth in cm
     ind    weeks a seedling spends indoors before planting out (none = no
            indoor raising)
     out    [from, to] weeks rel. LF to plant seedlings out in spring
     dir    [from, to] weeks rel. LF to sow direct in spring
     fo     [from, to] weeks rel. FF to plant seedlings out for autumn/winter
     fd     [from, to] weeks rel. FF to sow direct for autumn/winter
     dtm    days from planting out (or sowing direct) to first harvest
     hw     weeks the harvest lasts
     frost  't' tender (killed by frost), 'h' half-hardy, 'H' hardy
     pref   preferred method when adding to a bed
     care   [days after planting, what to do, task kind]

   Tree / perennial fields
     tasks  [kind, [from, to] weeks rel. LF, title, how-to]
     prune  step-by-step pruning guide
     fruitIn  years after planting before a crop is expected
   ========================================================================= */
(function () {
  'use strict';

  var PLANTS = [];
  function add(id, name, cat, icon, o) {
    o.id = id; o.name = name; o.cat = cat; o.icon = icon;
    PLANTS.push(o);
  }

  /* ---------------------------------------------------------------- veg */

  add('tomato', 'Tomato', 'veg', '🍅', {
    fam: 'Nightshade', sun: 'Full sun, 6–8 h', water: 'Deep & regular', feed: 'Heavy feeder',
    sp: [50, 60], depth: 0.5, ind: 7, out: [1, 10], dtm: 70, hw: 12, frost: 't',
    good: ['basil', 'marigold', 'carrot', 'parsley', 'borage', 'chives', 'nasturtium', 'lettuce'],
    bad: ['potato', 'corn', 'cabbage', 'broccoli', 'cauliflower', 'kale', 'dill'],
    pests: ['Aphids', 'Whitefly', 'Tomato grub / hornworm', 'Fruit fly'],
    dis: ['Early & late blight', 'Blossom end rot (uneven watering)', 'Fusarium wilt'],
    care: [[0, 'Plant deep — bury the stem up to the first leaves', 'plant'], [7, 'Stake or cage the plants', 'stake'],
      [21, 'Pinch out side shoots weekly on vining types', 'care'], [35, 'Feed with high-potash fertiliser every 2 weeks', 'feed'],
      [56, 'Remove lower leaves touching the soil', 'care']],
    tips: 'Water at the base, not the leaves, and keep moisture even to avoid split fruit and blossom end rot. Rotate beds yearly — never follow potatoes or tomatoes.'
  });
  add('cherry-tomato', 'Cherry tomato', 'veg', '🍅', {
    fam: 'Nightshade', sun: 'Full sun, 6–8 h', water: 'Deep & regular', feed: 'Heavy feeder',
    sp: [45, 50], depth: 0.5, ind: 7, out: [1, 12], dtm: 60, hw: 14, frost: 't',
    good: ['basil', 'marigold', 'carrot', 'parsley', 'borage', 'chives', 'nasturtium'],
    bad: ['potato', 'corn', 'cabbage', 'broccoli', 'kale', 'dill'],
    pests: ['Aphids', 'Whitefly', 'Fruit fly'], dis: ['Blight', 'Blossom end rot'],
    care: [[7, 'Add a stake or trellis', 'stake'], [35, 'Feed with tomato fertiliser fortnightly', 'feed']],
    tips: 'The easiest tomato for pots — a 40 cm pot holds one plant. Pick often and it keeps cropping until the cold arrives.'
  });
  add('capsicum', 'Capsicum (sweet pepper)', 'veg', '🫑', {
    fam: 'Nightshade', sun: 'Full sun', water: 'Regular', feed: 'Moderate',
    sp: [45, 50], depth: 0.5, ind: 9, out: [2, 9], dtm: 75, hw: 12, frost: 't',
    good: ['basil', 'onion', 'carrot', 'marigold', 'parsley'], bad: ['bush-bean', 'climbing-bean'],
    pests: ['Aphids', 'Fruit fly', 'Thrips'], dis: ['Blossom end rot', 'Bacterial leaf spot'],
    care: [[14, 'Stake taller plants before fruit sets', 'stake'], [30, 'Feed fortnightly once flowering', 'feed']],
    tips: 'Peppers love warmth — wait until nights stay above 12 °C before planting out. Green fruit turns red, yellow or orange if left longer.'
  });
  add('chilli', 'Chilli', 'veg', '🌶️', {
    fam: 'Nightshade', sun: 'Full sun', water: 'Moderate', feed: 'Moderate',
    sp: [40, 45], depth: 0.5, ind: 9, out: [2, 9], dtm: 80, hw: 14, frost: 't',
    good: ['basil', 'onion', 'carrot', 'marigold'], bad: ['bush-bean', 'climbing-bean'],
    pests: ['Aphids', 'Fruit fly'], dis: ['Root rot in soggy soil'],
    care: [[30, 'Feed fortnightly once flowering', 'feed']],
    tips: 'Slightly dry conditions make hotter chillies. Plants can be overwintered in a pot in a frost-free spot.'
  });
  add('eggplant', 'Eggplant (aubergine)', 'veg', '🍆', {
    fam: 'Nightshade', sun: 'Full sun, hot', water: 'Regular', feed: 'Heavy feeder',
    sp: [55, 60], depth: 0.5, ind: 9, out: [3, 9], dtm: 80, hw: 10, frost: 't',
    good: ['bush-bean', 'basil', 'marigold', 'thyme'], bad: ['potato'],
    pests: ['Spider mites', 'Aphids', 'Flea beetle'], dis: ['Verticillium wilt'],
    care: [[14, 'Stake plants', 'stake'], [30, 'Feed fortnightly', 'feed']],
    tips: 'Harvest while the skin is still glossy — dull skin means seedy, bitter fruit.'
  });
  add('cucumber', 'Cucumber', 'veg', '🥒', {
    fam: 'Cucurbit', sun: 'Full sun', water: 'Lots, consistent', feed: 'Moderate',
    sp: [40, 60], depth: 2, ind: 4, out: [2, 10], dir: [2, 10], dtm: 55, hw: 8, frost: 't', pref: 'direct',
    good: ['bush-bean', 'climbing-bean', 'pea', 'dill', 'nasturtium', 'lettuce', 'sunflower', 'corn', 'radish'],
    bad: ['potato', 'sage'],
    pests: ['Aphids', 'Cucumber beetle', 'Spider mites'], dis: ['Powdery mildew', 'Downy mildew'],
    care: [[7, 'Train vines up a trellis', 'stake'], [25, 'Side-dress with compost', 'feed']],
    tips: 'Grow up a trellis to save space and keep fruit clean. Pick small and often — one overripe cucumber slows the whole plant.'
  });
  add('zucchini', 'Zucchini (courgette)', 'veg', '🥒', {
    fx: 'saturate(1.4) brightness(.78)',
    fam: 'Cucurbit', sun: 'Full sun', water: 'Lots', feed: 'Heavy feeder',
    sp: [80, 90], depth: 2, ind: 4, out: [2, 10], dir: [2, 10], dtm: 50, hw: 10, frost: 't', pref: 'direct',
    good: ['nasturtium', 'corn', 'bush-bean', 'borage', 'marigold'], bad: ['potato'],
    pests: ['Aphids', 'Squash bugs'], dis: ['Powdery mildew'],
    care: [[30, 'Hand-pollinate if fruit shrivels', 'care'], [30, 'Feed with liquid fertiliser', 'feed']],
    tips: 'Two plants feed a family. Pick at 15–20 cm — they turn into marrows overnight.'
  });
  add('pumpkin', 'Pumpkin', 'veg', 'svg:pumpkin', {
    fam: 'Cucurbit', sun: 'Full sun', water: 'Deep, weekly', feed: 'Heavy feeder',
    sp: [120, 150], depth: 2, ind: 4, out: [2, 6], dir: [2, 6], dtm: 100, hw: 4, frost: 't', pref: 'direct',
    good: ['corn', 'climbing-bean', 'nasturtium', 'marigold', 'borage'], bad: ['potato'],
    pests: ['Aphids', 'Squash bugs'], dis: ['Powdery mildew'],
    care: [[45, 'Lift fruit onto straw to stop rot', 'care'], [30, 'Feed monthly', 'feed']],
    tips: 'Harvest when the stalk is dry and corky and the skin resists a fingernail. Cure in the sun for 10 days so they store for months.'
  });
  add('watermelon', 'Watermelon', 'veg', '🍉', {
    fam: 'Cucurbit', sun: 'Full sun, hot', water: 'Deep, less near harvest', feed: 'Moderate',
    sp: [90, 120], depth: 2, ind: 4, out: [3, 7], dir: [3, 7], dtm: 85, hw: 4, frost: 't', pref: 'direct',
    good: ['corn', 'nasturtium', 'radish'], bad: ['potato'],
    pests: ['Aphids'], dis: ['Powdery mildew', 'Fusarium wilt'],
    care: [[45, 'Slip a tile under fruit', 'care']],
    tips: 'Ripe when the tendril nearest the fruit dries and the ground spot turns creamy yellow.'
  });
  add('rockmelon', 'Rockmelon (cantaloupe)', 'veg', '🍈', {
    fam: 'Cucurbit', sun: 'Full sun, hot', water: 'Deep, less near harvest', feed: 'Moderate',
    sp: [60, 90], depth: 2, ind: 4, out: [3, 7], dir: [3, 7], dtm: 80, hw: 4, frost: 't', pref: 'direct',
    good: ['corn', 'nasturtium', 'radish', 'marigold'], bad: ['potato'],
    pests: ['Aphids'], dis: ['Powdery mildew'], care: [],
    tips: 'Ready when it slips from the vine with a gentle push and smells sweet at the stem end.'
  });
  add('corn', 'Sweet corn', 'veg', '🌽', {
    fam: 'Grass', sun: 'Full sun', water: 'Regular, critical at tasselling', feed: 'Heavy feeder',
    sp: [30, 45], depth: 3, ind: 3, out: [2, 8], dir: [2, 9], dtm: 80, hw: 3, frost: 't', pref: 'direct',
    good: ['climbing-bean', 'bush-bean', 'pumpkin', 'cucumber', 'zucchini', 'pea', 'sunflower'], bad: ['tomato'],
    pests: ['Corn earworm', 'Aphids'], dis: ['Rust', 'Smut'],
    care: [[30, 'Hill soil around the stems', 'care'], [40, 'Feed with nitrogen when knee-high', 'feed']],
    tips: 'Plant in a block of at least 4 × 4 rather than one long row — corn is wind-pollinated. Ready when the silks go brown and kernels squirt milky juice.'
  });
  add('bush-bean', 'Bush beans', 'veg', '🫛', {
    fx: 'hue-rotate(-18deg) saturate(.85)',
    fam: 'Legume', sun: 'Full sun', water: 'Regular', feed: 'Light — fixes its own nitrogen',
    sp: [10, 40], depth: 3, dir: [2, 12], dtm: 55, hw: 6, frost: 't', pref: 'direct',
    good: ['corn', 'cucumber', 'carrot', 'potato', 'marigold', 'rosemary', 'strawberry', 'eggplant'],
    bad: ['onion', 'garlic', 'leek', 'chives', 'spring-onion', 'capsicum', 'chilli'],
    pests: ['Bean fly', 'Aphids', 'Snails'], dis: ['Rust', 'Halo blight'],
    care: [[14, 'Mulch once seedlings are up', 'care']],
    tips: 'Sow a short row every 3 weeks for a steady supply. Pick beans young and often.'
  });
  add('climbing-bean', 'Climbing beans', 'veg', '🫛', {
    fx: 'hue-rotate(-18deg) saturate(.85)',
    fam: 'Legume', sun: 'Full sun', water: 'Regular', feed: 'Light — fixes its own nitrogen',
    sp: [15, 40], depth: 3, dir: [2, 10], dtm: 65, hw: 8, frost: 't', pref: 'direct',
    good: ['corn', 'cucumber', 'carrot', 'pumpkin', 'marigold', 'nasturtium'],
    bad: ['onion', 'garlic', 'leek', 'chives', 'spring-onion', 'capsicum', 'chilli'],
    pests: ['Bean fly', 'Aphids'], dis: ['Rust'],
    care: [[0, 'Put up a 2 m trellis or teepee before sowing', 'stake']],
    tips: 'More beans per square metre than bush types and a longer harvest. Keep picking or the vine stops.'
  });
  add('pea', 'Peas (snow & sugar snap)', 'veg', '🫛', {
    fam: 'Legume', sun: 'Full sun / part shade', water: 'Regular', feed: 'Light',
    sp: [5, 30], depth: 3, dir: [-6, 0], fd: [-12, -4], dtm: 65, hw: 6, frost: 'H', pref: 'direct',
    good: ['carrot', 'radish', 'cucumber', 'corn', 'lettuce', 'spinach', 'mint', 'coriander'],
    bad: ['onion', 'garlic', 'leek', 'chives', 'spring-onion'],
    pests: ['Aphids', 'Birds', 'Snails'], dis: ['Powdery mildew'],
    care: [[0, 'Add netting or a trellis for the tendrils', 'stake'], [21, 'Mulch to keep roots cool', 'care']],
    tips: 'A cool-season crop: sow in early spring or autumn, not in summer heat. Leave roots in the ground after harvest — they feed the soil.'
  });
  add('lettuce', 'Lettuce', 'veg', '🥬', {
    fam: 'Daisy', sun: 'Full sun / part shade in summer', water: 'Little and often', feed: 'Light',
    sp: [25, 25], depth: 0.5, ind: 4, out: [-3, 6], dir: [-4, 8], fo: [-10, -4], fd: [-10, -5], dtm: 45, hw: 4, frost: 'h',
    good: ['carrot', 'radish', 'strawberry', 'chives', 'beetroot', 'onion', 'cucumber', 'pea'],
    bad: ['parsley'],
    pests: ['Slugs & snails', 'Aphids'], dis: ['Downy mildew', 'Bolting in heat'],
    care: [[14, 'Liquid feed every 2 weeks', 'feed']],
    tips: 'Sow a few every 2–3 weeks. Pick outer leaves of loose-leaf types and the plant keeps going for weeks.'
  });
  add('spinach', 'Spinach', 'veg', '🥬', {
    fx: 'saturate(1.6) brightness(.82)',
    fam: 'Amaranth', sun: 'Part shade OK', water: 'Regular', feed: 'Moderate',
    sp: [10, 20], depth: 1, dir: [-6, -1], fd: [-8, -3], dtm: 40, hw: 5, frost: 'H', pref: 'direct',
    good: ['strawberry', 'pea', 'bush-bean', 'radish', 'cabbage'], bad: ['potato'],
    pests: ['Leaf miner', 'Slugs'], dis: ['Downy mildew', 'Bolting'],
    care: [], tips: 'Bolts quickly in warm, long days — grow it in the cool months. Pick outer leaves.'
  });
  add('silverbeet', 'Silverbeet (Swiss chard)', 'veg', 'svg:chard', {
    fam: 'Amaranth', sun: 'Sun / part shade', water: 'Regular', feed: 'Moderate',
    sp: [30, 40], depth: 1.5, ind: 4, out: [0, 10], dir: [-2, 10], fd: [-14, -6], dtm: 55, hw: 20, frost: 'H', pref: 'direct',
    good: ['bush-bean', 'onion', 'cabbage', 'lettuce', 'mint'], bad: ['potato', 'corn', 'cucumber'],
    pests: ['Leaf miner', 'Snails'], dis: ['Leaf spot'],
    care: [[30, 'Liquid feed monthly', 'feed']],
    tips: 'Cut-and-come-again for months. Twist stalks off at the base, outer leaves first.'
  });
  add('kale', 'Kale', 'veg', '🥬', {
    fx: 'hue-rotate(38deg) brightness(.72) saturate(1.2)',
    fam: 'Brassica', sun: 'Full sun', water: 'Regular', feed: 'Heavy feeder',
    sp: [45, 45], depth: 1, ind: 5, out: [-4, 4], fo: [-14, -8], dtm: 55, hw: 16, frost: 'H',
    good: ['beetroot', 'onion', 'dill', 'nasturtium', 'marigold', 'potato', 'rosemary', 'thyme'],
    bad: ['tomato', 'cherry-tomato', 'strawberry'],
    pests: ['Cabbage white caterpillar', 'Aphids'], dis: ['Club root'],
    care: [[7, 'Cover with insect mesh against cabbage white', 'net'], [30, 'Feed with nitrogen', 'feed']],
    tips: 'Frost sweetens the leaves. Harvest from the bottom up and it grows tall like a little palm tree.'
  });
  add('broccoli', 'Broccoli', 'veg', '🥦', {
    fam: 'Brassica', sun: 'Full sun', water: 'Regular', feed: 'Heavy feeder',
    sp: [45, 50], depth: 1, ind: 5, out: [-3, 1], fo: [-14, -8], dtm: 70, hw: 4, frost: 'H',
    good: ['dill', 'rosemary', 'thyme', 'onion', 'beetroot', 'nasturtium', 'potato'],
    bad: ['tomato', 'cherry-tomato', 'strawberry'],
    pests: ['Cabbage white caterpillar', 'Aphids'], dis: ['Club root', 'Downy mildew'],
    care: [[7, 'Cover with insect mesh', 'net'], [30, 'Side-dress with compost', 'feed']],
    tips: 'Cut the main head while the buds are tight, then keep picking the side shoots for weeks.'
  });
  add('cabbage', 'Cabbage', 'veg', 'svg:cabbage', {
    fam: 'Brassica', sun: 'Full sun', water: 'Regular', feed: 'Heavy feeder',
    sp: [45, 50], depth: 1, ind: 5, out: [-4, 0], fo: [-14, -10], dtm: 80, hw: 4, frost: 'H',
    good: ['dill', 'onion', 'rosemary', 'thyme', 'nasturtium', 'beetroot', 'spinach'],
    bad: ['tomato', 'cherry-tomato', 'strawberry'],
    pests: ['Cabbage white caterpillar', 'Aphids', 'Slugs'], dis: ['Club root'],
    care: [[7, 'Cover with insect mesh', 'net'], [30, 'Feed with nitrogen', 'feed']],
    tips: 'Firm the soil well when planting — loose soil gives loose heads.'
  });
  add('cauliflower', 'Cauliflower', 'veg', 'svg:cauli', {
    fam: 'Brassica', sun: 'Full sun', water: 'Regular, never dry', feed: 'Heavy feeder',
    sp: [50, 60], depth: 1, ind: 5, out: [-3, 0], fo: [-16, -10], dtm: 85, hw: 3, frost: 'H',
    good: ['dill', 'onion', 'thyme', 'nasturtium', 'beetroot'], bad: ['tomato', 'cherry-tomato', 'strawberry'],
    pests: ['Cabbage white caterpillar', 'Aphids'], dis: ['Club root'],
    care: [[7, 'Cover with insect mesh', 'net'], [60, 'Fold leaves over the curd to keep it white', 'care']],
    tips: 'The fussiest brassica — any check in growth (drought, cold snap) makes small "buttons".'
  });
  add('bok-choy', 'Bok choy', 'veg', '🥬', {
    fam: 'Brassica', sun: 'Sun / part shade', water: 'Regular', feed: 'Moderate',
    sp: [25, 30], depth: 1, ind: 3, out: [-3, 2], dir: [-4, 2], fd: [-10, -4], dtm: 45, hw: 3, frost: 'h', pref: 'direct',
    good: ['dill', 'onion', 'beetroot', 'lettuce'], bad: ['strawberry'],
    pests: ['Cabbage white caterpillar', 'Flea beetle'], dis: ['Bolting in heat'], care: [],
    tips: 'Fast and forgiving in cool weather. Harvest whole or pick outer leaves.'
  });
  add('rocket', 'Rocket (arugula)', 'veg', '🌿', {
    fx: 'hue-rotate(-12deg) saturate(1.2)',
    fam: 'Brassica', sun: 'Sun / part shade', water: 'Regular', feed: 'Light',
    sp: [15, 20], depth: 0.5, dir: [-4, 6], fd: [-8, -2], dtm: 30, hw: 4, frost: 'h', pref: 'direct',
    good: ['lettuce', 'bush-bean', 'carrot', 'dill'], bad: ['strawberry'],
    pests: ['Flea beetle'], dis: ['Bolting in heat'], care: [],
    tips: 'Gets peppery and bolts in heat. Sow little and often.'
  });
  add('carrot', 'Carrot', 'veg', '🥕', {
    fam: 'Carrot', sun: 'Full sun', water: 'Even moisture', feed: 'Light — no fresh manure',
    sp: [5, 15], depth: 1, dir: [-3, 10], fd: [-14, -10], dtm: 75, hw: 8, frost: 'H', pref: 'direct',
    good: ['tomato', 'lettuce', 'onion', 'chives', 'leek', 'rosemary', 'pea', 'radish', 'spring-onion'],
    bad: ['dill'],
    pests: ['Carrot fly'], dis: ['Forked roots (stony or rich soil)'],
    care: [[21, 'Thin seedlings to 5 cm apart', 'care'], [30, 'Mulch to keep soil moist', 'care']],
    tips: 'Mix the tiny seed with sand to sow thinly. Keep the bed moist until they come up — it can take 2–3 weeks.'
  });
  add('beetroot', 'Beetroot', 'veg', 'svg:beet', {
    fam: 'Amaranth', sun: 'Full sun', water: 'Regular', feed: 'Moderate',
    sp: [10, 25], depth: 2, ind: 4, out: [0, 8], dir: [-2, 10], fd: [-12, -8], dtm: 60, hw: 6, frost: 'H', pref: 'direct',
    good: ['lettuce', 'onion', 'cabbage', 'kale', 'broccoli', 'bush-bean'], bad: ['climbing-bean'],
    pests: ['Leaf miner'], dis: ['Scab'],
    care: [[21, 'Thin to one seedling per cluster', 'care']],
    tips: 'Each "seed" is a cluster that gives several seedlings. Harvest at golf-ball to tennis-ball size; the leaves are tasty too.'
  });
  add('radish', 'Radish', 'veg', 'svg:radish', {
    fam: 'Brassica', sun: 'Full sun', water: 'Regular', feed: 'Light',
    sp: [4, 15], depth: 1, dir: [-5, 8], fd: [-10, -2], dtm: 28, hw: 2, frost: 'H', pref: 'direct',
    good: ['lettuce', 'pea', 'carrot', 'cucumber', 'spinach', 'nasturtium'], bad: [],
    pests: ['Flea beetle'], dis: ['Woody roots if left too long'], care: [],
    tips: 'Ready in four weeks — great between slower crops and for kids.'
  });
  add('onion', 'Onion', 'veg', '🧅', {
    fam: 'Allium', sun: 'Full sun', water: 'Moderate, stop near harvest', feed: 'Moderate',
    sp: [10, 25], depth: 1, ind: 10, out: [-4, 0], fo: [-14, -8], dtm: 110, hw: 4, frost: 'H',
    good: ['carrot', 'beetroot', 'lettuce', 'tomato', 'capsicum', 'strawberry', 'cabbage', 'silverbeet'],
    bad: ['bush-bean', 'climbing-bean', 'pea'],
    pests: ['Onion thrips'], dis: ['Downy mildew', 'Neck rot'],
    care: [[30, 'Weed carefully — onions hate competition', 'care']],
    tips: 'Pick a variety for your day length (short-day for mild winters, long-day for high latitudes). Harvest when tops flop over; cure in a dry, airy spot.'
  });
  add('spring-onion', 'Spring onion', 'veg', 'svg:leek', {
    fam: 'Allium', sun: 'Sun / part shade', water: 'Regular', feed: 'Light',
    sp: [3, 15], depth: 1, dir: [-4, 10], fd: [-12, -4], dtm: 60, hw: 8, frost: 'H', pref: 'direct',
    good: ['carrot', 'lettuce', 'tomato', 'beetroot'], bad: ['bush-bean', 'climbing-bean', 'pea'],
    pests: ['Thrips'], dis: [], care: [],
    tips: 'Sow a pinch every few weeks — or regrow bought ones from their roots in a glass of water.'
  });
  add('garlic', 'Garlic', 'veg', '🧄', {
    fam: 'Allium', sun: 'Full sun', water: 'Moderate, stop 3 weeks before harvest', feed: 'Moderate',
    sp: [12, 25], depth: 5, fd: [-6, 2], dtm: 230, hw: 3, frost: 'H', pref: 'direct',
    good: ['tomato', 'carrot', 'beetroot', 'strawberry', 'apple', 'peach'], bad: ['bush-bean', 'climbing-bean', 'pea'],
    pests: ['Onion thrips'], dis: ['Rust', 'White rot'],
    care: [[150, 'Feed and keep weed-free as bulbs swell', 'feed'], [200, 'Cut off flower stalks (scapes) — they\'re edible', 'care']],
    tips: 'Plant cloves pointy end up in autumn; it needs winter cold to form bulbs. Harvest when the lower third of leaves have browned.'
  });
  add('leek', 'Leek', 'veg', 'svg:leek', {
    fam: 'Allium', sun: 'Full sun', water: 'Regular', feed: 'Moderate',
    sp: [15, 30], depth: 1, ind: 10, out: [0, 8], dtm: 100, hw: 16, frost: 'H',
    good: ['carrot', 'onion', 'strawberry'], bad: ['bush-bean', 'climbing-bean', 'pea'],
    pests: ['Leek moth', 'Thrips'], dis: ['Rust'],
    care: [[0, 'Drop into deep dibber holes and water in — don\'t backfill', 'plant'], [45, 'Hill soil up the stems to blanch', 'care']],
    tips: 'Stands in the ground through winter — harvest as needed.'
  });
  add('potato', 'Potato', 'veg', '🥔', {
    fam: 'Nightshade', sun: 'Full sun', water: 'Regular once flowering', feed: 'Heavy feeder',
    sp: [30, 60], depth: 10, dir: [-3, 4], fd: [-20, -15], dtm: 100, hw: 4, frost: 't', pref: 'direct',
    good: ['bush-bean', 'corn', 'cabbage', 'marigold', 'nasturtium', 'kale', 'broccoli'],
    bad: ['tomato', 'cherry-tomato', 'cucumber', 'pumpkin', 'zucchini', 'sunflower', 'raspberry', 'spinach'],
    pests: ['Potato moth', 'Aphids'], dis: ['Late blight', 'Scab'],
    care: [[21, 'Hill up soil around stems (repeat every 2–3 weeks)', 'care'], [60, 'Dig a few "new" potatoes at flowering', 'harvest']],
    tips: 'Plant seed potatoes, not supermarket ones. Never let tubers see light — green potatoes are toxic.'
  });
  add('sweet-potato', 'Sweet potato', 'veg', '🍠', {
    fam: 'Morning glory', sun: 'Full sun, hot', water: 'Moderate', feed: 'Light',
    sp: [30, 90], depth: 5, out: [3, 8], dtm: 120, hw: 3, frost: 't', pref: 'seedling',
    good: ['bush-bean', 'thyme'], bad: ['pumpkin'],
    pests: ['Sweet potato weevil'], dis: [], care: [[30, 'Lift vines so they don\'t root along the ground', 'care']],
    tips: 'Grown from "slips" (sprouted shoots). Needs a long hot season; harvest before the first frost.'
  });

  /* ---------------------------------------------------------------- herbs */

  add('basil', 'Basil', 'herb', '🌿', {
    fam: 'Mint', sun: 'Full sun, warm', water: 'Regular', feed: 'Light',
    sp: [25, 30], depth: 0.5, ind: 5, out: [2, 10], dir: [2, 8], dtm: 30, hw: 14, frost: 't',
    good: ['tomato', 'cherry-tomato', 'capsicum', 'chilli', 'eggplant', 'lettuce'], bad: ['sage', 'thyme'],
    pests: ['Aphids', 'Snails'], dis: ['Downy mildew'],
    care: [[21, 'Pinch out flower tips to keep it leafy', 'care']],
    tips: 'Pinch above a pair of leaves and it branches into a bush. Hates cold nights.'
  });
  add('parsley', 'Parsley', 'herb', '🌿', {
    fx: 'hue-rotate(14deg) saturate(1.4)',
    fam: 'Carrot', sun: 'Sun / part shade', water: 'Regular', feed: 'Light',
    sp: [20, 25], depth: 0.5, ind: 6, out: [-2, 6], dir: [-2, 8], fd: [-14, -8], dtm: 70, hw: 30, frost: 'H',
    good: ['tomato', 'cherry-tomato', 'asparagus', 'corn', 'capsicum'], bad: ['lettuce'],
    pests: ['Aphids'], dis: [], care: [],
    tips: 'Slow to germinate — soak seed overnight. A biennial: it flowers and dies in its second year.'
  });
  add('coriander', 'Coriander (cilantro)', 'herb', '🌿', {
    fx: 'hue-rotate(-14deg)',
    fam: 'Carrot', sun: 'Sun / part shade', water: 'Regular', feed: 'Light',
    sp: [15, 20], depth: 1, dir: [-3, 1], fd: [-12, -4], dtm: 45, hw: 4, frost: 'h', pref: 'direct',
    good: ['spinach', 'pea', 'bush-bean', 'lettuce'], bad: [],
    pests: ['Aphids'], dis: ['Bolting'], care: [],
    tips: 'Bolts fast in heat — grow it in the cool months and sow every few weeks. Let some go to seed for coriander seed.'
  });
  add('dill', 'Dill', 'herb', '🌿', {
    fx: 'hue-rotate(-34deg) brightness(1.1)',
    fam: 'Carrot', sun: 'Full sun', water: 'Moderate', feed: 'Light',
    sp: [30, 30], depth: 0.5, dir: [0, 8], dtm: 50, hw: 6, frost: 'h', pref: 'direct',
    good: ['cucumber', 'lettuce', 'onion', 'cabbage', 'broccoli', 'kale'], bad: ['carrot', 'tomato', 'cherry-tomato'],
    pests: ['Aphids'], dis: [], care: [],
    tips: 'Its flowers pull in hoverflies and ladybirds that eat aphids.'
  });
  add('chives', 'Chives', 'herb', '🌱', {
    fam: 'Allium', sun: 'Sun / part shade', water: 'Regular', feed: 'Light',
    sp: [20, 25], depth: 0.5, ind: 8, out: [-2, 6], dtm: 80, hw: 26, frost: 'H',
    good: ['carrot', 'tomato', 'cherry-tomato', 'apple', 'lettuce', 'strawberry'], bad: ['bush-bean', 'climbing-bean', 'pea'],
    pests: [], dis: ['Rust'], care: [],
    tips: 'A perennial clump that comes back every spring. Cut to 5 cm and it regrows; divide every few years.'
  });
  add('mint', 'Mint', 'herb', '🌿', {
    fx: 'hue-rotate(28deg) brightness(1.12)',
    fam: 'Mint', sun: 'Part shade', water: 'Moist', feed: 'Light',
    sp: [45, 45], depth: 0, out: [0, 10], dtm: 60, hw: 26, frost: 'H', pref: 'seedling',
    good: ['cabbage', 'tomato', 'pea', 'silverbeet'], bad: ['parsley'],
    pests: [], dis: ['Rust'], care: [],
    tips: 'Always grow mint in a pot — in a bed it takes over everything.'
  });
  add('rosemary', 'Rosemary', 'herb', '🌿', {
    fx: 'hue-rotate(48deg) saturate(.6) brightness(.9)',
    fam: 'Mint', sun: 'Full sun', water: 'Low', feed: 'None',
    sp: [60, 60], depth: 0, out: [0, 10], dtm: 90, hw: 52, frost: 'H', pref: 'seedling',
    good: ['bush-bean', 'cabbage', 'carrot', 'broccoli', 'kale'], bad: ['pumpkin'],
    pests: [], dis: ['Root rot in wet soil'], care: [],
    tips: 'Mediterranean: give it sun and sharp drainage, then ignore it. Trim after flowering.'
  });
  add('thyme', 'Thyme', 'herb', '🌿', {
    fx: 'saturate(.55) brightness(1.05)',
    fam: 'Mint', sun: 'Full sun', water: 'Low', feed: 'None',
    sp: [25, 30], depth: 0.5, ind: 8, out: [0, 10], dtm: 70, hw: 40, frost: 'H', pref: 'seedling',
    good: ['cabbage', 'broccoli', 'kale', 'eggplant', 'strawberry', 'sweet-potato'], bad: ['basil'],
    pests: [], dis: ['Root rot in wet soil'], care: [],
    tips: 'Trim lightly after flowering to stop it going woody.'
  });
  add('oregano', 'Oregano', 'herb', '🌿', {
    fx: 'brightness(1.18) saturate(.8)',
    fam: 'Mint', sun: 'Full sun', water: 'Low', feed: 'None',
    sp: [30, 30], depth: 0.5, ind: 6, out: [0, 10], dtm: 70, hw: 30, frost: 'H', pref: 'seedling',
    good: ['capsicum', 'tomato', 'cucumber', 'zucchini'], bad: [],
    pests: [], dis: [], care: [],
    tips: 'Flavour is strongest just before flowering. Spreads gently — a good edging plant.'
  });
  add('sage', 'Sage', 'herb', '🌿', {
    fx: 'saturate(.35) brightness(1.15)',
    fam: 'Mint', sun: 'Full sun', water: 'Low', feed: 'None',
    sp: [45, 45], depth: 0.5, ind: 6, out: [0, 10], dtm: 75, hw: 40, frost: 'H', pref: 'seedling',
    good: ['cabbage', 'broccoli', 'carrot', 'rosemary'], bad: ['cucumber', 'basil'],
    pests: [], dis: ['Powdery mildew'], care: [],
    tips: 'Prune back by a third in spring to keep it compact; replace every 4–5 years.'
  });

  /* ---------------------------------------------------------------- flowers */

  add('marigold', 'Marigold', 'flower', '🌼', {
    fx: 'hue-rotate(-28deg) saturate(2)',
    fam: 'Daisy', sun: 'Full sun', water: 'Moderate', feed: 'None',
    sp: [25, 25], depth: 0.5, ind: 6, out: [1, 8], dir: [1, 6], dtm: 50, hw: 16, frost: 't',
    good: ['tomato', 'cherry-tomato', 'capsicum', 'bush-bean', 'potato', 'cucumber', 'pumpkin', 'kale', 'eggplant'], bad: [],
    pests: ['Slugs on seedlings'], dis: [], care: [],
    tips: 'French marigolds deter whitefly and root-knot nematodes — dot them through tomato and pepper beds.'
  });
  add('nasturtium', 'Nasturtium', 'flower', '🌺', {
    fx: 'hue-rotate(28deg) saturate(1.5)',
    fam: 'Nasturtium', sun: 'Sun / part shade', water: 'Low', feed: 'None — poor soil gives more flowers',
    sp: [30, 30], depth: 2, dir: [1, 8], dtm: 50, hw: 16, frost: 't', pref: 'direct',
    good: ['cucumber', 'zucchini', 'pumpkin', 'cabbage', 'broccoli', 'kale', 'apple', 'tomato', 'radish', 'climbing-bean'], bad: [],
    pests: ['Aphids (on purpose — it\'s a trap crop)'], dis: [], care: [],
    tips: 'A sacrificial trap crop: aphids go for it instead of your veg. Leaves and flowers are edible and peppery.'
  });
  add('borage', 'Borage', 'flower', '🪻', {
    fx: 'hue-rotate(-38deg) saturate(1.3)',
    fam: 'Borage', sun: 'Full sun', water: 'Low', feed: 'None',
    sp: [40, 40], depth: 1, dir: [-1, 6], dtm: 50, hw: 16, frost: 'h', pref: 'direct',
    good: ['tomato', 'strawberry', 'zucchini', 'pumpkin', 'cucumber'], bad: [],
    pests: [], dis: [], care: [],
    tips: 'Bees adore it, which means better pollination for squash and tomatoes. Self-seeds freely.'
  });
  add('calendula', 'Calendula', 'flower', '🌼', {
    fx: 'hue-rotate(-14deg) saturate(1.6)',
    fam: 'Daisy', sun: 'Full sun', water: 'Moderate', feed: 'None',
    sp: [30, 30], depth: 1, dir: [-3, 4], fd: [-12, -6], dtm: 50, hw: 16, frost: 'H', pref: 'direct',
    good: ['tomato', 'carrot', 'lettuce', 'pea'], bad: [],
    pests: ['Aphids'], dis: ['Powdery mildew'], care: [],
    tips: 'Flowers through cool weather; petals are edible. Attracts hoverflies.'
  });
  add('sunflower', 'Sunflower', 'flower', '🌻', {
    fam: 'Daisy', sun: 'Full sun', water: 'Moderate', feed: 'Moderate',
    sp: [45, 45], depth: 2, dir: [1, 8], dtm: 80, hw: 4, frost: 't', pref: 'direct',
    good: ['cucumber', 'corn', 'climbing-bean'], bad: ['potato'],
    pests: ['Birds (at seed time)'], dis: [], care: [[40, 'Stake tall varieties', 'stake']],
    tips: 'Plant on the south side (north in the southern hemisphere) so they don\'t shade the rest of the bed.'
  });
  add('lavender', 'Lavender', 'flower', '🪻', {
    fam: 'Mint', sun: 'Full sun', water: 'Low', feed: 'None',
    sp: [45, 60], depth: 0, out: [0, 10], dtm: 90, hw: 8, frost: 'H', pref: 'seedling',
    good: ['rosemary', 'thyme', 'cabbage'], bad: [],
    pests: [], dis: ['Root rot in wet soil'], care: [],
    tips: 'Trim by a third straight after flowering, but never cut into bare wood — it won\'t regrow.'
  });

  /* ---------------------------------------------------------------- fruit trees */

  add('apple', 'Apple', 'tree', '🍎', {
    fam: 'Rose', sun: 'Full sun', water: 'Deep, weekly in summer', feed: 'Spring feed',
    sp: [400, 400], fruitIn: 3, form: 'Open centre or central leader', fruitOn: 'Short spurs on 2-year-old and older wood',
    pollination: 'Most varieties need a different apple (or crabapple) flowering nearby.',
    good: ['chives', 'nasturtium', 'garlic', 'marigold', 'calendula'], bad: ['potato'],
    pests: ['Codling moth', 'Woolly aphid', 'Fruit fly'], dis: ['Apple scab / black spot', 'Powdery mildew'],
    tasks: [
      ['prune', [-14, -6], 'Winter prune', 'While dormant, remove dead, diseased and crossing wood, then thin crowded spurs. Shorten new leaders by about a third, cutting to an outward-facing bud.'],
      ['spray', [-6, -3], 'Bud-swell spray', 'Copper or lime sulphur as the buds swell to protect against scab.'],
      ['feed', [-4, 0], 'Feed & mulch', 'Scatter a complete fruit-tree fertiliser around the drip line, water in and top up mulch, keeping it 10 cm off the trunk.'],
      ['pest', [0, 3], 'Codling moth traps', 'Hang pheromone traps at blossom time and wrap a corrugated cardboard band around the trunk to catch larvae.'],
      ['thin', [6, 9], 'Thin fruitlets', 'After the natural drop, thin to one or two fruit per cluster about 15 cm apart for bigger, sweeter apples.'],
      ['prune', [12, 16], 'Summer prune', 'Cut this year\'s long side shoots back to three leaves above the base cluster. Controls size and builds fruit spurs.'],
      ['net', [14, 18], 'Net against birds', 'Net the tree once the fruit starts to colour.'],
      ['harvest', [16, 28], 'Harvest', 'Ripe when the fruit lifts and twists off easily and the pips are brown.'],
      ['care', [28, 32], 'Clean up', 'Rake fallen leaves and remove mummified fruit to break the scab and codling-moth cycle.']
    ],
    prune: ['Prune in winter for shape, in summer to control size.', 'Remove the 3 Ds first: dead, diseased and damaged wood.', 'Cut out branches that cross, rub or grow into the centre.', 'Keep 3–5 main limbs spaced around the trunk (open centre).', 'Shorten new growth on leaders by a third to an outward bud.', 'Never take more than a quarter of the tree in one year.'],
    tips: 'Choose a dwarfing rootstock (M9, M26, MM106) for a small garden — or grow it as an espalier on a fence.'
  });
  add('pear', 'Pear', 'tree', '🍐', {
    fam: 'Rose', sun: 'Full sun', water: 'Deep, weekly in summer', feed: 'Spring feed',
    sp: [400, 400], fruitIn: 4, form: 'Central leader or open centre', fruitOn: 'Spurs on 2-year-old and older wood',
    pollination: 'Most need a second pear variety nearby.',
    good: ['chives', 'nasturtium', 'garlic', 'marigold'], bad: ['potato'],
    pests: ['Pear & cherry slug', 'Codling moth'], dis: ['Pear scab', 'Fireblight'],
    tasks: [
      ['prune', [-14, -6], 'Winter prune', 'Thin crowded spurs and remove dead or crossing wood. Pears grow upright — keep the centre open for light.'],
      ['spray', [-6, -3], 'Bud-swell spray', 'Copper or lime sulphur as buds swell to protect against scab.'],
      ['feed', [-4, 0], 'Feed & mulch', 'Complete fruit-tree fertiliser around the drip line; water in and mulch.'],
      ['thin', [6, 9], 'Thin fruitlets', 'Thin to one or two per cluster if the crop is heavy.'],
      ['prune', [12, 16], 'Summer prune', 'Shorten this year\'s side shoots to three leaves.'],
      ['harvest', [14, 24], 'Harvest', 'Pick when mature but still firm — the stalk parts when the fruit is lifted. Ripen indoors for a few days.'],
      ['care', [26, 32], 'Clean up', 'Clear fallen leaves and fruit.']
    ],
    prune: ['Prune in winter while dormant.', 'Remove dead, diseased and damaged wood first.', 'Pears are naturally upright — tie or spread young branches to near-horizontal to encourage fruiting.', 'Thin spur systems on older trees so each has room.', 'Never take more than a quarter of the tree in a year.'],
    tips: 'Never let pears ripen on the tree — they go gritty and brown inside.'
  });
  add('peach', 'Peach & nectarine', 'tree', '🍑', {
    fam: 'Rose', sun: 'Full sun', water: 'Deep, weekly in fruiting', feed: 'Spring feed',
    sp: [400, 400], fruitIn: 2, form: 'Open vase', fruitOn: 'Last year\'s shoots (one-year-old wood)',
    pollination: 'Self-fertile — one tree is enough.',
    good: ['garlic', 'chives', 'marigold', 'nasturtium'], bad: ['potato', 'tomato'],
    pests: ['Fruit fly', 'Oriental fruit moth', 'Birds'], dis: ['Leaf curl', 'Brown rot', 'Bacterial spot'],
    tasks: [
      ['spray', [-6, -3], 'Leaf-curl spray', 'Copper spray as the buds swell — the one spray that matters. Once leaves curl it is too late for this season.'],
      ['feed', [-4, 0], 'Feed & mulch', 'Complete fruit-tree fertiliser; water in and mulch.'],
      ['thin', [3, 6], 'Thin fruit', 'Thin to one fruit every 15–20 cm. Feels brutal, gives far better peaches.'],
      ['net', [8, 12], 'Net & fruit-fly traps', 'Net against birds and hang fruit-fly traps as fruit starts to colour.'],
      ['harvest', [10, 18], 'Harvest', 'Ripe when the background colour turns from green to yellow and fruit gives slightly near the stalk.'],
      ['prune', [16, 20], 'Prune after harvest', 'Peaches fruit on last year\'s wood: cut out about a third of the shoots that just fruited to make room for new ones. Keep an open vase.'],
      ['spray', [28, 32], 'Leaf-fall spray', 'Copper spray at leaf fall against leaf curl and bacterial spot.']
    ],
    prune: ['Prune every year — peaches only fruit on last year\'s growth.', 'Keep an open vase of 3–4 main limbs with a clear centre.', 'After harvest, remove about a third of the wood that just fruited.', 'Shorten the remaining new shoots by a third.', 'Remove water shoots growing straight up.'],
    tips: 'Leaf curl is the big one: spray copper at leaf fall and again at bud swell, every year.'
  });
  add('plum', 'Plum', 'tree', 'svg:plum', {
    fam: 'Rose', sun: 'Full sun', water: 'Deep, weekly in summer', feed: 'Spring feed',
    sp: [400, 400], fruitIn: 3, form: 'Open vase', fruitOn: 'Spurs on older wood and one-year-old shoots',
    pollination: 'Japanese plums usually need a second variety; many European plums are self-fertile.',
    good: ['garlic', 'chives', 'nasturtium', 'marigold'], bad: ['potato'],
    pests: ['Fruit fly', 'Aphids', 'Birds'], dis: ['Brown rot', 'Silver leaf', 'Bacterial canker'],
    tasks: [
      ['feed', [-4, 0], 'Feed & mulch', 'Complete fruit-tree fertiliser; water in and mulch.'],
      ['thin', [5, 8], 'Thin fruit', 'Thin Japanese plums to 8–10 cm apart to avoid branch breakage.'],
      ['net', [8, 12], 'Net against birds', 'Net and hang fruit-fly traps as the fruit colours.'],
      ['harvest', [10, 18], 'Harvest', 'Ripe when slightly soft and the bloom on the skin is full.'],
      ['prune', [14, 18], 'Prune after harvest', 'Prune in dry summer weather, never in winter — it avoids silver leaf and bacterial canker. Thin crowded branches and shorten long leaders.'],
      ['spray', [28, 32], 'Leaf-fall spray', 'Copper at leaf fall against bacterial canker.']
    ],
    prune: ['Prune in summer after harvest, never in winter (silver leaf disease enters winter cuts).', 'Remove dead, diseased and crossing wood.', 'Keep an open vase shape.', 'Shorten overly long, whippy leaders by a third.', 'Prop heavily laden branches rather than letting them snap.'],
    tips: 'If silver leaf appears (silvery sheen on leaves), cut the branch back to clean wood in summer.'
  });
  add('cherry', 'Cherry', 'tree', '🍒', {
    fam: 'Rose', sun: 'Full sun', water: 'Deep, regular', feed: 'Spring feed',
    sp: [500, 500], fruitIn: 4, form: 'Open vase', fruitOn: 'Spurs on 2-year-old and older wood',
    pollination: 'Many need a pollinating partner — choose a self-fertile variety like Stella for one tree.',
    good: ['garlic', 'chives', 'nasturtium', 'marigold'], bad: ['potato'],
    pests: ['Birds (big time)', 'Pear & cherry slug', 'Fruit fly'], dis: ['Bacterial canker', 'Brown rot', 'Silver leaf'],
    tasks: [
      ['feed', [-4, 0], 'Feed & mulch', 'Complete fruit-tree fertiliser; water in and mulch.'],
      ['net', [4, 8], 'Net the tree', 'Net before the fruit colours — birds will strip a tree in a day.'],
      ['harvest', [6, 10], 'Harvest', 'Pick with the stalk on when fully coloured and sweet.'],
      ['prune', [10, 14], 'Prune after harvest', 'Prune in dry summer weather only, to avoid silver leaf and canker. Remove crowded and crossing branches.'],
      ['spray', [28, 32], 'Leaf-fall spray', 'Copper at leaf fall against bacterial canker.']
    ],
    prune: ['Prune in summer after harvest, never in winter.', 'Remove dead, diseased and crossing wood.', 'Keep the tree low enough to net — a dwarf rootstock (Gisela) helps.', 'Thin the centre for light and airflow.'],
    tips: 'Rain at ripening splits cherries — keep watering even, and pick promptly.'
  });
  add('apricot', 'Apricot', 'tree', '🍑', {
    fx: 'hue-rotate(14deg) saturate(1.25)',
    fam: 'Rose', sun: 'Full sun, sheltered', water: 'Deep, regular', feed: 'Spring feed',
    sp: [500, 500], fruitIn: 3, form: 'Open vase', fruitOn: 'Spurs and one-year-old shoots',
    pollination: 'Self-fertile, but blossom is early — frost can take the crop.',
    good: ['garlic', 'chives', 'nasturtium'], bad: ['potato', 'tomato'],
    pests: ['Fruit fly', 'Birds'], dis: ['Bacterial canker', 'Shot hole', 'Brown rot'],
    tasks: [
      ['feed', [-4, 0], 'Feed & mulch', 'Complete fruit-tree fertiliser; water in and mulch.'],
      ['thin', [3, 6], 'Thin fruit', 'Thin to 8–10 cm apart if heavily set.'],
      ['net', [6, 10], 'Net against birds', 'Net and set fruit-fly traps.'],
      ['harvest', [8, 12], 'Harvest', 'Pick when fully coloured and slightly soft.'],
      ['prune', [12, 16], 'Prune after harvest', 'Prune in dry weather after harvest; remove crowded and dead wood and shorten leaders.'],
      ['spray', [28, 32], 'Leaf-fall spray', 'Copper at leaf fall against shot hole and canker.']
    ],
    prune: ['Prune after harvest in dry weather.', 'Keep an open vase of 3–4 limbs.', 'Remove dead, diseased and crossing wood.', 'Spurs fruit for about 3 years — remove the oldest to renew.'],
    tips: 'Plant in the warmest, most sheltered spot you have — early blossom is easily frosted.'
  });
  add('lemon', 'Lemon', 'tree', '🍋', {
    fam: 'Citrus', sun: 'Full sun, sheltered', water: 'Deep & even, mulch well', feed: 'Hungry — feed twice a year',
    sp: [300, 300], fruitIn: 2, form: 'Natural rounded shape', fruitOn: 'New growth',
    pollination: 'Self-fertile.',
    good: ['nasturtium', 'marigold', 'borage', 'calendula'], bad: [],
    pests: ['Citrus gall wasp', 'Scale', 'Leaf miner', 'Stink bugs'], dis: ['Collar rot', 'Sooty mould'],
    tasks: [
      ['pest', [-8, -4], 'Cut out gall-wasp galls', 'Cut off swollen lumpy stems and bin them before adult wasps emerge in spring.'],
      ['harvest', [-24, -4], 'Main harvest', 'Lemons hold on the tree for weeks — pick as needed once fully coloured.'],
      ['feed', [-4, 0], 'Late-winter feed', 'Citrus fertiliser around the drip line, water in well.'],
      ['prune', [-2, 2], 'Light prune', 'Remove dead wood, water shoots and branches touching the ground. Citrus needs little pruning.'],
      ['water', [8, 20], 'Deep water through summer', 'Irregular watering causes fruit drop and splitting. Keep mulch topped up.'],
      ['feed', [14, 18], 'Summer feed', 'Second feed of citrus fertiliser.']
    ],
    prune: ['Citrus needs very little pruning.', 'Remove dead and damaged branches and any growth from below the graft.', 'Lift the skirt so branches don\'t touch the ground (keeps pests off).', 'Thin crowded interior shoots for airflow.', 'Prune lightly in spring after the risk of frost.'],
    tips: 'Yellow leaves usually mean hunger or cold, wet roots. Frost-tender — protect young trees.'
  });
  add('lime', 'Lime', 'tree', '🍋', {
    fx: 'hue-rotate(52deg) saturate(1.2)',
    fam: 'Citrus', sun: 'Full sun, warm', water: 'Deep & even', feed: 'Hungry — feed twice a year',
    sp: [300, 300], fruitIn: 2, form: 'Natural rounded shape', fruitOn: 'New growth',
    pollination: 'Self-fertile.',
    good: ['nasturtium', 'marigold', 'borage'], bad: [],
    pests: ['Citrus gall wasp', 'Scale', 'Leaf miner'], dis: ['Collar rot'],
    tasks: [
      ['pest', [-8, -4], 'Cut out gall-wasp galls', 'Cut off swollen stems and bin them before spring.'],
      ['feed', [-4, 0], 'Late-winter feed', 'Citrus fertiliser around the drip line, water in.'],
      ['prune', [-2, 2], 'Light prune', 'Remove dead wood and water shoots; lift the skirt.'],
      ['water', [8, 20], 'Deep water through summer', 'Keep moisture even and mulch well.'],
      ['feed', [14, 18], 'Summer feed', 'Second feed of citrus fertiliser.'],
      ['harvest', [16, 30], 'Harvest', 'Pick green and glossy; they turn yellow (and less tangy) if left.']
    ],
    prune: ['Prune lightly in spring.', 'Remove dead wood, crossing branches and suckers below the graft.', 'Lift the lower branches off the ground.'],
    tips: 'The most cold-sensitive common citrus — a warm wall or pot you can move is ideal.'
  });
  add('mandarin', 'Mandarin & orange', 'tree', '🍊', {
    fam: 'Citrus', sun: 'Full sun, sheltered', water: 'Deep & even', feed: 'Hungry — feed twice a year',
    sp: [400, 400], fruitIn: 3, form: 'Natural rounded shape', fruitOn: 'New growth',
    pollination: 'Self-fertile.',
    good: ['nasturtium', 'marigold', 'borage'], bad: [],
    pests: ['Citrus gall wasp', 'Scale', 'Leaf miner', 'Fruit fly'], dis: ['Collar rot', 'Sooty mould'],
    tasks: [
      ['pest', [-8, -4], 'Cut out gall-wasp galls', 'Cut off swollen stems and bin them before spring.'],
      ['harvest', [-22, -6], 'Harvest', 'Taste-test — colour comes before sweetness. Fruit stores well on the tree.'],
      ['feed', [-4, 0], 'Late-winter feed', 'Citrus fertiliser around the drip line, water in.'],
      ['prune', [-2, 2], 'Light prune', 'Remove dead wood and water shoots; lift the skirt.'],
      ['water', [8, 20], 'Deep water through summer', 'Even moisture prevents fruit drop.'],
      ['feed', [14, 18], 'Summer feed', 'Second feed of citrus fertiliser.']
    ],
    prune: ['Prune lightly after harvest.', 'Remove dead wood, crossing branches and growth from below the graft.', 'Thin the canopy a little if fruit is small and crowded.'],
    tips: 'Mandarins can crop heavily one year and lightly the next — thin a big crop to even it out.'
  });
  add('fig', 'Fig', 'tree', 'svg:fig', {
    fam: 'Mulberry', sun: 'Full sun, hot', water: 'Moderate', feed: 'Light',
    sp: [400, 400], fruitIn: 2, form: 'Open bush or fan', fruitOn: 'Last year\'s and this year\'s shoots',
    pollination: 'Common figs are self-fertile.',
    good: ['marigold', 'rosemary', 'thyme'], bad: [],
    pests: ['Birds', 'Fruit fly'], dis: ['Fig rust'],
    tasks: [
      ['prune', [-12, -6], 'Winter prune', 'Figs need little pruning: remove crowded, crossing or dead branches and keep the tree to a pickable height.'],
      ['feed', [-2, 2], 'Feed & mulch', 'A light feed of compost or general fertiliser — too much gives leaves, not fruit.'],
      ['net', [14, 20], 'Net against birds', 'Net as the figs start to swell and soften.'],
      ['harvest', [14, 24], 'Harvest', 'Pick when soft, drooping on the stalk and slightly split. Figs don\'t ripen after picking.']
    ],
    prune: ['Prune in winter while dormant.', 'Keep it low — a fig left alone becomes a 6 m tree.', 'Remove dead, crossing and inward-growing branches.', 'Wear gloves: the sap irritates skin.'],
    tips: 'Restricting the roots (a pot or a lined pit) gives more fruit and less leaf.'
  });
  add('avocado', 'Avocado', 'tree', '🥑', {
    fam: 'Laurel', sun: 'Full sun, sheltered', water: 'Deep, never waterlogged', feed: 'Spring & summer',
    sp: [600, 600], fruitIn: 4, form: 'Natural; keep low', fruitOn: 'New growth',
    pollination: 'Fruit set improves with an A-type and B-type variety nearby.',
    good: ['nasturtium', 'marigold'], bad: [],
    pests: ['Fruit spotting bug', 'Thrips'], dis: ['Phytophthora root rot'],
    tasks: [
      ['harvest', [-16, 4], 'Harvest (Hass)', 'Pick firm and ripen indoors. Fruit stores on the tree for months — pick as you need.'],
      ['feed', [-2, 2], 'Spring feed', 'Citrus/avocado fertiliser plus a thick mulch of compost.'],
      ['prune', [4, 8], 'Light prune', 'Tip-prune after harvest to keep the tree low and bushy.'],
      ['feed', [12, 14], 'Summer feed', 'Second feed while fruit is sizing up.'],
      ['water', [8, 22], 'Deep water in summer', 'Deep, infrequent soaks — wet feet cause root rot.']
    ],
    prune: ['Prune lightly after harvest.', 'Tip-prune young trees to make them bushy.', 'Keep height manageable for picking.', 'Protect the trunk from sunburn after heavy pruning.'],
    tips: 'Needs excellent drainage — plant on a mound if your soil is heavy.'
  });
  add('olive', 'Olive', 'tree', '🫒', {
    fam: 'Olive', sun: 'Full sun', water: 'Low once established', feed: 'Light',
    sp: [500, 500], fruitIn: 4, form: 'Open vase', fruitOn: 'Last year\'s growth',
    pollination: 'Most are partly self-fertile; a second variety improves the crop.',
    good: ['rosemary', 'lavender', 'thyme'], bad: [],
    pests: ['Olive lace bug', 'Scale'], dis: ['Peacock spot'],
    tasks: [
      ['prune', [-8, -2], 'Prune', 'Open up the centre so you could "throw a hat through it". Remove suckers and water shoots.'],
      ['feed', [-2, 2], 'Spring feed', 'Light general fertiliser.'],
      ['harvest', [26, 34], 'Harvest', 'Green olives early, black olives later. Olives must be cured before eating.']
    ],
    prune: ['Prune in late winter or after harvest.', 'Keep an open vase — light into the centre means fruit.', 'Remove suckers from the base and water shoots.', 'Olives fruit on last year\'s growth, so don\'t cut it all off.'],
    tips: 'Tough, drought-hardy and long-lived. Fresh olives are inedibly bitter until brined.'
  });
  add('mango', 'Mango', 'tree', '🥭', {
    fam: 'Cashew', sun: 'Full sun, hot', water: 'Regular, less in winter', feed: 'Spring & after harvest',
    sp: [600, 600], fruitIn: 4, form: 'Low, spreading', fruitOn: 'Mature terminal shoots',
    pollination: 'Self-fertile.',
    good: ['marigold'], bad: [],
    pests: ['Fruit fly', 'Mango seed weevil'], dis: ['Anthracnose', 'Powdery mildew'],
    tasks: [
      ['feed', [-6, -2], 'Pre-flowering feed', 'Potassium-rich feed; hold off nitrogen so the tree flowers.'],
      ['spray', [-4, 4], 'Flowering spray', 'Copper spray at flowering if anthracnose is a problem in your area.'],
      ['harvest', [12, 20], 'Harvest', 'Pick when the shoulders fill out and the flesh near the stem yellows.'],
      ['prune', [20, 24], 'Prune after harvest', 'Tip-prune after harvest to keep it low; new growth flowers next year.']
    ],
    prune: ['Prune straight after harvest.', 'Keep the tree at a pickable height.', 'Remove crossing and inward-growing branches.'],
    tips: 'Tropical/subtropical only — needs warm, frost-free conditions.'
  });
  add('feijoa', 'Feijoa', 'tree', 'svg:feijoa', {
    fam: 'Myrtle', sun: 'Full sun', water: 'Moderate', feed: 'Light',
    sp: [300, 300], fruitIn: 3, form: 'Bushy shrub or small tree', fruitOn: 'New growth',
    pollination: 'Many varieties fruit better with a second variety nearby.',
    good: ['lavender', 'rosemary'], bad: [],
    pests: ['Fruit fly'], dis: [],
    tasks: [
      ['feed', [-2, 2], 'Spring feed', 'Light general fertiliser and mulch.'],
      ['prune', [-4, 0], 'Light prune', 'Thin the centre and shorten leggy branches.'],
      ['harvest', [28, 36], 'Harvest', 'Collect fruit from the ground each day — feijoas drop when ripe.']
    ],
    prune: ['Prune lightly after harvest or in late winter.', 'Open the centre for light.', 'Can be clipped as a hedge.'],
    tips: 'Tough, frost-hardy and great as a fruiting hedge.'
  });

  /* ---------------------------------------------------------------- berries & vines */

  add('strawberry', 'Strawberry', 'berry', '🍓', {
    fam: 'Rose', sun: 'Full sun', water: 'Regular', feed: 'Moderate',
    sp: [30, 40], depth: 0, out: [-2, 4], fo: [-10, -4], dtm: 70, hw: 10, frost: 'H', pref: 'seedling', fruitIn: 0,
    form: 'Low clumps', fruitOn: 'Crowns', pollination: 'Self-fertile.',
    good: ['lettuce', 'spinach', 'borage', 'thyme', 'chives', 'bush-bean', 'onion', 'garlic'], bad: ['cabbage', 'broccoli', 'kale', 'cauliflower'],
    pests: ['Birds', 'Slugs', 'Earwigs'], dis: ['Grey mould (botrytis)', 'Leaf spot'],
    care: [[14, 'Mulch with straw as flowers appear', 'care']],
    tasks: [
      ['care', [0, 3], 'Mulch with straw', 'Lay straw under the plants as they flower to keep fruit clean.'],
      ['net', [4, 8], 'Net against birds', 'Net once the first fruit sets.'],
      ['harvest', [4, 16], 'Harvest', 'Pick fully red fruit every couple of days, with a little stalk.'],
      ['care', [8, 20], 'Trim runners', 'Cut runners off — or pin a few down to raise new plants.'],
      ['prune', [16, 20], 'Renovate the bed', 'Cut off the old leaves, weed, feed and water. Replace plants every 3 years.']
    ],
    prune: ['After fruiting, shear old leaves off just above the crowns.', 'Remove runners unless you want new plants.', 'Replace plants every 3 years.'],
    tips: 'Plant with the crown exactly at soil level — too deep rots, too high dries out.'
  });
  add('blueberry', 'Blueberry', 'berry', '🫐', {
    fam: 'Heath', sun: 'Full sun', water: 'Regular — rainwater if possible', feed: 'Acid fertiliser',
    sp: [120, 150], fruitIn: 2, form: 'Multi-stemmed bush', fruitOn: '1–3 year-old canes',
    pollination: 'Better crops with two varieties.',
    good: ['strawberry', 'thyme'], bad: ['tomato'],
    pests: ['Birds'], dis: ['Root rot', 'Rust'],
    tasks: [
      ['prune', [-10, -4], 'Winter prune', 'From year 3, cut one or two of the oldest grey canes to the ground and remove weak twiggy growth. Keep 6–8 strong canes.'],
      ['feed', [-2, 2], 'Acid feed & mulch', 'Azalea/camellia fertiliser; mulch with pine bark. Soil pH 4.5–5.5.'],
      ['net', [6, 10], 'Net against birds', 'Net as the berries start to colour.'],
      ['harvest', [8, 16], 'Harvest', 'Wait a few days after they turn fully blue for the best flavour.']
    ],
    prune: ['Little pruning for the first 2–3 years.', 'Each winter remove 1–2 of the oldest canes at the base.', 'Remove low, spindly and crossing shoots.', 'Keep 6–8 vigorous canes of mixed age.'],
    tips: 'They need acidic soil — easiest in a large pot of azalea mix.'
  });
  add('raspberry', 'Raspberry', 'berry', 'svg:raspberry', {
    fam: 'Rose', sun: 'Full sun / light shade', water: 'Regular', feed: 'Spring feed',
    sp: [45, 150], fruitIn: 1, form: 'Canes on a wire trellis', fruitOn: 'Summer types: last year\'s canes · Autumn types: this year\'s canes',
    pollination: 'Self-fertile.',
    good: ['garlic', 'marigold', 'nasturtium'], bad: ['potato', 'tomato', 'blackberry'],
    pests: ['Birds', 'Raspberry beetle'], dis: ['Cane blight', 'Grey mould'],
    tasks: [
      ['prune', [-10, -4], 'Cut autumn canes to the ground', 'For autumn-fruiting types, cut every cane to ground level. For summer types, tie in the best new canes and tip them at the top wire.'],
      ['feed', [-2, 2], 'Feed & mulch', 'General fertiliser and a thick mulch.'],
      ['harvest', [8, 14], 'Summer crop', 'Pick when berries pull off the core easily.'],
      ['prune', [14, 18], 'Cut out fruited canes', 'For summer-fruiting types, cut the canes that just fruited to the ground and tie in this year\'s new canes.'],
      ['harvest', [18, 26], 'Autumn crop', 'Autumn-fruiting types crop on this year\'s canes.']
    ],
    prune: ['Know your type: summer-fruiting or autumn-fruiting.', 'Summer types: after fruiting, cut those canes to the ground; keep 6–8 new canes per metre.', 'Autumn types: cut all canes to the ground in late winter.', 'Remove suckers that wander out of the row.'],
    tips: 'Plant against a two-wire trellis. Keep them away from potatoes and tomatoes (shared diseases).'
  });
  add('blackberry', 'Blackberry (thornless)', 'berry', 'svg:blackberry', {
    fam: 'Rose', sun: 'Full sun', water: 'Regular', feed: 'Spring feed',
    sp: [200, 200], fruitIn: 1, form: 'Canes trained on wires', fruitOn: 'Last year\'s canes',
    pollination: 'Self-fertile.',
    good: ['marigold', 'nasturtium'], bad: ['raspberry'],
    pests: ['Birds'], dis: ['Rust', 'Grey mould'],
    tasks: [
      ['feed', [-2, 2], 'Feed & mulch', 'General fertiliser and a thick mulch.'],
      ['harvest', [10, 16], 'Harvest', 'Pick when berries are glossy black and come away easily.'],
      ['prune', [14, 20], 'Cut out fruited canes', 'Cut canes that just fruited to the base; tie this year\'s new canes along the wires.']
    ],
    prune: ['After harvest, cut all fruited canes to the ground.', 'Tie in new canes in a fan along the wires.', 'Tip long canes to encourage side shoots.'],
    tips: 'Grow only thornless, non-invasive varieties — wild blackberry is a weed in many regions.'
  });
  add('grape', 'Grape', 'berry', '🍇', {
    fam: 'Grape', sun: 'Full sun', water: 'Low–moderate', feed: 'Light',
    sp: [200, 200], fruitIn: 2, form: 'Cordon on wires or a pergola', fruitOn: 'New shoots from last year\'s wood',
    pollination: 'Self-fertile.',
    good: ['chives', 'oregano', 'basil'], bad: [],
    pests: ['Birds', 'Wasps'], dis: ['Powdery & downy mildew', 'Botrytis'],
    tasks: [
      ['prune', [-12, -6], 'Winter prune', 'Cut last year\'s canes back to 2-bud spurs (spur pruning) or keep 1–2 long canes (cane pruning). Most of the vine should go.'],
      ['care', [2, 5], 'Thin shoots', 'Rub out extra shoots so each spur keeps one or two.'],
      ['spray', [2, 10], 'Mildew watch', 'Sulphur spray at the first sign of powdery mildew; keep the canopy open.'],
      ['prune', [8, 14], 'Summer trim & net', 'Trim long shoots two leaves past the last bunch, remove leaves shading the bunches and net against birds.'],
      ['harvest', [20, 28], 'Harvest', 'Taste-test — grapes don\'t ripen after picking.']
    ],
    prune: ['Prune hard in winter — grapes fruit on new shoots from one-year-old wood.', 'Spur pruning: cut each of last year\'s canes back to 2 buds.', 'Cane pruning: keep 1–2 canes of 10–15 buds and remove the rest.', 'In summer, trim shoots two leaves beyond the last bunch.'],
    tips: 'Bleeding sap after a late prune is harmless. Grow on a sunny fence, wall or pergola.'
  });
  add('passionfruit', 'Passionfruit', 'berry', 'svg:passion', {
    fam: 'Passionflower', sun: 'Full sun, sheltered', water: 'Regular', feed: 'Hungry',
    sp: [300, 300], fruitIn: 1, form: 'Vine on a strong trellis', fruitOn: 'New growth',
    pollination: 'Self-fertile; bees help.',
    good: ['marigold', 'nasturtium'], bad: [],
    pests: ['Passion vine hopper', 'Fruit fly'], dis: ['Root rot', 'Woodiness virus'],
    tasks: [
      ['prune', [-2, 2], 'Spring prune', 'Once frost risk passes, thin tangled growth by up to a third. Never cut into the main stems.'],
      ['feed', [0, 2], 'Spring feed', 'Citrus fertiliser and a compost mulch.'],
      ['feed', [10, 12], 'Summer feed', 'Second feed as fruit sets.'],
      ['harvest', [20, 34], 'Harvest', 'Ripe fruit falls — collect from the ground daily. Wrinkled is fine.']
    ],
    prune: ['Prune lightly in spring only.', 'Thin by up to a third; it fruits on new growth.', 'Remove suckers from grafted rootstock — they take over.', 'Replace vines after 5–7 years.'],
    tips: 'Rip out any suckers coming from below the graft straight away.'
  });
  add('kiwifruit', 'Kiwifruit', 'berry', '🥝', {
    fam: 'Kiwifruit', sun: 'Full sun, sheltered', water: 'Regular', feed: 'Spring feed',
    sp: [400, 400], fruitIn: 4, form: 'T-bar or pergola', fruitOn: 'New shoots from last year\'s canes',
    pollination: 'Needs a male vine for up to 8 female vines.',
    good: ['marigold'], bad: [],
    pests: ['Leafroller caterpillars'], dis: ['Root rot'],
    tasks: [
      ['prune', [-12, -6], 'Winter prune', 'Cut fruited laterals back to 2–3 buds past where they fruited; remove tangled growth.'],
      ['feed', [-2, 2], 'Spring feed', 'General fertiliser and mulch.'],
      ['prune', [8, 14], 'Summer prune', 'Shorten vigorous non-fruiting shoots; let light reach the fruit.'],
      ['harvest', [26, 32], 'Harvest', 'Pick firm when seeds are black; ripen indoors next to an apple.']
    ],
    prune: ['Winter: shorten fruited laterals and remove old canes.', 'Summer: cut back vigorous shoots to 4–6 leaves past the last fruit.', 'Keep the canopy open on its frame.'],
    tips: 'Vigorous — give it a sturdy pergola and plenty of room.'
  });

  /* ---------------------------------------------------------------- perennial veg */

  add('rhubarb', 'Rhubarb', 'perennial', 'svg:rhubarb', {
    fam: 'Dock', sun: 'Sun / part shade', water: 'Regular', feed: 'Heavy — loves manure',
    sp: [90, 90], fruitIn: 1, form: 'Crowns', fruitOn: 'Stalks',
    pollination: '—',
    good: ['garlic', 'onion', 'cabbage', 'kale'], bad: [],
    pests: ['Slugs'], dis: ['Crown rot'],
    tasks: [
      ['care', [-8, -2], 'Divide old crowns', 'Every 4–5 years, lift and split crowns with a spade; replant the healthy pieces.'],
      ['feed', [-4, 0], 'Feed & mulch', 'A thick mulch of compost or well-rotted manure around (not over) the crown.'],
      ['harvest', [0, 14], 'Harvest stalks', 'Pull — don\'t cut — stalks, taking no more than a third at once. Leaves are poisonous.'],
      ['care', [2, 10], 'Remove flower stalks', 'Snap off flower spikes so energy goes to the stalks.']
    ],
    prune: ['No pruning — just remove flower stalks and dead leaves.', 'Don\'t harvest in the first year.'],
    tips: 'Lasts 10+ years in one spot. Never eat the leaves.'
  });
  add('asparagus', 'Asparagus', 'perennial', 'svg:asparagus', {
    fam: 'Asparagus', sun: 'Full sun', water: 'Regular', feed: 'Spring feed',
    sp: [40, 60], fruitIn: 2, form: 'Crowns', fruitOn: 'Spears',
    pollination: '—',
    good: ['tomato', 'parsley', 'basil', 'marigold'], bad: ['onion', 'garlic'],
    pests: ['Asparagus beetle', 'Slugs'], dis: ['Rust', 'Crown rot'],
    tasks: [
      ['feed', [-6, -2], 'Weed, feed & mulch', 'Clear weeds, spread compost or manure and mulch before spears emerge.'],
      ['harvest', [-2, 6], 'Harvest spears', 'From year 3, snap spears at 15–20 cm. Stop after 6–8 weeks so the ferns can feed the crowns.'],
      ['care', [26, 32], 'Cut down yellow ferns', 'Once ferns yellow in autumn, cut them to ground level.']
    ],
    prune: ['Cut ferns to the ground once they yellow.', 'No harvest in year 1, a light pick in year 2, full harvest from year 3.'],
    tips: 'A bed lasts 20 years — prepare the soil well and keep it weed-free.'
  });

  /* ---------------------------------------------------------------- icons */

  /* Hand-drawn icons for plants with no suitable emoji (64×64). */
  var SVG = {
    beet: '<svg viewBox="0 0 64 64"><path d="M29 27C24 12 15 6 9 9c3 9 11 15 20 19z" fill="#5aa24a"/><path d="M35 27C40 11 50 5 56 8c-3 9-12 15-21 20z" fill="#4c9640"/><path d="M31 29 25 12M33 29l7-17" stroke="#b0244f" stroke-width="2.5" stroke-linecap="round"/><circle cx="32" cy="41" r="14" fill="#8e1f4a"/><path d="M32 55v8" stroke="#8e1f4a" stroke-width="2.5" stroke-linecap="round"/><ellipse cx="26" cy="37" rx="3.5" ry="5.5" fill="#c4557d" opacity=".6"/></svg>',
    radish: '<svg viewBox="0 0 64 64"><path d="M30 26C25 13 17 8 12 11c3 8 10 13 18 16z" fill="#5fae4e"/><path d="M34 26c5-13 13-18 18-15-3 8-10 13-18 16z" fill="#4c9640"/><path d="M32 27v-9" stroke="#3f8f3c" stroke-width="2.5"/><path d="M19 39c0-8 6-13 13-13s13 5 13 13c0 6-4 9-8 11H27c-4-2-8-5-8-11z" fill="#e0365e"/><path d="M27 50h10c-1 4-3 6-5 8-2-2-4-4-5-8z" fill="#f7eef0"/><path d="M32 58v5" stroke="#e8d9dd" stroke-width="2" stroke-linecap="round"/><ellipse cx="25" cy="37" rx="3" ry="4.5" fill="#f27c98" opacity=".7"/></svg>',
    leek: '<svg viewBox="0 0 64 64"><path d="M28 61V31h8v30c-2 2-6 2-8 0z" fill="#f2efdc"/><path d="M28 36v-5h8v5z" fill="#cfe3a4"/><path d="M29 32C25 19 17 11 10 7c9 1 18 9 23 22z" fill="#3f8f4a"/><path d="M35 32c2-13 10-22 19-27-6 7-13 15-17 27z" fill="#5aa652"/><path d="M31 31 30 4h4l-1 27z" fill="#4a9a4c"/><path d="M29 61l-3 3m6-3v3m3-3 3 3" stroke="#c9b98a" stroke-width="1.5"/></svg>',
    chard: '<svg viewBox="0 0 64 64"><path d="M20 30C10 22 8 10 14 5c9 2 14 12 13 24z" fill="#3e8a3f"/><path d="M44 30c10-8 12-20 6-25-9 2-14 12-13 24z" fill="#4a9a46"/><path d="M32 30C24 18 25 6 32 2c7 4 8 16 0 28z" fill="#55a64e"/><path d="M27 60 22 28" stroke="#d6304f" stroke-width="4" stroke-linecap="round"/><path d="M32 61V28" stroke="#f2c234" stroke-width="4" stroke-linecap="round"/><path d="M37 60l5-32" stroke="#e8577a" stroke-width="4" stroke-linecap="round"/></svg>',
    cabbage: '<svg viewBox="0 0 64 64"><circle cx="32" cy="34" r="24" fill="#7fb35f"/><path d="M14 40c4 10 12 16 18 16s14-6 18-16c-6 5-12 7-18 7s-12-2-18-7z" fill="#5d9a45"/><circle cx="32" cy="31" r="15" fill="#b9dc8e"/><path d="M32 16c-6 6-6 24 0 30M26 22c4 4 4 14 0 18M38 22c-4 4-4 14 0 18" stroke="#8cbf68" stroke-width="2" fill="none"/></svg>',
    cauli: '<svg viewBox="0 0 64 64"><path d="M8 40c6-14 14-18 24-18s18 4 24 18c-8 14-16 20-24 20S16 54 8 40z" fill="#5d9a45"/><circle cx="22" cy="32" r="8" fill="#f6f1df"/><circle cx="32" cy="27" r="9" fill="#fbf7ea"/><circle cx="42" cy="32" r="8" fill="#f6f1df"/><circle cx="27" cy="38" r="8" fill="#efe8cf"/><circle cx="38" cy="38" r="8" fill="#efe8cf"/></svg>',
    pumpkin: '<svg viewBox="0 0 64 64"><path d="M32 18c-2-6 0-10 4-12" stroke="#6b7d2a" stroke-width="4" fill="none" stroke-linecap="round"/><ellipse cx="32" cy="38" rx="26" ry="20" fill="#e8822a"/><ellipse cx="32" cy="38" rx="14" ry="20" fill="#f29a3c"/><ellipse cx="32" cy="38" rx="5" ry="20" fill="#f7ab4f"/><path d="M6 38c0 11 12 20 26 20S58 49 58 38" stroke="#c96a1c" stroke-width="1.5" fill="none" opacity=".5"/></svg>',
    plum: '<svg viewBox="0 0 64 64"><path d="M33 16c2-6 6-9 12-10" stroke="#6b5a2e" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M38 12c6-6 16-6 20-2-6 6-14 6-20 2z" fill="#5aa24a"/><circle cx="31" cy="38" r="22" fill="#6b2d6e"/><path d="M31 18c-4 8-4 32 0 40" stroke="#552258" stroke-width="2" fill="none"/><ellipse cx="22" cy="31" rx="5" ry="8" fill="#9a5a9e" opacity=".55"/></svg>',
    fig: '<svg viewBox="0 0 64 64"><path d="M32 4v8" stroke="#6b5a2e" stroke-width="3" stroke-linecap="round"/><path d="M32 11c-6 10-20 18-20 32 0 10 9 17 20 17s20-7 20-17c0-14-14-22-20-32z" fill="#6a3a5c"/><path d="M32 11c-3 12-8 22-8 34" stroke="#56304b" stroke-width="2" fill="none"/><ellipse cx="25" cy="40" rx="4" ry="8" fill="#9b6688" opacity=".5"/></svg>',
    feijoa: '<svg viewBox="0 0 64 64"><ellipse cx="32" cy="36" rx="17" ry="23" fill="#5f8f3a"/><ellipse cx="27" cy="30" rx="5" ry="10" fill="#86b25a" opacity=".6"/><path d="M28 13l4-6 4 6" stroke="#8a6a3a" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg>',
    raspberry: '<svg viewBox="0 0 64 64"><path d="M22 14c6-6 14-6 20 0-6 4-14 4-20 0z" fill="#4c9640"/><g fill="#d6264f"><circle cx="24" cy="24" r="7"/><circle cx="34" cy="22" r="7"/><circle cx="42" cy="28" r="7"/><circle cx="20" cy="34" r="7"/><circle cx="30" cy="32" r="7"/><circle cx="40" cy="38" r="7"/><circle cx="24" cy="44" r="7"/><circle cx="33" cy="44" r="7"/><circle cx="29" cy="53" r="6.5"/></g><g fill="#f0607f" opacity=".7"><circle cx="22" cy="22" r="2"/><circle cx="32" cy="20" r="2"/><circle cx="18" cy="32" r="2"/><circle cx="28" cy="30" r="2"/><circle cx="22" cy="42" r="2"/></g></svg>',
    blackberry: '<svg viewBox="0 0 64 64"><path d="M22 14c6-6 14-6 20 0-6 4-14 4-20 0z" fill="#4c9640"/><g fill="#2b1838"><circle cx="24" cy="24" r="7"/><circle cx="34" cy="22" r="7"/><circle cx="42" cy="28" r="7"/><circle cx="20" cy="34" r="7"/><circle cx="30" cy="32" r="7"/><circle cx="40" cy="38" r="7"/><circle cx="24" cy="44" r="7"/><circle cx="33" cy="44" r="7"/><circle cx="29" cy="53" r="6.5"/></g><g fill="#6f5a86" opacity=".8"><circle cx="22" cy="22" r="2"/><circle cx="32" cy="20" r="2"/><circle cx="18" cy="32" r="2"/><circle cx="28" cy="30" r="2"/><circle cx="22" cy="42" r="2"/></g></svg>',
    passion: '<svg viewBox="0 0 64 64"><path d="M32 14c0-5 3-8 7-10" stroke="#5a7a2e" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="32" cy="37" r="22" fill="#4b2346"/><g fill="#7a4a74"><circle cx="22" cy="30" r="1.6"/><circle cx="30" cy="24" r="1.6"/><circle cx="40" cy="30" r="1.6"/><circle cx="26" cy="42" r="1.6"/><circle cx="38" cy="44" r="1.6"/><circle cx="33" cy="34" r="1.6"/><circle cx="44" cy="38" r="1.6"/><circle cx="20" cy="38" r="1.6"/></g><ellipse cx="24" cy="29" rx="4" ry="7" fill="#7a4a74" opacity=".45"/></svg>',
    rhubarb: '<svg viewBox="0 0 64 64"><path d="M6 22C10 8 26 2 38 6c12 4 22 14 20 24-12-2-20 2-28 0S8 28 6 22z" fill="#4c9640"/><path d="M14 18c8 2 18 2 26 0M20 12c6 4 12 6 18 6" stroke="#3a7d32" stroke-width="1.5" fill="none"/><path d="M26 61l2-34M33 61l1-34M40 61l-2-32" stroke="#c42c4a" stroke-width="5" stroke-linecap="round"/></svg>',
    asparagus: '<svg viewBox="0 0 64 64"><g stroke-linecap="round"><path d="M22 62 24 14" stroke="#6e9e3c" stroke-width="7"/><path d="M33 62V8" stroke="#7aad44" stroke-width="7"/><path d="M44 62l-2-44" stroke="#6e9e3c" stroke-width="7"/></g><g fill="#8a5a8a"><path d="M24 10c-3 2-4 5-3 8l3-2 3 2c1-3 0-6-3-8z"/><path d="M33 4c-3 2-4 5-3 8l3-2 3 2c1-3 0-6-3-8z"/><path d="M42 14c-3 2-4 5-3 8l3-2 3 2c1-3 0-6-3-8z"/></g><path d="M22 34l-3-2m3 12-3-2m14-14 3-2m-3 14 3-2m8-4 3-2m-3 14 3-2" stroke="#5b8a30" stroke-width="2" stroke-linecap="round"/></svg>'
  };

  /* --------------------------------------------------------------- places */

  /* Typical average frost dates (MM-DD). Coastal subtropical places are
     effectively frost-free; there the dates mark the start and end of the
     main warm growing season instead. */
  var LOCATIONS = [
    { id: 'sydney', name: 'Sydney, NSW', lf: '08-25', ff: '06-10', tz: ['Australia/Sydney'] },
    { id: 'melbourne', name: 'Melbourne, VIC', lf: '09-25', ff: '05-01', tz: ['Australia/Melbourne'] },
    { id: 'brisbane', name: 'Brisbane, QLD', lf: '07-25', ff: '06-25', tz: ['Australia/Brisbane'] },
    { id: 'canberra', name: 'Canberra, ACT', lf: '10-25', ff: '04-10', tz: [] },
    { id: 'adelaide', name: 'Adelaide, SA', lf: '09-01', ff: '05-25', tz: ['Australia/Adelaide'] },
    { id: 'perth', name: 'Perth, WA', lf: '08-20', ff: '06-10', tz: ['Australia/Perth'] },
    { id: 'hobart', name: 'Hobart, TAS', lf: '10-15', ff: '04-25', tz: ['Australia/Hobart'] },
    { id: 'auckland', name: 'Auckland, NZ', lf: '09-01', ff: '06-01', tz: ['Pacific/Auckland'] },
    { id: 'christchurch', name: 'Christchurch, NZ', lf: '10-20', ff: '04-15', tz: [] },
    { id: 'johannesburg', name: 'Johannesburg, ZA', lf: '09-10', ff: '05-10', tz: ['Africa/Johannesburg'] },
    { id: 'london', name: 'London, UK', lf: '04-20', ff: '11-05', tz: ['Europe/London'] },
    { id: 'manchester', name: 'Manchester, UK', lf: '05-01', ff: '10-25', tz: [] },
    { id: 'edinburgh', name: 'Edinburgh, UK', lf: '05-10', ff: '10-15', tz: [] },
    { id: 'dublin', name: 'Dublin, IE', lf: '04-25', ff: '11-01', tz: ['Europe/Dublin'] },
    { id: 'sofia', name: 'Sofia, BG', lf: '04-20', ff: '10-20', tz: ['Europe/Sofia'] },
    { id: 'berlin', name: 'Berlin, DE', lf: '05-01', ff: '10-15', tz: ['Europe/Berlin'] },
    { id: 'amsterdam', name: 'Amsterdam, NL', lf: '04-20', ff: '10-30', tz: ['Europe/Amsterdam', 'Europe/Brussels'] },
    { id: 'paris', name: 'Paris, FR', lf: '04-15', ff: '11-01', tz: ['Europe/Paris'] },
    { id: 'madrid', name: 'Madrid, ES', lf: '03-25', ff: '11-20', tz: ['Europe/Madrid'] },
    { id: 'rome', name: 'Rome, IT', lf: '03-15', ff: '11-25', tz: ['Europe/Rome', 'Europe/Athens'] },
    { id: 'stockholm', name: 'Stockholm, SE', lf: '05-15', ff: '10-01', tz: ['Europe/Stockholm', 'Europe/Oslo', 'Europe/Helsinki'] },
    { id: 'newyork', name: 'New York, US', lf: '04-10', ff: '11-05', tz: ['America/New_York'] },
    { id: 'chicago', name: 'Chicago, US', lf: '04-25', ff: '10-20', tz: ['America/Chicago'] },
    { id: 'denver', name: 'Denver, US', lf: '05-05', ff: '10-05', tz: ['America/Denver'] },
    { id: 'seattle', name: 'Seattle, US', lf: '03-25', ff: '11-10', tz: [] },
    { id: 'losangeles', name: 'Los Angeles, US', lf: '02-15', ff: '12-15', tz: ['America/Los_Angeles'] },
    { id: 'toronto', name: 'Toronto, CA', lf: '05-09', ff: '10-10', tz: ['America/Toronto'] },
    { id: 'vancouver', name: 'Vancouver, CA', lf: '04-01', ff: '11-01', tz: ['America/Vancouver'] }
  ];

  var CATS = [
    { id: 'veg', label: 'Vegetables' },
    { id: 'herb', label: 'Herbs' },
    { id: 'flower', label: 'Flowers' },
    { id: 'tree', label: 'Fruit trees' },
    { id: 'berry', label: 'Berries & vines' },
    { id: 'perennial', label: 'Perennial veg' }
  ];

  /* What each kind of task looks like in lists and calendars. */
  var KINDS = {
    sow: { icon: '🌰', label: 'Sow' },
    harden: { icon: '🌤️', label: 'Harden off' },
    plant: { icon: '🌱', label: 'Plant' },
    stake: { icon: '🪵', label: 'Support' },
    care: { icon: '🧤', label: 'Care' },
    feed: { icon: '🪣', label: 'Feed' },
    net: { icon: '🕸️', label: 'Net / cover' },
    harvest: { icon: '🧺', label: 'Harvest' },
    prune: { icon: '✂️', label: 'Prune' },
    spray: { icon: '💦', label: 'Spray' },
    pest: { icon: '🐛', label: 'Pest check' },
    thin: { icon: '🤏', label: 'Thin' },
    water: { icon: '💧', label: 'Water' },
    task: { icon: '📝', label: 'Task' }
  };

  var PRUNING_BASICS = [
    ['Use clean, sharp tools', 'Sharp secateurs make clean cuts that heal fast. Wipe blades with alcohol between trees to avoid spreading disease.'],
    ['Start with the 3 Ds', 'Remove anything dead, diseased or damaged first — at any time of year.'],
    ['Cut just above a bud', 'Cut on a slight angle about 5 mm above an outward-facing bud so the new shoot grows away from the centre.'],
    ['Winter vs summer', 'Winter pruning (dormant) stimulates strong regrowth; summer pruning slows growth and controls size.'],
    ['Stone fruit is different', 'Prune plums, cherries and apricots in dry summer weather after harvest to keep out silver leaf and canker. Peaches fruit only on last year\'s wood, so they need pruning every year.'],
    ['Never overdo it', 'Remove no more than a quarter of a tree in one year. Over-pruning gives a forest of water shoots and no fruit.']
  ];

  window.GP_DATA = { plants: PLANTS, svg: SVG, locations: LOCATIONS, cats: CATS, kinds: KINDS, pruning: PRUNING_BASICS };
})();
