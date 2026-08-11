const base = import.meta.env.BASE_URL

const projects = [
  {
    id: 'living-guide',
    title: 'Living Guide',
    description: 'Living Guide is a wearable mask that turns other people\'s attention into tactile sensations and physical direction.\n\nThe wearer\'s vision is fully blocked, while five scale strips on the mask respond to how long people look from different directions. When one direction receives more gaze, the motors under that strip moves, and the wearer follows that tactile signal and walks toward the gazer.\n\nThe project reflects attention-seeking behavior in contemporary social & social media culture, where attention become invisible forces that shape how we move, perform, and define ourselves.',
    images: [`${base}projects/face-mask/FaceMask.png`],
    highlightSecondImage: `${base}projects/face-mask/FlapsClosed.png`,
    highlightMechanism: [
      `${base}projects/face-mask/1.png`,
      `${base}projects/face-mask/2.png`,
      `${base}projects/face-mask/3.png`,
      `${base}projects/face-mask/4.png`,
      `${base}projects/face-mask/5.png`,
    ],
    highlight: true,
  },
  {
    id: 'plant-bot',
    title: 'Plant Bot',
    subtitle: 'Agentic Plant Care Walking Robot',
    description: 'What if a plant could act as a pet? That was the goal of this project, to make a system that could extend a plant\'s consciousness. By mimicking pet behavior through a cute appearance and clever agentic behaviors, I was able to create a companion people would actually want to care for. When happy, it would run towards people and be more enthusiastic, and when distressed (not watered or given enough sun) it had the ability to dump out the dirt from the back and mimic a pet soiling itself. Overall, it was a very fun project and I got to work on some unique locomotion morphologies.',
    tags: [],
    images: [`${base}projects/plant-bot/CutePlant.png`],
    galleryTint: '#f2f5f0',
    gallery: [
      { src: `${base}projects/plant-bot/RobotCad.png`,     type: 'image', transparent: true  },
      { src: `${base}projects/plant-bot/ExplodedView.png`,  type: 'image', transparent: true  },
      { src: `${base}projects/plant-bot/Used.png`,          type: 'image', transparent: false },
      { src: `${base}projects/plant-bot/Misbehaved.png`,    type: 'image', transparent: false },
      { src: `${base}projects/plant-bot/Walking.mp4`,       type: 'video', transparent: false },
      { src: `${base}projects/plant-bot/Autonomy.mp4`,      type: 'video', transparent: false },
    ],
    flip: false,   // [image | text | gallery]
  },
  {
    id: 'gauntlet',
    title: 'Gauntlet',
    subtitle: 'Multimodal XR Input Device',
    description: 'This wearable gauntlet was developed and made in one day for a Makeathon. My goal was to have fun with design and challenge myself to make a fully mechanical and analog finger tracking system. I ended up only making two fingers because of the time constraints (along with a clicker on the thumb). These three analog input methods combined with an accelerometer allow for a unique combination of input logic. All the joints snap together or are connected with small M2.5 screws, and the ligaments on the back of the hand serve to tension the fingers against the base of the hand to ensure that tracking is smooth.',
    tags: [],
    images: [`${base}projects/gauntlet/GloveHands.png`],
    galleryTint: '#edeef3',
    gallery: [
      { src:  `${base}projects/gauntlet/FusionGauntlet.png`, type: 'image',  transparent: false },
      { src:  `${base}projects/gauntlet/Gauntlet.png`,        type: 'image',  transparent: false },
      { src:  `${base}projects/gauntlet/HandTesting.png`,     type: 'image',  transparent: false },
      { src:  `${base}projects/gauntlet/HappyTesting.jpg`,    type: 'image',  transparent: false },
      { src:  `${base}projects/gauntlet/WithHandModel.png`,   type: 'image',  transparent: false },
      { srcs: [`${base}projects/gauntlet/Open.png`, `${base}projects/gauntlet/Closed.png`], type: 'toggle', transparent: false },
    ],
    flip: true,    // [gallery | text | image]
  },
  {
    id: 'drone',
    title: 'Drone',
    subtitle: 'Club Quadcopter',
    description: 'These are some variations of a 12 inch prop quadcopter I developed for my club. The one on the left is the earlier version with a bigger focus on product aesthetic. The one on the right is much more technically complex with retracting landing legs and more room for an actual electronics stack. Both were a very fun challenge to design.',
    tags: [],
    images: [`${base}projects/Drone/Drone2.png`],
    imageZoom: 1.3,
    galleryTint: '#f0f1f3',
    galleryLayout: 'grid-2x2',
    gallery: [
      { src: `${base}projects/Drone/Drone1.png`,  type: 'image', transparent: true, zoom: true },
      { src: `${base}projects/Drone/Image1.png`,  type: 'image', transparent: false },
      { src: `${base}projects/Drone/Image2.png`,  type: 'image', transparent: false },
      { src: `${base}projects/Drone/Actual.png`,  type: 'image', transparent: false },
    ],
    flip: false,
  },
  {
    id: 'modular-hydroponics',
    title: 'Modular Hydroponics',
    description: 'My goal for this project was to make an innovative hydroponics system. I prioritized modularity because I wanted my system to be used as a tool for educators to teach about the technology — you could have two branches when teaching students, then put on ten more when you want to grow a larger volume of plants.\n\nMy favorite part was working on the quick disconnect branch joints. The requirements were to support a few plant pots, be easy and intuitive to connect and disconnect, and most importantly, connect water flow to the central water line when attached and cut it off when detached. I achieved this by mounting a quick disconnect pipe component to a 3D printed mounting plate, epoxied to a PVC pipe.',
    tags: [],
    links: [{ label: 'Instructables', href: 'https://www.instructables.com/contest/greenfuture/' }],
    images: [`${base}projects/modular-hydroponics/Hydroponics.png`],
    galleryTint: '#f0f5f1',
    galleryLayout: 'grid-2x2',
    gallery: [
      { src: `${base}projects/modular-hydroponics/Image1.jpg`, type: 'image', transparent: false },
      { src: `${base}projects/modular-hydroponics/Image2.png`, type: 'image', transparent: false },
      { src: `${base}projects/modular-hydroponics/Image3.png`, type: 'image', transparent: false },
      { src: `${base}projects/modular-hydroponics/Image4.png`, type: 'image', transparent: false },
    ],
    flip: true,    // [gallery | text | image]
  },
  {
    id: 'autonomous-rover',
    title: 'Autonomous Rover',
    description: 'I was browsing YouTube one day and stumbled upon the URC (University Rover Challenge). I saw some absolutely amazing designs for rovers, and wanted to make one myself as a general purpose data collection rover platform. After researching different powertrains and suspension methods, I ended up designing a novel independent front/back rocker system, which removed the need for a linkage bar between the sides of the rover.\n\nMy favorite part of this design was creating the four bar linkage systems for the two sets of front wheels. Using a set of thrust and axial bearings, I overengineered the front wheel mounts to be able to handle hundreds of pounds of shear load. Although I never tested them to that limit, I did accidentally perform a stress test while presenting my project at an MIT conference. I was holding the 40-pound rover when I tripped and fell forward, dropping it onto the ground right on its wheels. Nothing broke, so I\'d say it\'s pretty robust.',
    tags: [],
    images: [`${base}projects/autonomous-rover/Rover.png`],
    imageLarge: true,
    galleryTint: '#f0f2f5',
    galleryLayout: 'grid-2x2',
    gallery: [
      { src: `${base}projects/autonomous-rover/Image1.png`, type: 'image', transparent: false },
      { src: `${base}projects/autonomous-rover/Image2.png`, type: 'image', transparent: false },
      { src: `${base}projects/autonomous-rover/Image3.png`, type: 'image', transparent: false },
      { src: `${base}projects/autonomous-rover/Image4.png`, type: 'image', transparent: false },
    ],
    flip: false,   // [image | text | gallery]
  },
]

export default projects
