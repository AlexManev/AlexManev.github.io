/*
  Baby's First Year — content data.

  Everything the app *says* lives here, separate from the logic in app.js:
    BANDS      week-range guides (development, feeding, sleep, activities, flags)
    WEEKS      a headline + note for each of the 53 weeks from birth to one year
    SCHEDULES  suggested check-ups and immunisations by country
    MILESTONES achievement checklists at 2, 4, 6, 9 and 12 months
    GROWTH     WHO growth-standard reference bands (3rd / 50th / 97th centile)
    HELP       when to seek medical help, whatever the week

  This is general information for planning and remembering — it is not medical
  advice, and it never replaces your midwife, health visitor, GP or paediatrician.
*/
window.BFY_DATA = (function () {

  /* ---------------------------------------------------------------- bands */
  /* Each band covers a run of weeks. `from` and `to` are inclusive. */
  const BANDS = [
    {
      from: 0, to: 1,
      phase: 'Newborn days',
      development: [
        'Still curled into the tuck of the womb — arms and legs pulled in.',
        'Sees best about 20–30 cm away: your face at feeding distance is the perfect target.',
        'Reflexes are in charge — rooting, sucking, grasping and the startle (Moro) reflex.',
        'Sleeps 14–17 hours across the day, in short stretches scattered around the clock.'
      ],
      feeding: 'Eight to twelve feeds in 24 hours, on demand and often bunched together. A weight dip of up to 10% in the first days is expected, with birth weight usually back by day 10–14. Nappies are the best gauge: from day 5, look for six or more wet nappies and at least two yellow, seedy stools a day.',
      sleep: 'Day and night mean nothing yet — the body clock has not started. Stick to safer-sleep basics: on the back, in their own clear flat cot or Moses basket, in your room for the first six months, no loose bedding, and not too warm.',
      activities: [
        { t: 'Skin-to-skin, as often as you can', w: 'Steadies heart rate, temperature and blood sugar, and helps milk supply along.' },
        { t: 'Talk and sing through every nappy change', w: 'Your voice is already familiar. This is where language starts.' },
        { t: 'Slow face-to-face gazing', w: 'Hold them about 25 cm from your face and let them study you.' },
        { t: 'Two or three minutes of tummy time', w: 'Chest-to-chest counts. Start tiny and build a little every day.' }
      ],
      watch: [
        'A temperature of 38°C (100.4°F) or above — under three months this always needs a same-day medical opinion.',
        'Fewer wet nappies than expected, a sunken soft spot, or a baby too sleepy to feed.',
        'Yellowing of the skin or eyes in the first 24 hours, or yellowing that deepens after day three.'
      ],
      parent: 'Eat, drink and sleep whenever the baby does. Say yes to every offer of food, laundry and errands — accepting help now is not a failure, it is the plan.'
    },
    {
      from: 2, to: 3,
      phase: 'Settling in',
      development: [
        'Holds your gaze for longer and quietens when you speak.',
        'Lifts their head briefly during tummy time, then puts it down again.',
        'Alert windows stretch a little — 45 to 60 minutes before they need to sleep again.',
        'Crying starts to build; a fussy evening stretch is normal and not your fault.'
      ],
      feeding: 'Still eight or more feeds a day, with a cluster-feeding run most evenings. Around week two to three many babies have a growth spurt and feed almost non-stop for a day or two — it passes, and it is how supply is built.',
      sleep: 'Longest stretch is typically two to four hours. Watch for tired signs — staring, jerky arms, a red brow — and start the wind-down before the crying does.',
      activities: [
        { t: 'High-contrast black-and-white cards', w: 'The strongest visual signal a newborn eye can pick up.' },
        { t: 'Slow, narrated walks around the house', w: 'Name what you see. Repetition builds the sound map of your language.' },
        { t: 'Gentle bicycle legs after a nappy change', w: 'Helps wind and gives them a feel for their own body.' },
        { t: 'Tummy time in short, daily doses', w: 'Aim for a total of 10–15 minutes across the day by week three.' }
      ],
      watch: [
        'Feeding that hurts throughout, or a baby who never seems satisfied and is not gaining.',
        'Persistent vomiting that shoots out, or green vomit.',
        'A cry that sounds high-pitched, weak or very different from usual.'
      ],
      parent: 'Baby blues around day three to five are common and lift within a fortnight. If low mood, anxiety or intrusive thoughts stay past two weeks, tell your midwife, health visitor or GP — it is a treatable, well-worn path.'
    },
    {
      from: 4, to: 5,
      phase: 'One month in',
      development: [
        'Follows a slow-moving face or toy past the middle of their body.',
        'Makes small throaty noises other than crying.',
        'Hands are still mostly fisted but start to open when calm.',
        'The first real, aimed-at-you smile often lands somewhere in these weeks.'
      ],
      feeding: 'Feeds get quicker and more efficient. Expect another spurt around six weeks. If bottle feeding, watch the baby rather than the bottle — paced feeding, upright, with pauses.',
      sleep: 'Total sleep is still 14–17 hours. Some babies find a longer first night stretch; many do not. Keep nights dark, dull and boring, and let daytime be light and chatty.',
      activities: [
        { t: 'Copy their sounds back to them', w: 'The first conversation: they make a sound, you answer, they answer you.' },
        { t: 'Slow toy tracking, side to side', w: 'Builds the eye muscles they will use for reaching later.' },
        { t: 'Tummy time on your chest at an incline', w: 'Easier than the floor and gets far more head-lifting out of them.' },
        { t: 'Different textures on their hands and feet', w: 'Muslin, a wooden spoon, your jumper — early sensory mapping.' }
      ],
      watch: [
        'No response to loud sounds, or eyes that do not fix on your face at all.',
        'Very floppy or very stiff limbs.',
        'Poor weight gain, or fewer than six wet nappies a day.'
      ],
      parent: 'Book the six-to-eight week check for both of you. The postnatal check is yours as much as the baby’s — write your questions down now, while you remember them.'
    },
    {
      from: 6, to: 8,
      phase: 'Six to eight weeks',
      development: [
        'Social smiling arrives properly and is aimed at people they love.',
        'Coos vowel sounds — ooh, aah — and waits for you to answer.',
        'Head control is noticeably steadier when held upright.',
        'Crying usually peaks around six weeks, then eases week by week.'
      ],
      feeding: 'A big growth spurt around six weeks means more frequent feeds for a few days. Feeds may get dramatically faster — a ten-minute feed can be a full one.',
      sleep: 'Naps are still short and irregular. Some babies now do a four to six hour first stretch at night. Keep the room 16–20°C and the cot clear.',
      activities: [
        { t: 'Face games — tongue out, eyebrows up', w: 'They will start trying to copy you, which is early social learning.' },
        { t: 'A pram walk every day', w: 'Light exposure helps the body clock, and it helps yours too.' },
        { t: 'Play mat with a dangling toy just out of reach', w: 'Invites the first batting and swiping.' },
        { t: 'Sing the same three songs every day', w: 'Predictable rhythm and rhyme is exactly what a new brain wants.' }
      ],
      watch: [
        'No smiling at people by eight weeks.',
        'Inconsolable crying for more than two hours, or a baby who is unusually quiet and hard to rouse.',
        'A rash that does not fade when you press a glass against it — this needs emergency help.'
      ],
      parent: 'The first immunisations land in this window. Bring a feed, dress them in easy-access clothing, and plan a quiet evening. A mild fever and a grumpy night afterwards is normal.'
    },
    {
      from: 9, to: 12,
      phase: 'Approaching three months',
      development: [
        'Brings both hands together in the middle and stares at them.',
        'Pushes up on forearms during tummy time and holds it.',
        'Laughs, squeals and takes turns in a babbling conversation.',
        'Recognises familiar people from across the room and gets excited.'
      ],
      feeding: 'Feeding settles into a rhythm you can almost predict. Nothing but milk is needed — solid food is not recommended before around six months.',
      sleep: 'Night sleep starts consolidating and a rough day rhythm appears. Naps may still be 30–45 minutes; that is normal, not a problem to fix.',
      activities: [
        { t: 'Play gym with things to kick', w: 'They discover cause and effect: I move, that moves.' },
        { t: 'Read a board book daily', w: 'It is the pictures and your voice that matter, not the plot.' },
        { t: 'Mirror time', w: 'Faces are the best toy there is, including their own.' },
        { t: 'Roll practice — hips gently guided sideways', w: 'Lets them feel the movement before they can start it themselves.' }
      ],
      watch: [
        'Not following moving objects with the eyes by three months.',
        'Head still floppy when pulled to sitting.',
        'One hand or side used much more than the other.'
      ],
      parent: 'Whoever is going back to work: start the childcare and handover conversation now. Both parents doing solo stretches with the baby makes the transition far easier.'
    },
    {
      from: 13, to: 17,
      phase: 'Four months',
      development: [
        'Reaches out and grabs on purpose, then delivers it straight to the mouth.',
        'Rolls front to back, sometimes back to front.',
        'Belly laughs, and repeats anything that makes you react.',
        'Sleep often gets worse before it gets better — the four-month shift is real.'
      ],
      feeding: 'Still milk only for most babies. Distraction creeps in: feeds may need a quiet, dim room. Drooling and chewing on fists is teething and hand-discovery, not hunger for solids.',
      sleep: 'Around 16 weeks, sleep cycles mature and night waking often increases. It is developmental, not a step backwards. Consistent wind-down, a dark room, and putting them down drowsy all help.',
      activities: [
        { t: 'Rattles and crinkly cloth books', w: 'Sound plus grip plus sight, all in one object.' },
        { t: 'Peekaboo behind a muslin', w: 'The first steps towards understanding that hidden things still exist.' },
        { t: 'Supported sitting on your lap facing out', w: 'A whole new view, and core practice.' },
        { t: 'Sing action rhymes with hand movements', w: 'Links words to gestures, which is where communication begins.' }
      ],
      watch: [
        'Does not bring things to their mouth, or cannot hold their head steady when held upright.',
        'No babbling or sound-making back at you.',
        'Eyes that turn in or out most of the time.'
      ],
      parent: 'This is a common wall for parents. Lower the bar on everything but feeding, sleeping and being kind to each other. Split the nights explicitly rather than by accident.'
    },
    {
      from: 18, to: 21,
      phase: 'Five months',
      development: [
        'Sits propped up with cushions or your hands for a minute or two.',
        'Passes a toy from one hand to the other.',
        'Babbles with real consonants — ba, da, ma.',
        'Notices when you leave the room, and says so.'
      ],
      feeding: 'Look out for the three readiness signs for solids, which usually arrive together around six months: sitting up with support and holding their head steady, coordinating eye–hand–mouth, and swallowing food rather than pushing it back out.',
      sleep: 'A rough pattern of three naps a day. Bedtime often drifts earlier — many babies at this age want to go down between 6.30 and 7.30pm.',
      activities: [
        { t: 'Treasure basket of safe household objects', w: 'A wooden spoon and a metal whisk beat most bought toys.' },
        { t: 'Blow raspberries at each other', w: 'Mouth control practice, disguised as silliness.' },
        { t: 'Sit them in front of a low mirror', w: 'They will lean, reach and shift their weight — core work.' },
        { t: 'Name everything you hand them', w: 'Understanding runs months ahead of speaking.' }
      ],
      watch: [
        'Not rolling in either direction by six months.',
        'No laughing or squealing.',
        'Very stiff or very floppy when you pick them up.'
      ],
      parent: 'Read up on starting solids before you need to, and get a high chair that reclines slightly. Take the choking-versus-gagging first-aid refresher now, not in the moment.'
    },
    {
      from: 22, to: 26,
      phase: 'Six months — first tastes',
      development: [
        'Sits without support for short bursts, arms out for balance.',
        'Rolls confidently in both directions and may start shuffling backwards.',
        'Knows familiar faces and studies strangers carefully.',
        'Reaches for and mouths absolutely everything within a metre.'
      ],
      feeding: 'Around six months, start solids alongside milk — milk stays the main source of nutrition all year. Begin with one taste a day: soft finger foods or smooth purées, iron-rich food early (meat, lentils, fortified cereal). No salt, no sugar, no honey before one year, and no whole nuts or hard round foods.',
      sleep: 'Two or three naps, roughly 2–3 hours total. Some babies drop the late-afternoon nap in these weeks and need an earlier bedtime for a while.',
      activities: [
        { t: 'Let them touch and squash food', w: 'Mess is how a baby learns that food is safe and interesting.' },
        { t: 'Stacking cups and containers', w: 'In, out, bang — the beginning of problem-solving.' },
        { t: 'Sitting practice inside a nest of cushions', w: 'Falls are part of it; the cushions make them safe.' },
        { t: 'Offer an open cup with a little water at meals', w: 'Early sipping practice beats months of bottle-weaning later.' }
      ],
      watch: [
        'Not sitting with support, or unable to hold their head steady.',
        'Not reaching for objects, or not putting things in their mouth.',
        'No response to their own name and no babbling by seven months.'
      ],
      parent: 'Baby-proof now, before they move: stair gates, cupboard locks, blind cords tied up, furniture strapped to walls. It is much easier a fortnight early than a day late.'
    },
    {
      from: 27, to: 30,
      phase: 'Seven months',
      development: [
        'Sits steadily and can twist to grab something without toppling.',
        'Pushes up on hands and knees and rocks.',
        'Babbles long strings — bababa, dadada — with real intent.',
        'Looks for a toy after you hide it under a cloth.'
      ],
      feeding: 'Two, moving to three, small meals a day around milk feeds. Widen the range now: different textures, lumps, and a variety of tastes. Repeated exposure is what builds acceptance — offer a rejected food again another day.',
      sleep: 'Usually two naps, morning and early afternoon. Teething and new movement skills can both cause a rough patch — babies often practise rolling and sitting at 2am.',
      activities: [
        { t: 'Put a favourite toy just out of reach', w: 'Motivation is what turns rocking into crawling.' },
        { t: 'Proper peekaboo and hide-the-toy games', w: 'Object permanence, and it makes them laugh.' },
        { t: 'Bang two objects together in rhythm', w: 'Coordinating both hands at once.' },
        { t: 'Chunky board books they can grab', w: 'Let them turn the pages badly. That is the point.' }
      ],
      watch: [
        'No attempt to get objects that are within reach.',
        'Does not bear any weight on the legs when held standing.',
        'Shows no affection for regular caregivers.'
      ],
      parent: 'Get down on the floor and look at the room from their eye level. You will find the cables, the coins and the dog bowl you had stopped seeing.'
    },
    {
      from: 31, to: 34,
      phase: 'Eight months',
      development: [
        'Crawls, commando-shuffles or bum-shuffles — all of them count.',
        'Pulls up on furniture and gets stuck standing.',
        'Develops the pincer grip: thumb and finger, not the whole fist.',
        'Stranger wariness and separation anxiety show up in force.'
      ],
      feeding: 'Three meals a day plus milk. Finger foods let them practise the pincer grip at every meal. Expect throwing, spitting and refusal — it is experimentation, not a verdict on your cooking.',
      sleep: 'Two naps. Separation anxiety often shows up at bedtime: a long, predictable, boring routine and a quick reassuring return helps more than a long negotiation.',
      activities: [
        { t: 'Posting games — objects into a box with a hole', w: 'Fine motor control plus problem-solving.' },
        { t: 'Cruising practice along a sofa', w: 'Weight-shifting is the last step before walking.' },
        { t: 'Name-and-point around the room', w: 'Vocabulary grows fastest when it is attached to real things.' },
        { t: 'Say goodbye properly instead of sneaking off', w: 'Predictable partings build trust and shorten the tears.' }
      ],
      watch: [
        'Not bearing weight on legs, or not sitting without help by nine months.',
        'No babbling and no back-and-forth sounds or gestures.',
        'Does not look when you say their name.'
      ],
      parent: 'Clinginess is a sign of secure attachment, not a problem you caused. Keep letting other trusted adults do full care sessions anyway — short, regular and calm.'
    },
    {
      from: 35, to: 39,
      phase: 'Nine months',
      development: [
        'Moves fluently — crawling, cruising, and getting into a sitting position alone.',
        'Understands "no" and simple everyday phrases.',
        'Waves, points and lifts their arms to be picked up.',
        'Copies you: sounds, gestures and what you do with an object.'
      ],
      feeding: 'Three meals plus one or two snacks, with milk around them. Aim for iron-rich food every day and let them feed themselves as much as possible — a loaded spoon they grab counts.',
      sleep: 'Two naps totalling around 2–3 hours, night sleep around 11–12 hours. Some babies start refusing the second nap; hold it for a few more weeks if you can.',
      activities: [
        { t: 'Roll a ball back and forth', w: 'Turn-taking, which underpins conversation.' },
        { t: 'Simple instructions: "give me the cup"', w: 'Shows you how much they already understand.' },
        { t: 'Cruise between two pieces of furniture', w: 'Set them just far enough apart to need one brave step.' },
        { t: 'Sing action songs with them joining in', w: 'Row the boat, wheels on the bus, clap hands.' }
      ],
      watch: [
        'Not crawling or moving around some way, or dragging one side of the body.',
        'No pointing, waving or gestures.',
        'Loses skills they previously had — this always warrants a review.'
      ],
      parent: 'The nine-to-twelve month review is a good moment to raise anything at all: sleep, feeding, your own mood, or a niggle you have not been able to name.'
    },
    {
      from: 40, to: 43,
      phase: 'Ten months',
      development: [
        'Stands holding on, and may let go for a second or two.',
        'Points at things to show you, not just to ask for them.',
        'May say a first proper word with meaning — often mama, dada or a name.',
        'Puts objects into containers and takes them out again, endlessly.'
      ],
      feeding: 'Three meals and two snacks. Move towards eating what the family eats — same food, no added salt. Offer water in an open or free-flow cup with meals.',
      sleep: 'Two naps for most. Overtiredness looks like wired, not sleepy — an earlier bedtime often fixes early waking.',
      activities: [
        { t: 'Stack two blocks and let them knock them down', w: 'Demolition first, construction later.' },
        { t: 'Look at photos of family and name them', w: 'Links faces to words and to memory.' },
        { t: 'Push-along toy or a sturdy box to shove', w: 'Steadier than furniture and builds walking confidence.' },
        { t: 'Narrate their day back to them', w: 'You had toast, then we went to the park — early story sense.' }
      ],
      watch: [
        'Not pulling to stand.',
        'No sounds used consistently to mean something.',
        'Does not search for objects they saw you hide.'
      ],
      parent: 'Start thinking about the twelve-month appointments and the move to whole cow’s milk from one year. If you plan to stop bottles, an open cup at meals now makes it easy.'
    },
    {
      from: 44, to: 47,
      phase: 'Eleven months',
      development: [
        'Cruises quickly and may take a few free steps.',
        'Understands far more words than they can say — often 20 or more.',
        'Plays pat-a-cake, waves bye-bye and copies your household jobs.',
        'Feeds themselves with fingers and has a decent go with a spoon.'
      ],
      feeding: 'Three meals and two snacks, eating the same as everyone else. Milk drops back to around 350–500 ml a day for formula-fed babies; breastfeeding continues as long as you both want.',
      sleep: 'Around 11–12 hours at night plus two naps. Some babies begin the shift to one nap between 12 and 18 months — most are not ready yet.',
      activities: [
        { t: 'Shape sorter or simple posting box', w: 'Trial and error, and real satisfaction when it drops in.' },
        { t: 'Let them help: wiping, stirring, putting things away', w: 'Copying real work is their favourite game.' },
        { t: 'Walk holding one of your hands', w: 'One hand, not two — it makes them find their own balance.' },
        { t: 'Ask questions and wait for the answer', w: 'The pause is what teaches them their turn is coming.' }
      ],
      watch: [
        'No gestures at all — no waving, pointing or head-shaking.',
        'Does not respond to their name consistently.',
        'Cannot stand while holding on.'
      ],
      parent: 'Plan the first birthday you actually want. One year of keeping a small person alive is a real achievement — mark yours as well as theirs.'
    },
    {
      from: 48, to: 52,
      phase: 'Twelve months',
      development: [
        'Stands alone and walks, or is on the very edge of it — anywhere from 9 to 18 months is normal.',
        'Uses one or more words with meaning and understands simple requests.',
        'Puts things in a container, looks for hidden things, and copies you constantly.',
        'Shows clear preferences, opinions and a first taste of frustration.'
      ],
      feeding: 'Eating three meals and two snacks with the family. From one year, whole cow’s milk can replace formula — around 300–400 ml a day is plenty, and too much milk gets in the way of iron-rich food. Vitamin D is recommended right through the first years.',
      sleep: 'About 11–14 hours in 24, including naps. Most still need two naps; the change to one usually comes later.',
      activities: [
        { t: 'Simple pretend play — feed the teddy', w: 'Imagination is the next big cognitive leap.' },
        { t: 'Crayons and a big sheet of paper', w: 'First scribbles, and grip practice.' },
        { t: 'Barefoot walking on different surfaces', w: 'Bare feet build the arch and balance better than shoes.' },
        { t: 'Read the same book over and over', w: 'Repetition is not boredom to them — it is mastery.' }
      ],
      watch: [
        'Not standing when supported, or not crawling or moving about.',
        'No single words and no gestures.',
        'Loses skills they had before.'
      ],
      parent: 'Book the twelve-month immunisations and review, and take stock. Whatever the last year has looked like, you know this baby better than anyone.'
    }
  ];

  /* ---------------------------------------------------------------- weeks */
  /* One headline and note per week, 0 through 52. Week 0 is the first week
     of life. Ages are approximate — babies keep their own timetable. */
  const WEEKS = [
    { t: 'The fourth trimester begins', n: 'Everything is new — light, air, hunger, gravity. Skin-to-skin, feed on demand, and let the rest wait.' },
    { t: 'Back towards birth weight', n: 'The newborn blood spot (heel prick) and hearing screen usually happen this week. Most babies are back to birth weight by day 10–14.' },
    { t: 'Focus at feeding distance', n: 'They can see your face clearly when you hold them close. Cluster feeding in the evening is normal and builds supply.' },
    { t: 'Crying starts to build', n: 'Fussing tends to climb from now to about six weeks. It says nothing about you — hold, feed, walk, repeat.' },
    { t: 'One month old', n: 'Alert windows are longer and the first hints of a smile appear. Their neck is stronger every day.' },
    { t: 'Noisier and more awake', n: 'Small coos and throaty sounds arrive. Answer every one of them — this is the first conversation.' },
    { t: 'Growth spurt and first smiles', n: 'A hungry few days, then a real social smile. The six-to-eight week check for you and the baby is due around now.' },
    { t: 'Cooing properly', n: 'Vowel sounds, and pauses to let you reply. Hands are being discovered.' },
    { t: 'First immunisations', n: 'The first round of jabs falls around now in most countries. Expect a grumpy, sleepy evening — a mild fever afterwards is normal.' },
    { t: 'Head control building', n: 'Tummy time gets easier: they lift and hold their head, and push up on their forearms.' },
    { t: 'Back-and-forth chatter', n: 'They take turns with you: sound, pause, sound. Leave a gap and see what comes.' },
    { t: 'Batting at toys', n: 'Swiping at dangling things — half accident, half intent. The beginning of reaching.' },
    { t: 'Three months old', n: 'Hands meet in the middle and go to the mouth. The second round of immunisations falls around here in the UK.' },
    { t: 'Rolling rumours', n: 'Some babies flip front to back this week and surprise everyone, including themselves. Never leave them on a raised surface.' },
    { t: 'Grabbing on purpose', n: 'Voluntary grasp replaces reflex. Your hair, your glasses and your dinner are all now within reach.' },
    { t: 'Everything to the mouth', n: 'The mouth is the most sensitive tool they have, and it is how they investigate the world.' },
    { t: 'Four months: the sleep shuffle', n: 'Sleep cycles mature and nights often get worse for a few weeks. It is development, not a habit you have created.' },
    { t: 'Laughing out loud', n: 'Proper belly laughs. Whatever caused it, you will now be doing it forty more times.' },
    { t: 'Rolling both ways', n: 'Back-to-front may follow front-to-back. Cot should be clear and the floor is the safest playground.' },
    { t: 'Sitting with support', n: 'Propped up with cushions or your hands, they will hold it for a minute or two.' },
    { t: 'Hand-to-hand transfer', n: 'A toy moves from one hand to the other. Small, and a genuinely big deal.' },
    { t: 'Readiness for food appears', n: 'Watch for the three signs together: steady head and sitting up, eye–hand–mouth coordination, and swallowing rather than pushing food out.' },
    { t: 'Teething twinges', n: 'Drool, red cheeks and chewing. Teeth can arrive any time from three months to over a year.' },
    { t: 'Nearly sitting alone', n: 'Tripod sitting — leaning forward on their hands. Cushions all round.' },
    { t: 'Six months: first tastes', n: 'Solid food starts alongside milk. Begin with one taste a day, and keep milk as the main event.' },
    { t: 'Consonants arrive', n: 'Ba, da, ma. Not words yet, but the raw material for them.' },
    { t: 'Half a year', n: 'A good moment for a growth check. Iron-rich foods matter now: meat, lentils, beans, fortified cereal.' },
    { t: 'Sitting steady', n: 'Sits without support and can turn to grab something without falling over.' },
    { t: 'Rocking on all fours', n: 'Hands and knees, rocking back and forth. Crawling is being assembled in front of you.' },
    { t: 'Peekaboo lands', n: 'They now understand that hidden things still exist — which is exactly why the game is suddenly hilarious.' },
    { t: 'Commando crawling', n: 'Dragging, rolling, shuffling — every route counts. Get the floor safe now.' },
    { t: 'Three meals taking shape', n: 'Breakfast, lunch and tea around milk feeds. Textures and lumps, not just smooth purée.' },
    { t: 'Pulling to stand', n: 'They haul themselves up on the sofa and then cannot work out how to get down. Lower the cot base.' },
    { t: 'Stranger awareness', n: 'Wariness of new faces is a sign of secure attachment. Give them time and stay close by.' },
    { t: 'Pincer grip practice', n: 'Thumb and finger together. Offer soft finger foods and let them do the work.' },
    { t: 'Crawling properly', n: 'Hands and knees, at speed, usually towards the one thing you did not baby-proof.' },
    { t: 'Separation anxiety peaks', n: 'Always say goodbye rather than slipping away — it is briefly harder and builds far more trust.' },
    { t: 'Cruising the furniture', n: 'Sideways steps holding on. Weight-shifting is the last skill before walking.' },
    { t: 'Copycat games', n: 'They mimic your gestures, sounds and jobs. Give them a cloth and let them wipe.' },
    { t: 'Nine months', n: 'A developmental review falls between nine and twelve months. Bring your questions, including your own.' },
    { t: 'Understanding "no"', n: 'They understand far more than they can say. Redirection works better than negotiation.' },
    { t: 'Pointing to ask', n: 'A finger point plus a look at you is real communication. Always name what they point at.' },
    { t: 'First words, maybe', n: 'A repeated sound used for the same thing is a word. Anywhere from now to eighteen months is normal.' },
    { t: 'Standing alone for seconds', n: 'Let go, wobble, sit down hard, try again. Bare feet help more than shoes.' },
    { t: 'Ten months', n: 'Two naps and three meals is the usual shape. Family food, no added salt.' },
    { t: 'In and out, endlessly', n: 'Containers, boxes and bags. Filling and emptying is serious cognitive work.' },
    { t: 'Book love', n: 'They pick a favourite and want it again and again. Repetition is how they master it.' },
    { t: 'Scribble and stack', n: 'A fat crayon and a big sheet of paper. Two blocks stacked, then knocked down.' },
    { t: 'Cruising towards walking', n: 'Holding one of your hands rather than two makes them find their own balance.' },
    { t: 'Planning the milk change', n: 'From one year, whole cow’s milk can replace formula. An open cup at meals makes the switch easy.' },
    { t: 'Spoon attempts', n: 'Messy, determined self-feeding. Put a mat down and let it happen.' },
    { t: 'Almost one', n: 'Book the twelve-month immunisations and review if you have not yet.' },
    { t: 'Happy first birthday', n: 'Twelve months of growing, and a year of you learning them. Time for the one-year check, jabs and a proper look back.' }
  ];

  /* ------------------------------------------------------------ schedules */
  /* Suggested appointments, positioned by the baby's age in days.
     `w` is the target age in weeks; `win` is a rough window in weeks. */
  const SCHEDULES = {
    uk: {
      label: 'UK — NHS',
      items: [
        { id: 'uk-newborn-exam', title: 'Newborn physical examination', type: 'check', w: 0, win: 1, note: 'Full top-to-toe check within 72 hours of birth, usually before you leave hospital.' },
        { id: 'uk-bloodspot', title: 'Newborn blood spot (heel prick)', type: 'screening', w: 0.7, win: 1, note: 'Around day 5. Screens for nine rare but serious conditions.' },
        { id: 'uk-hearing', title: 'Newborn hearing screening', type: 'screening', w: 1, win: 3, note: 'Within the first few weeks — often done in hospital.' },
        { id: 'uk-hv-new', title: 'Health visitor new baby review', type: 'check', w: 1.7, win: 1, note: 'Usually at home between days 10 and 14.' },
        { id: 'uk-6wk', title: '6–8 week baby check + postnatal check', type: 'check', w: 7, win: 2, note: 'GP appointment for the baby, and your own postnatal check. Book both.' },
        { id: 'uk-8wk', title: '8 week immunisations', type: 'vaccine', w: 8, win: 2, note: '6-in-1, MenB and rotavirus (oral).' },
        { id: 'uk-12wk', title: '12 week immunisations', type: 'vaccine', w: 12, win: 2, note: '6-in-1, pneumococcal (PCV) and rotavirus (oral).' },
        { id: 'uk-16wk', title: '16 week immunisations', type: 'vaccine', w: 16, win: 2, note: '6-in-1 and MenB.' },
        { id: 'uk-9m', title: '9–12 month health visitor review', type: 'check', w: 40, win: 8, note: 'Development review — a good place to raise any concern, including your own mood.' },
        { id: 'uk-12m', title: '12–13 month immunisations', type: 'vaccine', w: 52, win: 4, note: 'Hib/MenC, MMR, pneumococcal booster and MenB booster.' }
      ]
    },
    us: {
      label: 'US — AAP / CDC',
      items: [
        { id: 'us-hepb', title: 'Hepatitis B (birth dose)', type: 'vaccine', w: 0, win: 1, note: 'Usually given in hospital within 24 hours of birth.' },
        { id: 'us-newborn', title: 'Newborn well visit', type: 'check', w: 0.5, win: 1, note: 'Three to five days old — weight check and feeding review.' },
        { id: 'us-1m', title: '1 month well visit', type: 'check', w: 4, win: 2, note: 'Growth, feeding and development check.' },
        { id: 'us-2m', title: '2 month well visit + immunisations', type: 'vaccine', w: 8, win: 2, note: 'DTaP, IPV, Hib, PCV, rotavirus and HepB.' },
        { id: 'us-4m', title: '4 month well visit + immunisations', type: 'vaccine', w: 17, win: 2, note: 'DTaP, IPV, Hib, PCV and rotavirus.' },
        { id: 'us-6m', title: '6 month well visit + immunisations', type: 'vaccine', w: 26, win: 3, note: 'DTaP, Hib, PCV, rotavirus, plus HepB and IPV in the 6–18 month window. Annual flu vaccine starts from 6 months.' },
        { id: 'us-9m', title: '9 month well visit', type: 'check', w: 39, win: 3, note: 'Includes a formal developmental screening.' },
        { id: 'us-12m', title: '12 month well visit + immunisations', type: 'vaccine', w: 52, win: 4, note: 'MMR, varicella, hepatitis A, Hib and PCV. Iron and lead screening are often done here too.' }
      ]
    },
    generic: {
      label: 'General pattern',
      items: [
        { id: 'gen-newborn', title: 'Newborn check', type: 'check', w: 0.5, win: 1, note: 'Top-to-toe examination in the first days.' },
        { id: 'gen-2wk', title: 'Two week weight and feeding check', type: 'check', w: 2, win: 1, note: 'Confirms birth weight is back on track.' },
        { id: 'gen-6wk', title: '6–8 week check for baby and parent', type: 'check', w: 7, win: 2, note: 'Development check for the baby and a postnatal check for you.' },
        { id: 'gen-2m', title: 'First immunisations', type: 'vaccine', w: 8, win: 2, note: 'Timing varies by country — check your local schedule.' },
        { id: 'gen-4m', title: 'Second immunisations', type: 'vaccine', w: 16, win: 3, note: 'Usually around 3–4 months.' },
        { id: 'gen-6m', title: 'Six month review', type: 'check', w: 26, win: 3, note: 'Growth, development and the start of solid food.' },
        { id: 'gen-9m', title: 'Nine month development review', type: 'check', w: 39, win: 4, note: 'Movement, communication and feeding.' },
        { id: 'gen-12m', title: 'One year review and immunisations', type: 'check', w: 52, win: 4, note: 'Growth review, boosters and the move to family food and milk.' }
      ]
    }
  };

  /* ----------------------------------------------------------- milestones */
  /* Checkpoints reflect what most babies do by that age. Wide variation is
     normal; the point is to notice and celebrate, not to score. */
  const MILESTONES = [
    {
      id: 'm2', month: 2, label: 'By 2 months',
      groups: [
        { g: 'Connecting', items: [
          { id: 'm2-a', t: 'Calms when picked up or spoken to' },
          { id: 'm2-b', t: 'Looks at your face' },
          { id: 'm2-c', t: 'Smiles when you talk to or smile at them' }
        ] },
        { g: 'Sounds', items: [
          { id: 'm2-d', t: 'Makes sounds other than crying' },
          { id: 'm2-e', t: 'Reacts to loud sounds' }
        ] },
        { g: 'Learning', items: [
          { id: 'm2-f', t: 'Watches you as you move' },
          { id: 'm2-g', t: 'Looks at a toy for several seconds' }
        ] },
        { g: 'Moving', items: [
          { id: 'm2-h', t: 'Holds head up when on their tummy' },
          { id: 'm2-i', t: 'Moves both arms and both legs' },
          { id: 'm2-j', t: 'Opens their hands briefly' }
        ] }
      ]
    },
    {
      id: 'm4', month: 4, label: 'By 4 months',
      groups: [
        { g: 'Connecting', items: [
          { id: 'm4-a', t: 'Smiles on their own to get your attention' },
          { id: 'm4-b', t: 'Chuckles when you try to make them laugh' },
          { id: 'm4-c', t: 'Looks, moves or makes sounds to keep your attention' }
        ] },
        { g: 'Sounds', items: [
          { id: 'm4-d', t: 'Makes cooing sounds like oooo and aahh' },
          { id: 'm4-e', t: 'Makes sounds back when you talk to them' },
          { id: 'm4-f', t: 'Turns their head towards your voice' }
        ] },
        { g: 'Learning', items: [
          { id: 'm4-g', t: 'Opens their mouth when they see the breast or bottle' },
          { id: 'm4-h', t: 'Looks at their own hands with interest' }
        ] },
        { g: 'Moving', items: [
          { id: 'm4-i', t: 'Holds their head steady without support when held' },
          { id: 'm4-j', t: 'Holds a toy when you put it in their hand' },
          { id: 'm4-k', t: 'Swings at toys with their arm' },
          { id: 'm4-l', t: 'Brings hands to their mouth' },
          { id: 'm4-m', t: 'Pushes up on elbows during tummy time' }
        ] }
      ]
    },
    {
      id: 'm6', month: 6, label: 'By 6 months',
      groups: [
        { g: 'Connecting', items: [
          { id: 'm6-a', t: 'Knows familiar people' },
          { id: 'm6-b', t: 'Likes to look at themselves in a mirror' },
          { id: 'm6-c', t: 'Laughs out loud' }
        ] },
        { g: 'Sounds', items: [
          { id: 'm6-d', t: 'Takes turns making sounds with you' },
          { id: 'm6-e', t: 'Blows raspberries' },
          { id: 'm6-f', t: 'Squeals' }
        ] },
        { g: 'Learning', items: [
          { id: 'm6-g', t: 'Puts things in their mouth to explore them' },
          { id: 'm6-h', t: 'Reaches out to grab a toy they want' },
          { id: 'm6-i', t: 'Closes their lips to show they do not want more food' }
        ] },
        { g: 'Moving', items: [
          { id: 'm6-j', t: 'Rolls from tummy to back' },
          { id: 'm6-k', t: 'Pushes up with straight arms on their tummy' },
          { id: 'm6-l', t: 'Leans on their hands to support themselves sitting' }
        ] }
      ]
    },
    {
      id: 'm9', month: 9, label: 'By 9 months',
      groups: [
        { g: 'Connecting', items: [
          { id: 'm9-a', t: 'Is shy, clingy or fearful around strangers' },
          { id: 'm9-b', t: 'Shows several different facial expressions' },
          { id: 'm9-c', t: 'Looks when you call their name' },
          { id: 'm9-d', t: 'Reacts when you leave the room' },
          { id: 'm9-e', t: 'Smiles or laughs during peekaboo' }
        ] },
        { g: 'Sounds', items: [
          { id: 'm9-f', t: 'Makes different sounds like mamamama and bababababa' },
          { id: 'm9-g', t: 'Lifts their arms up to be picked up' }
        ] },
        { g: 'Learning', items: [
          { id: 'm9-h', t: 'Looks for an object when it drops out of sight' },
          { id: 'm9-i', t: 'Bangs two things together' }
        ] },
        { g: 'Moving', items: [
          { id: 'm9-j', t: 'Gets into a sitting position on their own' },
          { id: 'm9-k', t: 'Moves things from one hand to the other' },
          { id: 'm9-l', t: 'Rakes food towards themselves with their fingers' },
          { id: 'm9-m', t: 'Sits without support' }
        ] }
      ]
    },
    {
      id: 'm12', month: 12, label: 'By 12 months',
      groups: [
        { g: 'Connecting', items: [
          { id: 'm12-a', t: 'Plays games with you, like pat-a-cake' }
        ] },
        { g: 'Sounds', items: [
          { id: 'm12-b', t: 'Waves bye-bye' },
          { id: 'm12-c', t: 'Calls a parent mama, dada or another special name' },
          { id: 'm12-d', t: 'Understands "no" and pauses briefly' }
        ] },
        { g: 'Learning', items: [
          { id: 'm12-e', t: 'Puts something into a container' },
          { id: 'm12-f', t: 'Looks for things they saw you hide' }
        ] },
        { g: 'Moving', items: [
          { id: 'm12-g', t: 'Pulls up to standing' },
          { id: 'm12-h', t: 'Cruises along holding on to furniture' },
          { id: 'm12-i', t: 'Drinks from a cup without a lid as you hold it' },
          { id: 'm12-j', t: 'Picks things up between thumb and finger' }
        ] }
      ]
    }
  ];

  /* -------------------------------------------------------------- growth */
  /* WHO Child Growth Standards, ages 0–12 months, by month.
     Each row is [3rd centile, 50th centile, 97th centile]. Values are
     rounded reference points for plotting, not a clinical chart. */
  const GROWTH = {
    boy: {
      weight: [[2.5,3.3,4.3],[3.4,4.5,5.7],[4.4,5.6,7.0],[5.1,6.4,7.9],[5.6,7.0,8.6],[6.1,7.5,9.2],[6.4,7.9,9.7],[6.7,8.3,10.2],[7.0,8.6,10.5],[7.2,8.9,10.9],[7.5,9.2,11.2],[7.7,9.4,11.5],[7.8,9.6,11.8]],
      length: [[46.3,49.9,53.4],[51.1,54.7,58.4],[54.7,58.4,62.2],[57.6,61.4,65.3],[60.0,63.9,67.8],[61.9,65.9,69.9],[63.6,67.6,71.6],[65.1,69.2,73.2],[66.5,70.6,74.7],[67.7,72.0,76.2],[69.0,73.3,77.6],[70.2,74.5,78.9],[71.3,75.7,80.2]],
      head:   [[32.1,34.5,36.9],[35.1,37.3,39.5],[36.9,39.1,41.3],[38.3,40.5,42.7],[39.4,41.6,43.8],[40.3,42.6,44.8],[41.0,43.3,45.6],[41.7,44.0,46.3],[42.2,44.5,46.9],[42.6,45.0,47.4],[43.0,45.4,47.8],[43.4,45.8,48.2],[43.6,46.1,48.5]]
    },
    girl: {
      weight: [[2.4,3.2,4.2],[3.2,4.2,5.5],[3.9,5.1,6.6],[4.6,5.8,7.5],[5.0,6.4,8.2],[5.4,6.9,8.8],[5.7,7.3,9.3],[6.0,7.6,9.8],[6.3,7.9,10.2],[6.5,8.2,10.5],[6.7,8.5,10.9],[6.9,8.7,11.2],[7.0,8.9,11.5]],
      length: [[45.6,49.1,52.7],[50.0,53.7,57.4],[53.2,57.1,60.9],[55.8,59.8,63.8],[58.0,62.1,66.2],[59.9,64.0,68.2],[61.5,65.7,70.0],[62.9,67.3,71.6],[64.3,68.7,73.2],[65.6,70.1,74.7],[66.8,71.5,76.1],[68.0,72.8,77.5],[69.2,74.0,78.9]],
      head:   [[31.5,33.9,36.2],[34.2,36.5,38.9],[35.8,38.3,40.7],[37.1,39.5,42.0],[38.1,40.6,43.1],[38.9,41.5,44.0],[39.6,42.2,44.8],[40.2,42.8,45.5],[40.7,43.4,46.0],[41.2,43.8,46.5],[41.5,44.2,46.9],[41.9,44.6,47.3],[42.2,44.9,47.6]]
    }
  };

  /* ---------------------------------------------------------------- help */
  const HELP = {
    urgent: [
      'A temperature of 38°C (100.4°F) or above in a baby under 3 months, or 39°C or above between 3 and 6 months.',
      'A rash that does not fade when you press a clear glass firmly against it.',
      'Working hard to breathe — grunting, flaring nostrils, ribs sucking in, or pauses in breathing.',
      'Blue, grey, very pale or mottled skin, lips or tongue.',
      'Very hard to wake, floppy, unresponsive, or a weak, high-pitched or continuous cry.',
      'A fit or seizure, or a bulging soft spot on the head.',
      'Repeated forceful vomiting, green vomit, or blood in vomit or nappies.',
      'Far fewer wet nappies than usual, no tears, a sunken soft spot, or refusing feeds.'
    ],
    routine: [
      'Feeding that is painful throughout, or a baby who is not gaining weight.',
      'Losing a skill they used to have.',
      'Anything about your own mood, anxiety or recovery that has lasted more than two weeks.',
      'Any worry at all that keeps coming back — that is reason enough to ask.'
    ]
  };

  return { BANDS, WEEKS, SCHEDULES, MILESTONES, GROWTH, HELP };
})();
